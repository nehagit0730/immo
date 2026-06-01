import { useState, useEffect, FormEvent, useRef } from 'react';
import { Property, User, EmailLog } from '../types';
import { Language, translations } from '../translations';
import { PlusCircle, List, Mail, FileCheck, RefreshCw, X, ShieldAlert, Compass, Upload, Trash2, Loader2 } from 'lucide-react';
import PropertyCard from './PropertyCard';
import { ibFetch } from '../apiMock';

interface ClientDashboardProps {
  user: User;
  currentLanguage: Language;
}

export default function ClientDashboard({ user, currentLanguage }: ClientDashboardProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [activeTab, setActiveTab] = useState<'listings' | 'emails'>('listings');
  const [isLoading, setIsLoading] = useState(true);
  
  // Property Submission Form Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'BIF'>('USD');
  const [type, setType] = useState<'house' | 'land' | 'commercial' | 'rental' | 'investment'>('house');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [area, setArea] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [gpsLocation, setGpsLocation] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[currentLanguage];

  const handleImageUpload = async (file: File, callback: (url: string) => void) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        callback(data.url);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchClientData = async () => {
    setIsLoading(true);
    try {
      // Get properties filtered by ownerId
      const pRes = await ibFetch(`/api/properties?ownerId=${user.id}&role=client`);
      const pData = await pRes.json();
      setProperties(pData);

      // Get simulated client email notification logs
      const eRes = await ibFetch('/api/emails');
      const eData = await eRes.json();
      // Filter logs sent to current user's email
      const clientEmails = eData.filter((e: EmailLog) => e.recipientEmail.toLowerCase() === user.email.toLowerCase());
      setEmails(clientEmails);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [user]);

  const handleOpenAddForm = () => {
    setEditingProperty(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setCurrency('USD');
    setType('house');
    setLocation('');
    setCity('');
    setBedrooms('');
    setBathrooms('');
    setArea('');
    setImageUrl('');
    setGpsLocation('');
    setFormOpen(true);
  };

  const handleOpenEditForm = (prop: Property) => {
    setEditingProperty(prop);
    setTitle(prop.title);
    setDescription(prop.description);
    setPrice(prop.price.toString());
    setCurrency(prop.currency);
    setType(prop.type);
    setLocation(prop.location);
    setCity(prop.city);
    setBedrooms(prop.bedrooms?.toString() || '');
    setBathrooms(prop.bathrooms?.toString() || '');
    setArea(prop.area || '');
    setImageUrl(prop.images[0] || '');
    setGpsLocation(prop.gpsLocation || '');
    setFormOpen(true);
  };

  const handleDeleteListing = async (id: string) => {
    const confirmation = window.confirm(currentLanguage === 'en' ? 'Are you sure you want to delete this listing?' : 'Êtes-vous sûr de vouloir supprimer cette annonce ?');
    if (!confirmation) return;

    try {
      const res = await ibFetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchClientData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProperty = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      description,
      price: Number(price),
      currency,
      type,
      location,
      city,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      area: area || undefined,
      images: imageUrl ? [imageUrl] : [],
      gpsLocation: gpsLocation || undefined,
      ownerId: user.id,
      role: 'client'
    };

    try {
      const endpoint = editingProperty ? `/api/properties/${editingProperty.id}` : '/api/properties';
      const method = editingProperty ? 'PUT' : 'POST';

      const res = await ibFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFormOpen(false);
        fetchClientData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Client Welcome banner */}
      <div className="bg-[#0f172a] rounded-sm p-6 sm:p-8 text-white border border-slate-800 shadow-md mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-500">
            {currentLanguage === 'en' ? 'CLIENT WORKSPACE' : 'ESPACE PROPRIÉTAIRE'}
          </span>
          <h1 className="font-sans font-black text-2xl sm:text-3xl tracking-wide uppercase mt-1">
            {currentLanguage === 'en' ? `Welcome back, ${user.name}!` : `Bienvenue, ${user.name} !`}
          </h1>
          <p className="text-slate-400 text-xs mt-1 leading-normal max-w-xl">
            {currentLanguage === 'en' 
              ? 'Submit and manage your Burundian real estate listings here. Admin review checks coordinates and cadaster authenticity prior to making listings public.' 
              : 'Soumettez et gérez vos annonces. La validation administrative vérifie l\'authenticité des documents cadastraux avant publication publique.'}
          </p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 font-bold px-4 py-3 rounded-sm text-xs leading-none uppercase tracking-wider cursor-pointer shadow-md transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          {currentLanguage === 'en' ? 'Add New Property' : 'Ajouter un bien'}
        </button>
      </div>

      {/* Tabs list indicators */}
      <div className="flex border-b border-slate-200 mb-6 gap-4">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'listings' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-850'
          }`}
        >
          <List className="w-4 h-4" />
          {currentLanguage === 'en' ? 'My Submissions' : 'Mes Biens Soumis'} ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`pb-3 text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'emails' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-855'
          }`}
        >
          <Mail className="w-4 h-4" />
          {currentLanguage === 'en' ? 'Compliance Outbox' : 'Messagerie de Validation'} ({emails.length})
        </button>
        <button
          onClick={fetchClientData}
          className="ml-auto pb-3 text-slate-400 hover:text-blue-700 flex items-center gap-1.5 text-xs transition-colors cursor-pointer uppercase font-mono font-bold tracking-wider"
          title="Refresh Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {currentLanguage === 'en' ? 'Sync' : 'Actualiser'}
        </button>
      </div>

      {/* Panel Views */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs uppercase font-bold tracking-widest">
          Loading client dashboard metrics...
        </div>
      ) : activeTab === 'listings' ? (
        <>
          {properties.length === 0 ? (
            <div className="bg-white border border-slate-200 border-l-4 border-l-blue-750 rounded-sm p-12 text-center shadow-sm">
              <span className="text-3xl">🏡</span>
              <h3 className="font-sans font-black text-slate-800 uppercase tracking-wider mt-2 text-sm">No properties submitted yet.</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto font-medium">
                Click the "Add New Property" button at the top to draft your first real estate listing and submit it for administrative review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  currentLanguage={currentLanguage}
                  isDashboard={true}
                  onEditClick={handleOpenEditForm}
                  onDeleteClick={handleDeleteListing}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Outbox Notifications tab */}
          {emails.length === 0 ? (
            <div className="bg-white border border-slate-200 border-l-4 border-l-blue-750 rounded-sm p-12 text-center shadow-sm">
              <span className="text-3xl">📧</span>
              <h3 className="font-sans font-black text-slate-805 uppercase tracking-wider mt-2 text-sm">No notifications yet.</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto font-medium">
                Once administrators approve or reject your submitted titles, detailed simulated congratulation or failure logs will be shown in this inbox.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50/60 border border-amber-100 text-amber-900 rounded-sm p-4 text-[11px] flex gap-2 border-l-4 border-l-amber-500 shadow-sm leading-relaxed">
                <span>🔔</span>
                <p>
                  <strong>Compliance Simulation:</strong> This section charts simulated outgoing emails sent from IMMO BURUNDI authorities to your registered email address (<code className="bg-amber-100 font-mono text-[10px] px-1 rounded-none font-bold">{user.email}</code>).
                </p>
              </div>

              {emails.map((email) => (
                <div key={email.id} className="bg-white border border-slate-200 border-l-4 border-l-blue-700 rounded-sm overflow-hidden shadow-sm">
                  <div className="bg-slate-50 p-3 sm:px-4 border-b border-slate-150 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 ${email.type === 'approval' ? 'bg-green-100 text-green-800' : 'bg-red-105 text-red-800'}`}>
                        {email.type === 'approval' ? 'Approval Outbound' : 'Feedback Outbound'}
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-medium">{new Date(email.sentAt).toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">To: <strong className="text-slate-800">{email.recipientName}</strong> &lt;{email.recipientEmail}&gt;</span>
                  </div>
                  <div className="p-4 sm:p-5">
                    <h4 className="font-sans font-bold text-slate-900 text-sm mb-3 uppercase tracking-wide">
                      Subject: {email.subject}
                    </h4>
                    <pre className="font-mono text-xs text-slate-700 bg-slate-50 p-4 rounded-sm overflow-x-auto border border-slate-150 leading-relaxed whitespace-pre-wrap">
                      {email.body}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

             {/* ==========================================
          SUBMIT & EDIT PROPERTY FORM MODAL WINDOW
      ========================================== */}
      {formOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-[#0f172a] text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-sans font-black text-base uppercase tracking-wider">
                  {editingProperty ? 'Edit Property Listing Documents' : 'Submit Property for Verification'}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">
                  {editingProperty ? `Property ID: ${editingProperty.id}` : 'Fill in comprehensive details for administrative audit'}
                </p>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="text-slate-400 hover:text-white dark:hover:bg-slate-800 p-1.5 rounded-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProperty} className="p-6 space-y-4">
              
              {/* Notice to client */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-150 text-blue-900 text-[11px] rounded-sm leading-normal flex items-start gap-1.5 border-l-4 border-l-blue-755 shadow-sm">
                <span className="text-xs">ℹ️</span>
                <p>
                  <strong>Verification Audit Note:</strong> Updating or editing an existing listing changes its display status to <strong>"Pending Approval"</strong>, taking it offline momentarily until administrative officers confirm the blueprints.
                </p>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-505 font-mono text-[10px] uppercase font-bold tracking-wider block">Listing Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Modern duplex with Lake Tanganyika view"
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-blue-700 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-505 font-mono text-[10px] uppercase font-bold tracking-wider block">Property Category</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-blue-700 font-medium cursor-pointer"
                  >
                    <option value="house">{t.house}</option>
                    <option value="land">{t.land}</option>
                    <option value="commercial">{t.commercial}</option>
                    <option value="rental">{t.rental}</option>
                    <option value="investment">{t.investment}</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-slate-505 font-mono text-[10px] uppercase font-bold tracking-wider block">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your property in complete detail, specifying security compound status, power backing system, water references, and legal blueprints..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-blue-700 leading-normal font-medium"
                />
              </div>

              {/* Price & Currency */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-505 font-mono text-[10px] uppercase font-bold tracking-wider block">Price</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-blue-700 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-505 font-mono text-[10px] uppercase font-bold tracking-wider block">Currency</label>
                  <select
                    value={currency}
                    onChange={(e: any) => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-blue-700 font-medium cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="BIF">BIF (BIF)</option>
                  </select>
                </div>
              </div>

              {/* City & Street Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-505 font-mono text-[10px] uppercase font-bold tracking-wider block">Burundian City Region</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bujumbura, Gitega, Rumonge"
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-blue-700 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-505 font-mono text-[10px] uppercase font-bold tracking-wider block">Street Neighborhood Address</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Avenue de la Colline, Kiriri"
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-blue-700 font-medium"
                  />
                </div>
              </div>

              {/* Bed, Bath, Size Spec metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-505 font-mono text-[10px] uppercase font-bold tracking-wider block">Bedrooms</label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-blue-700 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-505 font-mono text-[10px] uppercase font-bold tracking-wider block">Bathrooms</label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-blue-700 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-505 font-mono text-[10px] uppercase font-bold tracking-wider block">Floor Area (Sqm)</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. 250 sqm"
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-blue-700 font-medium"
                  />
                </div>
              </div>

              {/* Image Input url / Drag-and-drop secure upload */}
              <div className="space-y-1">
                <label className="text-slate-505 font-mono text-[10px] uppercase font-bold tracking-wider block">Cover Image Upload</label>
                
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0], setImageUrl);
                    }
                  }}
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="border border-slate-200 rounded p-3 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[85px] font-sans">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-16 h-12 object-cover rounded-sm border border-slate-200 flex-shrink-0" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-slate-450 uppercase font-mono block">Active Property photo</span>
                        <div className="text-[10px] text-slate-550 font-mono truncate">{imageUrl}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                            fileInputRef.current.click();
                          }
                        }}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-[9.5px] font-bold text-slate-650 hover:bg-slate-100 transition-colors uppercase tracking-wider cursor-pointer font-mono"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setImageUrl('');
                        }}
                        className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-650 hover:bg-red-100 rounded text-[9.5px] font-bold transition-colors uppercase tracking-wider cursor-pointer font-mono"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                        fileInputRef.current.click();
                      }
                    }}
                    className="border border-dashed border-slate-300 rounded p-4 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer min-h-[85px] flex flex-col items-center justify-center space-y-1 font-sans"
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-650" /> Uploading secure copy...
                      </span>
                    ) : (
                      <>
                        <span className="font-bold text-[11px] text-slate-600 flex items-center gap-1.5 justify-center">
                          <Upload className="w-4 h-4 text-slate-400" /> Choose Image or Drag here
                        </span>
                        <span className="text-[8.5px] text-slate-450 font-mono">Stored in public uploads directory</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* GPS coordinates mapping */}
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider block flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  GPS Coordinates mapping (optional)
                </label>
                <input
                  type="text"
                  value={gpsLocation}
                  onChange={(e) => setGpsLocation(e.target.value)}
                  placeholder="e.g. -3.3768, 29.3812"
                  className="w-full bg-slate-50 border border-slate-200 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-blue-700 font-medium"
                />
              </div>

              {/* Action feet footer */}
              <div className="border-t border-slate-200 pt-5 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2.5 font-bold text-slate-600 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-sm text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-800 text-white font-extrabold px-5 py-2.5 rounded-sm text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                >
                  {editingProperty ? 'Save Changes' : 'Submit Title for Review'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
