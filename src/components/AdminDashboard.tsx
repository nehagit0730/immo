import { useState, useEffect, FormEvent } from 'react';
import { Property, WebPage, EmailLog, SystemStats } from '../types';
import { Language, translations } from '../translations';
import { ShieldCheck, Plus, Trash2, Edit3, Check, X, Mail, Layers, BarChart2, CheckCircle, RefreshCw, Eye, Home, Sparkles, MapPin, Search } from 'lucide-react';

interface AdminDashboardProps {
  currentLanguage: Language;
}

export default function AdminDashboard({ currentLanguage }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'all-listings' | 'submissions' | 'pages' | 'emails'>('analytics');
  
  // App data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [pages, setPages] = useState<WebPage[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Property Filters / search
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyFilterType, setPropertyFilterType] = useState<string>('all');

  // Submit Review state
  const [reviewingProperty, setReviewingProperty] = useState<Property | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Page Editor state
  const [editingPage, setEditingPage] = useState<WebPage | null>(null);
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [newPageSlug, setNewPageSlug] = useState('');
  
  // Page edits translation states
  const [pageTitleEn, setPageTitleEn] = useState('');
  const [pageTitleFr, setPageTitleFr] = useState('');
  const [pageTitleSw, setPageTitleSw] = useState('');
  const [pageContentEn, setPageContentEn] = useState('');
  const [pageContentFr, setPageContentFr] = useState('');
  const [pageContentSw, setPageContentSw] = useState('');

  // Add Listing Form (Admin adding properties directly)
  const [adminAddOpen, setAdminAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addCurrency, setAddCurrency] = useState<'USD' | 'BIF'>('USD');
  const [addType, setAddType] = useState<string>('house');
  const [addLocation, setAddLocation] = useState('');
  const [addCity, setAddCity] = useState('');
  const [addBedrooms, setAddBedrooms] = useState('');
  const [addBathrooms, setAddBathrooms] = useState('');
  const [addArea, setAddArea] = useState('');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [addGpsLocation, setAddGpsLocation] = useState('');

  const t = translations[currentLanguage];

  // Fetch admin ecosystem metrics
  const fetchAllAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch all properties
      const pRes = await fetch('/api/properties?role=admin');
      const pData = await pRes.json();
      setProperties(pData);

      // Fetch all dynamic pages
      const pgRes = await fetch('/api/pages');
      const pgData = await pgRes.json();
      setPages(pgData);

      // Fetch simulated emails outbox logs
      const emRes = await fetch('/api/emails');
      const emData = await emRes.json();
      setEmails(emData);

      // Fetch stats summary
      const stRes = await fetch('/api/stats');
      const stData = await stRes.json();
      setStats(stData);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // Admin Direct Listing Actions
  const handleAddNewProperty = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      title: addTitle,
      description: addDescription,
      price: Number(addPrice),
      currency: addCurrency,
      type: addType,
      location: addLocation,
      city: addCity,
      bedrooms: addBedrooms ? Number(addBedrooms) : undefined,
      bathrooms: addBathrooms ? Number(addBathrooms) : undefined,
      area: addArea || undefined,
      images: addImageUrl ? [addImageUrl] : [],
      gpsLocation: addGpsLocation || undefined,
      ownerId: 'admin',
      role: 'admin' // auto approve and mark verified
    };

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAdminAddOpen(false);
        // Clear inputs
        setAddTitle('');
        setAddDescription('');
        setAddPrice('');
        setAddCurrency('USD');
        setAddType('house');
        setAddLocation('');
        setAddCity('');
        setAddBedrooms('');
        setAddBathrooms('');
        setAddArea('');
        setAddImageUrl('');
        setAddGpsLocation('');
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmission = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      alert(currentLanguage === 'en' ? ' rejections must declare an objection statement!' : 'Un motif de refus doit être fourni !');
      return;
    }

    try {
      const res = await fetch(`/api/properties/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason })
      });

      if (res.ok) {
        setReviewingProperty(null);
        setRejectionReason('');
        fetchAllAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleVerification = async (id: string) => {
    try {
      const res = await fetch(`/api/properties/${id}/verify`, { method: 'POST' });
      if (res.ok) {
        fetchAllAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteListing = async (id: string) => {
    const check = window.confirm(currentLanguage === 'en' ? 'Permanently delete this property file?' : 'Supprimer définitivement ce bien ?');
    if (!check) return;

    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAllAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Content Builder Page Management
  const handleOpenEditPage = (page: WebPage) => {
    setEditingPage(page);
    setPageTitleEn(page.title.en);
    setPageTitleFr(page.title.fr);
    setPageTitleSw(page.title.sw);
    setPageContentEn(page.content.en);
    setPageContentFr(page.content.fr);
    setPageContentSw(page.content.sw);
  };

  const handleSavePageContent = async (e: FormEvent) => {
    if (!editingPage) return;
    e.preventDefault();

    const payload = {
      title: { en: pageTitleEn, fr: pageTitleFr, sw: pageTitleSw },
      content: { en: pageContentEn, fr: pageContentFr, sw: pageContentSw }
    };

    try {
      const res = await fetch(`/api/pages/${editingPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditingPage(null);
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetHomepage = async (id: string) => {
    try {
      const res = await fetch(`/api/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHomepage: true })
      });
      if (res.ok) {
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomPage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPageSlug) return;

    const payload = {
      slug: newPageSlug,
      title: { en: pageTitleEn || 'New Custom Page', fr: pageTitleFr || 'Nouvelle Page', sw: pageTitleSw || 'Ukurasa Mpya' },
      content: { en: pageContentEn || 'Content details...', fr: pageContentFr || 'Détails du contenu...', sw: pageContentSw || 'Maelezo hapa...' }
    };

    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }
      setAddPageOpen(false);
      setNewPageSlug('');
      // Clear translation editing states
      setPageTitleEn('');
      setPageTitleFr('');
      setPageTitleSw('');
      setPageContentEn('');
      setPageContentFr('');
      setPageContentSw('');
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePage = async (id: string) => {
    const confirmation = window.confirm(currentLanguage === 'en' ? 'Do you really want to delete this custom page?' : 'Supprimer cette page ?');
    if (!confirmation) return;

    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter listings based on query
  const filteredProperties = properties.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(propertySearch.toLowerCase()) || 
                        p.location.toLowerCase().includes(propertySearch.toLowerCase()) || 
                        p.city.toLowerCase().includes(propertySearch.toLowerCase());
    const matchType = propertyFilterType === 'all' || p.type === propertyFilterType;
    return matchSearch && matchType;
  });

  const pendingSubmissions = properties.filter((p) => p.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Admin Title Banner */}
      <div className="bg-[#0f172a] rounded-sm p-6 sm:p-7 text-white border border-slate-800 shadow-md mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 fill-current text-blue-500" />
            IMMO BURUNDI OFFICIAL ADMINISTRATION PORTAL
          </span>
          <h1 className="font-sans font-black text-2xl tracking-wide uppercase mt-1">
            Core Webmaster & Regulatory Control
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAdminAddOpen(true)}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 font-extrabold px-3.5 py-3 rounded-sm text-xs tracking-wider uppercase cursor-pointer shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Direct Admin Listing
          </button>
          <button
            onClick={fetchAllAdminData}
            className="p-2.5 border border-slate-700 bg-slate-900 rounded-sm hover:text-blue-500 hover:border-slate-500 text-slate-350 transition-all cursor-pointer"
            title="Refresh Database Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Control Tabs */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto gap-4 no-scrollbar">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Analytics & Views
        </button>
        <button
          onClick={() => setActiveTab('all-listings')}
          className={`pb-3 text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all-listings' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          All Properties ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer relative whitespace-nowrap ${
            activeTab === 'submissions' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Client Submissions Check
          {pendingSubmissions.length > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-red-650 bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
              {pendingSubmissions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`pb-3 text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pages' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-4 h-4" />
          Content Pages Builder
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`pb-3 text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'emails' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          Simulated Outbound Logs
        </button>
      </div>

      {/* View panel renderer */}
      {isLoading ? (
        <div className="py-20 text-center font-mono text-xs text-slate-400">
          Syncing IMMO BURUNDI admin structures...
        </div>
      ) : activeTab === 'analytics' ? (
        /* Analytics summary modules cards */
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Total Listings</span>
              <span className="text-2xl font-black text-slate-850 block mt-1">{stats?.totalProperties}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Pending Audit</span>
              <span className="text-2xl font-black text-yellow-600 block mt-1">{stats?.pendingProperties}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Approved Active</span>
              <span className="text-2xl font-black text-green-600 block mt-1">{stats?.approvedProperties}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Total Users</span>
              <span className="text-2xl font-black text-blue-600 block mt-1">{stats?.totalUsers}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual breakdown widget progress bars */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <h3 className="font-sans font-bold text-slate-800 text-sm mb-4">Properties by Category Breakdown</h3>
              <div className="space-y-3.5 text-xs text-slate-550">
                {['house', 'land', 'commercial', 'rental', 'investment'].map((type) => {
                  const count = properties.filter((p) => p.type === type).length;
                  const percent = properties.length > 0 ? (count / properties.length) * 100 : 0;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="capitalize">{type === 'rental' ? 'Rental Apartments' : type === 'land' ? 'Land Plots' : type}</span>
                        <span className="font-mono">{count} units ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated engagements charts */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="font-sans font-bold text-slate-800 text-sm mb-1.5">Engagement Analytics Tracker</h3>
                <p className="text-[11px] text-slate-550 leading-normal">
                  Historical telemetry metrics matching customer activity patterns in Bujumbura, Gitega, Rumonge and Ngozi.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
                  <span className="text-[9px] font-mono uppercase tracking-wider block text-slate-400">Total Page Hits</span>
                  <span className="font-black text-slate-800 text-xl block mt-0.5">{stats?.totalViews}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">📥 Realtime telemetry sync</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl">
                  <span className="text-[9px] font-mono uppercase tracking-wider block text-slate-400">Buyer Inquiries</span>
                  <span className="font-black text-blue-900 text-xl block mt-0.5">{stats?.totalInquiries}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">📞 Direct click out calls</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'all-listings' ? (
        /* List of ALL properties with filters and actions */
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3.5">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Filter by title, street, neighborhood..."
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <select
              value={propertyFilterType}
              onChange={(e) => setPropertyFilterType(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-705 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="house">House / Villa</option>
              <option value="land">Land plots</option>
              <option value="commercial">Commercial buildings</option>
              <option value="rental">Rental Apartments</option>
              <option value="investment">Investment opportunities</option>
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-650">
                <thead className="bg-[#0f172a] text-slate-350 font-mono text-[9px] uppercase tracking-wide">
                  <tr>
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Title / Address</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Submitter Details</th>
                    <th className="p-3.5 text-center">Verification Badge</th>
                    <th className="p-3.5 text-center">Legal Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">No properties matching filters have been found.</td>
                    </tr>
                  ) : filteredProperties.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-mono text-[10px] text-slate-450">{p.id}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 truncate max-w-xs">{p.title}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {p.location}, {p.city}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 font-mono">
                        {p.currency === 'USD' ? `$${p.price.toLocaleString()}` : `${p.price.toLocaleString()} BIF`}
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-700">{p.ownerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono italic">{p.ownerEmail}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleVerification(p.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                            p.verified 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                          }`}
                          title="Click to toggle official verification status"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 fill-current" />
                          {p.verified ? 'Verified Active' : 'Unverified'}
                        </button>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          p.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : p.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setReviewingProperty(p);
                            setRejectionReason('');
                          }}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded transition-colors cursor-pointer"
                          title="Review / Approve Listing"
                        >
                          ⚖️
                        </button>
                        <button
                          onClick={() => handleDeleteListing(p.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded transition-colors cursor-pointer"
                          title="Delete Listing permanently"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'submissions' ? (
        /* Client submissions review section */
        <div className="space-y-4">
          <div className="bg-[#0f172a] text-white p-4 rounded-xl border border-slate-800 text-[11px] leading-relaxed">
            <span className="font-extrabold text-blue-500 block mb-0.5">APPROVAL PROTOCOL DECREE</span>
            Verify client-submitted listings against official urban records or cadaster Blueprints. Approving a property sends an automatic congratualtions simulated email to the client user. Rejections send objection statement reasons.
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-12 text-center text-slate-500 italic block">
              🎉 All client submissions have been vetted! Zero pending review tasks left.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between gap-5">
                  <div className="space-y-3 flex-grow">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono tracking-wider bg-slate-100 text-slate-450 p-0.5 rounded">ID: {p.id}</span>
                      <span className="text-[10px] font-mono text-slate-400 capitalize bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded">Type: {p.type}</span>
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-slate-950 text-base">{p.title}</h4>
                      <p className="text-xs text-slate-650 leading-relaxed mt-1 italic">"{p.description}"</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs leading-none">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-[9px] font-mono text-slate-400 block mb-0.5">Price</span>
                        <strong className="text-slate-800 font-mono">
                          {p.currency === 'USD' ? `$${p.price.toLocaleString()}` : `${p.price.toLocaleString()} BIF`}
                        </strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-[9px] font-mono text-slate-400 block mb-0.5">Neighborhood Region & City</span>
                        <strong className="text-slate-800">{p.location}, {p.city}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-[9px] font-mono text-slate-400 block mb-0.5">Client Submitter</span>
                        <strong className="text-slate-800">{p.ownerName}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-[9px] font-mono text-slate-400 block mb-0.5">Client Contact</span>
                        <strong className="text-slate-800 text-[10px] tracking-tight">{p.ownerPhone}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Approve or Reject triggers */}
                  <div className="flex md:flex-col justify-end gap-2 shrink-0 md:border-l border-slate-100 md:pl-5">
                    <button
                      onClick={() => handleReviewSubmission(p.id, 'approved')}
                      className="bg-green-600 hover:bg-green-500 text-white font-bold p-3 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1.5 uppercase transition-all cursor-pointer shadow-sm md:w-36"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setReviewingProperty(p);
                        setRejectionReason('');
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 font-bold p-3 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1.5 uppercase transition-all cursor-pointer md:w-36"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'pages' ? (
        /* Dynamic Pages builder Content management */
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-3 sm:px-4 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-600 font-sans leading-none">
              📁 Manage core structural landing interfaces and disclaimers. Enable dynamic layouts instant.
            </div>
            <button
              onClick={() => {
                setEditingPage(null);
                setAddPageOpen(true);
                setNewPageSlug('');
                // Clear state
                setPageTitleEn('');
                setPageTitleFr('');
                setPageTitleSw('');
                setPageContentEn('');
                setPageContentFr('');
                setPageContentSw('');
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 uppercase cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              Build Page
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((p) => (
              <div key={p.id} className="bg-white border border-slate-250 rounded-xl p-4 shadow-sm flex flex-col justify-between h-56 relative overflow-hidden">
                <div>
                  <div className="flex justify-between items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-350 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                      Slug: /{p.slug}
                    </span>
                    {p.isHomepage ? (
                      <span className="bg-blue-100 text-blue-800 border border-blue-200 font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wide">
                        <Sparkles className="w-3 h-3 fill-current" />
                        Homepage Target
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetHomepage(p.id)}
                        className="bg-slate-100 hover:bg-blue-600 hover:text-white border border-slate-205 text-slate-550 font-bold text-[9px] px-2 py-0.5 rounded-full cursor-pointer transition-all"
                      >
                        Set Homepage
                      </button>
                    )}
                  </div>

                  <h4 className="font-sans font-extrabold text-slate-900 text-sm line-clamp-1">
                    EN: {p.title.en}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 line-clamp-1 italic mt-0.5">
                    FR: {p.title.fr} | SW: {p.title.sw}
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-3 mt-3 leading-relaxed font-sans">
                    {p.content.en}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-4">
                  <span className="text-[9px] text-slate-400 font-mono tracking-tight uppercase">
                    Page ID: {p.id}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditPage(p)}
                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded transition-all cursor-pointer text-xs flex items-center gap-1 font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Content
                    </button>
                    
                    {!p.systemPage && (
                      <button
                        onClick={() => handleDeletePage(p.id)}
                        className="bg-red-50 text-red-650 hover:bg-red-100 p-1.5 rounded transition-colors cursor-pointer"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Emails Simulating System Outbox Logs */
        <div className="space-y-4">
          <div className="bg-[#0f172a] text-white p-4 py-3 rounded-lg text-[11px] font-mono border border-slate-800 uppercase tracking-wider">
            🛰️ System Outbox Audit Logs // Tracked Deliveries
          </div>

          {emails.length === 0 ? (
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-12 text-center text-slate-400 italic">
              No simulated transactions or verification messages have triggered outbound logging.
            </div>
          ) : (
            <div className="space-y-3.5">
              {emails.map((e) => (
                <div key={e.id} className="bg-white border border-slate-205 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-150 flex flex-wrap justify-between items-center gap-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">ID: {e.id}</span>
                      <span className="text-slate-350">•</span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${e.type === 'approval' ? 'bg-green-100 text-green-850' : 'bg-red-100 text-red-850'}`}>
                        {e.type.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-mono text-[11px]">{new Date(e.sentAt).toLocaleString()}</span>
                  </div>
                  <div className="p-4 bg-slate-50/15">
                    <div className="text-xs space-y-1 text-slate-550 border-b border-slate-100 pb-2.5 mb-3">
                      <div>Recipent Name: <strong className="text-slate-800">{e.recipientName}</strong></div>
                      <div>Recipient Mailbox: <strong className="text-slate-800 underline">&lt;{e.recipientEmail}&gt;</strong></div>
                      <div>Delivery Status: <span className="text-green-600 font-bold font-mono">● SENT (MOCK_SES_API_200)</span></div>
                    </div>
                    <h5 className="font-sans font-bold text-slate-900 text-xs mb-2">Subject: {e.subject}</h5>
                    <pre className="p-3.5 bg-slate-900 text-slate-300 font-mono text-xs rounded-lg overflow-x-auto border border-slate-950 whitespace-pre-wrap leading-relaxed antialiased">
                      {e.body}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          SUBMISSION REJECTION SPECIFICATION DIALOG
      ========================================== */}
      {reviewingProperty && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-150 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 pr-14 relative">
              <h3 className="font-sans font-black text-sm uppercase">Review Property Decision</h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">Audit item: {reviewingProperty.title}</p>
              <button onClick={() => setReviewingProperty(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">Rejection Reason</label>
                <textarea
                  placeholder="e.g. Cadastral lookup failed. Deed certificate uploaded appears altered or lacks original notary stamps."
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 text-xs focus:outline-none focus:border-red-500 font-sans leading-normal text-slate-800"
                />
              </div>
              <div className="flex gap-2.5 justify-end">
                <button
                  onClick={() => setReviewingProperty(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReviewSubmission(reviewingProperty.id, 'rejected')}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl uppercase tracking-wider"
                >
                  Send Rejection Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          PAGE BUILDER CREATOR / CONTENT EDITOR MODAL
      ========================================== */}
      {(editingPage || addPageOpen) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            
            <div className="bg-[#0f172a] text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-sans font-black text-sm uppercase">
                  {addPageOpen ? 'Create New Multilingual Page' : `Edit Content Page: /${editingPage?.slug}`}
                </h3>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Burundian real estate portal translation manager
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPage(null);
                  setAddPageOpen(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={addPageOpen ? handleCreateCustomPage : handleSavePageContent} className="p-6 space-y-4">
              
              {/* URL slug choice for dynamic pages */}
              {addPageOpen && (
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">URL path slug (Custom page)</label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 border border-r-0 border-slate-200 px-3 py-1.5 text-xs text-slate-500 font-mono rounded-l-lg">
                      immoburundi.bi/
                    </span>
                    <input
                      type="text"
                      required
                      value={newPageSlug}
                      onChange={(e) => setNewPageSlug(e.target.value)}
                      placeholder="e.g. ngozi-listings-guideline"
                      className="w-full bg-slate-50 border border-slate-200 rounded-r-lg py-1.5 px-3 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Notice tag */}
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-[11px] text-blue-900 leading-normal flex gap-1.5 items-start">
                <span>🌐</span>
                <p>
                  <strong>Translation Grid:</strong> Populate title and body contents for each language. This provides seamless, real-time localized updates when clients toggle languages on the header!
                </p>
              </div>

              {/* Multilingual Translation Tabs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* English block */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3.5">
                  <span className="text-[10.5px] font-mono font-black text-slate-450 tracking-wider uppercase block border-b pb-1.5 mb-2">🇬🇧 English Version</span>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider block">Page Title</label>
                    <input
                      type="text"
                      required
                      value={pageTitleEn}
                      onChange={(e) => setPageTitleEn(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider block">Content Editor (Markdown Supported)</label>
                    <textarea
                      required
                      placeholder="English description text..."
                      rows={10}
                      value={pageContentEn}
                      onChange={(e) => setPageContentEn(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 font-sans leading-normal text-slate-800 h-64 overflow-y-auto"
                    />
                  </div>
                </div>

                {/* French Block */}
                <div className="bg-slate-50/55 p-4 rounded-xl border border-slate-150 space-y-3.5">
                  <span className="text-[10.5px] font-mono font-black text-slate-450 tracking-wider uppercase block border-b pb-1.5 mb-2">🇫🇷 French Version</span>
                  <div className="space-y-1">
                    <label className="text-slate-505 font-mono text-[9px] uppercase font-bold tracking-wider block">Titre de la page</label>
                    <input
                      type="text"
                      required
                      value={pageTitleFr}
                      onChange={(e) => setPageTitleFr(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-505 font-mono text-[9px] uppercase font-bold tracking-wider block">Description en Français</label>
                    <textarea
                      required
                      placeholder="Texte descriptif en Français..."
                      rows={10}
                      value={pageContentFr}
                      onChange={(e) => setPageContentFr(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 font-sans leading-normal text-slate-800 h-64 overflow-y-auto"
                    />
                  </div>
                </div>

                {/* Swahili black */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-150 space-y-3.5">
                  <span className="text-[10.5px] font-mono font-black text-slate-450 tracking-wider uppercase block border-b pb-1.5 mb-2">🇧🇮 Swahili Version</span>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider block">Kichwa cha ukurasa</label>
                    <input
                      type="text"
                      required
                      value={pageTitleSw}
                      onChange={(e) => setPageTitleSw(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider block">Yaliyomo (Swahili)</label>
                    <textarea
                      required
                      placeholder="Maelezo kwa lugha ya Kiswahili..."
                      rows={10}
                      value={pageContentSw}
                      onChange={(e) => setPageContentSw(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 font-sans leading-normal text-slate-800 h-64 overflow-y-auto"
                    />
                  </div>
                </div>

              </div>

              {/* Action grid bottom */}
              <div className="border-t border-slate-150 pt-4 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPage(null);
                    setAddPageOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-600 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 hover:bg-blue-500 text-white bg-blue-600 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  Save Workspace Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* ==========================================
          ADMIN DIRECT PROPERTY ADDITION POPUP WINDOW
      ========================================== */}
      {adminAddOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-250 animate-in zoom-in-95 duration-150">
            <div className="bg-[#0f172a] text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-sans font-black text-sm uppercase">Webmaster Property Creation Form</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Creates pre-approved, pre-verified official IMMO BURUNDI listings</p>
              </div>
              <button onClick={() => setAdminAddOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddNewProperty} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">Listing Title</label>
                  <input
                    type="text"
                    required
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="e.g. Modern Residential Villa"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">Category</label>
                  <select
                    value={addType}
                    onChange={(e: any) => setAddType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input"
                  >
                    <option value="house">House / Villa</option>
                    <option value="land">Land plots</option>
                    <option value="commercial">Commercial Space</option>
                    <option value="rental">Rental Apartments</option>
                    <option value="investment">Investment Opportunities</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">Description</label>
                <textarea
                  required
                  rows={3}
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder="Official listing specifications details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input leading-normal"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">Price</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">Currency</label>
                  <select
                    value={addCurrency}
                    onChange={(e: any) => setAddCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input"
                  >
                    <option value="USD">USD</option>
                    <option value="BIF">BIF</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">City</label>
                  <input
                    type="text"
                    required
                    value={addCity}
                    onChange={(e) => setAddCity(e.target.value)}
                    placeholder="Bujumbura, Gitega, Rumonge"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">Deed neighborhood location Address</label>
                  <input
                    type="text"
                    required
                    value={addLocation}
                    onChange={(e) => setAddLocation(e.target.value)}
                    placeholder="Rohero, Kiriri Hills, Kinindo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">Bedrooms</label>
                  <input
                    type="number"
                    value={addBedrooms}
                    onChange={(e) => setAddBedrooms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">Bathrooms</label>
                  <input
                    type="number"
                    value={addBathrooms}
                    onChange={(e) => setAddBathrooms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">Area (Sqm)</label>
                  <input
                    type="text"
                    value={addArea}
                    onChange={(e) => setAddArea(e.target.value)}
                    placeholder="250 sqm"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">Cover Image URL</label>
                <input
                  type="url"
                  value={addImageUrl}
                  onChange={(e) => setAddImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block">GPS coordinates Coordinates mapping</label>
                <input
                  type="text"
                  value={addGpsLocation}
                  onChange={(e) => setAddGpsLocation(e.target.value)}
                  placeholder="-3.3768, 29.3812"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs select-input"
                />
              </div>

              <div className="border-t border-slate-150 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdminAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider"
                >
                  Post Official Listing
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


    </div>
  );
}
