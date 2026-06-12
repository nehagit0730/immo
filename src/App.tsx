import { useState, useEffect } from 'react';
import { User, Property, WebPage } from './types';
import { Language, translations } from './translations';
import Header from './components/Header';
import PropertyCard from './components/PropertyCard';
import AuthModal from './components/AuthModal';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import ContractDetails from './components/ContractDetails';
import { Search, MapPin, Building2, Phone, Mail, Clock, HelpCircle, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { ibFetch } from './apiMock';
import PageSectionsRenderer from './components/PageSectionsRenderer';
import { getThemeSettings } from './theme';
import PropertyDetailView from './components/PropertyDetailView';

export default function App() {
  // Local states
  const [themeRev, setThemeRev] = useState(0);
  const { colors, headerTitle, footerCopyright, announcementText, announcementBg, announcementTextCol } = getThemeSettings();

  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('ib_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('ib_lang');
    return (stored as Language) || 'en';
  });

  const [currentView, setCurrentView] = useState(() => {
    try {
      // 1. Check query parameters first (extremely reliable for static platforms)
      const params = new URLSearchParams(window.location.search);
      const queryView = params.get('page') || params.get('view');
      if (queryView) {
        let qv = queryView;
        if (qv.startsWith('pages/')) qv = qv.substring(6);
        else if (qv.startsWith('/pages/')) qv = qv.substring(7);
        return qv;
      }

      // 2. Check Hash fallback
      const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
      if (hash) {
        let h = hash;
        if (h.startsWith('pages/')) h = h.substring(6);
        else if (h.startsWith('/pages/')) h = h.substring(7);
        return h;
      }

      // 3. Fallback to pathname
      let path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (path.startsWith('pages/')) {
        path = path.substring(6);
      }
      return path || 'home';
    } catch {
      return 'home';
    }
  }); // active view slug
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<string>('home');
  const [properties, setProperties] = useState<Property[]>([]);
  const [pages, setPages] = useState<WebPage[]>([]);

  const getMatchingPage = (viewName: string) => {
    let query = viewName || '';
    if (query.startsWith('pages/')) {
      query = query.substring(6);
    } else if (query.startsWith('/pages/')) {
      query = query.substring(7);
    }
    
    // Check systemPage aliases
    const mappedSlug = query === 'disclaimer' ? 'verification-disclaimer' : 
                       query === 'privacy' ? 'privacy-policy' : 
                       query === 'terms' ? 'terms-and-conditions' : 
                       query === 'agreement' ? 'service-agreement' : query;
                       
    return pages.find(p => p.slug === mappedSlug);
  };
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Search filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');

  // Properties portal sub-states
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState('all');
  const [mobileViewTab, setMobileViewTab] = useState<'grid' | 'map'>('grid');
  const [mapStyle, setMapStyle] = useState<'vector' | 'cadaster'>('vector');
  const [hoveredPropId, setHoveredPropId] = useState<string | null>(null);

  const t = translations[currentLanguage];

  // Persist session and language selection
  useEffect(() => {
    if (user) {
      localStorage.setItem('ib_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ib_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ib_lang', currentLanguage);
  }, [currentLanguage]);

  // Fetch initial app public listings and page structures
  const fetchLandingData = async () => {
    setIsLoading(true);
    try {
      // Fetch public listings (Express server filters pre-approved only for public query)
      const pRes = await ibFetch('/api/properties');
      const pData = await pRes.json();
      setProperties(pData);

      // Fetch dynamic pages cadasters
      const pgRes = await ibFetch('/api/pages');
      const pgData = await pgRes.json();
      setPages(pgData);
    } catch (err) {
      console.error('Error fetching landing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLandingData();
  }, []);

  useEffect(() => {
    // Scroll to top on navigation triggers
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const queryView = params.get('page') || params.get('view');
        if (queryView) {
          let qv = queryView;
          if (qv.startsWith('pages/')) qv = qv.substring(6);
          else if (qv.startsWith('/pages/')) qv = qv.substring(7);
          setCurrentView(qv);
          return;
        }

        const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
        if (hash) {
          let h = hash;
          if (h.startsWith('pages/')) h = h.substring(6);
          else if (h.startsWith('/pages/')) h = h.substring(7);
          setCurrentView(h);
          return;
        }

        let path = window.location.pathname.replace(/^\/+|\/+$/g, '');
        if (path.startsWith('pages/')) {
          path = path.substring(6);
        }
        setCurrentView(path || 'home');
      } catch (err) {
        console.error('Error on popstate navigation change:', err);
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    // Auto redirect to correct workspace tab using non-404 query routing
    if (authenticatedUser.role === 'admin') {
      setCurrentView('admin-dashboard');
      try {
        window.history.pushState({ view: 'admin-dashboard' }, '', '/?page=admin-dashboard');
      } catch {}
    } else {
      setCurrentView('client-dashboard');
      try {
        window.history.pushState({ view: 'client-dashboard' }, '', '/?page=client-dashboard');
      } catch {}
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
    localStorage.removeItem('ib_user');
    try {
      window.history.pushState({ view: 'home' }, '', '/');
    } catch {}
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    try {
      let urlPath = '/';
      if (view === 'home') {
        urlPath = '/';
      } else if (view === 'properties' || view === 'properties-catalog') {
        urlPath = '/properties';
      } else if (view === 'contact') {
        urlPath = '/contact';
      } else {
        let checkSlug = view;
        if (checkSlug.startsWith('pages/')) {
          checkSlug = checkSlug.substring(6);
        } else if (checkSlug.startsWith('/pages/')) {
          checkSlug = checkSlug.substring(7);
        }
        
        const matched = pages.find(p => p.slug === checkSlug);
        if (matched) {
          urlPath = `/pages/${matched.slug}`;
        } else {
          urlPath = `/?page=${view}`;
        }
      }
      window.history.pushState({ view }, '', urlPath);
    } catch (e) {
      console.error('Error saving history navigation step:', e);
    }
  };

  const handleViewPropertyDetails = (id: string) => {
    setPreviousView(currentView);
    setSelectedPropertyId(id);
    setCurrentView('property-details');
  };

  // Find dynamic text block for custom page contents
  const findPageContent = (id: string, defText: string) => {
    const page = pages.find(p => p.id === id);
    if (!page) return defText;
    return page.content[currentLanguage] || page.content.en;
  };

  const findPageTitle = (id: string, defTitle: string) => {
    const page = pages.find(p => p.id === id);
    if (!page) return defTitle;
    return page.title[currentLanguage] || page.title.en;
  };

  // Filter public approved properties
  const filteredProperties = properties.filter((p) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(searchLower) ||
                          p.location.toLowerCase().includes(searchLower) ||
                          p.city.toLowerCase().includes(searchLower);

    const matchesType = selectedType === 'all' || p.type === selectedType;

    let matchesPrice = true;
    if (selectedPriceRange !== 'all') {
      // Express all math in USD for consistent range groupings
      const priceInUsd = p.currency === 'USD' ? p.price : p.price / 2850;
      if (selectedPriceRange === 'under-50k') matchesPrice = priceInUsd < 50000;
      else if (selectedPriceRange === '50k-150k') matchesPrice = priceInUsd >= 50000 && priceInUsd <= 150000;
      else if (selectedPriceRange === '150k-350k') matchesPrice = priceInUsd >= 150000 && priceInUsd <= 350000;
      else if (selectedPriceRange === '350k-plus') matchesPrice = priceInUsd > 350000;
    }

    return matchesSearch && matchesType && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      
      {/* Global Live Announcement Bar */}
      {currentView !== 'admin-dashboard' && announcementText && (
        <div 
          style={{ backgroundColor: announcementBg, color: announcementTextCol }}
          className="py-2 px-4 text-center text-[10px] sm:text-xs font-semibold select-none font-sans tracking-wide leading-normal flex items-center justify-center gap-1"
        >
          <span>{announcementText}</span>
        </div>
      )}

      {/* Dynamic Header */}
      {currentView !== 'admin-dashboard' && (
        <Header
          user={user}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          onLoginClick={() => setAuthModalOpen(true)}
          onLogoutClick={handleLogout}
          onNavigate={handleNavigate}
          currentView={currentView}
        />
      )}

      {/* Render panel routing layout views */}
      <main className="flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 min-h-[50vh] text-slate-500 space-y-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-mono tracking-widest uppercase animate-pulse">Loading holdings & cadasters...</p>
          </div>
        ) : currentView === 'property-details' && selectedPropertyId ? (() => {
          const matchedPProp = properties.find(p => p.id === selectedPropertyId);
          if (!matchedPProp) {
            return (
              <div className="py-24 text-center font-mono text-xs text-slate-400">
                Property not found.
                <button onClick={() => setCurrentView('home')} className="block mx-auto mt-4 underline text-blue-600 cursor-pointer">Back home</button>
              </div>
            );
          }
          return (
            <PropertyDetailView
              property={matchedPProp}
              currentLanguage={currentLanguage}
              user={user}
              onBack={() => {
                setCurrentView(previousView || 'home');
                setSelectedPropertyId(null);
              }}
            />
          );
        })() : currentView === 'home' ? (
          /* ==========================================
              MAIN HOMEPAGE VIEW
          ========================================== */
          (() => {
            const homePageObj = pages.find(p => p.slug === 'home' || p.isHomepage);
            if (homePageObj?.sections && homePageObj.sections.length > 0) {
              return (
                <div className="w-full animate-in fade-in duration-300">
                  <PageSectionsRenderer 
                    sections={homePageObj.sections} 
                    properties={properties} 
                    currentLanguage={currentLanguage} 
                    onViewDetails={handleViewPropertyDetails}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    selectedPriceRange={selectedPriceRange}
                    setSelectedPriceRange={setSelectedPriceRange}
                    t={t}
                  />
                </div>
              );
            }

            // Normal Fallback Layout if Database sections are completely empty
            return (
              <div className="space-y-12 animate-in fade-in duration-300 pb-14">
                {/* Elegant Hero Search Banner Section */}
                <section className="relative bg-[#0f172a] text-white py-14 sm:py-20 overflow-hidden">
                  {/* Abstract decorative graphic elements */}
                  <div className="absolute inset-x-0 -bottom-24 h-48 bg-gradient-to-t from-slate-50 to-transparent"></div>
                  <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-900/15 blur-3xl"></div>
                  <div className="absolute -right-20 top-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl"></div>

                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono mb-4">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                      {currentLanguage === 'en' ? 'Bilateral Land Registry Audits' : currentLanguage === 'fr' ? 'Audits de Cadastre Bilatéraux' : 'Uhakiki Rasmi wa Ardhi'}
                    </span>
                    
                    <h2 className="font-sans font-black text-3xl sm:text-5xl tracking-tight max-w-3xl mx-auto leading-tight text-white mb-4">
                      {t.heroTitle}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed mb-8">
                      {t.heroSubtitle}
                    </p>

                    {/* Main Filter Search Box widget */}
                    <div className="max-w-4xl mx-auto bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-xl text-slate-805 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                      {/* Search input text */}
                      <div className="relative md:col-span-2">
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-805 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder={t.searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      </div>

                      {/* Category select */}
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-705 focus:outline-none focus:border-blue-500"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                      >
                        <option value="all">{t.allTypes}</option>
                        <option value="house">{t.house}</option>
                        <option value="land">{t.land}</option>
                        <option value="commercial">{t.commercial}</option>
                        <option value="rental">{t.rental}</option>
                        <option value="investment">{t.investment}</option>
                      </select>

                      {/* Price select */}
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-705 focus:outline-none focus:border-blue-550"
                        value={selectedPriceRange}
                        onChange={(e) => setSelectedPriceRange(e.target.value)}
                      >
                        <option value="all">{currentLanguage === 'en' ? 'All Prices' : 'Tous les prix'}</option>
                        <option value="under-50k">{currentLanguage === 'en' ? 'Under $50k USD' : 'Moins de $50k USD'}</option>
                        <option value="50k-150k">$50k - $150k USD</option>
                        <option value="150k-350k">$150k - $350k USD</option>
                        <option value="350k-plus">{currentLanguage === 'en' ? 'Above $350k USD' : 'Plus de $350k USD'}</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Default Text/Company prologue message */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 block uppercase mb-1">
                      {currentLanguage === 'en' ? 'ADMINISTRATIVE PROLOGUE' : 'PROLOGUE ADMINISTRATIF'}
                    </span>
                    <h3 className="font-sans font-black text-slate-900 text-lg sm:text-xl leading-tight border-b pb-3.5 mb-4">
                      {findPageTitle('home', 'Welcome to IMMO BURUNDI')}
                    </h3>
                    <p className="text-slate-650 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">
                      {findPageContent('home', 'Discover secure holdings across the cadasters of Gitega, Rumonge and Bujumbura.')}
                    </p>
                  </div>
                </section>

                {/* Public Properties Grid */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
                  <div className="flex justify-between items-end border-b border-slate-200 pb-3.5 mb-6">
                    <div>
                      <h3 className="font-sans font-extrabold text-slate-900 text-lg sm:text-xl">
                        {t.publicListings}
                      </h3>
                      <p className="text-slate-450 text-xs mt-0.5 font-mono">
                        {filteredProperties.length} active listings verified
                      </p>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="py-20 text-center font-mono text-xs text-slate-400">
                      {t.loading}
                    </div>
                  ) : filteredProperties.length === 0 ? (
                    <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center p-8 max-w-md mx-auto">
                      <span className="text-2xl">🔍</span>
                      <h4 className="font-sans font-bold text-slate-700 mt-2 text-sm">{t.noProperties}</h4>
                      <p className="text-xs text-slate-404 mt-1">
                        Try adjusting your criteria or search inputs to find matching holdings.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProperties.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          currentLanguage={currentLanguage}
                          onViewDetails={handleViewPropertyDetails}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            );
          })()
        ) : currentView === 'properties' ? (
          /* ==========================================
              DEDICATED PROPERTIES PORTAL / CATALOG
             ========================================== */
          (() => {
            const propertiesPageObj = pages.find(p => p.slug === 'properties' || p.id === 'properties');
            const pageBuilderSections = propertiesPageObj?.sections || [];

            // Conversion helpers
            const EXCHANGE_RATE = 2855;
            const formatShortPrice = (price: number, currency: 'USD' | 'BIF') => {
              const usdVal = currency === 'USD' ? price : price / EXCHANGE_RATE;
              if (usdVal >= 1000000) return `$${(usdVal / 1000000).toFixed(1)}M USD`;
              if (usdVal >= 1000) return `$${(usdVal / 1000).toFixed(0)}k USD`;
              return `$${usdVal} USD`;
            };

            // Filter properties based on type, price range, city, verification state, and search query
            const catalogProperties = properties.filter((p) => {
              if (p.status !== 'approved') return false; // only approved are public

              const searchLower = searchQuery.toLowerCase();
              const matchesSearch = p.title.toLowerCase().includes(searchLower) ||
                                    p.location.toLowerCase().includes(searchLower) ||
                                    p.city.toLowerCase().includes(searchLower) ||
                                    (p.ownerName && p.ownerName.toLowerCase().includes(searchLower));

              const matchesType = selectedType === 'all' || p.type === selectedType;
              const matchesCity = selectedCity === 'all' || p.city.toLowerCase() === selectedCity.toLowerCase();
              
              let matchesVerification = true;
              if (selectedVerification === 'verified') matchesVerification = p.verified === true;
              else if (selectedVerification === 'unverified') matchesVerification = p.verified === false;

              let matchesPrice = true;
              if (selectedPriceRange !== 'all') {
                const priceInUsd = p.currency === 'USD' ? p.price : p.price / EXCHANGE_RATE;
                if (selectedPriceRange === 'under-50k') matchesPrice = priceInUsd < 50000;
                else if (selectedPriceRange === '50k-150k') matchesPrice = priceInUsd >= 50000 && priceInUsd <= 150000;
                else if (selectedPriceRange === '150k-350k') matchesPrice = priceInUsd >= 150000 && priceInUsd <= 350050;
                else if (selectedPriceRange === '350k-plus') matchesPrice = priceInUsd > 350000;
              }

              return matchesSearch && matchesType && matchesCity && matchesVerification && matchesPrice;
            });

            // List of unique cities in our verified database
            const uniqueCities = ['Bujumbura', 'Gitega', 'Rumonge', 'Ngozi', 'Muyinga'];

            return (
              <div className="w-full bg-[#f8fafc]/30 animate-in fade-in duration-300 pb-20 select-text font-sans text-slate-800">
                {/* 1. Page Builder Custom Sections (if defined for 'properties') */}
                {pageBuilderSections.length > 0 && (
                  <div className="w-full border-b border-slate-200 bg-white shadow-xs pb-6">
                    <PageSectionsRenderer 
                      sections={pageBuilderSections} 
                      properties={properties} 
                      currentLanguage={currentLanguage} 
                      onViewDetails={handleViewPropertyDetails}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      selectedType={selectedType}
                      setSelectedType={setSelectedType}
                      selectedPriceRange={selectedPriceRange}
                      setSelectedPriceRange={setSelectedPriceRange}
                      t={t}
                    />
                  </div>
                )}

                {/* 2. Interactive Map & Grid Catalog Block */}
                {/* Immersive Sub-Header Map Banner */}
                <div className="bg-[#0f172a] text-white border-b border-slate-800 relative py-12 px-4 shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-950/40 via-transparent to-indigo-950/35 mix-blend-color-burn pointer-events-none"></div>
                  <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left space-y-2 max-w-xl">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-white font-mono text-[9px] tracking-[0.2em] font-extrabold uppercase border border-white/20 backdrop-blur-md">
                        🛡️ Cadastral Ledger Catalog
                      </span>
                      <h1 className="text-3xl font-black tracking-tight text-white font-display uppercase leading-none mt-2">
                        {currentLanguage === 'en' ? 'Verified Public Land Registers' : 'Fichier Cadastral Public'}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed font-sans mt-2">
                        {currentLanguage === 'en' 
                          ? 'Review certified holdings, plots, and real estate listings in Burundi. Use the integrated cadastral ledger simulator to pinpoint geographic locations.'
                          : 'Parcourez le cadastre certifié et les biens immobiliers vérifiés au Burundi. Utilisez le simulateur géographique pour repérer les parcelles de terre.'}
                      </p>
                    </div>

                    {/* Quick Database Statistics Cards */}
                    <div className="grid grid-cols-3 gap-3.5 w-full md:w-auto font-mono text-left">
                      <div className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-sm">
                        <span className="text-[8.5px] text-slate-400 block uppercase tracking-wider">Active</span>
                        <div className="text-lg font-black text-white mt-1">{properties.filter(p => p.status === 'approved').length} Properties</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-sm">
                        <span className="text-[8.5px] text-slate-400 block uppercase tracking-wider">Verified Audits</span>
                        <div className="text-lg font-black text-emerald-400 mt-1">{properties.filter(p => p.verified && p.status === 'approved').length}</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-sm">
                        <span className="text-[8.5px] text-slate-400 block uppercase tracking-wider">Matches</span>
                        <div className="text-lg font-black text-blue-400 mt-1">{catalogProperties.length}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Interactive Controls & Search Box bar */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm text-slate-800 space-y-4">
                    {/* Top Row: Search Input */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                      <div className="relative md:col-span-6 text-left">
                        <label className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Keywords / Location Name</label>
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-sans"
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        </div>
                      </div>

                      <div className="md:col-span-3 text-left">
                        <label className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">{t.allTypes}</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value)}
                        >
                          <option value="all">{currentLanguage === 'en' ? 'All Formats' : 'Tous les formats'}</option>
                          <option value="house">{t.house}</option>
                          <option value="land">{t.land}</option>
                          <option value="commercial">{t.commercial}</option>
                          <option value="rental">{t.rental}</option>
                          <option value="investment">{t.investment}</option>
                        </select>
                      </div>

                      <div className="md:col-span-3 text-left">
                        <label className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Price Filter limit</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                          value={selectedPriceRange}
                          onChange={(e) => setSelectedPriceRange(e.target.value)}
                        >
                          <option value="all">Any Price Budget</option>
                          <option value="under-50k">Under $50,000 USD</option>
                          <option value="50k-150k">$50,000 - $150,000 USD</option>
                          <option value="150k-350k">$150,000 - $350,000 USD</option>
                          <option value="350k-plus">Over $350,000 USD</option>
                        </select>
                      </div>
                    </div>

                    {/* Bottom Row: Advanced City Filter Toggles & Integrity Badge Toggles */}
                    <div className="border-t border-slate-100 pt-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 text-left">
                      {/* Left: City Filter Toggles */}
                      <div className="space-y-1">
                        <span className="text-[8.5px] font-mono font-extrabold text-slate-400 uppercase tracking-wider block mb-1">CADASTRAL SECTORS / DISTRICTS</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => setSelectedCity('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer ${
                              selectedCity === 'all' 
                                ? `${colors.primaryBg} text-white font-bold shadow-xs` 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            All Regions ({properties.filter(p => p.status === 'approved').length})
                          </button>
                          {uniqueCities.map((city) => {
                            const count = properties.filter(p => p.status === 'approved' && p.city.toLowerCase() === city.toLowerCase()).length;
                            return (
                              <button
                                key={city}
                                onClick={() => setSelectedCity(city)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer ${
                                  selectedCity.toLowerCase() === city.toLowerCase()
                                    ? `${colors.primaryBg} text-white font-bold shadow-xs` 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {city} ({count})
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Verification Status Filter */}
                      <div className="space-y-1">
                        <span className="text-[8.5px] font-mono font-extrabold text-slate-400 uppercase tracking-wider block mb-1">CERTIFICATION INTEGRITY STATUS</span>
                        <div className="flex bg-slate-100/80 p-0.5 rounded-xl w-fit border border-slate-200">
                          <button
                            onClick={() => setSelectedVerification('all')}
                            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                              selectedVerification === 'all' 
                                ? 'bg-white text-slate-800 shadow-xs font-bold' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Show All
                          </button>
                          <button
                            onClick={() => setSelectedVerification('verified')}
                            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                              selectedVerification === 'verified' 
                                ? 'bg-emerald-650 text-white shadow-xs font-bold' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            🛡️ Verified
                          </button>
                          <button
                            onClick={() => setSelectedVerification('unverified')}
                            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                              selectedVerification === 'unverified' 
                                ? 'bg-slate-900 text-white shadow-xs font-bold' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Self-Reported
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation/Layout Toggles */}
                <div className="lg:hidden max-w-7xl mx-auto px-4 mt-4 text-left">
                  <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-xs w-full">
                    <button
                      onClick={() => setMobileViewTab('grid')}
                      className={`flex-1 py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                        mobileViewTab === 'grid' 
                          ? `${colors.primaryBg} text-white` 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      📁 {currentLanguage === 'en' ? 'Listing Grid' : 'Affichage Grille'} ({catalogProperties.length})
                    </button>
                    <button
                      onClick={() => setMobileViewTab('map')}
                      className={`flex-1 py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                        mobileViewTab === 'map' 
                          ? `${colors.primaryBg} text-white` 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🗺️ Cadastral Ledger Map
                    </button>
                  </div>
                </div>

                {/* Split layout block: side-by-side on desktop */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Listings Panel Column */}
                    <div className={`lg:col-span-7 space-y-6 text-left ${mobileViewTab === 'map' ? 'hidden lg:block' : 'block'}`}>
                      {/* Active Filter Pill Status feedback */}
                      <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                        <div className="text-left">
                          <h2 className="font-sans font-black text-slate-800 text-lg uppercase tracking-tight">
                            {currentLanguage === 'en' ? 'Verified Public Registers' : 'Fichier Cadastral Actif'}
                          </h2>
                          <div className="flex items-center gap-2 mt-0.5 font-mono text-slate-400 text-[9.5px] uppercase font-bold">
                            <span>{catalogProperties.length} verified targets matching filters</span>
                            {selectedCity !== 'all' && (
                              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg font-sans">
                                Sector: {selectedCity}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {catalogProperties.length === 0 ? (
                        <div className="py-24 bg-white rounded-3xl border border-slate-200/80 text-center p-10 max-w-lg mx-auto shadow-sm">
                          <span className="text-4xl block mb-3 animate-bounce">🔍</span>
                          <h4 className="font-sans font-black text-slate-700 text-base">{t.noProperties}</h4>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed font-light">
                            {currentLanguage === 'en' 
                              ? 'Change your search criteria or clear the region toggles to browse more approved records.'
                              : 'Veuillez modifier votre filtre de recherche ou effacer les filtres régionaux pour voir d\'autres parcelles.'}
                          </p>
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedType('all');
                              setSelectedPriceRange('all');
                              setSelectedCity('all');
                              setSelectedVerification('all');
                            }}
                            className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase transition-all duration-200 hover:bg-slate-800 cursor-pointer"
                          >
                            Clear All Filters
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {catalogProperties.map((property) => (
                            <div 
                              key={property.id}
                              onMouseEnter={() => setHoveredPropId(property.id)}
                              onMouseLeave={() => setHoveredPropId(null)}
                              className={`transition-all duration-300 rounded-3xl ${
                                hoveredPropId === property.id 
                                  ? 'ring-2 ring-offset-2 ring-blue-500 scale-[1.01]' 
                                  : ''
                              }`}
                            >
                              <PropertyCard
                                property={property}
                                currentLanguage={currentLanguage}
                                onViewDetails={handleViewPropertyDetails}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Highly Polished Interactive SVG Map Panel */}
                    <div className={`lg:col-span-5 ${mobileViewTab === 'grid' ? 'hidden lg:block' : 'block'} sticky top-24 z-10`}>
                      <div className="bg-[#0f172a] text-white rounded-3xl border border-slate-800 p-5 shadow-lg flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <span className="text-[8px] font-mono text-blue-400 block uppercase tracking-widest font-bold">Interactive Geographic Tracker</span>
                            <h3 className="font-sans font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                              🗺️ Cadaster Ledger Map
                            </h3>
                          </div>

                          {/* Map Visual Theme controls */}
                          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-[9px] font-mono font-bold uppercase">
                            <button
                              onClick={() => setMapStyle('vector')}
                              className={`px-2.5 py-1 rounded-lg cursor-pointer ${mapStyle === 'vector' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                            >
                              Satellite Grid
                            </button>
                            <button
                              onClick={() => setMapStyle('cadaster')}
                              className={`px-2.5 py-1 rounded-lg cursor-pointer ${mapStyle === 'cadaster' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                            >
                              Cadastral Wireframe
                            </button>
                          </div>
                        </div>

                        {/* Visual SVG Stage */}
                        <div className="aspect-square relative w-full bg-[#090d16] border border-slate-800 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center">
                          {/* Beautiful grid layer */}
                          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-15"></div>
                          
                          {/* Simulated Lake Tanganyika background on map */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
                            {/* lake Tanganyika visual blob (western border) */}
                            <path 
                              d="M 12,240 C 15,260 25,320 40,360 C 45,372 40,390 35,400 L 0,400 L 0,200 Z" 
                              fill="#14357a" 
                              fillOpacity={mapStyle === 'vector' ? 0.25 : 0.12} 
                              stroke="#2563eb" 
                              strokeWidth="1.5"
                              strokeOpacity="0.4"
                            />
                            {/* Lake Rweru & Cohoha on northern border */}
                            <path 
                              d="M 230,10 C 250,5 285,15 280,25 C 275,30 240,40 230,20 Z" 
                              fill="#14357a" 
                              fillOpacity="0.15" 
                              stroke="#2563eb" 
                              strokeWidth="1"
                              strokeOpacity="0.3"
                            />
                          </svg>

                          {/* Central Geographic Grid outlines */}
                          <svg className="w-4/5 h-4/5 text-slate-800" viewBox="0 0 300 300">
                            {/* Burundi country outline mock paths */}
                            <path
                              d="M 90,40 Q 150,20 210,40 T 260,110 T 250,200 T 170,270 T 90,260 Q 30,195 50,130 Q 60,60 90,40 Z"
                              fill={mapStyle === 'vector' ? '#111827' : 'transparent'}
                              stroke={mapStyle === 'vector' ? '#475569' : '#1e293b'}
                              strokeWidth="2.5"
                              strokeDasharray={mapStyle === 'cadaster' ? '3 3' : ''}
                              className="transition-all duration-500"
                            />

                            {/* Province Borders overlay */}
                            <path d="M 90,40 C 110,120 150,135 170,270" stroke="#1e293b" strokeWidth="1" strokeOpacity="0.35" fill="none" />
                            <path d="M 50,130 Q 150,145 250,200" stroke="#1e293b" strokeWidth="1" strokeOpacity="0.35" fill="none" />
                            
                            {/* Major Administrative centers labels */}
                            <g className="text-[#475569] font-mono text-[8px] font-bold select-none pointer-events-none opacity-80 uppercase tracking-widest">
                              <text x="52" y="145" className="fill-slate-500">Bujumbura</text>
                              <text x="135" y="165" className="fill-slate-500 text-center">Gitega</text>
                              <text x="58" y="225" className="fill-slate-500">Rumonge</text>
                              <text x="110" y="75" className="fill-slate-500">Ngozi</text>
                              <text x="195" y="115" className="fill-slate-500">Muyinga</text>
                            </g>
                          </svg>

                          {/* Dynamic Property Pin overlays */}
                          {catalogProperties.map((p) => {
                            // Extract numeric coordinates with standard fallback ranges to map nicely within 100% boundary
                            let mapX = 150;
                            let mapY = 150;

                            if (p.gpsLocation) {
                              try {
                                const [latStr, longStr] = p.gpsLocation.split(',');
                                const lat = parseFloat(latStr);
                                const long = parseFloat(longStr);
                                
                                // Convert onto SVG canvas coordinates (400x400 space)
                                mapX = Math.round(((long - 28.8) / (30.8 - 28.8)) * 360) + 20;
                                mapY = Math.round(((-3.0 - lat) / (-4.5 - -3.0)) * 340) + 30; // inverted lat mapping

                                // clamp values safety
                                if (mapX < 15 || mapX > 385) mapX = 150;
                                if (mapY < 15 || mapY > 385) mapY = 150;
                              } catch {
                                const cityLower = p.city.toLowerCase();
                                if (cityLower.includes('bujumbura')) { mapX = 66; mapY = 180; }
                                else if (cityLower.includes('gitega')) { mapX = 188; mapY = 190; }
                                else if (cityLower.includes('rumonge')) { mapX = 70; mapY = 270; }
                                else if (cityLower.includes('ngozi')) { mapX = 155; mapY = 90; }
                              }
                            } else {
                              const cityLower = p.city.toLowerCase();
                              if (cityLower.includes('bujumbura')) { mapX = 66; mapY = 180; }
                              else if (cityLower.includes('gitega')) { mapX = 188; mapY = 190; }
                              else if (cityLower.includes('rumonge')) { mapX = 70; mapY = 270; }
                              else if (cityLower.includes('ngozi')) { mapX = 155; mapY = 90; }
                            }

                            const isHovered = hoveredPropId === p.id;

                            // Color map based on property selection
                            let pinColor = p.verified ? 'fill-emerald-500' : 'fill-slate-400';
                            let strokeColor = p.verified ? 'stroke-emerald-400' : 'stroke-slate-300';

                            return (
                              <div
                                key={p.id}
                                style={{ left: `${(mapX / 400) * 100}%`, top: `${(mapY / 400) * 100}%` }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/pin cursor-pointer"
                                onMouseEnter={() => setHoveredPropId(p.id)}
                                onMouseLeave={() => setHoveredPropId(null)}
                                onClick={() => handleViewPropertyDetails(p.id)}
                              >
                                {/* Ping animation glow if fully verified or hovered */}
                                {(p.verified || isHovered) && (
                                  <span className={`absolute inline-flex h-7 w-7 rounded-full opacity-65 animate-ping -left-1.5 -top-1.5 ${p.verified ? 'bg-emerald-400' : 'bg-blue-300'}`}></span>
                                )}
                                
                                {/* Pin Node marker Icon */}
                                <div className="relative">
                                  <svg className="w-4 h-4 shadow-xl pointer-events-none" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" className={`${pinColor} ${strokeColor}`} strokeWidth="15" />
                                  </svg>
                                </div>

                                {/* Beautiful real-time interactive Hover card tooltip positioned dynamically */}
                                {isHovered && (
                                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/98 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-2xl z-55 w-52 text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-800 mb-2 relative">
                                      <img src={p.images[0]} referrerPolicy="no-referrer" className="w-full h-full object-cover animate-in fade-in duration-300" />
                                      {p.verified && (
                                        <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[7px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md">
                                          Verified
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-[10px] font-bold font-sans text-white truncate leading-tight">{p.title}</h4>
                                    <p className="text-[8.5px] font-mono text-slate-400 truncate mt-0.5">{p.location}</p>
                                    <div className="flex justify-between items-center mt-1.5 border-t border-slate-800/80 pt-1.5 font-mono text-[9px] text-white font-sans">
                                      <span className="font-extrabold text-teal-400">{formatShortPrice(p.price, p.currency)}</span>
                                      <span className="text-slate-500 uppercase tracking-wider text-[7px]">{p.city}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Anchor Legend absolute label */}
                          <div className="absolute bottom-3 left-3 bg-slate-950/95 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none flex gap-3.5 items-center">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block font-black"></span>
                              <span>Verified Audits</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block animate-pulse"></span>
                              <span>Declarative</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive hint block */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 text-xs text-slate-300 leading-relaxed text-left flex items-start gap-2.5">
                          <span className="text-sm">💡</span>
                          <p className="font-sans font-light">
                            <strong>Dynamic Sync:</strong> Hovering or clicking on coordinates/pins on the map highlights corresponding property cards. Green points represent fully checked documents.
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })()
        ) : getMatchingPage(currentView) !== undefined ? (
          /* ==========================================
              DYNAMIC CUSTOM PAGE ROUTER
          ========================================== */
          (() => {
            const matchedPl = getMatchingPage(currentView);
            if (!matchedPl) return null;
            
            if (matchedPl.sections && matchedPl.sections.length > 0) {
              return (
                <div className="w-full animate-in fade-in duration-300">
                  <PageSectionsRenderer 
                    sections={matchedPl.sections} 
                    properties={properties} 
                    currentLanguage={currentLanguage} 
                    onViewDetails={handleViewPropertyDetails}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    selectedPriceRange={selectedPriceRange}
                    setSelectedPriceRange={setSelectedPriceRange}
                    t={t}
                  />
                </div>
              );
            }

            return (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 animate-in fade-in duration-300">
                <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block mb-1 font-bold">
                  {currentLanguage === 'en' ? 'OFFICIAL DOCUMENT REFERENCE' : 'DOCUMENT OFFICIEL DE CONFORMITÉ'}
                </span>
                <div className="bg-white border border-slate-205 rounded-2xl p-6 sm:p-10 shadow-sm leading-relaxed prose prose-slate">
                  <h1 className="font-sans font-black text-slate-900 text-2xl sm:text-3xl border-b pb-4 mb-6">
                    {matchedPl.title[currentLanguage] || matchedPl.title.en}
                  </h1>
                  <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed space-y-4 font-sans">
                    {matchedPl.content[currentLanguage] || matchedPl.content.en}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (window.location.pathname.includes('/pages/') || window.location.pathname.startsWith('/pages')) ? (
          /* ==========================================
              404 NOT FOUND FOR EXPLICIT PAGES ROUTELINE
          ========================================== */
          <div className="max-w-md mx-auto py-24 text-center px-4 animate-in fade-in duration-200">
            <span className="text-4xl text-slate-400 block mb-4">🔍</span>
            <h2 className="font-sans font-black text-slate-900 text-lg">Page Not Found</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              The requested land cadaster dynamic document or page does not exist on our servers. It may have been deleted or archived by the compliance team.
            </p>
            <button
              onClick={() => handleNavigate('home')}
              className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs uppercase cursor-pointer transition-all"
            >
              go back to homepage
            </button>
          </div>
        ) : currentView === 'agreement' ? (
          /* ==========================================
              SERVICE AGREEMENT WITH DIGITAL SIGNATURE
          ========================================== */
          <div className="py-6 sm:py-10">
            <ContractDetails currentLanguage={currentLanguage} />
          </div>
        ) : currentView === 'contact' ? (
          /* ==========================================
              CONTACT US PAGE WITH LOCAL METADATA
          ========================================== */
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 animate-in fade-in duration-300 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-205 p-6 rounded-2xl shadow-sm md:col-span-2 space-y-6">
              <h2 className="font-sans font-black text-slate-900 text-xl border-b pb-3 leading-none">
                {findPageTitle('contact', 'Contact Us')}
              </h2>
              <div className="text-xs sm:text-sm text-slate-650 leading-relaxed whitespace-pre-wrap">
                {findPageContent('contact', 'Customer support channels.')}
              </div>
              
              {/* Quick simulation interactive contact form */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3 print:hidden">
                <span className="text-[10px] font-mono font-bold text-slate-550 block uppercase tracking-wide">Submit Inquiry Message</span>
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <input type="text" placeholder="Your Name" className="bg-white border border-slate-205 rounded p-2 focus:outline-none" />
                  <input type="email" placeholder="Your Email" className="bg-white border border-slate-205 rounded p-2 focus:outline-none" />
                  <textarea placeholder="Message specifications..." rows={3} className="col-span-2 bg-white border border-slate-205 rounded p-2.5 focus:outline-none" />
                  <button
                    type="button"
                    onClick={() => alert('Simulated query submitted! Brokerage agents will correspond shortly.')}
                    className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-bold p-2 rounded-lg text-xs tracking-wider uppercase cursor-pointer transition-colors"
                  >
                    Submit Query
                  </button>
                </div>
              </div>
            </div>

            {/* Quick side metadata */}
            <div className="space-y-6">
              <div className="bg-[#0f172a] text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                <span className="text-[10px] font-mono font-bold text-blue-500 block uppercase tracking-widest">Office HQ Hours</span>
                <div className="text-xs leading-relaxed space-y-2 text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>Mon - Fri: 8:00 AM - 5:30 PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>Saturday: 9:00 AM - 1:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-450">
                    <Clock className="w-4 h-4" />
                    <span>Sunday: Closed (Holy rest day)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3 text-xs leading-relaxed">
                <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase tracking-wider">Helpdesk Help</span>
                <div className="flex items-center gap-2 text-slate-800">
                  <span className="text-blue-600 font-bold">📞</span>
                  <span>+257 22 22 45 45</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-semibold underline truncate">
                  <span>📧</span>
                  <span>support@immoburundi.bi</span>
                </div>
              </div>
            </div>
          </div>
        ) : currentView === 'client-dashboard' && user ? (
          /* ==========================================
              CLIENT DASHBOARD VIEW (DEDICATED PANEL)
          ========================================== */
          <ClientDashboard user={user} currentLanguage={currentLanguage} onViewDetails={handleViewPropertyDetails} />
        ) : currentView === 'admin-dashboard' && user?.role === 'admin' ? (
          /* ==========================================
              ADMIN DASHBOARD VIEW (CORE REGULATORY)
          ========================================== */
          <AdminDashboard 
            currentLanguage={currentLanguage} 
            onThemeChange={() => setThemeRev(r => r + 1)} 
            onViewSite={() => setCurrentView('home')} 
          />
        ) : (
          /* FALLBACK / OUT-OF-SESSION HANDLER */
          <div className="max-w-md mx-auto py-24 text-center px-4 animate-in fade-in duration-200">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-sans font-black text-slate-900 text-lg">Administrative Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              You are trying to access a protected workspace folder. Please click the Acccess Portal button below to supply authorized demo credentials.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs uppercase cursor-pointer transition-all"
            >
              Sign In to Portal
            </button>
          </div>
        )}
      </main>

      {/* ==========================================
          FOOTER COMPONENT WIT OFFICIAL DISCLAIMERS
      ========================================== */}
      {currentView !== 'admin-dashboard' && (
        <footer className="bg-[#0f172a] text-slate-400 border-t border-slate-800 py-12 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              {/* Logo and brief */}
              <div className="md:col-span-2 space-y-4">
                <span className={`font-sans font-black text-lg tracking-tight ${colors.primaryText}`}>
                  {headerTitle}
                </span>
                <p className="text-[11.5px] text-slate-400 leading-normal max-w-sm font-sans italic-quotes">
                  {headerTitle} provides real estate listing and verification support services. Verification statuses are based on documents presented by owners or representatives and do not constitute a legal ownership guarantee. Users are encouraged to conduct independent legal due diligence before completing transactions.
                </p>
              </div>

              {/* Quick links */}
              <div>
                <span className="text-[10px] font-mono text-slate-500 font-extrabold block uppercase tracking-wider mb-3">CONFORMITY ARCHIVE</span>
                <ul className="text-xs space-y-2 font-medium">
                  <li><button onClick={() => handleNavigate('about')} className="hover:text-blue-400 cursor-pointer">About us</button></li>
                  <li><button onClick={() => handleNavigate('disclaimer')} className="hover:text-blue-400 cursor-pointer">Verification Disclaimer</button></li>
                  <li><button onClick={() => handleNavigate('agreement')} className="hover:text-blue-400 cursor-pointer text-blue-400">✍️ Service Agreement Contract</button></li>
                </ul>
              </div>

              {/* Legal files links */}
              <div>
                <span className="text-[10px] font-mono text-slate-500 font-extrabold block uppercase tracking-wider mb-3">PRIVACY & TERMS</span>
                <ul className="text-xs space-y-2 font-medium">
                  <li><button onClick={() => handleNavigate('privacy')} className="hover:text-blue-400 cursor-pointer text-slate-400">Privacy Policy</button></li>
                  <li><button onClick={() => handleNavigate('terms')} className="hover:text-blue-400 cursor-pointer text-slate-400">Terms & Conditions</button></li>
                  <li><button onClick={() => handleNavigate('contact')} className="hover:text-blue-400 cursor-pointer">Contact Desk</button></li>
                </ul>
              </div>

            </div>

            <div className="border-t border-slate-800 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10.5px] text-slate-500 font-mono">
              <span>{footerCopyright}</span>
              <span>Accredited Hub • Bujumbura, Republic of Burundi</span>
            </div>
          </div>
        </footer>
      )}

      {/* Auth Modal Trigger Popups */}
      {authModalOpen && (
        <AuthModal
          currentLanguage={currentLanguage}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

    </div>
  );
}
