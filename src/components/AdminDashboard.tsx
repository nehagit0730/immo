import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Property, WebPage, EmailLog, SystemStats, PageSection } from '../types';
import { Language, translations } from '../translations';
import { 
  ShieldCheck, Plus, Trash2, Edit3, Check, X, Mail, Layers, BarChart2, 
  CheckCircle, RefreshCw, Eye, Home, Sparkles, MapPin, Search, 
  ChevronUp, ChevronDown, ArrowUp, ArrowDown, Settings, Copy, 
  Monitor, Layout, Info, UserCheck, AlertTriangle, Play, HelpCircle, Star,
  Image
} from 'lucide-react';
import { ibFetch } from '../apiMock';
import { ThemeSchema, themesMap, getThemeSettings } from '../theme';

interface AdminImageUploadProps {
  id?: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

const AdminImageUpload = ({ id, value, onChange, label, placeholder }: AdminImageUploadProps) => {
  const [localUploading, setLocalUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mediaList, setMediaList] = useState<{ url: string; name: string }[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper inside component to compress image
  const compressImage = (file: File): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxWidth = 640;
            const maxHeight = 480;

            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve({ blob: file, dataUrl: rawUrl });
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            const base64Url = canvas.toDataURL('image/jpeg', 0.55);
            
            canvas.toBlob((blob) => {
              if (blob) {
                resolve({ blob, dataUrl: base64Url });
              } else {
                resolve({ blob: file, dataUrl: rawUrl });
              }
            }, 'image/jpeg', 0.55);
          } catch (err) {
            console.warn('Canvas compression failure', err);
            resolve({ blob: file, dataUrl: rawUrl });
          }
        };
        img.onerror = () => resolve({ blob: file, dataUrl: rawUrl });
        img.src = rawUrl;
      };
      reader.onerror = () => resolve({ blob: file, dataUrl: typeof reader.result === 'string' ? reader.result : '' });
      reader.readAsDataURL(file);
    });
  };

  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const res = await ibFetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
      }
    } catch (e) {
      console.error('Error fetching media list:', e);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleUpload = async (file: File) => {
    setLocalUploading(true);
    try {
      // 1. Compress image
      const { blob, dataUrl } = await compressImage(file);
      
      const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
        type: "image/jpeg"
      });

      const formData = new FormData();
      formData.append('image', compressedFile);

      // 2. Try posting to server
      const res = await ibFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      } else {
        console.warn('Server upload rejected image, falling back to offline compressed base64 data-url');
        onChange(dataUrl);
      }
    } catch (e) {
      console.error('Server upload failed, falling back to offline compressed base64 data-url:', e);
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onChange(reader.result);
          }
        };
        reader.readAsDataURL(file);
      } catch (fallbackErr) {
        console.error('Local photo read failed:', fallbackErr);
        alert('Error uploading image');
      }
    } finally {
      setLocalUploading(false);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // allow uploading the same file again
      fileInputRef.current.click();
    }
  };

  const openPicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPickerOpen(true);
    fetchMedia();
  };

  return (
    <div className="space-y-1.5 font-sans" id={id}>
      {label && <label className="block text-[9.5px] tracking-wider font-mono text-[#94a3b8] uppercase mb-1">{label}</label>}
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Manual Input + Media Library trigger bar */}
      <div className="flex gap-2 mb-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Paste image URL or upload below..."}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-slate-700 min-w-0"
        />
        <button
          type="button"
          onClick={openPicker}
          className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors"
        >
          📁 Media Pick
        </button>
      </div>

      {value ? (
        <div className="border border-slate-800 rounded-lg p-3 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[85px]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img 
              src={value} 
              alt="Preview" 
              className="w-16 h-12 object-cover rounded-lg border border-slate-800 flex-shrink-0" 
              referrerPolicy="no-referrer" 
            />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] text-[#94a3b8] uppercase font-mono block">Active Cover url</span>
              <div className="text-[10px] text-slate-350 font-mono truncate">{value}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={triggerFileSelect}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[9.5px] font-bold text-slate-300 hover:bg-slate-800 transition-colors uppercase tracking-wider cursor-pointer font-mono"
            >
              {localUploading ? 'Uploading...' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange('');
              }}
              className="px-2.5 py-1.5 bg-red-950/40 border border-red-900/30 text-red-400 hover:bg-red-900/45 rounded text-[9.5px] font-bold transition-colors uppercase tracking-wider cursor-pointer font-mono"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={triggerFileSelect}
          className="border border-dashed border-slate-800 rounded-lg p-4 text-center bg-slate-950 hover:bg-slate-900/40 transition-colors cursor-pointer min-h-[85px] flex flex-col items-center justify-center space-y-1"
        >
          {localUploading ? (
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <span className="animate-spin text-blue-500 mr-1">🔄</span> Uploading secure copy...
            </span>
          ) : (
            <>
              <span className="font-bold text-[11px] text-slate-350 flex items-center gap-1.5">
                📁 {placeholder || 'Choose Image or Drag here'}
              </span>
              <span className="text-[8.5px] text-slate-500 font-mono">Stored in public uploads directory</span>
            </>
          )}
        </div>
      )}

      {/* Media Picker Modal Overlay */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-start border-b border-slate-900 pb-4">
              <div>
                <h4 className="text-xs sm:text-xs font-mono font-black text-white uppercase tracking-widest text-[#38bdf8]">Select Platform Image asset</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-1 leading-relaxed">Choose an uploaded media element to allocate instantly</p>
              </div>
              <button 
                type="button"
                onClick={() => setPickerOpen(false)}
                className="p-1 px-3 text-slate-300 hover:bg-slate-800 rounded bg-slate-900 text-xs font-bold cursor-pointer transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 select-none">
              {loadingMedia ? (
                <div className="py-16 text-center text-xs font-mono text-slate-500 flex items-center justify-center gap-2">
                  <span className="animate-spin text-blue-500">🔄</span> Loading Media asset registry...
                </div>
              ) : mediaList.length === 0 ? (
                <div className="py-16 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-850 rounded-2xl leading-relaxed p-4">
                  No images uploaded yet on disk. Upload your first image or open the "Media Manager" under Admin sidebar to create assets.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {mediaList.map((item) => (
                    <div 
                      key={item.url}
                      onClick={() => {
                        onChange(item.url);
                        setPickerOpen(false);
                      }}
                      className="group border border-slate-850 hover:border-[#38bdf8] rounded-xl p-2 bg-slate-900 cursor-pointer transition flex flex-col space-y-1.5"
                    >
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-950 relative">
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      </div>
                      <span className="text-[9.2px] font-mono text-slate-400 truncate text-center block max-w-full px-0.5">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AdminDashboardProps {
  currentLanguage: Language;
  onThemeChange?: () => void;
}

export default function AdminDashboard({ currentLanguage, onThemeChange }: AdminDashboardProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'analytics' | 'listings' | 'submissions' | 'pages' | 'logs' | 'settings' | 'media'>('analytics');
  
  // App data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [pages, setPages] = useState<WebPage[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [mediaFiles, setMediaFiles] = useState<{ url: string; name: string; size: string; uploadedAt: string }[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Property Filters / search
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyFilterType, setPropertyFilterType] = useState<string>('all');

  // Submit Review state
  const [reviewingProperty, setReviewingProperty] = useState<Property | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Page Editor state
  const [editorPage, setEditorPage] = useState<WebPage | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<WebPage | null>(null);

  // Settings states
  const [themeSchema, setThemeSchema] = useState<ThemeSchema>('blue');
  const [headerTitleInput, setHeaderTitleInput] = useState('');
  const [footerCopyrightInput, setFooterCopyrightInput] = useState('');

  // Add Dynamic Page state
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  // Direct Admin Property state
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

  // Media Tab Lifted States to respect Rules of Hooks
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaCopiedUrl, setMediaCopiedUrl] = useState<string | null>(null);
  const adminMediaInputRef = useRef<HTMLInputElement>(null);

  const t = translations[currentLanguage];
  const { colors } = getThemeSettings();

  // Load Admin Data
  const fetchAllAdminData = async () => {
    setIsLoading(true);
    try {
      const pRes = await ibFetch('/api/properties?role=admin');
      const pData = await pRes.json();
      setProperties(pData);

      const pgRes = await ibFetch('/api/pages');
      const pgData = await pgRes.json();
      setPages(pgData);

      const emRes = await ibFetch('/api/emails');
      const emData = await emRes.json();
      setEmails(emData);

      const stRes = await ibFetch('/api/stats');
      const stData = await stRes.json();
      setStats(stData);

      const mdRes = await ibFetch('/api/media');
      if (mdRes.ok) {
        const mdData = await mdRes.json();
        setMediaFiles(mdData);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
    // Load config inputs
    setThemeSchema((localStorage.getItem('ib_theme') as ThemeSchema) || 'blue');
    setHeaderTitleInput(localStorage.getItem('ib_header') || 'IMMO BURUNDI');
    setFooterCopyrightInput(localStorage.getItem('ib_footer') || '© 2026 IMMO BURUNDI Private Limited. All rights reserved.');
  }, []);

  // Update branding settings
  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ib_theme', themeSchema);
    localStorage.setItem('ib_header', headerTitleInput);
    localStorage.setItem('ib_footer', footerCopyrightInput);
    
    if (onThemeChange) {
      onThemeChange();
    }
    alert(currentLanguage === 'en' ? 'Branding settings updated with high-tech schemas!' : 'Paramètres de marque mis à jour avec des schémas de pointe !');
  };

  // Duplicate page
  const handleDuplicatePage = async (page: WebPage) => {
    try {
      const copyPayload = {
        title: {
          en: `${page.title.en} (Copy)`,
          fr: `${page.title.fr} (Copie)`,
          sw: `${page.title.sw} (Nakala)`
        },
        content: page.content,
        slug: `${page.slug}-copy-${Math.floor(Math.random() * 1000)}`,
        sections: page.sections ? JSON.parse(JSON.stringify(page.sections)) : []
      };

      const res = await ibFetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyPayload)
      });

      if (res.ok) {
        fetchAllAdminData();
        alert('Page duplicated successfully!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to duplicate page');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create empty dynamic page
  const handleCreatePage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageSlug.trim()) return;

    try {
      const payload = {
        title: { en: newPageTitle, fr: newPageTitle, sw: newPageTitle },
        content: { en: 'Draft content. Use builder to set up templates.', fr: 'Modèle.', sw: 'Muundo.' },
        slug: newPageSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        sections: [
          {
            id: 'sec_' + Date.now(),
            type: 'banner',
            backgroundColor: 'bg-slate-900 text-white',
            headingColor: 'text-white',
            textColor: 'text-slate-300',
            fontSize: 'display',
            settings: {
              title: newPageTitle,
              subtitle: 'Welcome to your brand new, modern page. Open the builder settings to construct premium columns, FAQs, or brand grids.',
              imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
              buttonText: 'Get Started Today'
            }
          }
        ]
      };

      const res = await ibFetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewPageTitle('');
        setNewPageSlug('');
        setAddPageOpen(false);
        fetchAllAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create page.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete dynamic page
  const handleDeletePage = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this content page? This cannot be undone.')) return;
    try {
      const res = await ibFetch(`/api/pages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAllAdminData();
      }
    } catch(e) {
      console.error(e);
    }
  };

  // Submit Admin Direct Listing Add
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
      images: addImageUrl ? [addImageUrl] : ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'],
      gpsLocation: addGpsLocation || undefined,
      ownerId: 'admin',
      ownerName: 'Administrative Office',
      ownerPhone: '+257 22 22 45 45',
      ownerEmail: 'office@immoburundi.bi',
      role: 'admin'
    };

    try {
      const res = await ibFetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAdminAddOpen(false);
        setAddTitle('');
        setAddDescription('');
        setAddPrice('');
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

  // Submit Submission Review
  const handleReviewSubmission = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      alert('A rejection reason statement is required!');
      return;
    }

    try {
      const res = await ibFetch(`/api/properties/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason })
      });
      if (res.ok) {
        setReviewingProperty(null);
        setRejectionReason('');
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Property Verified
  const handleToggleVerification = async (id: string) => {
    try {
      const res = await ibFetch(`/api/properties/${id}/verify`, { method: 'POST' });
      if (res.ok) {
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Listing
  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to permanently remove this property listing?')) return;
    try {
      const res = await ibFetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save modified page sections builder
  const handleSavePageLayout = async (targetPage: WebPage) => {
    try {
      const res = await ibFetch(`/api/pages/${targetPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: targetPage.title,
          content: targetPage.content,
          slug: targetPage.slug,
          sections: targetPage.sections
        })
      });

      if (res.ok) {
        setEditorPage(null);
        setActiveSectionId(null);
        fetchAllAdminData();
        alert('High-tech page sections saved successfully!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to save page sections: ${errorData.error || 'Server error (' + res.status + ')'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network or database error saving page layout!');
    }
  };

  // Filter Properties for admin management
  const filteredListings = properties.filter(p => {
    const s = propertySearch.toLowerCase();
    const matchQueries = p.title.toLowerCase().includes(s) ||
                         p.location.toLowerCase().includes(s) ||
                         p.ownerName.toLowerCase().includes(s) ||
                         p.city.toLowerCase().includes(s);
    const matchesFilterType = propertyFilterType === 'all' || p.type === propertyFilterType;
    return matchQueries && matchesFilterType;
  });

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${editorPage ? 'h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden' : ''} bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans`}>
      
      {/* ==========================================
          Futuristic Left Sidebar Options
      ========================================== */}
      {!editorPage && (
        <aside className="w-full md:w-80 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none animate-in slide-in-from-left duration-300">
        <div className="p-6 space-y-8">
          
          {/* Dashboard Header Branding badge */}
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-100 border border-slate-700 text-[10px] font-mono font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Administrative Console
            </span>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Burundi Registry
            </h1>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('analytics'); setEditorPage(null); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'analytics' 
                  ? `${colors.primaryBg} text-white shadow-lg shadow-blue-900/10` 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <BarChart2 className="w-4 h-4" />
                Analytics &amp; Views
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/40 text-slate-400">Hub</span>
            </button>

            <button
              onClick={() => { setActiveTab('listings'); setEditorPage(null); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'listings' 
                  ? `${colors.primaryBg} text-white shadow-lg` 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Home className="w-4 h-4" />
                All Properties
              </span>
              <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-slate-950/40 text-slate-400">
                {properties.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('submissions'); setEditorPage(null); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'submissions' 
                  ? `${colors.primaryBg} text-white shadow-lg` 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <UserCheck className="w-4 h-4" />
                Client Audits Check
              </span>
              <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-red-950/50 text-red-400 font-black">
                {properties.filter(p => p.status === 'pending').length}
              </span>
            </button>

            <button
               onClick={() => { setActiveTab('pages'); setEditorPage(null); }}
               className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                 activeTab === 'pages' 
                   ? `${colors.primaryBg} text-white shadow-lg` 
                   : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
               }`}
             >
               <span className="flex items-center gap-3">
                 <Layout className="w-4 h-4" />
                 Content Pages Builder
               </span>
               <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/40 text-slate-400">
                 {pages.length}
               </span>
             </button>
 
             <button
               onClick={() => { setActiveTab('media'); setEditorPage(null); }}
               className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                 activeTab === 'media' 
                   ? `${colors.primaryBg} text-white shadow-lg` 
                   : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
               }`}
             >
               <span className="flex items-center gap-3">
                 <Image className="w-4 h-4" />
                 Media Assets Hub
               </span>
               <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/40 text-slate-400">
                 {mediaFiles.length}
               </span>
             </button>

            <button
              onClick={() => { setActiveTab('logs'); setEditorPage(null); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'logs' 
                  ? `${colors.primaryBg} text-white shadow-lg` 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Mail className="w-4 h-4" />
                Simulated Outbox Logs
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/40 text-slate-400">Out</span>
            </button>
          </nav>
        </div>

        {/* Pin-fixed Settings card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={() => { setActiveTab('settings'); setEditorPage(null); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'settings'
                ? `bg-slate-850 border border-slate-700 text-white`
                : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400 animate-spin-reverse" />
            <div className="text-left">
              <span className="block font-sans text-[11.5px] leading-tight">Branding &amp; Style</span>
              <span className="text-[8px] font-mono text-slate-500 uppercase">Change palette settings</span>
            </div>
          </button>
        </div>
      </aside>
      )}

      {/* ==========================================
          Main Content Dynamic Sections Router
      ========================================== */}
      <main className={`flex-grow ${editorPage ? 'p-0 h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden' : 'p-6 sm:p-8 overflow-y-auto'} max-w-full`}>
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4 text-center">
            <RefreshCw className="w-8 h-8 text-slate-500 animate-spin" />
            <span className="text-xs font-mono text-slate-400">Loading ecosystem dataset...</span>
          </div>
        ) : editorPage ? (
          /* ==========================================
              HIGH TECH SECTION-BASED PAGE BUILDER
          ========================================== */
          renderPageSectionsBuilder()
        ) : (
          <div>
            {/* Analytics Tab */}
            {activeTab === 'analytics' && renderAnalyticsView()}

            {/* Properties Listings Tab */}
            {activeTab === 'listings' && renderListingsView()}

            {/* Submissions Checked Tab */}
            {activeTab === 'submissions' && renderSubmissionsView()}

            {/* Custom Content Pages Builder Tab */}
            {activeTab === 'pages' && renderPagesCatalogView()}

            {/* Dynamic Media Assets Library Tab */}
            {activeTab === 'media' && renderMediaView()}

            {/* Simulated Outbound Emails logs */}
            {activeTab === 'logs' && renderEmailsLogView()}

            {/* Settings Tab */}
            {activeTab === 'settings' && renderSettingsView()}
          </div>
        )}
      </main>

      {/* ==========================================
          ADMIN SUBMISSION REVIEW LIGHTBOX MODAL
      ========================================== */}
      {reviewingProperty && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 block uppercase">Review Cadastral Submission</span>
                <h3 className="text-base font-black text-white">{reviewingProperty.title}</h3>
              </div>
              <button onClick={() => setReviewingProperty(null)} className="p-2 text-slate-400 hover:text-white rounded bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-mono block mb-1">CADASTRAL PRICE TAG</span>
                <span className="font-bold text-slate-200">
                  {reviewingProperty.currency} {reviewingProperty.price.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-mono block mb-1">DECLARED GPS COORDINATES</span>
                <span className="font-bold text-slate-200">{reviewingProperty.gpsLocation || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-mono block mb-1">OWNERSHIP PHONE</span>
                <span className="font-bold text-slate-200">{reviewingProperty.ownerPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 font-mono block mb-1">OWNERSHIP EMAIL</span>
                <span className="font-bold text-slate-200">{reviewingProperty.ownerEmail}</span>
              </div>
            </div>

            {/* Rejection Statement text input */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300">Observation Objection Statement (Required for Refusal)</label>
              <textarea
                rows={3}
                placeholder="Declare why listing does not conform to registration boundary cadaster..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleReviewSubmission(reviewingProperty.id, 'approved')}
                className="flex-grow bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Approve &amp; Publish Listing
              </button>
              <button
                type="button"
                onClick={() => handleReviewSubmission(reviewingProperty.id, 'rejected')}
                className="flex-grow bg-red-650 hover:bg-red-600 text-white font-bold p-3 rounded-xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Reject Submission with Objection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ADMIN DUSTY DIRECT PROPERTY FORM MODAL
      ========================================== */}
      {adminAddOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Direct Audited Registration</h3>
                <p className="text-[10px] text-slate-400">Instantly authenticated under IMMO BURUNDI administrative seal</p>
              </div>
              <button onClick={() => setAdminAddOpen(false)} className="p-2 text-slate-400 hover:text-white rounded bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewProperty} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Listing Broad Title</label>
                  <input type="text" required value={addTitle} onChange={(e) => setAddTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-blue-500" placeholder="e.g. High-security boundary land parcel in Gitega" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Declared Price</label>
                  <input type="number" required value={addPrice} onChange={(e) => setAddPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 focus:outline-none" placeholder="e.g. 75000" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Currency Unit</label>
                  <select value={addCurrency} onChange={(e) => setAddCurrency(e.target.value as 'USD' | 'BIF')} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                    <option value="USD">USD ($)</option>
                    <option value="BIF">BIF (FBu)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Property Layout Type</label>
                  <select value={addType} onChange={(e) => setAddType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                    <option value="house">House (Villa / Résidence)</option>
                    <option value="land">Land (Parcelle de Terre)</option>
                    <option value="commercial">Commercial Building</option>
                    <option value="rental">Apartment Rental</option>
                    <option value="investment">Agricultural Portfolio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Primary Neighborhood / Cadaster (Zone)</label>
                  <input type="text" required value={addLocation} onChange={(e) => setAddLocation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5" placeholder="e.g. Kiriri, Kinindo, Rohero" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">City Hub</label>
                  <input type="text" required value={addCity} onChange={(e) => setAddCity(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5" placeholder="e.g. Bujumbura, Gitega, Rumonge" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Parcel Area / Acreage (Sqm)</label>
                  <input type="text" value={addArea} onChange={(e) => setAddArea(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5" placeholder="e.g. 500 sqm" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Gps Boundary Coordinates (Latitude, Longitude)</label>
                  <input type="text" value={addGpsLocation} onChange={(e) => setAddGpsLocation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5" placeholder="e.g. -3.3822, 29.3599" />
                </div>
                <div>
                  <AdminImageUpload 
                    value={addImageUrl} 
                    onChange={setAddImageUrl} 
                    label="Representative Image" 
                    placeholder="Upload image from device" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Descriptions (Audit notes brief)</label>
                <textarea rows={2.5} required value={addDescription} onChange={(e) => setAddDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5" placeholder="Write full cadastral audit description notes..." />
              </div>
              <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-xl uppercase transition-colors uppercase tracking-wider">
                Authenticate Direct Admin Listing
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          LIVE DESKTOP WEB PAGE PREVIEW LIGHTBOX
      ========================================== */}
      {previewPage && renderPagePreviewLightbox()}

    </div>
  );

  // ==========================================
  // RENDER DYNAMIC COMPONENT TAB: ANALYTICAL VIEWS
  // ==========================================
  function renderAnalyticsView() {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-sans font-black text-white">Market intelligence</h2>
            <p className="text-xs text-slate-400">Consolidated real-time biometric cadastral analytics dashboard</p>
          </div>
          <button onClick={fetchAllAdminData} className="px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-850 bg-slate-900 text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Re-trigger Audits Sync
          </button>
        </div>

        {/* High-Tech Grid Panel metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-extrabold">AUTHENTICATED ASSETS</span>
              <span className="text-xs">📜</span>
            </div>
            <div className="text-3xl font-black text-white mt-4">{properties.length}</div>
            <p className="text-[10px] font-semibold text-slate-450 mt-1 font-mono uppercase">Validated property listings</p>
          </div>

          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-extrabold">APPROVED LIVE</span>
              <span className="text-xs text-emerald-400">●</span>
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-4">
              {properties.filter(p => p.status === 'approved').length}
            </div>
            <p className="text-[10px] font-semibold text-slate-450 mt-1 font-mono uppercase">Verified and searchable</p>
          </div>

          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-extrabold">PENDING COMPLIANCE</span>
              <span className="text-xs text-red-400">⏳</span>
            </div>
            <div className="text-3xl font-black text-red-400 mt-4">
              {properties.filter(p => p.status === 'pending').length}
            </div>
            <p className="text-[10px] font-semibold text-slate-450 mt-1 font-mono uppercase">Pending boundary checks</p>
          </div>

          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-extrabold">SIMULATED QUERIES</span>
              <span className="text-xs">⚡</span>
            </div>
            <div className="text-3xl font-black text-white mt-4">{stats?.totalViews || 1420}</div>
            <p className="text-[10px] font-semibold text-slate-450 mt-1 font-mono uppercase">Platform telemetry count</p>
          </div>
        </div>

        {/* Dynamic bar charts and details list side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-slate-300">Hub Volume density across municipalities</h3>
            
            <div className="space-y-4 pt-2">
              {[
                { name: 'Bujumbura (Capital)', count: properties.filter(p => p.city.toLowerCase().includes('buju')).length },
                { name: 'Gitega (Administrative)', count: properties.filter(p => p.city.toLowerCase().includes('git')).length },
                { name: 'Rumonge (Beachfront)', count: properties.filter(p => p.city.toLowerCase().includes('rum')).length },
                { name: 'Other provinces combined', count: properties.filter(p => !['buju', 'git', 'rum'].some(x => p.city.toLowerCase().includes(x))).length }
              ].map((cityItem, innerIdx) => {
                const pct = properties.length > 0 ? (cityItem.count / properties.length) * 100 : 0;
                return (
                  <div key={innerIdx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-200">{cityItem.name}</span>
                      <span className="font-mono text-slate-405">{cityItem.count} listings ({Math.round(pct)}%)</span>
                    </div>
                    <div className="bg-slate-950 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-full rounded-full ${colors.primaryBg} transition-all`} style={{ width: `${Math.max(pct, 4)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-slate-300">Direct Command Tools</h3>
            <div className="space-y-3.5 pt-2">
              <button 
                onClick={() => setAdminAddOpen(true)}
                className={`w-full text-left p-3.5 rounded-xl border border-blue-900/35 flex items-center justify-between text-xs hover:scale-[1.02] transition-transform duration-200 cursor-pointer ${colors.lightBg}`}
              >
                <div>
                  <span className="block font-sans font-black text-slate-100">Direct Land Registration</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Write verified titles</span>
                </div>
                <Plus className="w-4 h-4 text-slate-300" />
              </button>

              <button 
                onClick={() => { setEditorPage(pages[0] || null); }}
                className="w-full text-left p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between text-xs hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
              >
                <div>
                  <span className="block font-sans font-black text-slate-300">Launch Homepage Designer</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Set modular blocks</span>
                </div>
                <Layout className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER DYNAMIC TAB: ALL PROPERTIES MANAGER
  // ==========================================
  function renderListingsView() {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850 pb-4">
          <div>
            <h2 className="text-lg font-black text-white">Ecosystem Master Inventory</h2>
            <p className="text-xs text-slate-400">Total authorized properties on IMMO BURUNDI</p>
          </div>
          <button 
            type="button"
            onClick={() => setAdminAddOpen(true)}
            className={`flex items-center text-xs font-bold uppercase tracking-wider p-2.5 rounded-xl shadow cursor-pointer text-white ${colors.primaryBg} ${colors.primaryHover}`}
          >
            <Plus className="w-4 h-4 mr-2" /> Direct Asset Registration
          </button>
        </div>

        {/* Search filter widget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title, owner name or location..."
              className="w-full bg-slate-900 border border-slate-850 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
              value={propertySearch}
              onChange={(e) => setPropertySearch(e.target.value)}
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>

          <select
            className="bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300"
            value={propertyFilterType}
            onChange={(e) => setPropertyFilterType(e.target.value)}
          >
            <option value="all">Display All Structural Categories</option>
            <option value="house">House Resourses</option>
            <option value="land">Land Parcels Only</option>
            <option value="commercial">Commercial Warehouses</option>
            <option value="rental">Apartment Leases</option>
            <option value="investment">Agricultural Acreages</option>
          </select>
        </div>

        {/* Results Catalogue table */}
        <div className="bg-slate-905 border border-slate-850 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-450 border-b border-slate-800 uppercase tracking-wider font-mono text-[9px]">
                <th className="px-4 py-3.5">Structural Asset Details</th>
                <th className="px-4 py-3.5">Hub Class Map</th>
                <th className="px-4 py-3.5">Ownership Declared</th>
                <th className="px-4 py-3.5">Compliance status</th>
                <th className="px-4 py-3.5 text-right">Cadastral Commands</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center font-mono text-slate-500">No matching holdings on catalog.</td>
                </tr>
              ) : (
                filteredListings.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-4 space-y-1">
                      <span className="font-bold text-slate-100 text-[12.5px] block">{property.title}</span>
                      <span className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1.5">
                        📍 {property.location}, {property.city}
                      </span>
                    </td>
                    <td className="px-4 py-4 space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500 font-mono bg-amber-500/10 px-2 py-0.5 rounded">
                        {property.type}
                      </span>
                      <span className="block text-slate-200 mt-1 font-extrabold">
                        {property.currency === 'USD' ? '$' : 'FBu'} {property.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <div className="text-[11.5px] font-bold text-slate-200">{property.ownerName}</div>
                      <div className="text-[10px] text-slate-450 font-mono">{property.ownerPhone}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-block w-fit px-2.5 py-0.5 rounded text-[9.5px] font-mono tracking-wider uppercase font-bold ${
                          property.status === 'approved' 
                            ? 'bg-emerald-900/50 text-emerald-400' 
                            : property.status === 'rejected' 
                            ? 'bg-red-900/50 text-red-400' 
                            : 'bg-yellow-905/30 text-yellow-500 border border-yellow-500/10'
                        }`}>
                          {property.status}
                        </span>
                        
                        <button
                          onClick={() => handleToggleVerification(property.id)}
                          className={`text-[9.5px] px-2 py-0.5 rounded border text-left flex items-center gap-1 w-fit cursor-pointer ${
                            property.verified 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {property.verified ? '✓ Verified Cadaster' : '✗ Unverified'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <button 
                        onClick={() => { setReviewingProperty(property); setRejectionReason(property.rejectionReason || ''); }}
                        className="py-1 px-2.5 rounded text-[10px] font-bold bg-slate-800 text-slate-250 hover:bg-slate-700 cursor-pointer"
                      >
                        Audit
                      </button>
                      <button 
                        onClick={() => handleDeleteProperty(property.id)}
                        className="py-1 px-2 text-red-400 hover:bg-red-950/20 rounded cursor-pointer"
                        title="Delete listing permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER DYNAMIC TAB: SUBMISSIONS AUDIT
  // ==========================================
  function renderSubmissionsView() {
    const pendingListings = properties.filter(p => p.status === 'pending');
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-xl font-black text-white">Client Submissions Auditing Check</h2>
          <p className="text-xs text-slate-400">Validate boundary records from Burundi owners before public market release</p>
        </div>

        {pendingListings.length === 0 ? (
          <div className="py-20 bg-slate-900 border border-slate-850 rounded-2xl text-center max-w-lg mx-auto space-y-3 p-8">
            <span className="text-3xl block">🎉</span>
            <h4 className="text-sm font-bold text-slate-200">No Pending Submissions Found</h4>
            <p className="text-xs text-slate-400">All submissions have been thoroughly reviewed and published.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingListings.map((property) => (
              <div key={property.id} className="bg-slate-900 border border-slate-850 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 font-extrabold uppercase">Boundary Audit Needed</span>
                    <span className="text-xs text-yellow-500 font-mono font-bold bg-yellow-500/10 px-2 py-0.5 rounded">
                      {property.type}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#f8fafc] leading-tight">{property.title}</h3>
                    <p className="text-[11.5px] text-slate-400 mt-1 font-mono">📍 {property.location}, {property.city}</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-350">
                      <span>Declared price:</span>
                      <strong className="text-slate-100">{property.currency} {property.price.toLocaleString()}</strong>
                    </div>
                    {property.area && (
                      <div className="flex justify-between items-center text-slate-350">
                        <span>Acreage size:</span>
                        <strong className="text-slate-200">{property.area}</strong>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-355">
                      <span>Submitter Name:</span>
                      <strong className="text-slate-100">{property.ownerName}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-355">
                      <span>Contact Info:</span>
                      <strong className="text-slate-200">{property.ownerPhone}</strong>
                    </div>
                  </div>

                  {property.description && (
                    <div className="text-[11px] text-slate-450 italic leading-relaxed border-l-2 border-slate-700 pl-3">
                      "{property.description.slice(0, 150)}..."
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => { setReviewingProperty(property); setRejectionReason(''); }}
                    className="col-span-2 bg-slate-800 hover:bg-slate-750 text-slate-100 font-bold p-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer text-center"
                  >
                    Open Reviewing Chamber
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER DYNAMIC TAB: PAGES BUILDER LIST
  // ==========================================
  function renderPagesCatalogView() {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850 pb-4">
          <div>
            <h2 className="text-lg font-black text-white">Dynamic Content Pages Builder</h2>
            <p className="text-xs text-slate-400">Manipulate page layouts with premium section-based builders</p>
          </div>
          <button 
            onClick={() => setAddPageOpen(true)}
            className={`flex items-center text-xs font-bold uppercase tracking-wider p-2.5 rounded-xl shadow cursor-pointer text-white ${colors.primaryBg} ${colors.primaryHover}`}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Dynamic Page
          </button>
        </div>

        {addPageOpen && (
          <form onSubmit={handleCreatePage} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 max-w-xl animate-in slide-in-from-top-2 duration-200">
            <h3 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">Construct New Page</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Page Admin Title</label>
                <input required type="text" placeholder="e.g. Services" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">URL Route Slug</label>
                <input required type="text" placeholder="e.g. services" value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAddPageOpen(false)} className="px-3 py-2 rounded bg-slate-800 text-slate-400 text-xs cursor-pointer">Cancel</button>
              <button type="submit" className={`px-4 py-2 rounded text-xs font-bold text-white cursor-pointer ${colors.primaryBg} ${colors.primaryHover}`}>Create Draft Page</button>
            </div>
          </form>
        )}

        {/* Dynamic Pages Catalog table list */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 font-mono text-[10px] text-slate-500 uppercase tracking-wider">Dynamic Pages Cadaster</div>
          <div className="divide-y divide-slate-850">
            {pages.map((p) => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-850/40 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-100">
                      {p.title.en}
                    </h3>
                    {p.isHomepage && <span className="text-[8.5px] font-mono uppercase bg-blue-500/10 text-blue-400 px-2 rounded-full">Homepage</span>}
                    {p.systemPage && <span className="text-[8.5px] font-mono uppercase bg-slate-800 text-slate-400 px-2 rounded-full">Predefined</span>}
                  </div>
                  <p className="text-xs text-slate-505 font-mono">Slug: <span className="text-slate-350">/{p.slug}</span> | Sections count: <span className="text-emerald-400 font-bold">{p.sections?.length || 0} layouts</span></p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Eye Preview button */}
                  <a 
                    href={p.slug === 'home' || p.isHomepage ? '/' : `/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center animate-pulse"
                    title="Open live page preview in new tab"
                  >
                    <Eye className="w-4 h-4" />
                  </a>

                  {/* Duplicate button */}
                  <button 
                    onClick={() => handleDuplicatePage(p)}
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                    title="Duplicate content page"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Edit Section Builder trigger */}
                  <button 
                    onClick={() => {
                      // cloning to prevent mutating main state directly before saving
                      const clone = JSON.parse(JSON.stringify(p));
                      if (!clone.sections) clone.sections = [];
                      setEditorPage(clone);
                      setActiveSectionId(null);
                    }}
                    className={`p-2 rounded-lg text-white font-bold transition-colors cursor-pointer flex items-center justify-center ${colors.primaryBg} ${colors.primaryHover}`}
                    title="Launch customized section builder"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete page */}
                  {!p.systemPage && (
                    <button 
                      onClick={() => handleDeletePage(p.id)}
                      className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      title="Permanently remove page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER DYNAMIC TAB: ADMIN MEDIA LIBRARY
  // ==========================================
  function renderMediaView() {
    const handleMediaUpload = async (file: File) => {
      setMediaUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await ibFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          // Refresh list
          const mdRes = await ibFetch('/api/media');
          if (mdRes.ok) {
            const mdData = await mdRes.json();
            setMediaFiles(mdData);
          }
          alert('Media file successfully uploaded!');
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to upload image');
        }
      } catch (e) {
        console.error('Upload error:', e);
        alert('Error uploading media file');
      } finally {
        setMediaUploading(false);
      }
    };

    const handleCopy = (url: string) => {
      navigator.clipboard.writeText(url);
      setMediaCopiedUrl(url);
      setTimeout(() => setMediaCopiedUrl(null), 2000);
    };

    const handleDeleteMedia = async (name: string) => {
      if (!confirm('Are you sure you want to permanently delete this media file from disk? This cannot be undone.')) return;
      try {
        const res = await ibFetch(`/api/media/${name}`, { method: 'DELETE' });
        if (res.ok) {
          // Refresh list
          const mdRes = await ibFetch('/api/media');
          if (mdRes.ok) {
            const mdData = await mdRes.json();
            setMediaFiles(mdData);
          }
        } else {
          alert('Failed to delete media asset');
        }
      } catch (e) {
        console.error(e);
        alert('Error deleting media asset');
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-500" />
              Dynamic Platform Assets &amp; Media Library
            </h2>
            <p className="text-xs text-slate-400">Upload, manage, and retrieve local attachments used in cover page layouts or properties.</p>
          </div>
          
          <div>
            <input 
              type="file" 
              ref={adminMediaInputRef} 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleMediaUpload(e.target.files[0]);
                }
              }}
              className="hidden" 
            />
            <button
              onClick={() => adminMediaInputRef.current?.click()}
              disabled={mediaUploading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 mx-auto text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-2 transition duration-250 shrink-0"
            >
              {mediaUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Storing Resource File...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Upload New Image Asset
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informative advice banner */}
        <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-normal font-sans">
            <span className="font-bold text-white block mb-0.5">Asset Utilization Protocol</span>
            Click <strong className="text-[#38bdf8]">Copy URL Path</strong> on any asset below to copy its system address. You can copy-paste this URL path into any Page Section (e.g. Banners, Hero blocks, Image-Text blocks) as well as Property Listing cover edits to show the custom uploaded image instantly.
          </div>
        </div>

        {/* Gallery collection */}
        {mediaFiles.length === 0 ? (
          <div className="py-20 text-center border shadow-sm border-dashed border-slate-800 rounded-3xl p-8 bg-slate-900/10">
            <Image className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">Archive is completely empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">
              There are no images detected inside the `/public/uploads` system register. Use the button above to upload attachment files from your device now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaFiles.map((file) => (
              <div key={file.url} className="bg-slate-900 border border-slate-805/60 hover:border-slate-700/60 transition duration-200 rounded-2xl p-3 flex flex-col space-y-3 justify-between">
                <div>
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-850 relative group">
                    <img 
                      src={file.url} 
                      alt={file.name} 
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center">
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 rounded-lg bg-slate-950 text-white hover:bg-slate-800 text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1.5 transition-colors absolute bottom-2 right-2 pointer-events-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Full View
                      </a>
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-0.5">
                    <div className="text-xs font-mono text-slate-200 font-bold truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>{file.size}</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-800/40">
                  <button
                    onClick={() => handleCopy(file.url)}
                    className="flex-1 py-2 rounded-lg text-[10px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-slate-950 text-[#38bdf8] hover:bg-slate-850 border border-[#38bdf8]/15"
                  >
                    {mediaCopiedUrl === file.url ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy URL Path
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteMedia(file.name)}
                    className="p-2 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-900/20 text-red-400 transition cursor-pointer flex items-center justify-center"
                    title="Delete media from disk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER DYNAMIC TAB: SIMULATED LOG TABLES
  // ==========================================
  function renderEmailsLogView() {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 font-sans">
        <div>
          <h2 className="text-lg font-black text-white">Consolidated Telegram &amp; Mail Logs</h2>
          <p className="text-xs text-slate-400">Simulated system outputs triggered by regulatory actions</p>
        </div>

        <div className="bg-slate-905 border border-slate-850 rounded-2xl overflow-hidden font-mono text-xs">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center text-slate-400 text-[10px]">
            <span>REGULATOR EMAIL LOGS STREAM</span>
            <span>TOTAL: {emails.length} SENT</span>
          </div>
          <div className="overflow-x-auto max-h-[500px] divide-y divide-slate-850 overflow-y-auto">
            {emails.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-xs">No email actions captured. Try auditing a pending client submission.</div>
            ) : (
              emails.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-900/30 font-mono text-slate-350 space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between gap-1 text-[11px]">
                    <span className="text-slate-100 font-bold">📧 TO: {log.recipientEmail} ({log.recipientName})</span>
                    <span className="text-slate-500 text-[10px]">{new Date(log.sentAt).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-400">
                    <span className="text-slate-500">SUBJECT:</span> <span className="text-white font-bold">{log.subject}</span>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-lg text-slate-400 whitespace-pre-wrap leading-normal text-[10.5px] border border-slate-850 max-h-32 overflow-y-auto">
                    {log.body}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500">
                    <span>STATUS:</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-widest">● {log.status}</span>
                    <span>•</span>
                    <span>TYPE:</span> 
                    <span className="text-slate-400 uppercase">{log.type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER DYNAMIC TAB: BRANDING SETTINGS
  // ==========================================
  function renderSettingsView() {
    return (
      <div className="max-w-2xl space-y-8 animate-in fade-in duration-300">
        <div>
          <h2 className="text-lg font-black text-white">Site-Wide Branding &amp; Palette Edits</h2>
          <p className="text-xs text-slate-400">Instantly change color schemas, corporate title headers, and copyright footers</p>
        </div>

        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-850 rounded-3xl p-6 space-y-6">
          {/* Theme grid schema */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-350 block font-bold">Select Global Theme Color</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(themesMap) as ThemeSchema[]).map((themeKey) => {
                const mapVal = themesMap[themeKey];
                const activeColorHex = themeKey === 'slate' ? 'Carbon' : themeKey === 'emerald' ? 'Burundi Green' : themeKey === 'indigo' ? 'Royal' : themeKey === 'rose' ? 'Crimson' : themeKey === 'amber' ? 'Amber' : themeKey === 'teal' ? 'Teal' : 'Blue';
                
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setThemeSchema(themeKey)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer hover:scale-[1.02] ${
                      themeSchema === themeKey 
                        ? `bg-slate-950 border-slate-400 text-white` 
                        : 'bg-slate-900 border-slate-800 text-slate-450'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`w-3 h-3 rounded-full ${mapVal.primaryBg}`} />
                      {themeSchema === themeKey && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[10px] font-bold block uppercase tracking-wide mt-2 font-mono">{activeColorHex}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Header / Footer input */}
          <div className="grid grid-cols-1 gap-5 text-xs text-slate-205">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5">Header Site Title Brand Name</label>
              <input
                required
                type="text"
                value={headerTitleInput}
                onChange={(e) => setHeaderTitleInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-white focus:outline-none focus:border-slate-500"
              />
              <span className="text-[9.5px] text-slate-500 mt-1 block">Customize the branding displayed on the main menu bar.</span>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5">Footer Copyright statement line</label>
              <input
                required
                type="text"
                value={footerCopyrightInput}
                onChange={(e) => setFooterCopyrightInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-white focus:outline-none focus:border-slate-500"
              />
              <span className="text-[9.5px] text-slate-500 mt-1 block">Specify localized compliance, legal terms lines, or corporation cadasters details.</span>
            </div>
          </div>

          <button 
            type="submit" 
            className={`w-full text-white font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-wider shadow-lg cursor-pointer ${colors.primaryBg} ${colors.primaryHover}`}
          >
            Deploy New Site Branding Settings
          </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // HIGH-TECH SECTION EDITOR WORKSPACE (DRAWER + IFRAME)
  // ==========================================
  function renderPageSectionsBuilder() {
    if (!editorPage) return null;

    const sections = editorPage.sections || [];
    const activeSection = sections.find(s => s.id === activeSectionId);

    // Section actions helpers
    const handleAddSection = (type: PageSection['type']) => {
      let defaultSettings = {};
      if (type === 'banner') {
        defaultSettings = { title: 'High-Tech Banner Heading', subtitle: 'Detailed visual subtitle copy goes here.', buttonText: 'Explore listings' };
      } else if (type === 'slideshow') {
        defaultSettings = { slides: [
          { image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', title: 'Grand Residence', desc: 'Secure listing validations' },
          { image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80', title: 'Acreage Boundaries Hub', desc: 'Independent legal auditing' }
        ]};
      } else if (type === 'image_text') {
        defaultSettings = { heading: 'Aesthetic Heading Space', body: 'This block establishes a glorious symmetrical layout.', alignment: 'left' };
      } else if (type === 'columns') {
        defaultSettings = { heading: 'Core Pillars of Burundi', subheading: 'Trusted boundary validation features', columns: [
          { icon: '💎', title: 'Premium Audits', desc: 'Title validation verification at registry' },
          { icon: '🔒', title: 'Direct Leases', desc: 'Coordinate signatures with brokers' }
        ]};
      } else if (type === 'richtext') {
        defaultSettings = { title: 'Compliance Reference Document', body: 'Provide detailed administrative copy notes.' };
      } else if (type === 'faqs') {
        defaultSettings = { heading: 'Common Questions Accordions', faqs: [
          { q: 'Is registration fully secure?', a: 'Yes. Verified using our public cadastral protocol.' }
        ]};
      } else if (type === 'testimonials') {
        defaultSettings = { heading: 'Client Endorsements', testimonials: [
          { text: 'Extremely quick validation turnarounds in Bujumbura!', author: 'Clara Kaneza', role: 'Investor' }
        ]};
      } else if (type === 'video') {
        defaultSettings = { heading: 'Accredited Drone Showcase', duration: '3 mins' };
      } else if (type === 'single_image') {
        defaultSettings = { imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', caption: 'High-fidelity property mockup' };
      } else if (type === 'heading') {
        defaultSettings = { title: 'Premium Content Heading', subtitle: 'Responsive block layouts' };
      } else if (type === 'text') {
        defaultSettings = { body: 'This block is dedicated to informative text. You can adjust background colors, sizes, alignment, and preview everything immediately.' };
      } else if (type === 'property_list') {
        defaultSettings = { heading: 'Premium Verified Properties', subheading: 'Explore active listings verified directly on the ground by IMMO BURUNDI in Bujumbura, Gitega and Rumonge.', limit: '3', typeFilter: 'all', showOnlyVerified: true };
      } else if (type === 'team_profile') {
        defaultSettings = { heading: 'Our Licensed Auditing Experts', subheading: 'Fully certified legal counsel & cadastral surveyor team coordinate validations', members: [
          { name: 'Sylvain Ndayishimiye', role: 'Chief Land Registrar Audit Officer', bio: '15+ years cross-referencing title deeds at Gitega national archives.', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80' },
          { name: 'Estella Kaneza', role: 'Sovereist Boundary Surveyor, GPS', bio: 'Senior geodesist confirming precise UTM and GPS coordinates on sight.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
          { name: 'Aimé Ndizeye', role: 'Executive Diaspora Coordinator', bio: 'Facilitates escrow and secure electronic leasing contracts for expats.', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' }
        ]};
      } else if (type === 'process_steps') {
        defaultSettings = { heading: 'Our Secure Title Verification Workflow', subheading: 'Every single listing on Immo Burundi goes through these rigorous security stages to eliminate fraud or double allocation', steps: [
          { number: '01', title: 'Document Submission', desc: 'Owners submit digital cadastral papers and national identity deeds.' },
          { number: '02', title: 'Registrar Check', desc: 'Our team verifies the historical registry list directly in Bujumbura.' },
          { number: '03', title: 'GPS Demarcation', desc: 'We physically measure coordinates on the ground to match official maps.' },
          { number: '04', title: 'Verified Stamp', desc: 'The listing is certified \'System Verified\' and published live.' }
        ]};
      } else if (type === 'stats_grid') {
        defaultSettings = { heading: 'Immo Burundi in numbers', subheading: 'Unrivaled real estate validation figures across Burundi since 2018', stats: [
          { label: 'Land Audits Done', value: '480+' },
          { label: 'BIF Capital Secured', value: '95.4 Billion' },
          { label: 'Diaspora Transactions', value: '120+' },
          { label: 'Zero Fraud Rate', value: '100%' }
        ]};
      } else if (type === 'contact_form_banner') {
        defaultSettings = { heading: 'Secure Your Free Advisory Consult Session', subheading: 'Speak to an official cadastral validation attorney live in Bujumbura or via Microsoft Teams. Enter your parameters to proceed.', buttonText: 'Schedule Free Call' };
      } else if (type === 'finances_calculator') {
        defaultSettings = { title: 'Diaspora Capital & Mortgage Estimator', subtitle: 'Leverage premium local metrics to forecast real estate yields, downpayments, and monthly bank interest charges seamlessly before committing.' };
      } else {
        defaultSettings = { title: 'High-Tech Block', subtitle: 'Dynamic templates content' };
      }

      const newSec: PageSection = {
        id: 'sec_' + Date.now(),
        type,
        backgroundColor: 'bg-white text-slate-800 border-none',
        headingColor: 'text-slate-900',
        textColor: 'text-slate-650',
        fontSize: 'md',
        settings: defaultSettings
      };

      const updatedPage = {
        ...editorPage,
        sections: [...sections, newSec]
      };
      setEditorPage(updatedPage);
      setActiveSectionId(newSec.id);
    };

    const handleUpdateActiveSectionSettings = (key: string, value: any) => {
      if (!activeSection) return;
      const updatedSections = sections.map(s => {
        if (s.id === activeSectionId) {
          return {
            ...s,
            settings: {
              ...s.settings,
              [key]: value
            }
          };
        }
        return s;
      });
      setEditorPage({ ...editorPage, sections: updatedSections });
    };

    const handleUpdateActiveSectionStyle = (styleKey: keyof PageSection, value: string) => {
      if (!activeSection) return;
      const updatedSections = sections.map(s => {
        if (s.id === activeSectionId) {
          return {
            ...s,
            [styleKey]: value
          };
        }
        return s;
      });
      setEditorPage({ ...editorPage, sections: updatedSections });
    };

    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sections.length) return;

      const swapSections = [...sections];
      const temp = swapSections[index];
      swapSections[index] = swapSections[targetIndex];
      swapSections[targetIndex] = temp;

      setEditorPage({ ...editorPage, sections: swapSections });
    };

    const handleDuplicateSection = (index: number) => {
      const source = sections[index];
      const copy: PageSection = {
        ...source,
        id: 'sec_' + Date.now() + '_' + Math.floor(Math.random() * 100),
        settings: JSON.parse(JSON.stringify(source.settings))
      };
      const duplicated = [...sections];
      duplicated.splice(index + 1, 0, copy);
      setEditorPage({ ...editorPage, sections: duplicated });
      setActiveSectionId(copy.id);
    };

    const handleDeleteSection = (index: number) => {
      const deletedSec = sections.filter((_, i) => i !== index);
      setEditorPage({ ...editorPage, sections: deletedSec });
      if (activeSectionId === sections[index]?.id) {
        setActiveSectionId(null);
      }
    };

    return (
      <div className="h-full flex flex-col space-y-4 p-4 lg:p-6 animate-in fade-in duration-300 overflow-hidden bg-slate-950 text-slate-100">
        
        {/* Builder Status Bar header */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl shrink-0">
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-[#38bdf8]" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black text-white">{editorPage.title.en}</h2>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">Route: /{editorPage.slug}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Customize design blocks, backgrounds, text colors and font sizes live.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditorPage(null)}
              className="px-4 py-2 rounded-xl bg-slate-820 hover:bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider cursor-pointer transition"
            >
              Back
            </button>
            <button
              onClick={() => handleSavePageLayout(editorPage)}
              className={`px-5 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow cursor-pointer ${colors.primaryBg} ${colors.primaryHover}`}
            >
              Save Section Layout
            </button>
          </div>
        </div>

        {/* Workspace content split view */}
        <div className="flex-grow flex flex-col lg:flex-row gap-4 overflow-hidden h-full">
          
          {/* Column 1: LEFT BUILDER SIDEBAR PANEL (CONTROLS & COMPONENT LIST) */}
          <div className="w-full lg:w-[330px] shrink-0 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden h-full shadow-lg">
            
            <div className="p-4 border-b border-slate-800 font-mono text-[10px] text-slate-450 uppercase tracking-widest font-extrabold flex items-center justify-between">
              <span>Section Elements Stack</span>
              <span className="text-slate-500">{sections.length} blocks used</span>
            </div>

            {/* Quick Templates Trigger bar */}
            <div className="p-3 bg-slate-950/40 border-b border-slate-800/60 space-y-1.5 shrink-0">
              <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold tracking-wider">🚀 Quick Page Presets (Replaces current)</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Applying this template will replace your current section layout cards. Proceed?")) {
                      const agencySections: PageSection[] = [
                        {
                          id: 'sec_1',
                          type: 'banner',
                          backgroundColor: 'bg-slate-950 text-slate-100 border-b border-slate-800',
                          headingColor: 'text-white',
                          textColor: 'text-slate-350',
                          fontSize: 'lg',
                          settings: {
                            title: 'Elite Real Estate & Cadastral Verification in Burundi',
                            subtitle: 'Connecting certified property owners, investors and diaspora clients with total legal authenticity on the ground.',
                            buttonText: 'Browse Vetted Listings',
                            imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80'
                          }
                        },
                        {
                          id: 'sec_2',
                          type: 'property_list',
                          backgroundColor: 'bg-white text-slate-800 border-none',
                          headingColor: 'text-slate-900',
                          textColor: 'text-slate-650',
                          fontSize: 'md',
                          settings: {
                            heading: 'Vetted & Registered Holdings',
                            subheading: 'Properties physically audited and certified directly at the Land Registry Office.',
                            limit: '3',
                            typeFilter: 'all',
                            showOnlyVerified: true
                          }
                        },
                        {
                          id: 'sec_3',
                          type: 'columns',
                          backgroundColor: 'bg-slate-50 text-slate-800 border-none',
                          headingColor: 'text-slate-900',
                          textColor: 'text-slate-650',
                          fontSize: 'md',
                          settings: {
                            heading: 'Institutional Guardrails & Transparency',
                            subheading: 'Why trust Burundi’s premier real estate catalog ecosystem',
                            columns: [
                              { icon: '🛡️', title: 'Registry Checks', desc: 'Every title deed is cross-referenced with Gitega land registry before listing approval.' },
                              { icon: '🗺️', title: 'GPS Cadastrals', desc: 'Official boundaries are confirmed with precise coordinate survey matches.' },
                              { icon: '🔒', title: 'Secure Escrow', desc: 'Service execution agreements with legal validation prevent double-allocation.' }
                            ]
                          }
                        },
                        {
                          id: 'sec_4',
                          type: 'testimonials',
                          backgroundColor: 'bg-white text-slate-800 border-none',
                          headingColor: 'text-slate-900',
                          textColor: 'text-slate-600',
                          fontSize: 'md',
                          settings: {
                            heading: 'What Vetted Investors Say',
                            testimonials: [
                              { text: 'IMMO BURUNDI saved us from a fraudulent double-allocation trap in Kiriri. The document audit is stellar!', author: 'Gérard Sindayigaya', role: 'Diaspora Investor' },
                              { text: 'Easiest rent broker experience in Kinindo! Signed electronically on a Sunday and got keys on Monday.', author: 'Clara Kaneza', role: 'Administrative Manager' }
                            ]
                          }
                        }
                      ];
                      setEditorPage({ ...editorPage, sections: agencySections });
                      setActiveSectionId('sec_1');
                    }
                  }}
                  className="p-1.5 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900/20 text-blue-300 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wide cursor-pointer transition text-center"
                >
                  🏢 Agency Home
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Applying this template will replace your current section layout cards. Proceed?")) {
                      const landSections: PageSection[] = [
                        {
                          id: 'sec_11',
                          type: 'slideshow',
                          backgroundColor: 'bg-slate-950 text-slate-100 border-none',
                          headingColor: 'text-white',
                          textColor: 'text-slate-200',
                          fontSize: 'md',
                          settings: {
                            slides: [
                              { image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', title: 'Acreages & Fenced Plots', desc: 'Discover high elevation investment parcels in Gitega.' },
                              { image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80', title: 'Lakefront Beach Plots', desc: 'Secure sandy shore developments on Lake Tanganyika, Rumonge.' }
                            ]
                          }
                        },
                        {
                          id: 'sec_12',
                          type: 'property_list',
                          backgroundColor: 'bg-white text-slate-800 border-none',
                          headingColor: 'text-slate-900',
                          textColor: 'text-slate-600',
                          fontSize: 'md',
                          settings: {
                            heading: 'Featured Land Holdings Only',
                            subheading: 'Premium verified plots with demarcations ready for construction.',
                            limit: '3',
                            typeFilter: 'land',
                            showOnlyVerified: false
                          }
                        },
                        {
                          id: 'sec_13',
                          type: 'richtext',
                          backgroundColor: 'bg-slate-50 text-slate-805 border-none',
                          headingColor: 'text-slate-900',
                          textColor: 'text-slate-650',
                          fontSize: 'md',
                          settings: {
                            title: 'Land Acquisition & Cadastral Procedures',
                            body: 'All investors seeking land holdings in Burundi are advised to review compliance files. IMMO BURUNDI guides buyers through official name registration, title deeds transfer, and tax compliance indices.'
                          }
                        },
                        {
                          id: 'sec_14',
                          type: 'brands',
                          backgroundColor: 'bg-white text-slate-800 border-none',
                          headingColor: 'text-slate-900',
                          textColor: 'text-slate-600',
                          fontSize: 'md',
                          settings: {
                            brands: ['CADASTRE DE GITEGA', 'OFFICE DES RECETTES (OBR)', 'COMMUNE DE RO HERO', 'REGIDESO']
                          }
                        }
                      ];
                      setEditorPage({ ...editorPage, sections: landSections });
                      setActiveSectionId('sec_11');
                    }
                  }}
                  className="p-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900/20 text-emerald-300 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wide cursor-pointer transition text-center"
                >
                  🗺️ Land Plots
                </button>
              </div>
            </div>

            {/* List of active sections stack */}
            <div className="p-4 flex-grow space-y-2.5 overflow-y-auto">
              {sections.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono leading-relaxed p-4 border border-dashed border-slate-800 rounded-2xl">
                  Catalog stack is empty. Click a block catalog item below to add your very first visual section.
                </div>
              ) : (
                sections.map((sec, sIdx) => (
                  <div 
                    key={sec.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                      activeSectionId === sec.id 
                        ? 'bg-slate-950 border-slate-450 text-white' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-350 hover:bg-slate-850/50'
                    }`}
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setActiveSectionId(sec.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono font-black text-slate-500">#{sIdx+1}</span>
                        <div className="text-left">
                          <span className="text-xs font-black block text-slate-100 uppercase font-mono">{sec.type}</span>
                          <span className="text-[9.5px] text-slate-400 capitalize">{sec.fontSize} size • {sec.backgroundColor.includes('bg-white') ? 'Light style' : 'Premium Dark'}</span>
                        </div>
                      </div>
                      
                      {/* Section Ordering triggers */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          disabled={sIdx === 0}
                          onClick={(e) => { e.stopPropagation(); handleMoveSection(sIdx, 'up'); }}
                          className="p-1 rounded bg-slate-950 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          disabled={sIdx === sections.length - 1}
                          onClick={(e) => { e.stopPropagation(); handleMoveSection(sIdx, 'down'); }}
                          className="p-1 rounded bg-slate-950 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Duplicate / Delete control helpers */}
                    <div className="flex justify-end border-t border-slate-950/50 pt-2 gap-1.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDuplicateSection(sIdx); }}
                        className="p-1 px-1.5 rounded text-[10px] font-mono bg-slate-900 shadow hover:text-blue-400 flex items-center gap-1 cursor-pointer font-bold"
                      >
                        Copy
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteSection(sIdx); }}
                        className="p-1 px-1.5 rounded text-[10px] font-mono bg-slate-900 shadow text-red-400 hover:bg-red-950/20 flex items-center gap-1 cursor-pointer font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Catalog list to add items */}
            <div className="p-4 border-t border-slate-800 space-y-3.5 shrink-0">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 block font-extrabold uppercase">Block Sections Catalog</span>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {(['banner', 'slideshow', 'image_text', 'columns', 'gallery', 'richtext', 'brands', 'faqs', 'testimonials', 'video', 'single_image', 'heading', 'text', 'property_list', 'team_profile', 'process_steps', 'stats_grid', 'contact_form_banner', 'finances_calculator'] as PageSection['type'][]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAddSection(type)}
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-350 border border-slate-850 rounded-xl text-[10.5px] uppercase font-mono font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" /> {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: MIDDLE BUILDER SIDEBAR PANEL (ACTIVE SECTION SETTINGS) */}
          <div className="w-full lg:w-[350px] shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col overflow-hidden h-full shadow-lg">
              <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center shrink-0">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">Element details</span>
                {activeSection && <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-extrabold">{activeSection.type}</span>}
              </div>

              {activeSection ? (
                <div className="space-y-4 text-xs text-slate-205 flex-grow overflow-y-auto pr-1">
                  
                  {/* Style Settings: Background, color, fonts */}
                  <div className="space-y-3 border-b border-slate-830 pb-4 mb-4">
                    <span className="text-[10px] font-mono text-slate-450 uppercase uppercase tracking-wider font-extrabold">Format &amp; Sizing styles</span>
                    
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase">Section Background</label>
                      <select 
                        value={activeSection.backgroundColor} 
                        onChange={(e) => handleUpdateActiveSectionStyle('backgroundColor', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200"
                      >
                        <option value="bg-white text-slate-800 border-none">Clean Alabaster (Light)</option>
                        <option value="bg-slate-50 text-slate-800 border-none">Soft Ash (Light)</option>
                        <option value="bg-slate-100 text-slate-800 border-none">Clean Gray (Light)</option>
                        <option value="bg-slate-900 text-white border-slate-800 border-b">Midnight Carbon (Dark)</option>
                        <option value="bg-slate-950 text-slate-100 border-b border-slate-800">Deep Cosmic (Dark)</option>
                        <option value="bg-blue-900 text-white">Strategic Royal (Dark Blue)</option>
                        <option value="bg-blue-50 text-blue-950">Ocean Breeze (Soft Blue)</option>
                        <option value="bg-emerald-900 text-white">Registry Green (Dark Emerald)</option>
                        <option value="bg-emerald-50 text-emerald-950">Mint Fresh (Soft Green)</option>
                        <option value="bg-amber-500 text-amber-950">Solar Amber (Orange accent)</option>
                        <option value="bg-amber-50 text-amber-950">Soft Cream (Tan layout)</option>
                        <option value="bg-indigo-950 text-indigo-50">Imperial Indigo (Dreamy Purple)</option>
                        <option value="bg-indigo-50 text-indigo-950">Grape Soda (Soft Purple)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Heading Color</label>
                        <select 
                          value={activeSection.headingColor} 
                          onChange={(e) => handleUpdateActiveSectionStyle('headingColor', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 uppercase font-mono tracking-wider text-[10px]"
                        >
                          <option value="text-slate-900">Charcoal Slate</option>
                          <option value="text-white">Pure White</option>
                          <option value="text-blue-600">Primary Accent</option>
                          <option value="text-amber-500">Amber Gold</option>
                          <option value="text-emerald-400">Green Emerald</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Paragraph font</label>
                        <select 
                          value={activeSection.fontSize} 
                          onChange={(e) => handleUpdateActiveSectionStyle('fontSize', e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 font-mono text-[10px]"
                        >
                          <option value="sm">Small (text-xs)</option>
                          <option value="md">Medium (text-sm)</option>
                          <option value="lg">Large (text-base)</option>
                          <option value="display">Display Hero (text-xl)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section Content inputs fields */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-slate-450 uppercase uppercase tracking-wider font-extrabold">Section parameters inputs</span>
                    {renderSectionFieldsInputs(activeSection, handleUpdateActiveSectionSettings)}
                  </div>

                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 font-mono text-[11px] leading-relaxed">
                  Select any section block in the left stack list to configure titles, text, image offsets, accordion details, FAQs, and sliders.
                </div>
              )}
            </div>

            {/* Column 3: RIGHT BUILDER PANEL (LIVE HIGH-FIDELITY PREVIEW MOCKUP CONTAINER) */}
            <div className="flex-grow bg-slate-950 border border-slate-850 rounded-3xl overflow-hidden flex flex-col relative h-full shadow-inner">
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex justify-between items-center shrink-0">
                <span className="text-[9px] font-mono text-slate-450 block uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Interactive Visual Prototype Canvas
                </span>
                <span className="text-[8.5px] font-mono text-slate-500 uppercase">Fully Symmetrical Preview</span>
              </div>

              {/* Styled Mock Page Viewport container */}
              <div className="flex-grow overflow-y-auto p-4 space-y-0 text-slate-800 font-sans select-none pointer-events-auto [&_*]:pointer-events-none">
                {sections.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3">
                    <Layout className="w-10 h-10 text-slate-700 animate-pulse" />
                    <h4 className="text-xs font-black text-slate-400 uppercase">Interactive Screen Empty</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Generate visual layouts by adding sections. They will render beautifully here in real time with exact layout alignments and parameters.</p>
                  </div>
                ) : (
                  sections.map((sec, innerIdx) => (
                    <div 
                      key={sec.id} 
                      className={`relative w-full text-slate-800 border ${
                        activeSectionId === sec.id 
                          ? 'border-slate-400 shadow-2xl scale-[0.99] z-10' 
                          : 'border-slate-850/40 hover:border-slate-700/40'
                      }`}
                    >
                      {/* Active Indicator helper label */}
                      {activeSectionId === sec.id && (
                        <span className="absolute top-2 left-2 z-30 bg-slate-900 border border-slate-700 text-white text-[8px] font-mono uppercase px-2 py-0.5 rounded-full font-black animate-bounce tracking-widest">
                          Active Selection: {sec.type}
                        </span>
                      )}
                      
                      {renderMockPreviewSectionContent(sec)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
    );
  }

  // Inputs rendering depending on section type
  function renderSectionFieldsInputs(sec: PageSection, updateFn: (k: string, v: any) => void) {
    const s = sec.settings || {};
    switch (sec.type) {
      case 'banner':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[9.5px] tracking-wider font-mono text-slate-450 uppercase mb-1">Banner Main Heading</label>
              <input type="text" value={s.title || ''} onChange={(e) => updateFn('title', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[9.5px] tracking-wider font-mono text-slate-455 uppercase mb-1">Subheading Copy text</label>
              <textarea rows={2.5} value={s.subtitle || ''} onChange={(e) => updateFn('subtitle', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none" />
            </div>
            <AdminImageUpload
              value={s.imageUrl || ''}
              onChange={(url) => updateFn('imageUrl', url)}
              label="Cover Image"
              placeholder="Upload cover banner image"
            />
            <div>
              <label className="block text-[9.5px] tracking-wider font-mono text-[#94a3b8] uppercase mb-1">Call to Action button text</label>
              <input type="text" value={s.buttonText || ''} onChange={(e) => updateFn('buttonText', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none" />
            </div>
          </div>
        );

      case 'image_text':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Layout heading title</label>
              <input type="text" value={s.heading || ''} onChange={(e) => updateFn('heading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Body descriptive copy</label>
              <textarea rows={4} value={s.body || ''} onChange={(e) => updateFn('body', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2" placeholder="Write paragraphs..." />
            </div>
            <AdminImageUpload
              value={s.imageUrl || ''}
              onChange={(url) => updateFn('imageUrl', url)}
              label="Aesthetic Image"
              placeholder="Upload illustration image"
            />
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Image Alignment</label>
              <select value={s.alignment || 'left'} onChange={(e) => updateFn('alignment', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200">
                <option value="left">Image on Left (Standard)</option>
                <option value="right">Image on Right (Reversed)</option>
              </select>
            </div>
          </div>
        );

      case 'richtext':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-455 uppercase mb-1">Document Section Header</label>
              <input type="text" value={s.title || ''} onChange={(e) => updateFn('title', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2" />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-slate-455 uppercase mb-1">Paragraph prose content</label>
              <textarea rows={6} value={s.body || ''} onChange={(e) => updateFn('body', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2" />
            </div>
          </div>
        );

      case 'faqs': {
        const faqs = s.faqs && s.faqs.length > 0 ? s.faqs : [
          { q: 'How does IMMO BURUNDI verify cadastral documents?', a: 'Our expert team visits the physical national registry of properties of Burundi, coordinating with officials to ensure authenticity.' },
          { q: 'What is the cost of full property promotion?', a: 'Standard packages start from 1% of the final verified lease price.' },
          { q: 'Can international buyers securely signed electronic contracts?', a: 'Yes! Immo Burundi offers bilingual digital signatures.' }
        ];
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Accordions Heading Title</label>
              <input type="text" value={s.heading || ''} onChange={(e) => updateFn('heading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Objections subtitle</label>
              <input type="text" value={s.subheading || ''} onChange={(e) => updateFn('subheading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Manage questions & answers</span>
              {faqs.map((faq: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 font-bold">Question #{idx + 1}</span>
                  <input 
                    type="text" 
                    value={faq.q || ''} 
                    onChange={(e) => {
                      const newFaqs = [...faqs];
                      newFaqs[idx] = { ...newFaqs[idx], q: e.target.value };
                      updateFn('faqs', newFaqs);
                    }} 
                    placeholder="Question Text"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200" 
                  />
                  <textarea 
                    rows={2} 
                    value={faq.a || ''} 
                    onChange={(e) => {
                      const newFaqs = [...faqs];
                      newFaqs[idx] = { ...newFaqs[idx], a: e.target.value };
                      updateFn('faqs', newFaqs);
                    }} 
                    placeholder="Answer Details"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200" 
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'testimonials': {
        const testimonials = s.testimonials && s.testimonials.length > 0 ? s.testimonials : [
          { text: 'IMMO BURUNDI saved us from a fraudulent double-allocation trap in Kiriri. The document audit is stellar!', author: 'Gérard Sindayigaya', role: 'Diaspora Investor' },
          { text: 'Easiest rent broker experience in Kinindo! Signed electronically on a Sunday and got keys on Monday.', author: 'Clara Kaneza', role: 'Administrative Manager' }
        ];
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Slider review header</label>
              <input type="text" value={s.heading || ''} onChange={(e) => updateFn('heading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Edit Customer Reviews</span>
              {testimonials.map((test: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[9px] font-mono text-slate-555 font-bold">Review #{idx + 1}</span>
                  <textarea 
                    rows={2.5} 
                    value={test.text || ''} 
                    onChange={(e) => {
                      const newTests = [...testimonials];
                      newTests[idx] = { ...newTests[idx], text: e.target.value };
                      updateFn('testimonials', newTests);
                    }} 
                    placeholder="Feedback text"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200" 
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input 
                      type="text" 
                      value={test.author || ''} 
                      onChange={(e) => {
                        const newTests = [...testimonials];
                        newTests[idx] = { ...newTests[idx], author: e.target.value };
                        updateFn('testimonials', newTests);
                      }} 
                      placeholder="Name"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200" 
                    />
                    <input 
                      type="text" 
                      value={test.role || ''} 
                      onChange={(e) => {
                        const newTests = [...testimonials];
                        newTests[idx] = { ...newTests[idx], role: e.target.value };
                        updateFn('testimonials', newTests);
                      }} 
                      placeholder="Role"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'slideshow': {
        const slides = s.slides && s.slides.length > 0 ? s.slides : [
          { image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80', title: 'Luxury Living', desc: 'Secure properties in Bujumbura' },
          { image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', title: 'Prime Urban Portfolios', desc: 'Active commercial buildings in Gitega' }
        ];
        return (
          <div className="space-y-4">
            <span className="text-[9.5px] font-mono text-slate-400 uppercase block font-bold">Slideshow Showcase Items</span>
            {slides.map((slide: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-855 space-y-2">
                <span className="text-[9px] font-mono text-slate-500 font-bold">Slide #{idx + 1}</span>
                <input 
                  type="text" 
                  value={slide.title || ''} 
                  onChange={(e) => {
                    const newSlides = [...slides];
                    newSlides[idx] = { ...newSlides[idx], title: e.target.value };
                    updateFn('slides', newSlides);
                  }} 
                  placeholder="Slide Title text"
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-sans" 
                />
                <input 
                  type="text" 
                  value={slide.desc || ''} 
                  onChange={(e) => {
                    const newSlides = [...slides];
                    newSlides[idx] = { ...newSlides[idx], desc: e.target.value };
                    updateFn('slides', newSlides);
                  }} 
                  placeholder="Slide description caption"
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-sans" 
                />
                <AdminImageUpload
                  value={slide.image || ''}
                  onChange={(url) => {
                    const newSlides = [...slides];
                    newSlides[idx] = { ...newSlides[idx], image: url };
                    updateFn('slides', newSlides);
                  }}
                  label="Slide Background"
                  placeholder="Paste URL or upload image"
                />
              </div>
            ))}
          </div>
        );
      }

      case 'columns': {
        const cols = s.columns && s.columns.length > 0 ? s.columns : [
          { icon: '🛡️', title: 'Premium Verification', desc: 'Independent land registry title checks before transaction.' },
          { icon: '⚡', title: 'Instant Brokerage', desc: 'Secure real estate connections in Bujumbura, Gitega and beyond.' },
          { icon: '📂', title: 'Frictionless Contracts', desc: 'Electronically signed service agreement with legal standards.' }
        ];
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Columns Section Heading</label>
              <input type="text" value={s.heading || ''} onChange={(e) => updateFn('heading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Subheading explanation</label>
              <input type="text" value={s.subheading || ''} onChange={(e) => updateFn('subheading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>

            {/* Grid Layout Controls for Desktop, Tablet, and Mobile */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Responsive Column Controls</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[8.5px] font-mono text-slate-400 uppercase mb-1">Mobile View</label>
                  <select 
                    value={s.colsMobile || '1'} 
                    onChange={(e) => updateFn('colsMobile', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
                  >
                    <option value="1">1 Col</option>
                    <option value="2">2 Cols</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8.5px] font-mono text-slate-400 uppercase mb-1">Tablet View</label>
                  <select 
                    value={s.colsTablet || '2'} 
                    onChange={(e) => updateFn('colsTablet', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
                  >
                    <option value="1">1 Col</option>
                    <option value="2">2 Cols</option>
                    <option value="3">3 Cols</option>
                    <option value="4">4 Cols</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8.5px] font-mono text-slate-400 uppercase mb-1">Desktop View</label>
                  <select 
                    value={s.colsDesktop || '3'} 
                    onChange={(e) => updateFn('colsDesktop', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
                  >
                    <option value="1">1 Col</option>
                    <option value="2">2 Cols</option>
                    <option value="3">3 Cols</option>
                    <option value="4">4 Cols</option>
                    <option value="5">5 Cols</option>
                    <option value="6">6 Cols</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Edit Column Items ({cols.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    const newCols = [...cols, { icon: '📌', title: 'New Option', desc: 'Describe this feature detail.' }];
                    updateFn('columns', newCols);
                  }}
                  className="px-2 py-1 bg-blue-900 border border-blue-800 text-slate-200 hover:bg-blue-850 rounded text-[9px] font-bold font-mono uppercase tracking-wider cursor-pointer transition-colors"
                >
                  ＋ Add Column Item
                </button>
              </div>

              {cols.map((col: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2 relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-500 font-bold">Column Item #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newCols = cols.filter((_: any, i: number) => i !== idx);
                        updateFn('columns', newCols);
                      }}
                      className="text-[9.5px] text-red-400 hover:text-red-300 font-semibold font-mono tracking-wider cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      value={col.icon || ''} 
                      onChange={(e) => {
                        const newCols = [...cols];
                        newCols[idx] = { ...newCols[idx], icon: e.target.value };
                        updateFn('columns', newCols);
                      }} 
                      placeholder="Icon"
                      className="w-10 bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-center text-slate-200 font-mono" 
                    />
                    <input 
                      type="text" 
                      value={col.title || ''} 
                      onChange={(e) => {
                        const newCols = [...cols];
                        newCols[idx] = { ...newCols[idx], title: e.target.value };
                        updateFn('columns', newCols);
                      }} 
                      placeholder="Title"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-semibold" 
                    />
                  </div>
                  <textarea 
                    rows={2} 
                    value={col.desc || ''} 
                    onChange={(e) => {
                      const newCols = [...cols];
                      newCols[idx] = { ...newCols[idx], desc: e.target.value };
                      updateFn('columns', newCols);
                    }} 
                    placeholder="Short description text"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 leading-normal" 
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'gallery': {
        const images = s.images && s.images.length > 0 ? s.images : [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80'
        ];
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Gallery heading title</label>
              <input type="text" value={s.heading || ''} onChange={(e) => updateFn('heading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Gallery subheading</label>
              <input type="text" value={s.subheading || ''} onChange={(e) => updateFn('subheading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Image Grid (4 pictures)</span>
              {images.map((img: string, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 font-bold">Image #{idx + 1}</span>
                  <AdminImageUpload
                    value={img}
                    onChange={(url) => {
                      const newImages = [...images];
                      newImages[idx] = url;
                      updateFn('images', newImages);
                    }}
                    placeholder={`Upload gallery image #${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'brands': {
        const brandNames = s.brands && s.brands.length > 0 ? s.brands : ['BANQUE DE LA REPUBLIQUE', 'REGIDESO', 'MINISTERE DES FINANCES', 'OBR BURUNDI', 'CADASTRE NATIONAL'];
        return (
          <div className="space-y-3">
            <span className="text-[9.5px] font-mono text-slate-400 uppercase block font-bold font-mono">Partner Brand Names</span>
            <div className="space-y-2">
              {brandNames.map((brand: string, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-[9px] font-mono text-slate-500 font-bold">#{idx + 1}</span>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => {
                      const newBrands = [...brandNames];
                      newBrands[idx] = e.target.value;
                      updateFn('brands', newBrands);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded p-1.5 text-xs text-slate-200 font-sans"
                    placeholder="Partner name"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'heading':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-455 uppercase mb-1">Bold Display Title text</label>
              <input type="text" value={s.title || ''} onChange={(e) => updateFn('title', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2" />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-slate-455 uppercase mb-1">Centered alignment subtitle text</label>
              <input type="text" value={s.subtitle || ''} onChange={(e) => updateFn('subtitle', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2" />
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-455 uppercase mb-1">Segment explanatory text</label>
              <textarea rows={6} value={s.body || ''} onChange={(e) => updateFn('body', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2" />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-455 uppercase mb-1">Video Header Title</label>
              <input type="text" value={s.heading || ''} onChange={(e) => updateFn('heading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2" />
            </div>
            <AdminImageUpload
              value={s.coverImage || ''}
              onChange={(url) => updateFn('coverImage', url)}
              label="Poster Cover Image"
              placeholder="Upload poster cover image"
            />
            <div>
              <label className="block text-[9.5px] font-mono text-slate-455 uppercase mb-1">Video Duration Tag</label>
              <input type="text" value={s.duration || ''} onChange={(e) => updateFn('duration', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2" />
            </div>
          </div>
        );

      case 'single_image':
        return (
          <div className="space-y-3">
            <AdminImageUpload
              value={s.imageUrl || ''}
              onChange={(url) => updateFn('imageUrl', url)}
              label="High-Res Image"
              placeholder="Upload single photography/image"
            />
            <div>
              <label className="block text-[9.5px] font-mono text-slate-455 uppercase mb-1">Border label caption text</label>
              <input type="text" value={s.caption || ''} onChange={(e) => updateFn('caption', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2" />
            </div>
          </div>
        );

      case 'property_list':
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[9.5px] tracking-wider font-mono text-slate-450 uppercase mb-1">Listings Section Heading</label>
              <input type="text" value={s.heading || ''} onChange={(e) => updateFn('heading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none text-slate-200" />
            </div>
            <div>
              <label className="block text-[9.5px] tracking-wider font-mono text-slate-455 uppercase mb-1">Subheading Copy text</label>
              <textarea rows={2.5} value={s.subheading || ''} onChange={(e) => updateFn('subheading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 focus:outline-none text-slate-200" />
            </div>
            <div>
              <label className="block text-[9.5px] tracking-wider font-mono text-slate-455 uppercase mb-1">Property Limit to Show</label>
              <select value={s.limit || '3'} onChange={(e) => updateFn('limit', e.target.value)} className="w-full bg-slate-950 border border-slate-855 rounded p-2 text-slate-200">
                <option value="3">3 properties</option>
                <option value="6">6 properties</option>
                <option value="9">9 properties</option>
                <option value="12">12 properties</option>
                <option value="18">18 properties</option>
              </select>
            </div>
            <div>
              <label className="block text-[9.5px] tracking-wider font-mono text-slate-455 uppercase mb-1">Filter by Property Type</label>
              <select value={s.typeFilter || 'all'} onChange={(e) => updateFn('typeFilter', e.target.value)} className="w-full bg-slate-950 border border-slate-855 rounded p-2 text-slate-200">
                <option value="all">All Types</option>
                <option value="house">House/Villa</option>
                <option value="land">Land/Plot</option>
                <option value="commercial">Commercial Space</option>
                <option value="rental">Rental Property</option>
                <option value="investment">Investment Land</option>
              </select>
            </div>
            <div>
              <label className="block text-[9.5px] tracking-wider font-mono text-[#94a3b8] uppercase mb-1">Verification Status Filter</label>
              <select value={s.showOnlyVerified === false ? 'all' : 'verified'} onChange={(e) => updateFn('showOnlyVerified', e.target.value === 'verified')} className="w-full bg-slate-950 border border-slate-855 rounded p-2 text-slate-200">
                <option value="verified">Fully Verified Properties Only (Recommended)</option>
                <option value="all">All Approved Properties (Self-Reported + Verified)</option>
              </select>
            </div>
          </div>
        );

      case 'team_profile': {
        const members = s.members && s.members.length > 0 ? s.members : [
          { name: 'Sylvain Ndayishimiye', role: 'Chief Registrar Audit Officer', bio: '15+ years cross-referencing title deeds at Gitega archives.', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80' },
          { name: 'Estella Kaneza', role: 'Sovereist Boundary Surveyor, GPS', bio: 'Senior geodesist confirming precise UTM and GPS coordinates.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
          { name: 'Aimé Ndizeye', role: 'Executive Diaspora Coordinator', bio: 'Facilitates escrow and secure electronic leasing contracts.', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' }
        ];
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Team Section Heading</label>
              <input type="text" value={s.heading || ''} onChange={(e) => updateFn('heading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Subheading Copy</label>
              <input type="text" value={s.subheading || ''} onChange={(e) => updateFn('subheading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold font-mono">Team Members (3 Persons)</span>
              {members.map((member: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 font-bold">Member #{idx + 1}</span>
                  <input 
                    type="text" 
                    value={member.name || ''} 
                    onChange={(e) => {
                      const newMembers = [...members];
                      newMembers[idx] = { ...newMembers[idx], name: e.target.value };
                      updateFn('members', newMembers);
                    }} 
                    placeholder="Name"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-sans" 
                  />
                  <input 
                    type="text" 
                    value={member.role || ''} 
                    onChange={(e) => {
                      const newMembers = [...members];
                      newMembers[idx] = { ...newMembers[idx], role: e.target.value };
                      updateFn('members', newMembers);
                    }} 
                    placeholder="Professional Title/Role"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-sans" 
                  />
                  <textarea 
                    rows={2} 
                    value={member.bio || ''} 
                    onChange={(e) => {
                      const newMembers = [...members];
                      newMembers[idx] = { ...newMembers[idx], bio: e.target.value };
                      updateFn('members', newMembers);
                    }} 
                    placeholder="Short biography"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-sans" 
                  />
                  <AdminImageUpload
                    value={member.avatar || ''}
                    onChange={(url) => {
                      const newMembers = [...members];
                      newMembers[idx] = { ...newMembers[idx], avatar: url };
                      updateFn('members', newMembers);
                    }}
                    label="Avatar photo URL"
                    placeholder="Upload avatar image"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      case 'process_steps': {
        const steps = s.steps && s.steps.length > 0 ? s.steps : [
          { number: '01', title: 'Document Submission', desc: 'Owners submit digital cadastral papers and national identity deeds.' },
          { number: '02', title: 'Registrar Check', desc: 'Our team verifies the historical registry list directly in Bujumbura.' },
          { number: '03', title: 'GPS Demarcation', desc: 'We physically measure coordinates on the ground to match official maps.' },
          { number: '04', title: 'Verified Stamp', desc: 'The listing is certified \'System Verified\' and published live.' }
        ];
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Process Section Heading</label>
              <input type="text" value={s.heading || ''} onChange={(e) => updateFn('heading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Subheading Explanation</label>
              <input type="text" value={s.subheading || ''} onChange={(e) => updateFn('subheading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold font-mono">Process Steps (4 Milestones)</span>
              {steps.map((step: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-855 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 font-bold">Step Step #{idx + 1}</span>
                  <div className="flex gap-1.5 font-mono">
                    <input 
                      type="text" 
                      value={step.number || `0${idx + 1}`} 
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[idx] = { ...newSteps[idx], number: e.target.value };
                        updateFn('steps', newSteps);
                      }} 
                      placeholder="Step tag"
                      className="w-12 bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-center text-slate-200" 
                    />
                    <input 
                      type="text" 
                      value={step.title || ''} 
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[idx] = { ...newSteps[idx], title: e.target.value };
                        updateFn('steps', newSteps);
                      }} 
                      placeholder="Milestone Title"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200" 
                    />
                  </div>
                  <textarea 
                    rows={2} 
                    value={step.desc || ''} 
                    onChange={(e) => {
                      const newSteps = [...steps];
                      newSteps[idx] = { ...newSteps[idx], desc: e.target.value };
                      updateFn('steps', newSteps);
                    }} 
                    placeholder="Short description"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200" 
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'stats_grid': {
        const stats = s.stats && s.stats.length > 0 ? s.stats : [
          { label: 'Land Audits Done', value: '480+' },
          { label: 'BIF Capital Secured', value: '95.4 Billion' },
          { label: 'Diaspora Transactions', value: '120+' },
          { label: 'Zero Fraud Rate', value: '100%' }
        ];
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Stats Section Heading</label>
              <input type="text" value={s.heading || ''} onChange={(e) => updateFn('heading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Subheading Copy</label>
              <input type="text" value={s.subheading || ''} onChange={(e) => updateFn('subheading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold font-mono">Metrics Grid (4 values)</span>
              {stats.map((stat: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-855 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 font-bold font-mono">Stat #{idx + 1}</span>
                  <div className="grid grid-cols-2 gap-1.5 font-mono">
                    <input 
                      type="text" 
                      value={stat.value || ''} 
                      onChange={(e) => {
                        const newStats = [...stats];
                        newStats[idx] = { ...newStats[idx], value: e.target.value };
                        updateFn('stats', newStats);
                      }} 
                      placeholder="e.g. 480+"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200" 
                    />
                    <input 
                      type="text" 
                      value={stat.label || ''} 
                      onChange={(e) => {
                        const newStats = [...stats];
                        newStats[idx] = { ...newStats[idx], label: e.target.value };
                        updateFn('stats', newStats);
                      }} 
                      placeholder="e.g. Land Audits"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'contact_form_banner': {
        return (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Advisory Consultation Heading</label>
              <input type="text" value={s.heading || ''} onChange={(e) => updateFn('heading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Subtitle guidance instructions</label>
              <textarea rows={3} value={s.subheading || ''} onChange={(e) => updateFn('subheading', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-slate-450 uppercase mb-1">Button Call-To-Action Text</label>
              <input type="text" value={s.buttonText || ''} onChange={(e) => updateFn('buttonText', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-200" />
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="text-[10px] text-slate-500 font-mono leading-normal">
            This module has smart mock settings automatically preconfigured to keep your page visuals extremely stunning.
          </div>
        );
    }
  }

  // Render Visual Mini-Prototype for builder right workspace canvas
  function renderMockPreviewSectionContent(sec: PageSection) {
    const bg = sec.backgroundColor || 'bg-white text-slate-800';
    const s = sec.settings || {};
    const fs = sec.fontSize;
    const fontClass = fs === 'sm' ? 'text-xs' : fs === 'lg' ? 'text-base' : fs === 'display' ? 'text-lg font-extrabold' : 'text-sm font-normal';

    return (
      <div className={`p-6 text-center ${bg} ${fontClass} leading-relaxed rounded-md space-y-2`}>
        <div className="font-sans font-black flex items-center justify-center gap-1">
          <span className="text-[10px] font-mono tracking-widest text-[#a855f7] border border-[#a855f7]/25 px-1.5 py-0.5 rounded capitalize font-bold leading-none shrink-0 mb-1">
            Visual block: {sec.type === 'image_text' ? 'Image & Text' : sec.type}
          </span>
        </div>
        
        {sec.type === 'banner' && (
          <div className="space-y-1">
            <h4 className="font-extrabold max-w-sm mx-auto leading-none text-slate-900 border-none pt-1">{s.title || 'Responsive Banner Heading'}</h4>
            <p className="text-[11px] opacity-75 max-w-xs mx-auto leading-normal">{s.subtitle || 'Custom subtitle lines...'}</p>
            {s.buttonText && <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded text-[9px] uppercase tracking-wide font-black mt-2">{s.buttonText}</span>}
          </div>
        )}

        {sec.type === 'image_text' && (
          <div className="grid grid-cols-2 gap-3 items-center text-left py-2">
            <div className={`space-y-1 ${s.alignment === 'right' ? 'order-2' : ''}`}>
              <h5 className="font-bold text-xs leading-none text-slate-900">{s.heading || 'Aesthetic Title'}</h5>
              <p className="text-[10px] opacity-75 leading-tight">{s.body || 'Paragraph copy blocks...'}</p>
            </div>
            <div className={`bg-slate-200 rounded h-14 overflow-hidden relative flex items-center justify-center ${s.alignment === 'right' ? 'order-1' : ''}`}>
              <img src={s.imageUrl || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          </div>
        )}

        {sec.type === 'columns' && (
          <div className="space-y-2">
            <h4 className="font-bold text-xs">{s.heading || 'Symmetrical columns title'}</h4>
            <div className="grid grid-cols-3 gap-2 text-center pt-1 text-[9px]">
              <div className="bg-slate-500/10 p-2 rounded">
                <span>💎</span>
                <p className="font-bold mt-1 leading-none text-slate-900 text-[10px]">Verification</p>
              </div>
              <div className="bg-slate-500/10 p-2 rounded">
                <span>⚡</span>
                <p className="font-bold mt-1 leading-none text-slate-900 text-[10px]">Registry</p>
              </div>
              <div className="bg-slate-500/10 p-2 rounded">
                <span>📁</span>
                <p className="font-bold mt-1 leading-none text-slate-900 text-[10px]">Audit</p>
              </div>
            </div>
          </div>
        )}

        {sec.type === 'slideshow' && (
          <div className="rounded bg-cover bg-center h-20 relative flex flex-col justify-center text-white" style={{ backgroundImage: `url(${(s.slides && s.slides[0]?.image) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'})` }}>
            <div className="absolute inset-0 bg-black/60 rounded" />
            <div className="relative z-10 p-2">
              <h5 className="font-bold text-[11px] leading-none">{(s.slides && s.slides[0]?.title) || 'Luxury Living'}</h5>
              <p className="text-[8px] opacity-85 leading-none mt-1">{(s.slides && s.slides[0]?.desc) || 'Multi-slide carousel banner support'}</p>
            </div>
          </div>
        )}

        {sec.type === 'gallery' && (
          <div className="grid grid-cols-4 gap-1 pt-1.5">
            {(s.images && s.images.length > 0 ? s.images : [
              'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=150&q=80',
              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=150&q=80',
              'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=150&q=80',
              'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=150&q=80'
            ]).slice(0, 4).map((imgUrl: string, idx: number) => (
              <div key={idx} className="bg-slate-200 h-10 rounded overflow-hidden">
                <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        )}

        {sec.type === 'richtext' && (
          <div className="space-y-1 py-1 max-w-sm mx-auto text-left">
            <h5 className="font-bold text-[11.5px] border-b pb-1 text-slate-950 leading-tight">{s.title || 'Compliance details'}</h5>
            <p className="text-[10px] opacity-70 leading-normal font-sans pr-1 line-clamp-2">{s.body || 'This provides high quality rich text layout models...'}</p>
          </div>
        )}

        {sec.type === 'brands' && (
          <div className="py-1 flex justify-center flex-wrap gap-2 text-[9px] font-mono tracking-wider text-slate-500 uppercase font-bold">
            {(s.brands && s.brands.length > 0 ? s.brands : ['BANQUE DE LA REPUBLIQUE', 'REGIDESO', 'MINISTERE DES FINANCES', 'OBR BURUNDI']).slice(0, 4).map((b: string, idx: number) => (
              <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">🏢 {b}</span>
            ))}
          </div>
        )}

        {sec.type === 'faqs' && (
          <div className="space-y-1.5 text-left max-w-xs mx-auto py-1.5">
            <span className="text-[10px] font-bold text-slate-800 tracking-tight block">❓ {s.heading || 'Frequently Asked Accordions'}</span>
            <div className="p-2 bg-slate-50 border rounded text-[9.5px] text-slate-600 leading-tight font-sans space-y-1">
              {(s.faqs && s.faqs.length > 0 ? s.faqs : [{ q: 'How does IMMO BURUNDI audit listings securely?' }]).slice(0, 2).map((item: any, idx: number) => (
                <div key={idx} className="truncate font-medium text-slate-700">Q: {item.q}</div>
              ))}
            </div>
          </div>
        )}

        {sec.type === 'testimonials' && (
          <div className="bg-slate-50 p-2.5 rounded-xl text-left max-w-xs mx-auto space-y-1 border">
            <div className="flex gap-0.5 text-amber-500 text-[8px] leading-none">★★★★★</div>
            <p className="text-[10px] italic leading-tight text-slate-650 font-sans line-clamp-2">
              "{(s.testimonials && s.testimonials.length > 0 ? s.testimonials[0].text : 'Saved us from double-allocation trap!')}"
            </p>
            <span className="text-[8.5px] font-bold text-slate-800 block">
              - {(s.testimonials && s.testimonials.length > 0 ? s.testimonials[0].author : 'Clara Kaneza')}
            </span>
          </div>
        )}

        {sec.type === 'video' && (
          <div className="bg-slate-900 hover:opacity-95 text-white h-20 rounded-xl relative flex items-center justify-center cursor-pointer">
            <img src={s.coverImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80'} className="absolute inset-0 w-full h-full object-cover opacity-40 rounded-xl" referrerPolicy="no-referrer" />
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center relative z-10">
              <Play className="w-3 h-3 fill-white translate-x-0.5" />
            </div>
            <span className="absolute bottom-1 right-2 text-[8px] font-mono opacity-80 uppercase leading-none">📽️ {s.duration || '3 mins'}</span>
          </div>
        )}

        {sec.type === 'single_image' && (
          <div className="space-y-1.5 font-sans">
            <div className="rounded overflow-hidden h-20 border">
              <img src={s.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            {s.caption && <span className="text-[9px] font-mono text-slate-450 block">{s.caption}</span>}
          </div>
        )}

        {sec.type === 'heading' && (
          <div className="py-2">
            <h4 className="font-extrabold text-sm text-slate-900 border-none">{s.title || 'Display Centered Typography'}</h4>
            {s.subtitle && <p className="text-[10.5px] text-slate-500 mt-1">{s.subtitle}</p>}
          </div>
        )}

        {sec.type === 'text' && (
          <p className="text-slate-650 text-[10.5px] text-left leading-normal font-sans px-2 mx-auto max-w-sm">
            {s.body || 'Provide detailed layout information paragraph segments...'}
          </p>
        )}

        {sec.type === 'property_list' && (
          <div className="space-y-2 text-left py-1.5 border-t border-b border-slate-100 mt-2">
            <h4 className="font-extrabold text-xs text-slate-950 border-none pb-0 text-center">{s.heading || 'Featured Properties Catalog'}</h4>
            <p className="text-[9.5px] opacity-70 leading-tight text-center max-w-xs mx-auto">{s.subheading || 'Listing widgets filtered from the database'}</p>
            <div className="grid grid-cols-3 gap-2 text-center pt-2 text-[8px] font-mono">
              <div className="bg-slate-100 border border-slate-200/50 p-1.5 rounded text-slate-800">
                <span>🏡 Villa</span>
                <p className="font-bold font-sans text-[7.5px] truncate text-slate-900 mt-0.5 leading-none">Kiriri Hills</p>
              </div>
              <div className="bg-slate-100 border border-slate-200/50 p-1.5 rounded text-slate-800">
                <span>🏢 Office</span>
                <p className="font-bold font-sans text-[7.5px] truncate text-slate-900 mt-0.5 leading-none">Rohero I</p>
              </div>
              <div className="bg-slate-100 border border-slate-200/50 p-1.5 rounded text-slate-800">
                <span>🗺️ Land</span>
                <p className="font-bold font-sans text-[7.5px] truncate text-slate-900 mt-0.5 leading-none">Rumonge</p>
              </div>
            </div>
            <div className="text-[8.5px] text-blue-600 font-mono text-center font-bold mt-1 tracking-wide">
              Show Limit: {s.limit || '3'} • Filter: {s.typeFilter || 'all'} • Verified Only: {s.showOnlyVerified !== false ? 'Yes' : 'No'}
            </div>
          </div>
        )}

        {sec.type === 'team_profile' && (
          <div className="space-y-2.5 text-center mt-2 py-1.5 border-t border-b border-slate-100">
            <h4 className="font-extrabold text-xs text-slate-900 leading-tight">{s.heading || 'Our Licensed Auditing Experts'}</h4>
            <p className="text-[9px] opacity-70 leading-none">{s.subheading || 'Certified surveyor team validations'}</p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(s.members || [
                { name: 'Sylvain Ndayishimiye', role: 'Chief Audit Officer' },
                { name: 'Estella Kaneza', role: 'Sovereist GPS Geodesist' },
                { name: 'Aimé Ndizeye', role: 'Diaspora Coordinator' }
              ]).slice(0, 3).map((m: any, idx: number) => (
                <div key={idx} className="bg-slate-50 p-1.5 rounded border border-slate-150 text-[8px] truncate">
                  <div className="w-6 h-6 rounded-full bg-blue-100 mx-auto mb-1 overflow-hidden">
                    <img src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} className="w-full h-full object-cover" />
                  </div>
                  <p className="font-bold text-slate-950 truncate leading-none">{m.name}</p>
                  <p className="text-[7px] text-blue-600 truncate opacity-90 mt-0.5 leading-none">{m.role}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {sec.type === 'process_steps' && (
          <div className="space-y-2 text-center mt-2 py-1.5 border-t border-b border-slate-100">
            <h4 className="font-extrabold text-xs text-slate-900 leading-tight">{s.heading || 'Our Secure Verification Workflow'}</h4>
            <div className="flex justify-between items-center px-4 pt-1.5 max-w-xs mx-auto font-mono text-[8.5px] text-slate-500 font-bold">
              {(s.steps || [
                { title: 'Deeds Check' },
                { title: 'Registrar Search' },
                { title: 'GPS Boundary' },
                { title: 'Live stamp' }
              ]).slice(0, 4).map((st: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center font-bold">0{idx + 1}</div>
                  <span className="text-[7px] text-slate-850 truncate max-w-[45px] mt-1 leading-none">{st.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sec.type === 'stats_grid' && (
          <div className="space-y-2 text-center mt-2 py-1.5 border-t border-b border-slate-100">
            <h4 className="font-extrabold text-xs text-slate-900 leading-tight">{s.heading || 'Our Achievements'}</h4>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {(s.stats || [
                { value: '480+', label: 'Audits' },
                { value: '95B', label: 'BIF Capital' },
                { value: '120+', label: 'Diaspora' },
                { value: '100%', label: 'Zero Fraud' }
              ]).slice(0, 4).map((st: any, idx: number) => (
                <div key={idx} className="bg-slate-50 border rounded p-1 text-[8px] truncate">
                  <span className="font-extrabold text-blue-600 text-[10px] block leading-none">{st.value}</span>
                  <span className="text-[7px] text-slate-400 block truncate mt-0.5 leading-none">{st.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sec.type === 'contact_form_banner' && (
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-3 rounded-xl text-center text-white mt-2 space-y-1.5 shadow border border-slate-800">
            <span className="text-[7.5px] font-mono tracking-widest text-slate-400 block uppercase">🔒 Protected Consult Panel</span>
            <h5 className="font-extrabold text-[10px] text-white leading-none truncate">{s.heading || 'Secure Free Advisory Consult Session'}</h5>
            <div className="flex gap-1 justify-center max-w-xs mx-auto pt-0.5">
              <div className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[7.5px] text-white/50 w-12 truncate leading-none text-left">Full Name</div>
              <div className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[7.5px] text-white/50 w-12 truncate leading-none text-left font-sans">Email</div>
              <div className="bg-blue-600 text-[7px] font-bold text-white px-2 rounded font-sans uppercase tracking-wide py-0.5 shrink-0 leading-none flex items-center justify-center">{s.buttonText || 'Schedule'}</div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Preview Lightbox triggered on eye click (styled as full layout simulator)
  function renderPagePreviewLightbox() {
    if (!previewPage) return null;
    const sectionsObjList = previewPage.sections || [];

    return (
      <div className="fixed inset-0 bg-slate-950/90 flex flex-col justify-end items-center z-50 animate-in fade-in duration-200">
        
        {/* Hub Lightbox header bar */}
        <div className="w-full max-w-7xl bg-slate-900 border-b border-slate-800 p-4 rounded-t-3xl flex justify-between items-center text-slate-100 uppercase shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-black">{previewPage.title.en} Draft Mockup Preview</h3>
          </div>
          <button 
            onClick={() => setPreviewPage(null)} 
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            Exit Preview
          </button>
        </div>

        {/* Live render viewport simulator */}
        <div className="w-full max-w-7xl bg-slate-50 flex-grow overflow-y-auto p-4 sm:p-8 space-y-0 text-slate-800">
          {sectionsObjList.length === 0 ? (
            <div className="py-24 text-center text-xs font-mono text-slate-400 max-w-md mx-auto leading-relaxed border border-dashed rounded-3xl p-8 bg-white shadow-sm">
              No custom block layout elements found. Try clicking the edit icon to design high-tech sections using our drag designer stack.
            </div>
          ) : (
            <div className="space-y-0 w-full animate-in fade-in">
              {sectionsObjList.map((section, idx) => {
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
                  fontSizeHeadClass = 'text-3xl sm:text-6xl font-black tracking-tighter leading-none';
                }

                const commonStyle = `${bgVal} w-full py-12 sm:py-16 px-4 border-b border-slate-100 last:border-0 relative select-none pointer-events-none`;

                return (
                  <div key={section.id || idx} className={commonStyle}>
                    <div className="max-w-5xl mx-auto">
                      {/* Using simpler custom layout render elements to prevent useEffect duplicate loops in iframe portal lightboxes */}
                      {renderFullVisualSectionContent(section, { fontSizeHeadClass, fontSizeTextClass, headColorVal, txtColorVal })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Simplified render logic inside portal modal
  function renderFullVisualSectionContent(sec: PageSection, styleOptions: { fontSizeHeadClass: string; fontSizeTextClass: string; headColorVal: string; txtColorVal: string }) {
    const s = sec.settings || {};
    const { fontSizeHeadClass, fontSizeTextClass, headColorVal, txtColorVal } = styleOptions;

    switch (sec.type) {
      case 'banner':
        return (
          <div 
            className="rounded-3xl p-8 sm:p-14 text-center min-h-[300px] flex flex-col justify-center items-center text-white relative overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: `url(${s.imageUrl || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80'})` }}
          >
            <div className="absolute inset-0 bg-slate-950/70" />
            <div className="relative z-10 max-w-xl space-y-3">
              <h2 className={`${fontSizeHeadClass} font-black`}>{s.title || 'Dynamic Banner'}</h2>
              <p className={`${fontSizeTextClass} font-sans opacity-95`}>{s.subtitle}</p>
              {s.buttonText && <span className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full font-bold text-xs uppercase tracking-wider">{s.buttonText}</span>}
            </div>
          </div>
        );

      case 'image_text':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className={`space-y-3 ${s.alignment === 'right' ? 'md:order-2' : ''}`}>
              <h3 className={`${fontSizeHeadClass} ${headColorVal} font-black`}>{s.heading || 'Aesthetic Heading'}</h3>
              <p className={`${fontSizeTextClass} ${txtColorVal} leading-relaxed whitespace-pre-wrap font-sans`}>{s.body}</p>
            </div>
            <div className={`rounded-2xl overflow-hidden shadow-md max-h-[300px] ${s.alignment === 'right' ? 'md:order-1' : ''}`}>
              <img src={s.imageUrl || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
        );

      case 'columns':
        return (
          <div className="space-y-6">
            <h3 className={`${fontSizeHeadClass} ${headColorVal} font-black text-center`}>{s.heading || 'Dynamic pillars'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((num) => (
                <div key={num} className="bg-slate-500/5 p-4 rounded-2xl border border-slate-205/30">
                  <span className="text-2xl">💎</span>
                  <h4 className="font-bold text-slate-900 mt-2">Pillar feature {num}</h4>
                  <p className="text-xs text-slate-500 leading-normal font-sans mt-1">Provide premium cadastral description variables directly from the dynamic dashboard catalog.</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'faqs':
        return (
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className={`${fontSizeHeadClass} ${headColorVal} font-black text-center`}>{s.heading || 'Frequently Asked Accordions'}</h3>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 text-xs leading-normal font-sans">
              <div className="font-bold text-slate-800">Q: How does the verification workflow operate?</div>
              <p className="text-slate-600 border-l pl-3 italic">Our representative panel audits physical registration records in Gitega and Rumonge.</p>
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-4">
            <h3 className={`${fontSizeHeadClass} ${headColorVal} font-black text-center`}>{s.heading || 'Client Endorsements'}</h3>
            <div className="p-6 bg-white border border-slate-200 rounded-3xl max-w-md mx-auto text-center space-y-3 font-sans">
              <div className="text-amber-500 text-sm">★★★★★</div>
              <p className="text-xs italic text-slate-600">"Extremely quick validation turnarounds in Bujumbura! Fully legal contracts."</p>
              <div className="font-bold text-xs text-slate-800">- Gérard Sindayigaya</div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="aspect-video relative rounded-3xl bg-slate-900 overflow-hidden max-w-2xl mx-auto flex items-center justify-center">
            <img src={s.coverImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'} className="absolute inset-0 w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white relative z-10"><Play className="w-5 h-5 fill-white translate-x-0.5" /></div>
          </div>
        );

      case 'single_image':
        return (
          <div className="text-center space-y-2">
            <div className="rounded-2xl overflow-hidden max-h-[350px] border">
              <img src={s.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            {s.caption && <p className="text-[10px] font-mono text-slate-400">{s.caption}</p>}
          </div>
        );

      case 'heading':
        return (
          <div className="text-center space-y-1">
            <h2 className={`${fontSizeHeadClass} ${headColorVal} font-black`}>{s.title || 'Dynamic Centered Heading'}</h2>
            {s.subtitle && <p className={`text-xs ${txtColorVal}`}>{s.subtitle}</p>}
          </div>
        );

      case 'text':
        return (
          <div className="max-w-2xl mx-auto leading-relaxed text-xs sm:text-sm font-sans whitespace-pre-wrap text-slate-600">
            {s.body}
          </div>
        );

      default:
        return (
          <p className="text-center italic text-xs text-slate-500 font-mono">Mock Preview block: {sec.type}</p>
        );
    }
  }
}
