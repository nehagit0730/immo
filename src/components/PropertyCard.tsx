import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Property } from '../types';
import { Language, translations } from '../translations';
import { ShieldCheck, MapPin, Eye, Phone, Mail, User, Compass, Info, Building, LandPlot, Key, Landmark, X } from 'lucide-react';

interface PropertyCardProps {
  key?: string;
  property: Property;
  currentLanguage: Language;
  onEditClick?: (property: Property) => void;
  onDeleteClick?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  isDashboard?: boolean;
}

const EXCHANGE_RATE = 2850; // 1 USD = 2850 BIF

export default function PropertyCard({
  property,
  currentLanguage,
  onEditClick,
  onDeleteClick,
  onViewDetails,
  isDashboard = false
}: PropertyCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const t = translations[currentLanguage];

  // Safely extract property images list to prevent exceptions if empty or undefined
  const images = property.images && Array.isArray(property.images) && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80'];

  // Helper to format currency lists
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
      case 'house': return <Building className="w-4 h-4 text-slate-500" />;
      case 'land': return <LandPlot className="w-4 h-4 text-slate-500" />;
      case 'commercial': return <Landmark className="w-4 h-4 text-slate-500" />;
      case 'rental': return <Key className="w-4 h-4 text-slate-500" />;
      default: return <Building className="w-4 h-4 text-slate-500" />;
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 flex flex-col h-full group relative">
      {/* Verification Badge absolute overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
        {property.verified ? (
          <span className="inline-flex items-center bg-blue-750 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg shadow-sm gap-1">
            <ShieldCheck className="w-3.5 h-3.5 fill-current" />
            {t.verifiedBadge}
          </span>
        ) : (
          <span className="inline-flex items-center bg-slate-900/85 text-slate-300 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
            {t.unverifiedBadge}
          </span>
        )}
        
        {/* Status indicator on Dashboard */}
        {isDashboard && (
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase shadow-sm ${
            property.status === 'approved' 
              ? 'bg-green-150 text-green-800 border border-green-200/65' 
              : property.status === 'rejected'
              ? 'bg-red-150 text-red-800 border border-red-200/65'
              : 'bg-yellow-150 text-yellow-800 border border-yellow-200/65'
          }`}>
            {property.status === 'approved' ? (currentLanguage === 'en' ? 'Approved' : 'Approuvé') :
             property.status === 'rejected' ? (currentLanguage === 'en' ? 'Rejected' : 'Rejeté') :
             (currentLanguage === 'en' ? 'Pending Approval' : 'En attente')}
          </span>
        )}
      </div>

      {/* Property Thumbnail */}
      <div 
        onClick={() => onViewDetails ? onViewDetails(property.id) : setModalOpen(true)}
        className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer"
      >
        <img
          src={images[0]}
          alt={property.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-550 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90"></div>
        
        {/* Price Tag overlay */}
        <div className="absolute bottom-4 left-4 text-white">
          <div className="font-sans font-black text-xl leading-tight">
            {pricePrimary}
          </div>
          <div className="text-[11px] font-mono text-slate-300 opacity-95 leading-none mt-1">
            {priceSecondary}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono mb-1">
            {getTypeIcon(property.type)}
            <span>{getTypeText(property.type)}</span>
            <span className="text-slate-300">•</span>
            <span>{property.city}</span>
          </div>

          <h3 
            onClick={() => onViewDetails ? onViewDetails(property.id) : setModalOpen(true)}
            className="font-sans font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-base line-clamp-1 mb-1.5 cursor-pointer"
          >
            {property.title}
          </h3>

          <div className="flex items-center text-xs text-slate-500 mb-2.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>

          <p className="text-xs text-slate-650 leading-relaxed line-clamp-2 md:line-clamp-3 mb-4">
            {property.description}
          </p>
        </div>

        <div>
          {/* Quick specs bar */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-slate-500 text-xs mb-3 font-mono">
            {property.bedrooms && (
              <span className="flex items-center gap-1">
                <span>{property.bedrooms}</span>
                <span className="text-[10px] text-slate-450 uppercase">{t.pRooms}</span>
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center gap-1">
                <span>{property.bathrooms}</span>
                <span className="text-[10px] text-slate-450 uppercase">{t.pBaths}</span>
              </span>
            )}
            {property.area && (
              <span className="flex items-center gap-1">
                <span>{property.area}</span>
              </span>
            )}
          </div>

          {/* Action Row */}
          {isDashboard ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditClick?.(property)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer text-center uppercase tracking-wider"
              >
                {currentLanguage === 'en' ? 'Edit' : 'Modifier'}
              </button>
              <button
                onClick={() => onDeleteClick?.(property.id)}
                className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 p-2 rounded-xl text-xs transition-colors cursor-pointer"
                title={currentLanguage === 'en' ? 'Delete Listing' : 'Supprimer'}
              >
                🗑️
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-slate-100 text-slate-700 rounded-xl p-2 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                title={currentLanguage === 'en' ? 'Quick View' : 'Aperçu Rapide'}
              >
                <Eye className="w-4 h-4" />
              </button>
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(property.id)}
                  className="bg-slate-900 text-white rounded-xl p-2 hover:bg-slate-800 transition-colors cursor-pointer"
                  title={t.viewDetails}
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-[10px] sm:text-xs tracking-wider uppercase transition-all border border-slate-200/60 cursor-pointer"
              >
                {currentLanguage === 'en' ? 'Quick View' : currentLanguage === 'fr' ? 'Aperçu Rapide' : 'Uhakiki wa Haraka'}
              </button>
              <button
                onClick={() => onViewDetails?.(property.id)}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-[10px] sm:text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer hover:shadow-md"
              >
                {t.viewDetails}
              </button>
            </div>
          )}

          {/* Rejection Notification if rejected in dashboard */}
          {isDashboard && property.status === 'rejected' && property.rejectionReason && (
            <div className="mt-3 p-2.5 bg-red-50 border border-red-150 rounded-sm text-[11px] text-red-800 leading-normal">
              <span className="font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-red-600" />
                {currentLanguage === 'en' ? 'Rejection statement:' : 'Motif de refus :'}
              </span>
              <p className="mt-1 font-sans leading-tight italic">
                "{property.rejectionReason}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          PROPERTY DETAIL MODAL POPUP (Rendered via Portal for smooth overlay & zero flickering)
      ========================================== */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-200/40 animate-in fade-in duration-200 text-slate-800">
            
            {/* Close Button absolute */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 z-20 bg-slate-950/50 hover:bg-slate-950/80 text-white p-2.5 rounded-full cursor-pointer transition-colors backdrop-blur-md border border-white/15"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Media Section (Left side) */}
              <div className="p-8 bg-[#0f172a] text-white flex flex-col justify-between">
                <div>
                  <h2 className="font-sans font-black text-2xl leading-snug mb-3 pr-8">
                    {property.title}
                  </h2>
                  <div className="flex items-center gap-2 mb-6">
                    {property.verified ? (
                      <span className="inline-flex items-center bg-blue-700 text-white text-[10px] font-extrabold px-3 py-1 rounded-xl gap-1 uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5 fill-current" />
                        {t.verifiedBadge} Status
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-slate-800 text-slate-350 text-[10px] font-bold px-3 py-1 rounded-xl gap-1 uppercase tracking-wider">
                        Self-Reported
                      </span>
                    )}
                    <span className="inline-flex items-center bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono px-3 py-1 rounded-xl gap-1">
                      ID: {property.id}
                    </span>
                  </div>
                </div>

                {/* Big Active Image */}
                <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 relative mb-5 border border-slate-800 shadow-xl">
                  <img
                    src={images[activeImageIdx]}
                    alt={`${property.title} detailed list`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image Navigation overlay if multiples */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 flex gap-1.5 bg-black/60 p-1.5 rounded-xl backdrop-blur-md border border-slate-800">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIdx(idx)}
                          className={`w-2 h-2 rounded-full cursor-pointer transition-all ${activeImageIdx === idx ? 'bg-blue-500 w-5' : 'bg-slate-500'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Small Image Thumbs */}
                {images.length > 1 && (
                  <div className="flex gap-2.5 p-1 overflow-x-auto">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${activeImageIdx === idx ? 'border-blue-500 scale-102' : 'border-slate-850 opacity-50 hover:opacity-80'}`}
                      >
                        <img src={img} alt="Thumb" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Subtitle footer */}
                <div className="mt-6 pt-5 border-t border-slate-850 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.14em] block">Price Value</span>
                    <span className="font-extrabold text-2xl text-white">{pricePrimary}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.14em] block">Converted Rate</span>
                    <span className="font-semibold text-sm text-slate-350">{priceSecondary}</span>
                  </div>
                </div>
              </div>

              {/* Information Section (Right side) */}
              <div className="p-8 flex flex-col justify-between h-full bg-slate-50 text-slate-800">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono font-black tracking-[0.2em] text-slate-450 uppercase block mb-2">
                      Property Description
                    </span>
                    <p className="text-xs sm:text-sm font-sans text-slate-700 leading-relaxed pr-2 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm max-h-48 overflow-y-auto font-light">
                      {property.description}
                    </p>
                  </div>

                  {/* Fact sheet metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 border-l-4 border-l-blue-700 shadow-sm">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">City Region</span>
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1 mt-1 font-display">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        {property.city}
                      </span>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 border-l-4 border-l-blue-700 shadow-sm">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Street Address</span>
                      <span className="font-semibold text-slate-700 text-xs truncate block mt-1">
                        {property.location}
                      </span>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 border-l-4 border-l-blue-700 shadow-sm">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Living Details</span>
                      <span className="font-semibold text-slate-800 text-xs mt-1 flex items-center gap-1">
                        🛌 {property.bedrooms || '—'} {t.pRooms} / 🚿 {property.bathrooms || '—'} {t.pBaths}
                      </span>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 border-l-4 border-l-blue-700 shadow-sm">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Floor Area</span>
                      <span className="font-semibold text-slate-800 text-xs mt-1 flex items-center gap-1">
                        📐 {property.area || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Contact outreach details */}
                  <div className="bg-blue-50/40 border border-blue-100/60 rounded-2xl p-4.5 space-y-3 shadow-xs">
                    <span className="text-[10px] font-mono font-black text-blue-800 tracking-widest uppercase flex items-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      {t.ownerDetails}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="flex items-center gap-2 font-medium text-slate-705">
                        <User className="w-4 h-4 text-slate-400 bg-white p-0.5 rounded-lg border border-slate-200" />
                        <span className="truncate">{property.ownerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                        <span>📞 {property.ownerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-650 truncate col-span-1 sm:col-span-2">
                        <Mail className="w-4 h-4 text-slate-400 bg-white p-0.5 rounded-lg border border-slate-200" />
                        <span className="underline truncate">{property.ownerEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* GPS Details & Security check */}
                  {property.gpsLocation && (
                    <div className="text-xs text-slate-450 font-mono flex items-center gap-2 p-1">
                      <Compass className="w-4 h-4 text-slate-400" />
                      <span>{t.coordinates}:</span>
                      <a 
                        href={`https://maps.google.com/?q=${property.gpsLocation}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-650 font-bold hover:underline"
                      >
                        {property.gpsLocation} 🗺️
                      </a>
                    </div>
                  )}
                </div>

                {/* Disclaimer prompt to ensure no liability */}
                <div className="border-t border-slate-200/80 pt-5 mt-6">
                  <div className="bg-amber-50/70 border border-amber-150 rounded-2xl p-3.5 text-[11px] text-amber-905 leading-relaxed flex items-start gap-2 max-w-full">
                    <span className="mt-0.5 text-sm flex-shrink-0">⚠️</span>
                    <p className="italic font-light">
                      <strong>Audit Disclaimer:</strong> Verification statuses represent historical reviews of uploaded documents at the time of submission and are not legal property title guarantees. Please conduct independent due diligence.
                    </p>
                  </div>
                  
                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="bg-slate-900 hover:bg-slate-850 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer uppercase tracking-widest transition-colors"
                    >
                      {t.closeBtn}
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
