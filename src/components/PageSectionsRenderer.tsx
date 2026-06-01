import { useState, useEffect } from 'react';
import { PageSection } from '../types';
import { ChevronRight, ChevronLeft, Volume2, HelpCircle, Star, Play, CheckCircle } from 'lucide-react';

interface PageSectionsRendererProps {
  sections: PageSection[];
}

export default function PageSectionsRenderer({ sections }: PageSectionsRendererProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="w-full space-y-0">
      {sections.map((section, idx) => {
        const bgVal = section.backgroundColor || 'bg-white';
        const headColorVal = section.headingColor || 'text-slate-900';
        const txtColorVal = section.textColor || 'text-slate-650';
        
        let fontSizeTextClass = 'text-sm sm:text-base';
        let fontSizeHeadClass = 'text-xl sm:text-3xl font-black tracking-tight';

        if (section.fontSize === 'sm') {
          fontSizeTextClass = 'text-xs sm:text-sm';
          fontSizeHeadClass = 'text-base sm:text-xl font-bold';
        } else if (section.fontSize === 'lg') {
          fontSizeTextClass = 'text-base sm:text-lg';
          fontSizeHeadClass = 'text-2xl sm:text-4xl font-extrabold tracking-tight';
        } else if (section.fontSize === 'display') {
          fontSizeTextClass = 'text-lg sm:text-xl';
          fontSizeHeadClass = 'text-4xl sm:text-6xl font-black tracking-tighter leading-none';
        }

        const commonStyle = `${bgVal} w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-100 last:border-0 transition-all overflow-hidden relative`;

        return (
          <div key={section.id || idx} className={commonStyle}>
            <div className="max-w-7xl mx-auto">
              {renderSectionContent(section, { fontSizeHeadClass, fontSizeTextClass, headColorVal, txtColorVal })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderSectionContent(
  section: PageSection, 
  styles: { fontSizeHeadClass: string; fontSizeTextClass: string; headColorVal: string; txtColorVal: string }
) {
  const settings = section.settings || {};
  const { fontSizeHeadClass, fontSizeTextClass, headColorVal, txtColorVal } = styles;

  switch (section.type) {
    case 'banner': {
      const bannerBg = settings.imageUrl || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80';
      const overlayColor = settings.overlayColor || 'rgba(15, 23, 42, 0.7)';
      return (
        <div 
          className="relative rounded-3xl p-8 sm:p-20 text-center overflow-hidden min-h-[350px] flex flex-col justify-center items-center text-white"
          style={{ 
            backgroundImage: `url(${bannerBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Custom Overlay */}
          <div className="absolute inset-0 z-0" style={{ backgroundColor: overlayColor }}></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h1 className={`${fontSizeHeadClass} font-black drop-shadow-sm`}>
              {settings.title || 'Dynamic High-Tech Banner'}
            </h1>
            <p className={`${fontSizeTextClass} opacity-90 leading-relaxed font-sans`}>
              {settings.subtitle || 'Customize this banner space directly with full alignment toggles, custom overlay variables, and instant layout previews.'}
            </p>
            {settings.buttonText && (
              <div className="pt-4">
                <button 
                  className="px-6 py-3 rounded-full font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all font-sans text-xs tracking-wider uppercase shadow-lg duration-200 cursor-pointer"
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
      
      const [curSlide, setCurSlide] = useState(0);

      useEffect(() => {
        const interval = setInterval(() => {
          setCurSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(interval);
      }, [slides.length]);

      const slide = slides[curSlide] || slides[0];

      return (
        <div className="relative rounded-3xl h-[400px] overflow-hidden group">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className="absolute inset-0 bg-slate-950/70" />
          
          {/* Overlay text */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 text-white z-10 space-y-3">
            <h2 className={`${fontSizeHeadClass} font-black tracking-tight`}>{slide.title}</h2>
            <p className={`${fontSizeTextClass} max-w-lg opacity-80`}>{slide.desc}</p>
          </div>

          {/* Controls */}
          <button 
            type="button"
            onClick={() => setCurSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white cursor-pointer z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            type="button"
            onClick={() => setCurSlide((prev) => (prev + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white cursor-pointer z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
            {slides.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === curSlide ? 'bg-white w-5' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      );
    }

    case 'image_text': {
      const isReversed = settings.alignment === 'right';
      const sectionImg = settings.imageUrl || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80';
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${isReversed ? 'md:flex-row-reverse' : ''}`}>
          <div className={`space-y-4 ${isReversed ? 'md:order-2' : ''}`}>
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black`}>
              {settings.heading || 'Aesthetic Image with Text pairing'}
            </h2>
            <p className={`${fontSizeTextClass} ${txtColorVal} leading-relaxed whitespace-pre-wrap font-sans`}>
              {settings.body || 'This section creates a majestic 50/50 balance. You can swap the side of the image, adjust letter spacing, write unlimited paragraph blocks, and preview everything instantaneously without refresh noise.'}
            </p>
          </div>
          <div className={`rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 ${isReversed ? 'md:order-1' : ''}`}>
            <img 
              src={sectionImg} 
              alt="Section" 
              className="w-full h-[320px] object-cover hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      );
    }

    case 'columns': {
      const items = settings.columns && settings.columns.length > 0
        ? settings.columns
        : [
            { icon: '💎', title: 'Premium Verification', desc: 'Independent land registry title checks before transaction.' },
            { icon: '⚡', title: 'Instant Brokerage', desc: 'Secure real estate connections in Bujumbura, Gitega and beyond.' },
            { icon: '📂', title: 'Frictionless Contracts', desc: 'Electronically signed service agreement with legal standards.' }
          ];
      return (
        <div className="space-y-10">
          {settings.heading && (
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black`}>{settings.heading}</h2>
              {settings.subheading && <p className={`text-sm ${txtColorVal}`}>{settings.subheading}</p>}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((item: any, idx: number) => (
              <div 
                key={idx} 
                className="bg-white/5 backdrop-blur-sm border border-slate-200/20 rounded-2xl p-6 shadow-sm hover:translate-y-[-4px] transition-transform duration-200"
              >
                <span className="text-3xl block mb-4">{item.icon || '📌'}</span>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title || 'Column Title'}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">{item.desc || 'Provide column descriptions.'}</p>
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
        <div className="space-y-8">
          {settings.heading && (
            <div className="text-center space-y-1">
              <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black`}>{settings.heading}</h2>
              <p className={`text-xs ${txtColorVal}`}>{settings.subheading || 'Explore verified catalog captures'}</p>
            </div>
          )}
          <div className={`grid ${gridColsClass} gap-4`}>
            {images.map((img: string, idx: number) => (
              <div key={idx} className="group relative rounded-2xl overflow-hidden h-[200px] border border-slate-200/50">
                <img 
                  src={img} 
                  alt={`Gallery item ${idx}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'richtext': {
      return (
        <div className="max-w-3xl mx-auto space-y-4">
          {settings.title && (
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black border-b pb-3`}>
              {settings.title}
            </h2>
          )}
          <div className={`prose prose-slate max-w-none ${fontSizeTextClass} ${txtColorVal} leading-relaxed whitespace-pre-wrap font-sans`}>
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
        <div className="space-y-4 py-4 text-center">
          <p className="text-[10px] font-mono tracking-widest text-slate-400 font-extrabold uppercase uppercase">INTEGRATED AUDIT PARTNERS</p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-14">
            {brandList.map((brand: string, idx: number) => (
              <span 
                key={idx} 
                className="text-sm sm:text-base font-black tracking-widest text-slate-450 hover:text-blue-500 transition-colors font-mono uppercase bg-slate-100/50 border border-slate-200/30 px-4 py-2 rounded-xl"
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

      const [openIdx, setOpenIdx] = useState<number | null>(null);

      return (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black`}>
              {settings.heading || 'Frequently Asked Questions'}
            </h2>
            <p className={`text-xs ${txtColorVal}`}>{settings.subheading || 'Get instant clear responses regarding compliance'}</p>
          </div>
          <div className="space-y-3.5 mt-8">
            {qasList.map((item: any, idx: number) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="w-full text-left p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100/70 transition-colors cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    {item.q || 'Question?'}
                  </span>
                  <span className="text-slate-400 font-mono">{openIdx === idx ? '−' : '+'}</span>
                </button>
                {openIdx === idx && (
                  <div className="p-4 bg-white text-xs sm:text-sm text-slate-650 leading-relaxed font-sans border-t border-slate-100 animate-in slide-in-from-top-1 duration-150">
                    {item.a || 'Answer goes here.'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
        <div className="space-y-8">
          <div className="text-center space-y-1">
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black`}>
              {settings.heading || 'What Our Verified Clients Say'}
            </h2>
            <p className={`text-xs ${txtColorVal}`}>Endorsements of absolute security and execution excellence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {reviews.map((rev: any, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
                <p className="text-xs sm:text-sm italic text-slate-650 font-sans">"{rev.text}"</p>
                <div className="border-t pt-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-blue-600">
                    {rev.author?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{rev.author}</h4>
                    <span className="text-[10px] font-mono text-slate-450">{rev.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'video': {
      return (
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          {settings.heading && <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black`}>{settings.heading}</h2>}
          <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center group cursor-pointer">
            <img 
              src={settings.coverImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'} 
              alt="Video Poster"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-950/40" />
            <div className="relative z-10 w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
              <Play className="w-7 h-7 fill-white translate-x-0.5" />
            </div>
            <span className="absolute bottom-4 right-4 bg-black/60 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 uppercase">
              📽️ {settings.duration || '2:45 MINS'} • Bujumbura Drone Tour
            </span>
          </div>
        </div>
      );
    }

    case 'single_image': {
      return (
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md">
            <img 
              src={settings.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'} 
              alt={settings.caption || 'Immo Burundi Media'} 
              className="w-full max-h-[450px] object-cover hover:scale-[1.02] transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
          {settings.caption && <p className="text-[11px] font-mono tracking-wider text-slate-400 text-center">{settings.caption}</p>}
        </div>
      );
    }

    case 'heading': {
      return (
        <div className="text-center py-2">
          <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black`}>
            {settings.title || 'Custom Centered Typography Heading'}
          </h2>
          {settings.subtitle && <p className={`mt-2 ${fontSizeTextClass} ${txtColorVal}`}>{settings.subtitle}</p>}
        </div>
      );
    }

    case 'text': {
      return (
        <div className="max-w-2xl mx-auto py-2 leading-relaxed whitespace-pre-wrap font-sans text-center md:text-left">
          <p className={`${fontSizeTextClass} ${txtColorVal}`}>
            {settings.body || 'This is a dedicated text block layout. Expand on corporate rules, office locations, security policies, digital submission files, boundary maps limits, or any broker listings guidelines.'}
          </p>
        </div>
      );
    }

    default:
      return null;
  }
}
