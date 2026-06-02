import { useState, useEffect } from 'react';
import { User, Property, WebPage } from './types';
import { Language, translations } from './translations';
import Header from './components/Header';
import PropertyCard from './components/PropertyCard';
import AuthModal from './components/AuthModal';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import ContractDetails from './components/ContractDetails';
import { Search, MapPin, Building2, Phone, Mail, Clock, HelpCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ibFetch } from './apiMock';
import PageSectionsRenderer from './components/PageSectionsRenderer';
import { getThemeSettings } from './theme';
import PropertyDetailView from './components/PropertyDetailView';

export default function App() {
  // Local states
  const [themeRev, setThemeRev] = useState(0);
  const { colors, headerTitle, footerCopyright } = getThemeSettings();

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

  const [currentView, setCurrentView] = useState('home'); // active view slug
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<string>('home');
  const [properties, setProperties] = useState<Property[]>([]);
  const [pages, setPages] = useState<WebPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Search filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');

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
    // Scroll to top on navigation triggers
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    // Auto redirect to correct workspace tab
    if (authenticatedUser.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('client-dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
    localStorage.removeItem('ib_user');
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
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
      
      {/* Dynamic Header */}
      <Header
        user={user}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        onLoginClick={() => setAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        onNavigate={handleNavigate}
        currentView={currentView}
      />

      {/* Render panel routing layout views */}
      <main className="flex-grow">
        {currentView === 'property-details' && selectedPropertyId ? (() => {
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
          <div className="space-y-12 animate-in fade-in duration-300">
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
                <div className="max-w-4xl mx-auto bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-xl text-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                  
                  {/* Search input text */}
                  <div className="relative md:col-span-2">
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-805 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
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

            {/* Dynamic Intro/Homepage Text from Page Manager Block */}
            {(() => {
              const homePageObj = pages.find(p => p.slug === 'home' || p.isHomepage);
              if (homePageObj?.sections && homePageObj.sections.length > 0) {
                return <PageSectionsRenderer sections={homePageObj.sections} properties={properties} currentLanguage={currentLanguage} onViewDetails={handleViewPropertyDetails} />;
              }
              return (
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
              );
            })()}

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
        ) : pages.some(p => p.slug === currentView) ? (
          /* ==========================================
              DYNAMIC CUSTOM PAGE ROUTER
          ========================================== */
          (() => {
            const matchedPl = pages.find(p => p.slug === currentView);
            if (!matchedPl) return null;
            
            if (matchedPl.sections && matchedPl.sections.length > 0) {
              return (
                <div className="w-full animate-in fade-in duration-300">
                  <PageSectionsRenderer sections={matchedPl.sections} properties={properties} currentLanguage={currentLanguage} onViewDetails={handleViewPropertyDetails} />
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
          <AdminDashboard currentLanguage={currentLanguage} onThemeChange={() => setThemeRev(r => r + 1)} />
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
