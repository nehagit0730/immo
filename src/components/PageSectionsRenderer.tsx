import { useState, useEffect } from 'react';
import { PageSection, Property } from '../types';
import { Language } from '../translations';
import PropertyCard from './PropertyCard';
import { ChevronRight, ChevronLeft, HelpCircle, Star, Play, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PageSectionsRendererProps {
  sections: PageSection[];
  properties?: Property[];
  currentLanguage?: Language;
}

export default function PageSectionsRenderer({ sections, properties = [], currentLanguage = 'en' }: PageSectionsRendererProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="w-full space-y-0">
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

        const commonStyle = `${bgVal} w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-100/50 last:border-0 transition-all overflow-hidden relative`;

        return (
          <div key={section.id || idx} className={commonStyle}>
            {/* Ambient subtle gradient blur behind sections */}
            <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>
            <div className="max-w-7xl mx-auto relative z-10">
              {renderSectionContent(section, { fontSizeHeadClass, fontSizeTextClass, headColorVal, txtColorVal }, properties, currentLanguage)}
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
    <div className="relative rounded-3xl h-[450px] sm:h-[550px] overflow-hidden shadow-2xl group border border-slate-200/50">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out transform group-hover:scale-102"
        style={{ backgroundImage: `url(${slide.image})` }}
      />
      
      {/* High-end progressive black glass gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/20" />
      
      {/* Overlay text */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-16 text-left text-white z-10 max-w-3xl space-y-4">
        <span className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white font-mono text-[10px] tracking-widest uppercase backdrop-blur-md border border-white/20">
          📍 Curated Portfolio Highlight
        </span>
        <h2 className={`${fontSizeHeadClass} font-black tracking-tight drop-shadow-md leading-tight text-white`}>
          {slide.title}
        </h2>
        <p className={`${fontSizeTextClass} font-normal max-w-xl text-slate-300 leading-relaxed font-sans`}>
          {slide.desc}
        </p>
      </div>

      {/* Navigation Arrows */}
      <button 
        type="button"
        onClick={() => setCurSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white cursor-pointer transition-all opacity-0 group-hover:opacity-100 duration-350 z-20"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button 
        type="button"
        onClick={() => setCurSlide((prev) => (prev + 1) % slides.length)}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white cursor-pointer transition-all opacity-0 group-hover:opacity-100 duration-350 z-20"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Modern thin line Indicators */}
      <div className="absolute bottom-6 left-8 sm:left-16 flex gap-2.5 z-20">
        {slides.map((_: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setCurSlide(idx)}
            className={`h-1 rounded-full transition-all duration-350 cursor-pointer ${idx === curSlide ? 'bg-white w-10' : 'bg-white/30 w-3'}`}
          />
        ))}
      </div>
    </div>
  );
}

function FaqsSection({ qasList, heading, subheading, fontSizeHeadClass, headColorVal, txtColorVal }: { qasList: any[], heading: string, subheading: string, fontSizeHeadClass: string, headColorVal: string, txtColorVal: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight leading-none`}>
          {heading}
        </h2>
        {subheading && <p className={`text-sm tracking-wide ${txtColorVal}`}>{subheading}</p>}
      </div>
      <div className="space-y-4 mt-8">
        {qasList.map((item: any, idx: number) => {
          const isOpen = openIdx === idx;
          return (
            <div 
              key={idx} 
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen ? 'border-blue-500 shadow-md transform translate-y-[-1px]' : 'border-slate-200/80 shadow-sm'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full text-left p-5 flex justify-between items-center bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <span className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-3">
                  <HelpCircle className={`w-5 h-5 flex-shrink-0 transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.q || 'Question?'}
                </span>
                <span className={`text-base font-mono font-bold ml-2 transition-transform duration-300 ${isOpen ? 'rotate-90 text-blue-600' : 'text-slate-400'}`}>
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div className="p-5 bg-white text-xs sm:text-sm text-slate-650 leading-relaxed font-normal font-sans border-t border-slate-100 animate-in slide-in-from-top-1 duration-150 whitespace-pre-wrap">
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
    <div className="max-w-4xl mx-auto space-y-6 text-center">
      {heading && (
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
          {heading}
        </h2>
      )}
      <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 flex items-center justify-center group cursor-pointer">
        <img 
          src={coverImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'} 
          alt="Video Poster"
          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-103 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-950/45 group-hover:bg-slate-950/30 transition-colors" />
        
        {/* Pulsing Play Button */}
        <div className="relative z-10 w-20 h-20 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-108 transition-all duration-300">
          <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping pointer-events-none"></div>
          <Play className="w-8 h-8 fill-white translate-x-0.5" />
        </div>
        
        <span className="absolute bottom-6 right-6 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-sm text-[10px] font-mono font-bold text-slate-200 uppercase tracking-widest border border-slate-800">
          📽️ {duration || '2:45 MINS'} • Bujumbura Aerial Drone Tour
        </span>
      </div>
    </div>
  );
}

function renderSectionContent(
  section: PageSection, 
  styles: { fontSizeHeadClass: string; fontSizeTextClass: string; headColorVal: string; txtColorVal: string },
  properties: Property[],
  currentLanguage: Language
) {
  const settings = section.settings || {};
  const { fontSizeHeadClass, fontSizeTextClass, headColorVal, txtColorVal } = styles;

  switch (section.type) {
    case 'banner': {
      const bannerBg = settings.imageUrl || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80';
      const overlayColor = settings.overlayColor || 'rgba(15, 23, 42, 0.75)';
      return (
        <div className="relative rounded-3xl p-10 sm:p-24 text-center overflow-hidden min-h-[460px] flex flex-col justify-center items-center text-white shadow-2xl group border border-slate-850/10">
          {/* Zoomable Absolute Background Wrapper */}
          <div 
            className="absolute inset-0 bg-cover bg-center transform group-hover:scale-102 transition-transform duration-1000 ease-out z-0" 
            style={{ backgroundImage: `url(${bannerBg})` }}
          />
          {/* Custom Overlay */}
          <div className="absolute inset-0 z-10" style={{ backgroundColor: overlayColor }}></div>
          
          <div className="relative z-20 max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white font-mono text-[9px] tracking-[0.2em] font-extrabold uppercase backdrop-blur-md border border-white/20">
              ⚡ Verified Portal Standard
            </span>
            <h1 className={`${fontSizeHeadClass} font-black drop-shadow-md leading-[1.1] text-white tracking-tight`}>
              {settings.title || 'Dynamic High-Tech Banner'}
            </h1>
            <p className={`${fontSizeTextClass} opacity-90 leading-relaxed font-sans max-w-2xl mx-auto font-light`}>
              {settings.subtitle || 'Customize this banner space directly with full alignment toggles, custom overlay variables, and instant layout previews.'}
            </p>
            {settings.buttonText && (
              <div className="pt-4">
                <button 
                  className="px-8 py-3.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg transition-all font-sans text-xs tracking-widest uppercase shadow-md duration-250 cursor-pointer"
                >
                  {settings.buttonText}
                </button>
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className={`space-y-6 md:col-span-6 lg:col-span-7 ${isReversed ? 'md:order-2' : ''}`}>
            <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">
              Corporate Registry Standard
            </span>
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black leading-tight tracking-tight`}>
              {settings.heading || 'Aesthetic Image with Text pairing'}
            </h2>
            <div className="w-16 h-1 bg-blue-700 rounded-full"></div>
            <p className={`${fontSizeTextClass} ${txtColorVal} leading-relaxed whitespace-pre-wrap font-sans font-light`}>
              {settings.body || 'This section creates a majestic 50/50 balance. You can swap the side of the image, adjust letter spacing, write unlimited paragraph blocks, and preview everything instantaneously without refresh noise.'}
            </p>
          </div>
          <div className={`md:col-span-6 lg:col-span-5 ${isReversed ? 'md:order-1' : ''}`}>
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 relative group">
              <img 
                src={sectionImg} 
                alt="Section" 
                className="w-full h-[360px] md:h-[450px] object-cover hover:scale-103 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
        <div className="space-y-12">
          {settings.heading && (
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">
                Guaranteed Framework
              </span>
              <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black leading-tight tracking-tight`}>
                {settings.heading}
              </h2>
              {settings.subheading && <p className={`text-sm sm:text-base ${txtColorVal} font-light max-w-2xl mx-auto`}>{settings.subheading}</p>}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-4">
            {items.map((item: any, idx: number) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg hover:translate-y-[-4px] transition-all duration-300 relative group"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-700 to-indigo-500 rounded-t-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-3xl mb-5 shadow-inner">
                  {item.icon || '📌'}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2 font-display">{item.title || 'Column Title'}</h3>
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
        <div className="space-y-10 animate-in fade-in duration-300">
          {settings.heading && (
            <div className="text-center space-y-3">
              <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">
                Official Media Catalog
              </span>
              <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight`}>
                {settings.heading}
              </h2>
              <p className={`text-xs sm:text-sm ${txtColorVal} font-light`}>{settings.subheading || 'Explore verified catalog captures'}</p>
            </div>
          )}
          <div className={`grid ${gridColsClass} gap-6`}>
            {images.map((img: string, idx: number) => (
              <div key={idx} className="group relative rounded-2xl overflow-hidden h-[240px] border border-slate-200/50 shadow-md">
                <img 
                  src={img} 
                  alt={`Gallery item ${idx}`} 
                  className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                
                {/* Elegant overlay gradient detail */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-90 transition-opacity" />
                <span className="absolute bottom-4 left-4 bg-white/15 backdrop-blur-md px-2.5 py-1 text-[9px] font-mono tracking-widest text-white uppercase rounded-md border border-white/20">
                  📁 Captured Portfolio Pt. {idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'richtext': {
      return (
        <div className="max-w-3xl mx-auto space-y-6">
          {settings.title && (
            <div className="space-y-3 border-b border-slate-200/80 pb-6 mb-6">
              <span className="text-[10.5px] font-mono tracking-[0.2em] font-extrabold text-blue-650 uppercase block">Regulatory Reference</span>
              <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight leading-tight`}>
                {settings.title}
              </h2>
            </div>
          )}
          <div className={`prose prose-slate max-w-none ${fontSizeTextClass} ${txtColorVal} leading-relaxed whitespace-pre-wrap font-sans font-light`}>
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
        <div className="space-y-6 py-4 text-center">
          <p className="text-[10px] font-mono tracking-[0.25em] text-slate-400 font-extrabold uppercase mb-2">INTEGRATED AUDIT PARTNERS</p>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
            {brandList.map((brand: string, idx: number) => (
              <span 
                key={idx} 
                className="text-xs sm:text-xs font-bold tracking-widest text-slate-450 hover:text-blue-550 transition-colors font-mono uppercase bg-slate-50/70 border border-slate-200/60 px-4 py-2.5 rounded-xl shadow-xs"
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
            { q: 'Can international buyers securely signed electronic contracts?', a: 'Yes! Immo Burundi offers bilingual digital signatures that comply with private mercantile codes.' }
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
        <div className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">
              Verified Feedback
            </span>
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight`}>
              {settings.heading || 'What Our Verified Clients Say'}
            </h2>
            <p className={`text-xs sm:text-sm ${txtColorVal} font-light`}>Endorsements of absolute security and execution excellence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 max-w-5xl mx-auto">
            {reviews.map((rev: any, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative space-y-4">
                <span className="text-5xl text-blue-100 font-serif absolute right-6 top-4 pointer-events-none">“</span>
                <div className="flex gap-1 text-amber-500 relative z-10">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
                <p className="text-xs sm:text-sm italic text-slate-650 font-sans leading-relaxed relative z-10 font-light">"{rev.text}"</p>
                <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-black text-xs text-blue-700">
                    {rev.author?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{rev.author}</h4>
                    <span className="text-[10px] font-mono text-slate-450 uppercase tracking-wider">{rev.role}</span>
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
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
            <img 
              src={settings.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'} 
              alt={settings.caption || 'Immo Burundi Media'} 
              className="w-full max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
          {settings.caption && <p className="text-[11px] font-mono font-semibold tracking-widest text-slate-400 text-center uppercase">{settings.caption}</p>}
        </div>
      );
    }

    case 'heading': {
      return (
        <div className="text-center py-4 space-y-3">
          <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">System Highlight</span>
          <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight leading-tight`}>
            {settings.title || 'Custom Centered Typography Heading'}
          </h2>
          {settings.subtitle && <p className={`max-w-2xl mx-auto ${fontSizeTextClass} ${txtColorVal} font-light`}>{settings.subtitle}</p>}
        </div>
      );
    }

    case 'text': {
      return (
        <div className="max-w-3xl mx-auto py-2 leading-relaxed whitespace-pre-wrap font-sans font-light text-center">
          <p className={`${fontSizeTextClass} ${txtColorVal}`}>
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
      const filtered = fullList
        .filter(p => p.status === 'approved')
        .filter(p => !showOnlyVerified || p.verified)
        .filter(p => typeFilter === 'all' || p.type === typeFilter)
        .slice(0, limit);

      return (
        <div className="space-y-10 font-sans">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[10px] sm:text-xs font-mono font-black tracking-[0.25em] text-blue-650 uppercase block">Direct Live Sync</span>
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black tracking-tight`}>{heading}</h2>
            {subheading && <p className={`text-xs sm:text-sm ${txtColorVal} font-light max-w-2xl mx-auto`}>{subheading}</p>}
          </div>
          
          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-slate-50 border border-slate-150 p-8 max-w-md mx-auto shadow-inner">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-xs text-slate-400 font-mono">No matching verified properties found. Try updating filters or verify lists in active tables.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6.5">
              {filtered.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  currentLanguage={currentLanguage}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
