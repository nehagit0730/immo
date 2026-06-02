import React, { useState } from 'react';
import { Property } from '../types';
import { Language, translations } from '../translations';
import { 
  ChevronLeft, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Building, 
  LandPlot, 
  Key, 
  Landmark, 
  Compass, 
  FileText, 
  Clock, 
  Hash, 
  Send, 
  Copy, 
  CheckCircle, 
  ArrowLeft 
} from 'lucide-react';
import { ibFetch } from '../apiMock';

interface PropertyDetailViewProps {
  property: Property;
  currentLanguage: Language;
  onBack: () => void;
  user: any; // Connected user
}

const EXCHANGE_RATE = 2850;

export default function PropertyDetailView({
  property,
  currentLanguage,
  onBack,
  user
}: PropertyDetailViewProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [inquiryName, setInquiryName] = useState(user?.name || '');
  const [inquiryEmail, setInquiryEmail] = useState(user?.email || '');
  const [inquiryPhone, setInquiryPhone] = useState(user?.phone || '');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const t = translations[currentLanguage];

  const images = property.images && Array.isArray(property.images) && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80'];

  // Currency utility
  const formatCurrencies = (price: number, currency: 'USD' | 'BIF') => {
    if (currency === 'USD') {
      const usdFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
      const bifVal = price * EXCHANGE_RATE;
      const bifFormatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'BIF', maximumFractionDigits: 0 }).format(bifVal);
      return { primary: usdFormatted, secondary: `~ ${bifFormatted}` };
    } else {
      const bifFormatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'BIF', maximumFractionDigits: 0 }).format(price);
      const usdVal = price / EXCHANGE_RATE;
      const usdFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(usdVal);
      return { primary: bifFormatted, secondary: `~ ${usdFormatted}` };
    }
  };

  const { primary: pricePrimary, secondary: priceSecondary } = formatCurrencies(property.price, property.currency);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'house': return <Building className="w-5 h-5 text-blue-600" />;
      case 'land': return <LandPlot className="w-5 h-5 text-blue-600" />;
      case 'commercial': return <Landmark className="w-5 h-5 text-blue-600" />;
      case 'rental': return <Key className="w-5 h-5 text-blue-600" />;
      default: return <Building className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'house': return t.house;
      case 'land': return t.land;
      case 'commercial': return t.commercial;
      case 'rental': return t.rental;
      case 'investment': return t.investment;
      default: return type;
    }
  };

  const handleCopy = (text: string, type: 'phone' | 'email' | 'coordinates') => {
    navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryEmail || !inquiryMessage) return;

    try {
      // Simulate creating an email log/inquiry in the mock backend
      await ibFetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          propertyTitle: property.title,
          name: inquiryName,
          email: inquiryEmail,
          phone: inquiryPhone,
          message: inquiryMessage,
          ownerEmail: property.ownerEmail,
          ownerName: property.ownerName
        })
      });

      setSuccessMsg(true);
      setInquiryMessage('');
      setTimeout(() => setSuccessMsg(false), 5000);
    } catch (err) {
      console.error('Error submitting inquiry simulation:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300 text-slate-800">
      
      {/* Return Navigation Back Bar */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-blue-700 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-3px] transition-transform" />
          {currentLanguage === 'en' ? 'Back to Listings' : currentLanguage === 'fr' ? 'Retour aux Annonces' : 'Rudi kwenye Orodha'}
        </button>

        {property.verified && (
          <span className="flex items-center gap-1 bg-blue-750/10 text-blue-800 text-[10px] uppercase font-black px-3 py-1.5 rounded-lg border border-blue-200">
            <ShieldCheck className="w-4 h-4 fill-current text-blue-600" />
            {currentLanguage === 'en' ? 'Fully Certified Listing' : 'Annonce Entièrement Certifiée'}
          </span>
        )}
      </div>

      {/* Main Title & Address Block */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">
              ID: {property.id.substring(0, 8).toUpperCase()}
            </span>
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
              {getTypeIcon(property.type)}
              {getTypeText(property.type)}
            </span>
          </div>

          <h1 className="font-sans font-black text-slate-900 text-2xl sm:text-4xl tracking-tight leading-tight">
            {property.title}
          </h1>

          <div className="flex items-center gap-1.5 text-slate-500 text-xs sm:text-sm font-medium">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{property.location}, <strong className="text-slate-800">{property.city} (Burundi)</strong></span>
          </div>
        </div>

        {/* Dynamic Big Pricing Sideblock */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm md:text-right flex flex-col justify-center">
          <span className="text-[9px] font-mono text-slate-400 font-black tracking-widest block uppercase mb-1">Estimated Listing Value</span>
          <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            {pricePrimary}
          </div>
          <div className="text-sm font-mono text-blue-600 font-bold mt-1.5">
            {priceSecondary}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-mono">
            {currentLanguage === 'en' ? 'Official Central Bank Index System Sync' : 'Indexation synchronisée Banque Centrale'}
          </div>
        </div>
      </div>

      {/* Grid Layout: Left Visuals & Specs, Right Sidebar for Submitter Contact Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Aspect Grid */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Splendid Media Showcase */}
          <div className="space-y-3">
            <div className="aspect-16/10 rounded-3xl overflow-hidden bg-slate-950 relative border border-slate-200/50 shadow-lg">
              <img
                src={images[activeImageIdx]}
                alt={`${property.title} high res visual index`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Prev / Next controls */}
              {images.length > 1 && (
                <>
                  <div className="absolute inset-y-0 left-4 flex items-center">
                    <button
                      onClick={() => setActiveImageIdx(prev => prev === 0 ? images.length - 1 : prev - 1)}
                      className="bg-black/40 hover:bg-black/60 rounded-full p-2.5 backdrop-blur-md border border-white/20 text-white cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute inset-y-0 right-4 flex items-center">
                    <button
                      onClick={() => setActiveImageIdx(prev => prev === images.length - 1 ? 0 : prev + 1)}
                      className="bg-black/40 hover:bg-black/60 rounded-full p-2.5 backdrop-blur-md border border-white/20 text-white cursor-pointer transition-colors"
                    >
                      {/* Using Chevron to maintain matching style */}
                      <span className="inline-block transform rotate-180">
                        <ChevronLeft className="w-5 h-5" />
                      </span>
                    </button>
                  </div>
                </>
              )}

              {/* Image Indicators */}
              <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10 text-white text-[11px] font-mono">
                {activeImageIdx + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail Selection Bar */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-24 aspect-4/3 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${
                      activeImageIdx === idx ? 'border-blue-600 scale-95 shadow-md' : 'border-slate-200/80 grayscale opacity-75 hover:grayscale-0 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Specifications Strip */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center font-sans">
            {property.bedrooms && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase block tracking-wider">{t.pRooms}</span>
                <span className="text-xl font-black text-slate-800 block">{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase block tracking-wider">{t.pBaths}</span>
                <span className="text-xl font-black text-slate-800 block">{property.bathrooms}</span>
              </div>
            )}
            {property.area && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase block tracking-wider">{t.pArea}</span>
                <span className="text-base font-black text-slate-800 block truncate">{property.area}</span>
              </div>
            )}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase block tracking-wider">Indexed On</span>
              <span className="text-xs font-mono font-medium text-slate-700 block whitespace-nowrap">
                {new Date(property.createdAt).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'fr-FR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Detailed Narrative Section */}
          <div className="space-y-4">
            <h2 className="font-sans font-black text-slate-900 text-lg sm:text-xl border-b pb-2.5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {currentLanguage === 'en' ? 'Property Description' : 'Description de la propriété'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-sans whitespace-pre-wrap">
              {property.description}
            </p>
          </div>

          {/* Land-Office Symmetrical Conformity Certificate Container */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm border-l-4 border-l-blue-750 space-y-4">
            <div className="flex items-center gap-2 text-blue-800">
              <ShieldCheck className="w-5 h-5 fill-current" />
              <h3 className="font-sans font-black text-sm uppercase tracking-wide">
                {currentLanguage === 'en' ? 'MUNICIPAL REGISTRATION STATUS' : 'STATUT D\'ENREGISTREMENT MUNICIPAL'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-650 leading-relaxed">
              {currentLanguage === 'en' 
                ? 'This parcel holding corresponds perfectly to audited local files. Boundary measurements, public path easements, and registry title deeds have been reviewed with local land administration officials to prevent double tenancy and boundary encroachments.'
                : 'Cette parcelle correspond parfaitement aux registres fonciers municipaux. Les mesures cadastrales, les servitudes et les titres de propriété ont été examinés avec l\'administration foncière locale afin d\'éviter double attribution.'
              }
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600 font-sans">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Cadastral Reference</span>
                <span className="font-mono font-bold text-slate-800">BUR-{property.city.substring(0,3).toUpperCase()}-{property.id.substring(0,6).toUpperCase()}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Title Verification Status</span>
                <span className={`inline-flex items-center gap-1 font-bold ${property.verified ? 'text-green-700' : 'text-amber-700'}`}>
                  {property.verified ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 fill-current text-green-600" /> 
                      {currentLanguage === 'en' ? 'Certified Real' : 'Certifié Conforme'}
                    </>
                  ) : (
                    <>
                      <span>⚠️</span> 
                      {currentLanguage === 'en' ? 'Self-Reported Reference' : 'Référence Autodéclarée'}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* GPS Coordinate Simulation Box */}
          {property.gpsLocation && (
            <div className="bg-[#0f172a] text-white rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono uppercase tracking-widest">
                  <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                  {t.coordinates}
                </span>

                <button
                  onClick={() => handleCopy(property.gpsLocation || '', 'coordinates')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copySuccess === 'coordinates' ? (
                    <span className="text-green-400 font-mono text-[10px]">Copied!</span>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="font-mono text-[10px]">Copy GPS</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Coordinated Pin Location</span>
                  <p className="font-mono text-xs text-slate-200">{property.gpsLocation}</p>
                </div>
                <div className="flex items-center sm:justify-end">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.gpsLocation)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors shadow-sm"
                  >
                    🗺️ Open in Google Maps
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar: Listing Contact Form & Owner card */}
        <div className="space-y-6">
          
          {/* Owner Profile Spot */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-sans font-black text-slate-900 text-base uppercase border-b pb-2 tracking-wide flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              {t.ownerDetails}
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-105 flex items-center justify-center text-blue-700 font-black shrink-0">
                  {property.ownerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">{t.ownerName}</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5">{property.ownerName}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono font-medium">{property.ownerPhone}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(property.ownerPhone, 'phone')}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    {copySuccess === 'phone' ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono text-slate-650">{property.ownerEmail}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(property.ownerEmail, 'email')}
                    className="text-[10px] text-blue-600 hover:underline font-bold shrink-0"
                  >
                    {copySuccess === 'email' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Symmetrical Direct Simulated Query Inquiry Form */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-sans font-black text-slate-900 text-base uppercase border-b pb-2 tracking-wide flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              {currentLanguage === 'en' ? 'Submit Inquiry' : 'Soumettre une demande'}
            </h3>

            {successMsg ? (
              <div className="p-4 bg-green-50 border border-green-150 text-green-900 rounded-2xl flex items-start gap-2 animate-in slide-in-from-top-4 duration-150">
                <CheckCircle className="w-5 h-5 text-green-650 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block">Inquiry Submitted Successfully!</span>
                  <p className="mt-1 leading-normal text-slate-600">
                    Your interest statement has been recorded and simulated outbound notification has been delivered.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Your Name</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Your Email</label>
                  <input
                    type="email"
                    required
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Your Phone (Optional)</label>
                  <input
                    type="text"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                    placeholder="+257 60 00 00 00"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Message specifications</label>
                  <textarea
                    required
                    rows={4}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium leading-relaxed"
                    placeholder="I am interested in this verified holding and want to request survey index paperwork..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-center cursor-pointer shadow-sm transition-all text-xs flex justify-center items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Inquiries
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
