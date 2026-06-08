import { useState, useEffect } from 'react';
import { PageSection, Property } from '../types';
import { Language } from '../translations';
import PropertyCard from './PropertyCard';
import { 
  ChevronRight, ChevronLeft, ChevronDown, HelpCircle, Star, Play, 
  ShieldAlert, CheckCircle2, Search, ArrowRight, Video, Users, Check,
  Compass, MapPin, Sparkles, Trophy, Award, Lock, BookOpen, Quote
} from 'lucide-react';

interface PageSectionsRendererProps {
  sections: PageSection[];
  properties?: Property[];
  currentLanguage?: Language;
  onViewDetails?: (id: string) => void;
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  selectedType?: string;
  setSelectedType?: (val: string) => void;
  selectedPriceRange?: string;
  setSelectedPriceRange?: (val: string) => void;
  t?: any;
}

export default function PageSectionsRenderer({ 
  sections, 
  properties = [], 
  currentLanguage = 'en', 
  onViewDetails,
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedPriceRange,
  setSelectedPriceRange,
  t
}: PageSectionsRendererProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="w-full space-y-0 relative bg-slate-50/20">
      {sections.map((section, idx) => {
        const bgVal = section.backgroundColor || 'bg-white';
        const headColorVal = section.headingColor || 'text-slate-900';
        const txtColorVal = section.textColor || 'text-slate-650';
        
        let fontSizeTextClass = 'text-sm sm:text-base';
        let fontSizeHeadClass = 'text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight';

        if (section.fontSize === 'sm') {
          fontSizeTextClass = 'text-xs sm:text-sm';
          fontSizeHeadClass = 'text-lg sm:text-2xl font-bold';
        } else if (section.fontSize === 'lg') {
          fontSizeTextClass = 'text-base sm:text-lg';
          fontSizeHeadClass = 'text-3xl sm:text-5xl font-black tracking-tight leading-tight';
        } else if (section.fontSize === 'display') {
          fontSizeTextClass = 'text-lg sm:text-xl';
          fontSizeHeadClass = 'text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-none';
        }

        const isFullWidthSection = ['banner', 'slideshow', 'single_image', 'contact_form_banner'].includes(section.type);
        const commonStyle = `${bgVal} w-full border-b border-slate-100/50 last:border-0 transition-all overflow-hidden relative ${
          isFullWidthSection ? 'py-0 px-0' : 'py-20 sm:py-28 px-4 sm:px-6 lg:px-8'
        }`;

        // Dynamic background ambient lighting effects based on section styles
        const isDarkSection = bgVal.includes('bg-slate-') || bgVal.includes('bg-gray-') || bgVal.includes('bg-indigo-') || bgVal.includes('bg-emerald-9') || bgVal.includes('bg-blue-9');
        const glowColor = isDarkSection ? 'bg-blue-500/10' : 'bg-blue-500/5';

        return (
          <div key={section.id || idx} className={commonStyle}>
            {/* Ambient subtle premium gradient blur behind section elements */}
            <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full ${glowColor} blur-3xl pointer-events-none`} />
            <div className={`absolute bottom-1/4 right-1/4 w-[350px] top-1/4 h-[400px] rounded-full bg-indigo-500/5 blur-3xl pointer-events-none`} />
            
            <div className={isFullWidthSection ? 'w-full relative z-10' : 'max-w-7xl mx-auto relative z-10'}>
              {renderSectionContent(
                section, 
                { fontSizeHeadClass, fontSizeTextClass, headColorVal, txtColorVal }, 
                properties, 
                currentLanguage, 
                onViewDetails,
                searchQuery,
                setSearchQuery,
                selectedType,
                setSelectedType,
                selectedPriceRange,
                setSelectedPriceRange,
                t
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Custom specialized components to avoid nested hooks warning & ensure majestic design
function SlideshowSection({ slides, fontSizeHeadClass, fontSizeTextClass }: { slides: any[], fontSizeHeadClass: string, fontSizeTextClass: string }) {
  const [curSlide, setCurSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const slide = slides[curSlide] || slides[0];

  return (
    <div className="relative w-full h-[550px] sm:h-[680px] lg:h-[780px] overflow-hidden group">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out transform group-hover:scale-[1.015]"
        style={{ backgroundImage: `url(${slide.image})` }}
      />
      
      {/* High-end progressive black glass gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/20" />
      
      {/* Overlay text */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-20 lg:p-28 text-left text-white z-10 max-w-7xl mx-auto w-full space-y-6">
        <span className="inline-flex self-start items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase backdrop-blur-md border border-white/20 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> PRESTIGE PORTFOLIO SPOTLIGHT
        </span>
        <h2 className={`${fontSizeHeadClass} font-black tracking-tight drop-shadow-md leading-[1.1] text-white max-w-4xl`}>
          {slide.title}
        </h2>
        <p className={`${fontSizeTextClass} font-light max-w-2xl text-slate-300 leading-relaxed font-sans`}>
          {slide.desc}
        </p>
      </div>

      {/* Navigation Arrows with refined micro-border glows */}
      <button 
        type="button"
        onClick={() => setCurSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white cursor-pointer transition-all opacity-0 group-hover:opacity-100 duration-350 z-20"
      >
        <ChevronLeft className="w-5.5 h-5.5" />
      </button>
      <button 
        type="button"
        onClick={() => setCurSlide((prev) => (prev + 1) % slides.length)}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white cursor-pointer transition-all opacity-0 group-hover:opacity-100 duration-350 z-20"
      >
        <ChevronRight className="w-5.5 h-5.5" />
      </button>

      {/* Modern thin line Indicators with glow details */}
      <div className="absolute bottom-10 left-8 sm:left-20 lg:left-28 flex gap-3 z-20">
        {slides.map((_: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setCurSlide(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${idx === curSlide ? 'bg-blue-500 w-12 shadow-lg shadow-blue-500/50' : 'bg-white/30 w-3'}`}
          />
        ))}
      </div>
    </div>
  );
}

function FaqsSection({ qasList, heading, subheading, fontSizeHeadClass, headColorVal, txtColorVal }: { qasList: any[], heading: string, subheading: string, fontSizeHeadClass: string, headColorVal: string, txtColorVal: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-10 font-sans">
      <div className="text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-850 font-mono text-[9px] tracking-[0.2em] font-black uppercase border border-blue-150">
          <BookOpen className="w-3.5 h-3.5 text-blue-750" /> CLARITY REGULATION DIRECTIVES
        </span>
        <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight leading-none`}>
          {heading}
        </h2>
        {subheading && <p className={`text-sm tracking-wide ${txtColorVal} font-light`}>{subheading}</p>}
      </div>
      <div className="space-y-4 mt-8">
        {qasList.map((item: any, idx: number) => {
          const isOpen = openIdx === idx;
          return (
            <div 
              key={idx} 
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen ? 'border-blue-500 shadow-md ring-4 ring-blue-500/5 transform translate-y-[-1px]' : 'border-slate-200/80 shadow-xs'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full text-left p-5 sm:p-6 flex justify-between items-center bg-slate-50/70 hover:bg-slate-100/50 transition-colors cursor-pointer"
              >
                <span className="text-sm sm:text-[15px] font-bold text-slate-800 flex items-center gap-3.5">
                  <HelpCircle className={`w-5 h-5 flex-shrink-0 transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.q || 'Question?'}
                </span>
                <span className={`p-1.5 rounded-full transition-all duration-300 bg-white border border-slate-200 ${isOpen ? 'rotate-180 text-blue-600 border-blue-300 bg-blue-50' : 'text-slate-450'}`}>
                  <ChevronDown className="w-4 h-4" />
                </span>
              </button>
              {isOpen && (
                <div className="p-6 bg-white text-xs sm:text-sm text-slate-650 leading-relaxed font-normal font-sans border-t border-slate-100 animate-in slide-in-from-top-2 duration-200 whitespace-pre-wrap">
                  {item.a || 'Answer details.'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VideoSection({ heading, coverImage, duration }: { heading?: string, coverImage?: string, duration?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-center font-sans">
      {heading && (
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
          {heading}
        </h2>
      )}
      <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 flex items-center justify-center group cursor-pointer">
        <img 
          src={coverImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'} 
          alt="Video Poster"
          className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-[1.025] transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/25 transition-colors" />
        
        {/* Pulsing Play Button with Luxurious Backdrop glass glow */}
        <div className="relative z-10 w-22 h-22 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-108 transition-all duration-300 border-4 border-white/20">
          <div className="absolute inset-0 rounded-full bg-blue-500/45 animate-ping pointer-events-none" />
          <Play className="w-8 h-8 fill-white translate-x-0.5" />
        </div>
        
        <span className="absolute bottom-6 right-6 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg text-[10px] font-mono font-bold text-slate-200 uppercase tracking-widest border border-slate-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> 📽️ {duration || '2:45 MINS'} • AERIAL DRONE VERIFICATION TOUR
        </span>
      </div>
    </div>
  );
}

function ContactFormBannerSection({ heading, subheading, buttonText, fontSizeHeadClass }: { heading: string, subheading?: string, buttonText?: string, fontSizeHeadClass: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <div className="w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-20 sm:py-28 px-6 sm:px-16 text-white relative overflow-hidden text-left border-b border-slate-800">
      <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay pointer-events-none animate-pulse"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-5 space-y-5 text-center lg:text-left">
          <span className="inline-flex self-start mx-auto lg:mx-0 items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white font-mono text-[9px] tracking-[0.2em] font-extrabold uppercase border border-white/20">
            <Lock className="w-3.5 h-3.5 text-amber-400" /> Dial-In Protected Advisor Escrow
          </span>
          <h2 className={`${fontSizeHeadClass} font-black tracking-tight text-white leading-tight`}>{heading}</h2>
          {subheading && <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">{subheading}</p>}
        </div>

        <div className="lg:col-span-7 w-full font-sans">
          {submitted ? (
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl">✓</div>
              <h3 className="text-lg font-black text-white">Consultation Request Confirmed</h3>
              <p className="text-xs sm:text-sm text-slate-350 leading-relaxed">
                Thank you! Our certified real estate attorney clerk will coordinate with the Gitega cadastral office and reach out within 2 hours to confirm your private advisory session.
              </p>
            </div>
          ) : (
            <form 
              onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
              className="bg-white/5 border border-white/10 backdrop-blur-md p-6 sm:p-10 rounded-3xl space-y-5 max-w-xl mx-auto lg:ml-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Your Name</span>
                  <input
                    type="text"
                    required
                    placeholder="Sylvain Ndayishimiye"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all text-left font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all text-left font-sans"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Phone / WhatsApp Number</span>
                <input
                  type="tel"
                  required
                  placeholder="+257 (9x) or WhatsApp link"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all text-left font-sans"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg transition-all font-sans text-xs tracking-widest uppercase shadow-md duration-250 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{buttonText}</span> <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function renderSectionContent(
  section: PageSection, 
  styles: { fontSizeHeadClass: string; fontSizeTextClass: string; headColorVal: string; txtColorVal: string },
  properties: Property[],
  currentLanguage: Language,
  onViewDetails?: (id: string) => void,
  searchQuery?: string,
  setSearchQuery?: (val: string) => void,
  selectedType?: string,
  setSelectedType?: (val: string) => void,
  selectedPriceRange?: string,
  setSelectedPriceRange?: (val: string) => void,
  t?: any
) {
  const settings = section.settings || {};
  const { fontSizeHeadClass, fontSizeTextClass, headColorVal, txtColorVal } = styles;

  switch (section.type) {
    case 'banner': {
      const bannerBg = settings.imageUrl || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80';
      const overlayColor = settings.overlayColor || 'rgba(15, 23, 42, 0.75)';
      return (
        <div className="relative w-full text-center overflow-hidden min-h-[550px] sm:min-h-[660px] flex flex-col justify-center items-center text-white group py-24 sm:py-36 px-6">
          {/* Zoomable Absolute Background Wrapper */}
          <div 
            className="absolute inset-0 bg-cover bg-center transform group-hover:scale-[1.012] transition-transform duration-1000 ease-out z-0" 
            style={{ backgroundImage: `url(${bannerBg})` }}
          />
          {/* Custom Overlay */}
          <div className="absolute inset-0 z-10" style={{ backgroundColor: overlayColor }}></div>
          
          <div className="relative z-20 max-w-7xl mx-auto w-full space-y-6 font-sans">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white font-mono text-[9px] tracking-[0.2em] font-extrabold uppercase backdrop-blur-md border border-white/20">
              <Award className="w-3.5 h-3.5 text-blue-400" /> OFFICIAL LICENSED PORTAL
            </span>
            <h1 className={`${fontSizeHeadClass} font-black drop-shadow-md leading-[1.1] text-white tracking-tight max-w-4xl mx-auto`}>
              {settings.title || 'Dynamic High-Tech Banner'}
            </h1>
            <p className={`${fontSizeTextClass} opacity-90 leading-relaxed font-sans max-w-2xl mx-auto font-light`}>
              {settings.subtitle || 'Customize this banner space directly with full alignment toggles, custom overlay variables, and instant layout previews.'}
            </p>
            {settings.buttonText && (
              <div className="pt-2">
                <button 
                  className="px-8 py-3.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg transition-all font-sans text-xs tracking-widest uppercase shadow-md duration-250 cursor-pointer"
                >
                  {settings.buttonText}
                </button>
              </div>
            )}

            {/* Custom Interactive Search Filter Cards - High-end Glassmorphic Design */}
            {setSearchQuery && (
              <div className="mt-12 mx-auto bg-white/95 backdrop-blur-md border border-slate-205/60 p-4 sm:p-5 rounded-3xl shadow-2xl text-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-center w-full max-w-4xl text-left relative z-30">
                {/* Search input text */}
                <div className="relative md:col-span-2 select-text font-sans">
                  <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Keywords</span>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-3 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-sans"
                      placeholder={t?.searchPlaceholder || "Search location, title, owner..."}
                      value={searchQuery || ''}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Category select */}
                <div className="space-y-1 font-sans">
                  <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest block">Type</span>
                  <select
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-3 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    value={selectedType || 'all'}
                    onChange={(e) => setSelectedType && setSelectedType(e.target.value)}
                  >
                    <option value="all">{t?.allTypes || "All Types"}</option>
                    <option value="house">{t?.house || "House"}</option>
                    <option value="land">{t?.land || "Land"}</option>
                    <option value="commercial">{t?.commercial || "Commercial"}</option>
                    <option value="rental">{t?.rental || "Rental"}</option>
                    <option value="investment">{t?.investment || "Investment"}</option>
                  </select>
                </div>

                {/* Price select */}
                <div className="space-y-1 font-sans">
                  <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest block">Price Range</span>
                  <select
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-3 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    value={selectedPriceRange || 'all'}
                    onChange={(e) => setSelectedPriceRange && setSelectedPriceRange(e.target.value)}
                  >
                    <option value="all">{currentLanguage === 'en' ? 'All Prices' : 'Tous les prix'}</option>
                    <option value="under-50k">{currentLanguage === 'en' ? 'Under $50k USD' : 'Moins de $50k'}</option>
                    <option value="50k-150k">$50k - $150k USD</option>
                    <option value="150k-350k">$150k - $350k USD</option>
                    <option value="350k-plus">{currentLanguage === 'en' ? 'Above $350k' : 'Plus de $350k'}</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'slideshow': {
      const slides = settings.slides && settings.slides.length > 0 
        ? settings.slides 
        : [
            { image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80', title: 'Luxury Living', desc: 'Secure properties in Bujumbura' },
            { image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', title: 'Prime Urban Portfolios', desc: 'Active commercial buildings in Gitega' }
          ];

      return <SlideshowSection slides={slides} fontSizeHeadClass={fontSizeHeadClass} fontSizeTextClass={fontSizeTextClass} />;
    }

    case 'image_text': {
      const isReversed = settings.alignment === 'right';
      const sectionImg = settings.imageUrl || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80';
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center font-sans py-4">
          <div className={`space-y-6 lg:col-span-7 ${isReversed ? 'lg:order-2' : ''}`}>
            <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">
              CADASTRAL COMPLIANCE FRAMEWORK
            </span>
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black leading-tight tracking-tight`}>
              {settings.heading || 'Aesthetic Image with Text pairing'}
            </h2>
            <div className="w-20 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
            <p className={`${fontSizeTextClass} ${txtColorVal} leading-relaxed whitespace-pre-wrap font-sans font-light`}>
              {settings.body || 'This section creates a majestic 50/50 balance. You can swap the side of the image, adjust letter spacing, write unlimited paragraph blocks, and preview everything instantaneously without refresh noise.'}
            </p>
          </div>
          <div className={`lg:col-span-5 ${isReversed ? 'lg:order-1' : ''}`}>
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 relative group p-2 bg-white">
              <div className="rounded-2xl overflow-hidden relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]">
                <img 
                  src={sectionImg} 
                  alt="Section representation" 
                  className="w-full h-full object-cover hover:scale-[1.025] transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-305" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'columns': {
      const items = settings.columns && settings.columns.length > 0
        ? settings.columns
        : [
            { icon: '🛡️', title: 'Premium Verification', desc: 'Independent land registry title checks before transaction.' },
            { icon: '⚡', title: 'Instant Brokerage', desc: 'Secure real estate connections in Bujumbura, Gitega and beyond.' },
            { icon: '📂', title: 'Frictionless Contracts', desc: 'Electronically signed service agreement with legal standards.' }
          ];
      return (
        <div className="space-y-16 font-sans">
          {settings.heading && (
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">
                GUARANTEED INSTITUTIONAL STANDARDS
              </span>
              <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black leading-tight tracking-tight`}>
                {settings.heading}
              </h2>
              {settings.subheading && <p className={`text-sm sm:text-base ${txtColorVal} font-light max-w-2xl mx-auto leading-relaxed`}>{settings.subheading}</p>}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            {items.map((item: any, idx: number) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs hover:shadow-xl hover:translate-y-[-5px] transition-all duration-350 relative group"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-t-3xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-350 origin-left" />
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-6 shadow-inner border border-blue-100/40">
                  {item.icon || '📌'}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-3 font-display">{item.title || 'Column Title'}</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans font-light">{item.desc || 'Provide column descriptions.'}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'gallery': {
      const images = settings.images && settings.images.length > 0 
        ? settings.images 
        : [
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80'
          ];
      const cols = settings.columns || 4;
      const gridColsClass = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4';

      return (
        <div className="space-y-12 font-sans">
          {settings.heading && (
            <div className="text-center space-y-4">
              <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">
                OFFICIAL VERIFIED MEDIA ARCHIVE
              </span>
              <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight`}>
                {settings.heading}
              </h2>
              <p className={`text-xs sm:text-sm ${txtColorVal} font-light`}>{settings.subheading || 'Explore verified catalog captures'}</p>
            </div>
          )}
          <div className={`grid ${gridColsClass} gap-6`}>
            {images.map((img: string, idx: number) => (
              <div key={idx} className="group relative rounded-3xl overflow-hidden h-[260px] md:h-[300px] border border-slate-200/60 shadow-md">
                <img 
                  src={img} 
                  alt={`Gallery piece ${idx + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out animate-in fade-in"
                  referrerPolicy="no-referrer"
                />
                
                {/* Elegant overlay gradient detail */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-95" />
                <span className="absolute bottom-5 left-5 bg-white/20 backdrop-blur-md px-3 py-1 text-[9px] font-mono tracking-widest text-white uppercase rounded-lg border border-white/25 flex items-center gap-1.5 font-bold">
                  <Compass className="w-3.5 h-3.5 text-blue-400" /> VETTED CAPTURE PT. {idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'richtext': {
      return (
        <div className="max-w-3xl mx-auto space-y-8 font-sans">
          {settings.title && (
            <div className="space-y-4 border-b border-slate-200/80 pb-6 mb-2 text-center md:text-left">
              <span className="text-[10.5px] font-mono tracking-[0.2em] font-black text-blue-650 uppercase block">REGULATORY REFERENCE ACT</span>
              <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight leading-tight`}>
                {settings.title}
              </h2>
            </div>
          )}
          <div className={`prose prose-slate max-w-none ${fontSizeTextClass} ${txtColorVal} leading-extra-relaxed whitespace-pre-wrap font-sans font-light`}>
            {settings.body || 'Provide comprehensive rich text details regarding corporate structure, compliance, audits, or legal guidelines. Fully supports newlines and raw layout blocks.'}
          </div>
        </div>
      );
    }

    case 'brands': {
      const brandList = settings.brands && settings.brands.length > 0 
        ? settings.brands 
        : ['BANQUE DE LA REPUBLIQUE', 'REGIDESO', 'MINISTERE DES FINANCES', 'OBR BURUNDI', 'CADASTRE NATIONAL'];
      return (
        <div className="space-y-8 py-6 text-center font-sans">
          <span className="text-[10px] font-mono tracking-[0.25em] text-slate-400 font-extrabold uppercase mb-2 block">
            INTEGRATED LEGAL & FINANCIAL AUDIT PARTNERS
          </span>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 max-w-5xl mx-auto">
            {brandList.map((brand: string, idx: number) => (
              <span 
                key={idx} 
                className="text-xs font-bold tracking-widest text-slate-600 hover:text-blue-650 transition-colors font-mono uppercase bg-white border border-slate-205/85 px-5 py-3 rounded-2xl shadow-xs transition-shadow duration-300 flex items-center gap-2 select-all hover:shadow-md"
              >
                🏢 {brand}
              </span>
            ))}
          </div>
        </div>
      );
    }

    case 'faqs': {
      const qasList = settings.faqs && settings.faqs.length > 0
        ? settings.faqs
        : [
            { q: 'How does IMMO BURUNDI verify cadastral documents?', a: 'Our expert team visits the physical national registry of properties of Burundi, coordinating with officials to ensure authenticity.' },
            { q: 'What is the cost of full property promotion?', a: 'Standard packages start from 1% of the final verified lease price or flat rates depending on acreage.' },
            { q: 'Can international buyers securely sign electronic lease deeds?', a: 'Yes! Immo Burundi offers bilingual digital signatures that comply with private mercantile codes.' }
          ];

      return (
        <FaqsSection 
          qasList={qasList} 
          heading={settings.heading || 'Frequently Asked Questions'} 
          subheading={settings.subheading || 'Get instant clear responses regarding compliance'} 
          fontSizeHeadClass={fontSizeHeadClass} 
          headColorVal={headColorVal} 
          txtColorVal={txtColorVal} 
        />
      );
    }

    case 'testimonials': {
      const reviews = settings.testimonials && settings.testimonials.length > 0
        ? settings.testimonials
        : [
            { text: 'IMMO BURUNDI saved us from a fraudulent double-allocation trap in Kiriri. The document audit is stellar!', author: 'Gérard Sindayigaya', role: 'Diaspora Investor' },
            { text: 'Easiest rental broker experience in Kinindo! Signed electronically on a Sunday and received keys on Monday.', author: 'Clara Kaneza', role: 'Executive Secretary' }
          ];
      return (
        <div className="space-y-16 font-sans">
          <div className="text-center space-y-4">
            <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">
              VERIFIED RESIDENT feedback
            </span>
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight`}>
              {settings.heading || 'What Our Verified Clients Say'}
            </h2>
            <p className={`text-xs sm:text-sm ${txtColorVal} font-light`}>Absolute records of customer protection and electronic transaction validity</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mt-8 max-w-5xl mx-auto">
            {reviews.map((rev: any, idx: number) => (
              <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 relative space-y-5">
                <span className="absolute top-6 right-6 text-slate-100 font-serif text-8xl leading-none font-bold select-none pointer-events-none">“</span>
                <div className="flex gap-1 text-amber-500 relative z-10">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
                <p className="text-sm italic text-slate-650 font-sans leading-relaxed relative z-10 font-light font-display">
                  "{rev.text}"
                </p>
                <div className="border-t border-slate-100 pt-5 flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-650 to-blue-800 text-white flex items-center justify-center font-black text-sm shadow-md uppercase">
                    {rev.author?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{rev.author}</h4>
                    <span className="text-[10px] font-mono text-slate-450 uppercase tracking-widest">{rev.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'video': {
      return <VideoSection heading={settings.heading} coverImage={settings.coverImage} duration={settings.duration} />;
    }

    case 'single_image': {
      return (
        <div className="w-full text-center font-sans">
          <div className="w-full overflow-hidden border-b border-slate-200/50 bg-slate-900 leading-none">
            <img 
              src={settings.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'} 
              alt={settings.caption || 'Immo Burundi Media'} 
              className="w-full h-[380px] sm:h-[500px] lg:h-[650px] object-cover hover:scale-[1.01] transition-transform duration-500 ease"
              referrerPolicy="no-referrer"
            />
          </div>
          {settings.caption && (
            <p className="text-[11px] font-mono font-bold tracking-widest text-[#64748b] text-center uppercase py-5 bg-slate-50 border-t border-slate-200">
              <Compass className="w-4.5 h-4.5 inline mr-1 text-slate-400" /> {settings.caption}
            </p>
          )}
        </div>
      );
    }

    case 'heading': {
      return (
        <div className="text-center py-6 space-y-4 font-sans">
          <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">SYSTEM HIGHLIGHT DIRECTIVE</span>
          <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight leading-tight`}>
            {settings.title || 'Custom Centered Typography Heading'}
          </h2>
          {settings.subtitle && <p className={`max-w-2xl mx-auto ${fontSizeTextClass} ${txtColorVal} font-light leading-relaxed`}>{settings.subtitle}</p>}
        </div>
      );
    }

    case 'text': {
      return (
        <div className="max-w-3xl mx-auto py-4 leading-relaxed whitespace-pre-wrap font-sans font-light text-center">
          <p className={`${fontSizeTextClass} ${txtColorVal} font-sans leading-extra-relaxed`}>
            {settings.body || 'This is a dedicated text block layout. Expand on corporate rules, office locations, security policies, digital submission files, boundary maps limits, or any broker listings guidelines.'}
          </p>
        </div>
      );
    }

    case 'property_list': {
      const heading = settings.heading || (currentLanguage === 'en' ? 'Featured Properties' : currentLanguage === 'fr' ? 'Propriétés Vedettes' : 'Mali Maalum');
      const subheading = settings.subheading || (currentLanguage === 'en' ? 'Explore active verified listings directly synchronized from the registry builder' : 'Explorez les annonces actives vérifiées directement personnalisées');
      const limit = parseInt(settings.limit || '3', 10);
      const typeFilter = settings.typeFilter || 'all';
      const showOnlyVerified = settings.showOnlyVerified !== false;

      // Filter in client space
      const fullList = properties || [];
      const searchLower = (searchQuery || '').toLowerCase().trim();
      const filtered = fullList
         .filter(p => p.status === 'approved')
         .filter(p => !showOnlyVerified || p.verified)
         .filter(p => {
           if (typeFilter !== 'all') {
             return p.type === typeFilter;
           }
           if (selectedType && selectedType !== 'all') {
             return p.type === selectedType;
           }
           return true;
         })
         .filter(p => {
           if (!searchQuery) return true;
           return (p.title || '').toLowerCase().includes(searchLower) || 
                  (p.location || '').toLowerCase().includes(searchLower) || 
                  (p.city || '').toLowerCase().includes(searchLower);
         })
         .filter(p => {
           if (!selectedPriceRange || selectedPriceRange === 'all') return true;
           const priceInUsd = p.currency === 'USD' ? p.price : p.price / 2850;
           if (selectedPriceRange === 'under-50k') return priceInUsd < 50000;
           if (selectedPriceRange === '50k-150k') return priceInUsd >= 50000 && priceInUsd <= 150000;
           if (selectedPriceRange === '150k-350k') return priceInUsd >= 150000 && priceInUsd <= 350000;
           if (selectedPriceRange === '350k-plus') return priceInUsd > 350000;
           return true;
         })
         .slice(0, limit);

      return (
        <div className="space-y-12 font-sans">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-mono text-[9px] tracking-[0.2em] font-extrabold uppercase border border-blue-150">
              <Compass className="w-3.5 h-3.5 text-blue-750 animate-spin" /> LIVE GPS-SYNCHRONIZED DEEDS REGISTER
            </span>
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight`}>{heading}</h2>
            {subheading && <p className={`text-xs sm:text-sm ${txtColorVal} font-light max-w-2xl mx-auto leading-relaxed`}>{subheading}</p>}
          </div>
          
          {filtered.length === 0 ? (
            <div className="text-center py-20 rounded-3xl bg-white border border-slate-200 p-8 max-w-md mx-auto shadow-sm">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider font-bold mb-1">No Matched Records</p>
              <p className="text-xs text-slate-500 font-light leading-relaxed">No matching verified properties found on this search filter. Try adjusting tags or keyword parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  currentLanguage={currentLanguage}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'team_profile': {
      const heading = settings.heading || 'Our Licensed Auditing Experts';
      const subheading = settings.subheading || 'Fully certified legal counsel & cadastral surveyor team coordinate validations';
      const members = settings.members && settings.members.length > 0
        ? settings.members
        : [
            { name: 'Sylvain Ndayishimiye', role: 'Chief Land Registrar Audit Officer', bio: '15+ years cross-referencing title deeds at Gitega national archives.', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80' },
            { name: 'Estella Kaneza', role: 'Sovereign Boundary Surveyor, GPS', bio: 'Senior geodesist confirming precise UTM and GPS coordinates on sight.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
            { name: 'Aimé Ndizeye', role: 'Executive Diaspora Coordinator', bio: 'Facilitates escrow and secure electronic leasing contracts for expats.', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' }
          ];

      return (
        <div className="space-y-16 font-sans">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-805 font-mono text-[9px] tracking-[0.2em] font-black uppercase border border-blue-150">
              <Users className="w-3.5 h-3.5 text-blue-750" /> LICENSED OFFICIAL REGISTRARS
            </span>
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight`}>{heading}</h2>
            {subheading && <p className={`text-xs sm:text-sm ${txtColorVal} font-light max-w-2xl mx-auto leading-relaxed`}>{subheading}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
            {members.map((member: any, idx: number) => (
              <div key={idx} className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs hover:shadow-xl hover:translate-y-[-4px] transition-all duration-350 text-center flex flex-col items-center space-y-5">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full blur opacity-15 group-hover:opacity-30 transition-all duration-300" />
                  <img
                    src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={member.name}
                    className="w-28 h-28 rounded-full object-cover relative border-4 border-white shadow-xl group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">{member.name}</h3>
                  <p className="inline-block text-[10px] font-mono font-bold text-blue-650 uppercase tracking-widest mt-1 bg-blue-50/70 border border-blue-100/50 px-2.5 py-1 rounded-lg">{member.role}</p>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-light leading-relaxed font-sans">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'process_steps': {
      const heading = settings.heading || 'Our Secure Title Verification Workflow';
      const subheading = settings.subheading || 'Every single listing on Immo Burundi goes through these rigorous security stages to eliminate fraud or double allocation';
      const steps = settings.steps && settings.steps.length > 0
        ? settings.steps
        : [
            { number: '01', title: 'Document Submission', desc: 'Owners submit digital cadastral papers and national identity deeds.' },
            { number: '02', title: 'Registrar Check', desc: 'Our team verifies the historical registry list directly in Bujumbura.' },
            { number: '03', title: 'GPS Demarcation', desc: 'We physically measure coordinates on the ground to match official maps.' },
            { number: '04', title: 'Verified Stamp', desc: 'The listing is certified \'System Verified\' and published live.' }
          ];

      return (
        <div className="space-y-16 font-sans">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">
              DIASPORA SECURITY PROTOCOL
            </span>
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight`}>{heading}</h2>
            {subheading && <p className={`text-xs sm:text-sm ${txtColorVal} font-light max-w-2xl mx-auto leading-relaxed`}>{subheading}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6 max-w-6xl mx-auto relative text-center md:text-left">
            {/* Connecting line in desktop view */}
            <div className="hidden md:block absolute top-[55px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-blue-600 via-indigo-500 to-indigo-300 z-0" />

            {steps.map((step: any, idx: number) => (
              <div key={idx} className="relative z-10 flex flex-col items-center md:items-start space-y-5 group">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-black font-mono text-[15px] shadow-xl border-4 border-white group-hover:scale-105 transition-transform duration-300 shadow-blue-600/10">
                  {step.number || `0${idx + 1}`}
                </div>
                <div className="space-y-2 mt-2">
                  <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-light leading-relaxed font-sans">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'stats_grid': {
      const heading = settings.heading || 'Immo Burundi in numbers';
      const subheading = settings.subheading || 'Unrivaled real estate validation figures across Burundi since 2018';
      const stats = settings.stats && settings.stats.length > 0
        ? settings.stats
        : [
            { label: 'Land Audits Done', value: '480+' },
            { label: 'BIF Capital Secured', value: '95.4 Billion' },
            { label: 'Diaspora Transactions', value: '120+' },
            { label: 'Zero Fraud Rate', value: '100%' }
          ];

      return (
        <div className="space-y-16 font-sans">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-mono text-[9px] tracking-[0.2em] font-black uppercase border border-blue-150">
              <Trophy className="w-3.5 h-3.5 text-blue-750" /> ECOSYSTEM OUTCOME ANALYSIS
            </span>
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight`}>{heading}</h2>
            {subheading && <p className={`text-xs sm:text-sm ${txtColorVal} font-light max-w-2xl mx-auto leading-relaxed`}>{subheading}</p>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 max-w-6xl mx-auto">
            {stats.map((stat: any, idx: number) => (
              <div key={idx} className="bg-white border border-slate-205 rounded-3xl p-8 text-center shadow-xs hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 relative group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-b-full opacity-60" />
                <span className="text-2xl sm:text-[34px] font-black text-blue-600 font-display block select-all tracking-tight leading-none mb-3">
                  {stat.value}
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-slate-450 uppercase leading-relaxed block border-t border-slate-100 pt-3">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'contact_form_banner': {
      const heading = settings.heading || 'Secure Your Free Advisory Consult Session';
      const subheading = settings.subheading || 'Speak to an official cadastral validation attorney live in Bujumbura or via Microsoft Teams. Enter your parameters to proceed.';
      const buttonText = settings.buttonText || 'Schedule Free Call';

      return (
        <ContactFormBannerSection
          heading={heading}
          subheading={subheading}
          buttonText={buttonText}
          fontSizeHeadClass={fontSizeHeadClass}
        />
      );
    }

    default:
      return null;
  }
}
