import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Property, WebPage, EmailLog, SystemStats, PageSection } from '../types';
import { Language, translations } from '../translations';
import { 
  ShieldCheck, Plus, Trash2, Edit3, Check, X, Mail, Layers, BarChart2, 
  CheckCircle, RefreshCw, Eye, Home, Sparkles, MapPin, Search, 
  ChevronUp, ChevronDown, ArrowUp, ArrowDown, Settings, Copy, 
  Monitor, Layout, Info, UserCheck, AlertTriangle, Play, HelpCircle, Star,
  Image, GripVertical, MoreHorizontal, Smartphone, Laptop, FileText, Link
} from 'lucide-react';
import { ibFetch } from '../apiMock';
import { ThemeSchema, themesMap, getThemeSettings } from '../theme';
import PageSectionsRenderer from './PageSectionsRenderer';

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
      let resolved = false;
      const safeResolve = (val: { blob: Blob; dataUrl: string }) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(val);
        }
      };

      // Set a hard timeout of 1.2 seconds to fall back to the raw file instantly if canvas hangs
      const timer = setTimeout(() => {
        console.warn('compressImage timed out, using fallback original file');
        const fallbackReader = new FileReader();
        fallbackReader.onload = () => {
          safeResolve({ blob: file, dataUrl: fallbackReader.result as string });
        };
        fallbackReader.onerror = () => safeResolve({ blob: file, dataUrl: '' });
        fallbackReader.readAsDataURL(file);
      }, 1200);

      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        const img = new window.Image();
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
              safeResolve({ blob: file, dataUrl: rawUrl });
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            const base64Url = canvas.toDataURL('image/jpeg', 0.55);
            
            canvas.toBlob((blob) => {
              if (blob) {
                safeResolve({ blob, dataUrl: base64Url });
              } else {
                safeResolve({ blob: file, dataUrl: rawUrl });
              }
            }, 'image/jpeg', 0.55);
          } catch (err) {
            console.warn('Canvas compression failure', err);
            safeResolve({ blob: file, dataUrl: rawUrl });
          }
        };
        img.onerror = () => safeResolve({ blob: file, dataUrl: rawUrl });
        img.src = rawUrl;
      };
      reader.onerror = () => safeResolve({ blob: file, dataUrl: typeof reader.result === 'string' ? reader.result : '' });
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
  const [addSectionDropdownOpen, setAddSectionDropdownOpen] = useState(false);
  const [previewSize, setPreviewSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeSubBlock, setActiveSubBlock] = useState<string | null>(null);
  const [showInsertCatalogIndex, setShowInsertCatalogIndex] = useState<number | null>(null);

  // Settings states
  const [themeSchema, setThemeSchema] = useState<ThemeSchema>('blue');
  const [headerTitleInput, setHeaderTitleInput] = useState('');
  const [footerCopyrightInput, setFooterCopyrightInput] = useState('');
  const [announcementText, setAnnouncementText] = useState('🌿 Secure Cadastral Approvals & Land Registration In Burundi Since 2018');
  const [announcementBg, setAnnouncementBg] = useState('#1a1a1a');
  const [announcementTextCol, setAnnouncementTextCol] = useState('#f2f2f2');

  // Unsaved changes tracking for Page Builder
  const [originalPageSectionsJSON, setOriginalPageSectionsJSON] = useState<string | null>(null);
  const [originalGlobalsJSON, setOriginalGlobalsJSON] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: 'tab' | 'page' | 'exit';
    targetTab?: 'analytics' | 'listings' | 'submissions' | 'pages' | 'logs' | 'settings' | 'media';
    targetPageId?: string;
  } | null>(null);

  const hasUnsavedChanges = (() => {
    if (!editorPage) return false;
    if (originalPageSectionsJSON === null) return false;
    
    const currentPageSectionsJSON = JSON.stringify(editorPage.sections || []);
    const currentGlobalsJSON = JSON.stringify({
      announcementText,
      headerTitleInput,
      footerCopyrightInput,
      announcementBg,
      announcementTextCol
    });
    
    return (currentPageSectionsJSON !== originalPageSectionsJSON) || (currentGlobalsJSON !== originalGlobalsJSON);
  })();

  useEffect(() => {
    if (editorPage) {
      setOriginalPageSectionsJSON(JSON.stringify(editorPage.sections || []));
      setOriginalGlobalsJSON(JSON.stringify({
        announcementText,
        headerTitleInput,
        footerCopyrightInput,
        announcementBg,
        announcementTextCol
      }));
    } else {
      setOriginalPageSectionsJSON(null);
      setOriginalGlobalsJSON(null);
    }
  }, [editorPage?.id]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Do you want to save your changes before leaving?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleTabClick = (tab: 'analytics' | 'listings' | 'submissions' | 'pages' | 'logs' | 'settings' | 'media') => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'tab', targetTab: tab });
    } else {
      setActiveTab(tab);
      setEditorPage(null);
    }
  };

  const executePendingNavigation = (nav: {
    type: 'tab' | 'page' | 'exit';
    targetTab?: 'analytics' | 'listings' | 'submissions' | 'pages' | 'logs' | 'settings' | 'media';
    targetPageId?: string;
  }) => {
    if (nav.type === 'exit') {
      setEditorPage(null);
    } else if (nav.type === 'page' && nav.targetPageId) {
      const targetPage = pages.find(p => p.id === nav.targetPageId);
      if (targetPage) {
        setEditorPage(targetPage);
        setActiveSectionId(null);
        setActiveSubBlock(null);
      }
    } else if (nav.type === 'tab' && nav.targetTab) {
      setActiveTab(nav.targetTab);
      setEditorPage(null);
    }
  };

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
    setFooterCopyrightInput(localStorage.getItem('ib_footer') || '© 2018-2026 IMMO BURUNDI Private Limited. All rights reserved.');
    setAnnouncementText(localStorage.getItem('ib_announcement') || '🌿 Secure Cadastral Approvals & Land Registration In Burundi Since 2018');
    setAnnouncementBg(localStorage.getItem('ib_announcement_bg') || '#1a1a1a');
    setAnnouncementTextCol(localStorage.getItem('ib_announcement_text_col') || '#f2f2f2');
  }, []);

  // Update branding settings
  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ib_theme', themeSchema);
    localStorage.setItem('ib_header', headerTitleInput);
    localStorage.setItem('ib_footer', footerCopyrightInput);
    localStorage.setItem('ib_announcement', announcementText);
    localStorage.setItem('ib_announcement_bg', announcementBg);
    localStorage.setItem('ib_announcement_text_col', announcementTextCol);
    
    if (onThemeChange) {
      onThemeChange();
    }
    alert(currentLanguage === 'en' ? 'Branding settings updated with high-tech schemas!' : 'Paramètres de marque mis à jour avec des schémas de pointe !');
  };

  // Duplicate page
  const handleDuplicatePage = async (page: WebPage) => {
    try {
      const defaultTitle = `${page.title.en} (Copy)`;
      const chosenTitle = prompt(
        currentLanguage === 'en'
          ? 'Enter Title for the duplicated page:'
          : 'Entrez le titre pour la page dupliquée :',
        defaultTitle
      );
      if (chosenTitle === null) return;
      const finalTitle = chosenTitle.trim() || defaultTitle;

      const defaultSlug = `${page.slug}-copy`;
      const chosenSlugRaw = prompt(
        currentLanguage === 'en' 
          ? 'Enter URL slug for the duplicated page:' 
          : 'Entrez le slug URL pour la page dupliquée :',
        defaultSlug
      );
      
      if (chosenSlugRaw === null) return; // user cancelled duplication
      
      const chosenSlug = chosenSlugRaw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      if (!chosenSlug) {
        alert(currentLanguage === 'en' ? 'Slug cannot be empty!' : 'Le slug ne peut pas être vide !');
        return;
      }

      // Check if duplicate slug already exists
      if (pages.some(p => p.slug === chosenSlug)) {
        alert(currentLanguage === 'en' ? `The slug "/${chosenSlug}" is already in use by another page.` : `Le slug "/${chosenSlug}" est déjà utilisé.`);
        return;
      }

      const copyPayload = {
        title: {
          en: finalTitle,
          fr: page.title.fr ? `${page.title.fr} (Copie)` : finalTitle,
          sw: page.title.sw ? `${page.title.sw} (Nakala)` : finalTitle
        },
        content: page.content,
        slug: chosenSlug,
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
  const handleSavePageLayout = async (targetPage: WebPage, onSuccessCallback?: () => void) => {
    try {
      // Also persist header/footer and announcement text if changed in builder
      localStorage.setItem('ib_header', headerTitleInput);
      localStorage.setItem('ib_announcement', announcementText);
      localStorage.setItem('ib_footer', footerCopyrightInput);
      localStorage.setItem('ib_announcement_bg', announcementBg);
      localStorage.setItem('ib_announcement_text_col', announcementTextCol);
      if (onThemeChange) {
        onThemeChange();
      }

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
        // Update reference states
        setOriginalPageSectionsJSON(JSON.stringify(targetPage.sections || []));
        setOriginalGlobalsJSON(JSON.stringify({
          announcementText,
          headerTitleInput,
          footerCopyrightInput,
          announcementBg,
          announcementTextCol
        }));

        fetchAllAdminData();
        
        if (onSuccessCallback) {
          onSuccessCallback();
        } else {
          alert('High-tech page sections saved successfully!');
        }
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
      
      {/* Unsaved Changes Confirmation Modal */}
      {pendingNavigation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 select-text animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1 text-left">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Unsaved Changes</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1">
                  You have unsaved changes. Do you want to save your changes before leaving?
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => {
                  if (editorPage) {
                    handleSavePageLayout(editorPage, () => {
                      executePendingNavigation(pendingNavigation);
                      setPendingNavigation(null);
                    });
                  }
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 flex items-center justify-center border-0"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  executePendingNavigation(pendingNavigation);
                  setPendingNavigation(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-350 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center border-0"
              >
                Discard Changes
              </button>
              <button
                onClick={() => setPendingNavigation(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-350 bg-slate-850 hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center border-0"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
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
              onClick={() => handleTabClick('analytics')}
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
              onClick={() => handleTabClick('listings')}
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
              onClick={() => handleTabClick('submissions')}
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
               onClick={() => handleTabClick('pages')}
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
               onClick={() => handleTabClick('media')}
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
              onClick={() => handleTabClick('logs')}
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
            onClick={() => handleTabClick('settings')}
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
                    href={p.slug === 'home' || p.isHomepage ? '/' : `/?page=${p.slug}`}
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
      if (sections[index] && activeSectionId === sections[index].id) {
        setActiveSectionId(null);
      }
    };

    const handleSidebarAddBlock = (sectionId: string) => {
      const updatedSections = sections.map((sec) => {
        if (sec.id === sectionId) {
          const s = sec.settings || {};
          if (sec.type === 'columns') {
            const currentCols = s.columns || [
              { icon: '🛡️', title: 'Premium Verification', desc: 'Independent land registry title checks before transaction.' },
              { icon: '⚡', title: 'Instant Brokerage', desc: 'Secure real estate connections.' },
              { icon: '📂', title: 'Frictionless Contracts', desc: 'Signed service agreement.' }
            ];
            const updatedCols = [...currentCols, { 
              icon: '📌', 
              title: 'Burundi Column Item', 
              desc: 'Describe additional cadastral records or real estate benefits.' 
            }];
            return {
              ...sec,
              settings: {
                ...s,
                columns: updatedCols
              }
            };
          } else if (sec.type === 'slideshow') {
            const currentSlides = s.slides || [
              { image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80', title: 'Luxury Living', desc: 'Secure properties in Bujumbura' },
              { image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', title: 'Prime Urban Portfolios', desc: 'Active commercial buildings' }
            ];
            const updatedSlides = [...currentSlides, {
              image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
              title: 'New Slate Portfolio',
              desc: 'Legal title boundaries certified.'
            }];
            return {
              ...sec,
              settings: {
                ...s,
                slides: updatedSlides
              }
            };
          } else if (sec.type === 'testimonials') {
            const currentTests = s.testimonials || [
              { text: 'IMMO BURUNDI saved us from fraud.', author: 'Gérard Sindayigaya', role: 'Diaspora Investor' }
            ];
            const updatedTests = [...currentTests, {
              text: 'The best real estate service provider with authentic Burundi legal reviews.',
              author: 'New Verified Buyer',
              role: 'Gitega Client'
            }];
            return {
              ...sec,
              settings: {
                ...s,
                testimonials: updatedTests
              }
            };
          } else if (sec.type === 'gallery') {
            const currentImages = s.images || [
              'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80'
            ];
            const updatedImages = [...currentImages, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'];
            return {
              ...sec,
              settings: {
                ...s,
                images: updatedImages
              }
            };
          } else if (sec.type === 'team_profile') {
            const currentMembers = s.members || [
              { name: 'Sylvain Ndayishimiye', role: 'Chief Registrar Audit Officer', bio: '15+ years cross-referencing title deeds at Gitega archives.', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80' }
            ];
            const updatedMembers = [...currentMembers, {
              name: 'New Team Member',
              role: 'Licensed Property Advisor',
              bio: 'Expert consultant helping clients secure premium real estate listings.',
              avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
            }];
            return {
              ...sec,
              settings: {
                ...s,
                members: updatedMembers
              }
            };
          } else if (sec.type === 'stats_grid') {
            const currentStats = s.stats || [
              { label: 'Land Audits Done', value: '480+' }
            ];
            const updatedStats = [...currentStats, {
              label: 'New Stat Metric',
              value: '100+'
            }];
            return {
              ...sec,
              settings: {
                ...s,
                stats: updatedStats
              }
            };
          }
        }
        return sec;
      });
      setEditorPage({ ...editorPage, sections: updatedSections });
    };

    // HTML5 Drag & Drop event handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      // To prevent strange visual artifacts:
      e.currentTarget.classList.add('opacity-45');
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;
      const reordered = [...sections];
      const items = [...sections];
      const itemToMove = items[draggedIndex];
      items.splice(draggedIndex, 1);
      items.splice(index, 0, itemToMove);
      setEditorPage({
        ...editorPage,
        sections: items
      });
      setDraggedIndex(null);
    };

    const handleDragEnd = (e: React.DragEvent) => {
      e.currentTarget.classList.remove('opacity-45');
      setDraggedIndex(null);
    };

    const handleInsertSectionAfter = (index: number, type: PageSection['type']) => {
      let defaultSettings = {};
      if (type === 'banner') {
        defaultSettings = { title: 'Fresh Added Banner', subtitle: 'Detailed visual subtitle copy goes here.', buttonText: 'Explore' };
      } else if (type === 'columns') {
        defaultSettings = { heading: 'Our Core Pillars', subheading: 'Trusted boundary verification systems', columns: [
          { icon: '💎', title: 'Premium Audits', desc: 'Title deed validation verification' },
          { icon: '🔒', title: 'Direct Leases', desc: 'Secure coordinate verification' }
        ]};
      } else if (type === 'testimonials') {
        defaultSettings = { heading: 'Success Stories', testimonials: [{ text: 'Elite auditing expertise!', author: 'Gérard S.', role: 'Investor' }] };
      } else {
        defaultSettings = { title: 'New Layout Block', subtitle: 'Dynamic customizations lines' };
      }

      const newSec: PageSection = {
        id: 'sec_' + Date.now() + '_' + Math.floor(Math.random() * 100),
        type,
        backgroundColor: 'bg-white text-slate-800 border-none',
        headingColor: 'text-slate-900',
        textColor: 'text-slate-650',
        fontSize: 'md',
        settings: defaultSettings
      };

      const revised = [...sections];
      revised.splice(index + 1, 0, newSec);
      setEditorPage({ ...editorPage, sections: revised });
      setActiveSectionId(newSec.id);
      setShowInsertCatalogIndex(null);
    };

    return (
      <div className="h-full flex flex-col overflow-hidden bg-[#f1f1f1] text-[#303030]">
        
        {/* =======================================================
            SHOPIFY TOP HEADER CHROME BAR
           ======================================================= */}
        <header className="h-[52px] shrink-0 bg-[#1a1a1a] text-white border-b border-[#2a2a2a] flex items-center justify-between px-4 z-40 shadow-md">
          {/* Left corner: Back action + Page Selector Dropdown */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (hasUnsavedChanges) {
                  setPendingNavigation({ type: 'exit' });
                } else {
                  setEditorPage(null);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-[#2b2b2b] hover:bg-[#3d3d3d] text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Close editor and return to page catalogs list"
            >
              <span>←</span> <span className="hidden sm:inline">Exit</span>
            </button>
            <div className="h-5 w-px bg-[#333333]" />
            
            {/* Page dropdown picker */}
            <div className="relative">
              <select
                value={editorPage.id}
                onChange={(e) => {
                  const targetId = e.target.value;
                  if (hasUnsavedChanges) {
                    setPendingNavigation({ type: 'page', targetPageId: targetId });
                  } else {
                    const targetPage = pages.find(p => p.id === targetId);
                    if (targetPage) {
                      setEditorPage(targetPage);
                      setActiveSectionId(null);
                      setActiveSubBlock(null);
                    }
                  }
                }}
                className="appearance-none bg-[#2b2b2b] hover:bg-[#3a3a3a] text-white text-xs font-bold pl-3 pr-8 py-1.5 rounded-md border border-[#404040] focus:outline-none focus:border-blue-500 cursor-pointer transition"
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#1a1a1a] text-white">
                    {p.isHomepage ? "🏠 Home page" : `📄 Page: ${p.title.en}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-350 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Middle corner: Status Chrome */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[11.5px] font-medium text-slate-300">Immo Burundi Enterprise Theme</span>
            <span className="px-2 py-0.5 rounded-full bg-[#1b5e20] text-[#81c784] text-[9.5px] font-black uppercase tracking-wider scale-95 border border-[#2e7d32]/40">Active</span>
            <div className="h-3 w-px bg-[#333333] mx-1" />
            <span className="text-[11px] font-bold text-[#8c8c8c] font-mono select-none">Store default</span>
          </div>

          {/* Right corner: Live responsive scaling selector + Save button */}
          <div className="flex items-center gap-3">
            {/* Device toggles identical to Shopify top bar */}
            <div className="flex bg-[#2b2b2b] rounded-lg p-0.5 border border-[#3d3d3d] shrink-0 select-none">
              <button
                type="button"
                onClick={() => setPreviewSize('desktop')}
                className={`p-1.5 rounded transition ${
                  previewSize === 'desktop' ? 'bg-[#404040] text-blue-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop viewport previewing mode"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewSize('mobile')}
                className={`p-1.5 rounded transition ${
                  previewSize === 'mobile' ? 'bg-[#404040] text-blue-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile viewport previewing mode"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => {
                if (hasUnsavedChanges) {
                  handleSavePageLayout(editorPage);
                }
              }}
              disabled={!hasUnsavedChanges}
              className={`px-5 py-1.5 rounded font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow cursor-pointer ${
                hasUnsavedChanges
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40"
                  : "bg-[#2a2a2a] text-[#717171] cursor-not-allowed opacity-60 shadow-none"
              }`}
            >
              Save Layout
            </button>
          </div>
        </header>

        {/* =======================================================
            MAIN THREE-COLUMN SPLIT CONTAINER
           ======================================================= */}
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative w-full h-full">

          {/* -------------------------------------------------------------
              COLUMN 1: SHOPIFY LEFT SIDEBAR (SECTIONS DIRECTORY HIERARCHY)
              ------------------------------------------------------------- */}
          <aside className="w-full lg:w-[320px] shrink-0 bg-white border-r border-[#dcdcdc] flex flex-col overflow-hidden h-full">
            {/* Sidebar Active Page Header */}
            <div className="p-3 bg-[#fafafa] border-b border-[#e1e1e1] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-slate-500" />
                <span className="text-[12.5px] font-bold text-[#1a1a1a]">{editorPage.title.en} sections</span>
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-500 bg-[#eaeaea] px-2 py-0.5 rounded-full">
                {sections.length + 3} slices
              </span>
            </div>

            {/* Hierarchical sections tree directory */}
            <div className="flex-grow p-3 space-y-4 overflow-y-auto bg-white">
              
              {/* GROUP A: HEADER & GLOBAL PLUGINS */}
              <div className="space-y-1">
                <span className="text-[9.5px] font-extrabold text-[#757575] uppercase tracking-wider block px-1.5 mb-1.5">Header Group</span>
                
                {/* 1. Global Announcement bar item */}
                <div 
                  onClick={() => {
                    setActiveSectionId('announcement_bar');
                    setActiveSubBlock(null);
                  }}
                  className={`group p-2.5 rounded-md border flex items-center justify-between cursor-pointer transition ${
                    activeSectionId === 'announcement_bar'
                      ? 'bg-[#e2f0fd] border-blue-400 text-blue-900'
                      : 'bg-white border-transparent hover:bg-[#f6f6f6] text-[#303030]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-3.5 h-3.5 text-slate-350 shrink-0 select-none cursor-grab" />
                    <div className="text-left">
                      <span className="text-xs font-bold block">📢 Announcement bar</span>
                      <span className="text-[9px] text-[#717171] truncate block max-w-[190px] font-mono">{announcementText}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>

                {/* 2. Global Brand Header item */}
                <div 
                  onClick={() => {
                    setActiveSectionId('header_brand');
                    setActiveSubBlock(null);
                  }}
                  className={`group p-2.5 rounded-md border flex items-center justify-between cursor-pointer transition ${
                    activeSectionId === 'header_brand'
                      ? 'bg-[#e2f0fd] border-blue-400 text-blue-900'
                      : 'bg-white border-transparent hover:bg-[#f6f6f6] text-[#303030]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-3.5 h-3.5 text-slate-350 shrink-0 select-none cursor-grab" />
                    <div className="text-left">
                      <span className="text-xs font-bold block">🏠 Header (Logo & menus)</span>
                      <span className="text-[9px] text-[#717171] truncate block max-w-[190px] font-mono">{headerTitleInput || 'IMMO BURUNDI'}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              </div>

              {/* GROUP B: TEMPLATE CONTENT SECTIONS (COLLAPSIBLE / DRAGGABLE TREE) */}
              <div className="space-y-1.5 pt-2 border-t border-[#f0f0f0]">
                <div className="flex items-center justify-between px-1.5 mb-1.5">
                  <span className="text-[9.5px] font-extrabold text-[#757575] uppercase tracking-wider">Template sections (Slices)</span>
                  <span className="text-[8px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded cursor-help" title="To organize layouts, you can drag and drop sections up or down inside this panel!">DRAG TO ORDER</span>
                </div>

                {sections.length === 0 ? (
                  <div className="p-5 text-center text-xs text-[#757575] border border-dashed border-[#cccccc] rounded-lg bg-[#fafafa]">
                    Layout container empty.<br />Click "+ Add section" below or use the fast presets to populate blocks!
                  </div>
                ) : (
                  sections.map((sec, idx) => {
                    const isSelected = activeSectionId === sec.id;
                    return (
                      <div 
                        key={sec.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`group rounded-lg border transition-all ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-700 text-white shadow shadow-blue-800/20' 
                            : 'bg-white border-[#e1e1e1] hover:bg-[#f8f8f8]'
                        }`}
                      >
                        {/* Section Header Row clickable */}
                        <div 
                          onClick={() => {
                            setActiveSectionId(sec.id);
                            setActiveSubBlock(null);
                          }}
                          className="p-2.5 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <GripVertical className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-300' : 'text-[#a2a2a2]'} cursor-grab active:cursor-grabbing`} />
                            <div className="text-left truncate">
                              <span className="text-xs font-bold block capitalize">
                                {sec.type.replace('_', ' ')}
                              </span>
                              <span className={`text-[9px] block font-mono ${isSelected ? 'text-blue-100' : 'text-[#717171]'}`}>
                                Section Block #{idx + 1}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Duplicate and delete quick bar */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDuplicateSection(idx); }}
                              className={`p-1 rounded text-[9.5px] font-mono uppercase font-bold text-center shrink-0 hover:scale-105 transition-all ${
                                isSelected ? 'bg-blue-700 text-white' : 'bg-[#f0f0f0] text-slate-800'
                              }`}
                              title="Duplicate block duplicate copy"
                            >
                              📋
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteSection(idx); }}
                              className={`p-1 rounded text-[9.5px] font-mono uppercase font-bold text-center shrink-0 hover:scale-105 transition-all ${
                                isSelected ? 'bg-red-800 text-white' : 'bg-red-50 text-red-600'
                              }`}
                              title="Delete this block"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Hierarchical Sub-Blocks Sub-Tree displayed ONLY when this section is selected/active */}
                        {isSelected && (
                          <div className="px-3 pb-2.5 pt-1.5 border-t border-blue-500/50 bg-blue-700/30 text-white text-[11px] space-y-1 rounded-b-lg">
                            <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-blue-100 block opacity-90 pl-3">Inner Blocks Layout:</span>
                            
                            {/* Standard structural children nodes mapping matching Shopify Dawn list exactly */}
                            <div className="space-y-1">
                              <div 
                                onClick={(e) => { e.stopPropagation(); setActiveSubBlock('heading'); }}
                                className={`pl-4 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer ${activeSubBlock === 'heading' ? 'bg-blue-800 text-white font-bold' : 'hover:bg-blue-700/50 text-blue-50'}`}
                              >
                                <span className="opacity-60 text-[9px]">├─</span>
                                <span className="font-mono">📝</span> 
                                <span className="truncate">Heading: "{(sec.settings && (sec.settings.heading || sec.settings.title)) || 'Section Text heading'}"</span>
                              </div>

                              {sec.type === 'banner' && (
                                <>
                                  <div 
                                    onClick={(e) => { e.stopPropagation(); setActiveSubBlock('first_image'); }}
                                    className={`pl-4 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer ${activeSubBlock === 'first_image' ? 'bg-blue-800 text-white font-bold' : 'hover:bg-blue-700/50 text-blue-50'}`}
                                  >
                                    <span className="opacity-60 text-[9px]">├─</span>
                                    <span className="font-mono">🖼️</span> 
                                    <span className="truncate">First Image slot</span>
                                  </div>
                                  <div 
                                    onClick={(e) => { e.stopPropagation(); setActiveSubBlock('buttons'); }}
                                    className={`pl-4 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer ${activeSubBlock === 'buttons' ? 'bg-blue-800 text-white font-bold' : 'hover:bg-blue-700/50 text-blue-50'}`}
                                  >
                                    <span className="opacity-60 text-[9px]">└─</span>
                                    <span className="font-mono">🖱️</span> 
                                    <span className="truncate">Action buttons (Shop all...)</span>
                                  </div>
                                </>
                              )}

                              {sec.type === 'columns' && (
                                <>
                                  {((sec.settings && sec.settings.columns) || [
                                    { icon: '🛡️', title: 'Premium Verification' },
                                    { icon: '⚡', title: 'Instant Brokerage' },
                                    { icon: '📂', title: 'Frictionless Contracts' }
                                  ]).map((col: any, colIdx: number, arr: any[]) => {
                                    const blockId = `column_${colIdx}`;
                                    const isLast = colIdx === arr.length - 1;
                                    return (
                                      <div 
                                        key={colIdx}
                                        onClick={(e) => { e.stopPropagation(); setActiveSubBlock(blockId); }}
                                        className={`pl-4 py-1.5 rounded transition flex items-center justify-between cursor-pointer ${activeSubBlock === blockId ? 'bg-blue-800 text-white font-bold' : 'hover:bg-blue-700/50 text-blue-50'}`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="opacity-60 text-[9px] font-mono">{isLast ? '└─' : '├─'}</span>
                                          <span>{col.icon || '📌'}</span>
                                          <span className="truncate">{col.title || `Column ${colIdx + 1}`}</span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const originalCols = (sec.settings && sec.settings.columns) || [];
                                            const newCols = originalCols.filter((_: any, idx: number) => idx !== colIdx);
                                            if (activeSubBlock === blockId) setActiveSubBlock(null);
                                            const updated = sections.map(sc => sc.id === sec.id ? { ...sc, settings: { ...sc.settings, columns: newCols } } : sc);
                                            setEditorPage({ ...editorPage, sections: updated });
                                          }}
                                          className="text-[9px] text-red-200 hover:text-red-105 font-bold px-1 ml-1"
                                          title="Remove Column"
                                        >
                                          ❌
                                        </button>
                                      </div>
                                    );
                                  })}
                                </>
                              )}

                              {sec.type === 'slideshow' && (
                                <>
                                  {((sec.settings && sec.settings.slides) || [
                                    { title: 'Luxury Living' },
                                    { title: 'Prime Urban Portfolios' }
                                  ]).map((slide: any, slideIdx: number, arr: any[]) => {
                                    const blockId = `slide_${slideIdx}`;
                                    const isLast = slideIdx === arr.length - 1;
                                    return (
                                      <div 
                                        key={slideIdx}
                                        onClick={(e) => { e.stopPropagation(); setActiveSubBlock(blockId); }}
                                        className={`pl-4 py-1.5 rounded transition flex items-center justify-between cursor-pointer ${activeSubBlock === blockId ? 'bg-blue-800 text-white font-bold' : 'hover:bg-blue-700/50 text-blue-50'}`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="opacity-60 text-[9px] font-mono">{isLast ? '└─' : '├─'}</span>
                                          <span>🌄</span>
                                          <span className="truncate">{slide.title || `Slide ${slideIdx + 1}`}</span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const originalSlides = (sec.settings && sec.settings.slides) || [];
                                            const newSlides = originalSlides.filter((_: any, idx: number) => idx !== slideIdx);
                                            if (activeSubBlock === blockId) setActiveSubBlock(null);
                                            const updated = sections.map(sc => sc.id === sec.id ? { ...sc, settings: { ...sc.settings, slides: newSlides } } : sc);
                                            setEditorPage({ ...editorPage, sections: updated });
                                          }}
                                          className="text-[9px] text-red-200 hover:text-red-105 font-bold px-1 ml-1"
                                          title="Remove Slide"
                                        >
                                          ❌
                                        </button>
                                      </div>
                                    );
                                  })}
                                </>
                              )}

                              {sec.type === 'testimonials' && (
                                <>
                                  {((sec.settings && sec.settings.testimonials) || [
                                    { author: 'Gérard Sindayigaya' },
                                    { author: 'Clara Kaneza' }
                                  ]).map((test: any, testIdx: number, arr: any[]) => {
                                    const blockId = `testimonial_${testIdx}`;
                                    const isLast = testIdx === arr.length - 1;
                                    return (
                                      <div 
                                        key={testIdx}
                                        onClick={(e) => { e.stopPropagation(); setActiveSubBlock(blockId); }}
                                        className={`pl-4 py-1.5 rounded transition flex items-center justify-between cursor-pointer ${activeSubBlock === blockId ? 'bg-blue-800 text-white font-bold' : 'hover:bg-blue-700/50 text-blue-50'}`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="opacity-60 text-[9px] font-mono">{isLast ? '└─' : '├─'}</span>
                                          <span>💬</span>
                                          <span className="truncate">{test.author || `Reviewer ${testIdx + 1}`}</span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const originalTests = (sec.settings && sec.settings.testimonials) || [];
                                            const newTests = originalTests.filter((_: any, idx: number) => idx !== testIdx);
                                            if (activeSubBlock === blockId) setActiveSubBlock(null);
                                            const updated = sections.map(sc => sc.id === sec.id ? { ...sc, settings: { ...sc.settings, testimonials: newTests } } : sc);
                                            setEditorPage({ ...editorPage, sections: updated });
                                          }}
                                          className="text-[9px] text-red-200 hover:text-red-105 font-bold px-1 ml-1"
                                          title="Remove Testimonial"
                                        >
                                          ❌
                                        </button>
                                      </div>
                                    );
                                  })}
                                </>
                              )}

                              {sec.type === 'gallery' && (
                                <>
                                  {((sec.settings && sec.settings.images) || [
                                    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80',
                                    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80',
                                    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
                                    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80'
                                  ]).map((img: string, imgIdx: number, arr: any[]) => {
                                    const blockId = `gallery_image_${imgIdx}`;
                                    const isLast = imgIdx === arr.length - 1;
                                    return (
                                      <div 
                                        key={imgIdx}
                                        onClick={(e) => { e.stopPropagation(); setActiveSubBlock(blockId); }}
                                        className={`pl-4 py-1.5 rounded transition flex items-center justify-between cursor-pointer ${activeSubBlock === blockId ? 'bg-blue-800 text-white font-bold' : 'hover:bg-blue-700/50 text-blue-50'}`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="opacity-60 text-[9px] font-mono">{isLast ? '└─' : '├─'}</span>
                                          <span>🖼️</span>
                                          <span className="truncate">Picture #{imgIdx + 1}</span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const originalImages = (sec.settings && sec.settings.images) || [];
                                            const newImages = originalImages.filter((_: any, idx: number) => idx !== imgIdx);
                                            if (activeSubBlock === blockId) setActiveSubBlock(null);
                                            const updated = sections.map(sc => sc.id === sec.id ? { ...sc, settings: { ...sc.settings, images: newImages } } : sc);
                                            setEditorPage({ ...editorPage, sections: updated });
                                          }}
                                          className="text-[9px] text-red-200 hover:text-red-105 font-bold px-1 ml-1"
                                          title="Remove Image"
                                        >
                                          ❌
                                        </button>
                                      </div>
                                    );
                                  })}
                                </>
                              )}

                              {sec.type === 'team_profile' && (
                                <>
                                  {((sec.settings && sec.settings.members) || [
                                    { name: 'Sylvain Ndayishimiye' },
                                    { name: 'Estella Kaneza' },
                                    { name: 'Aimé Ndizeye' }
                                  ]).map((member: any, memIdx: number, arr: any[]) => {
                                    const blockId = `team_member_${memIdx}`;
                                    const isLast = memIdx === arr.length - 1;
                                    return (
                                      <div 
                                        key={memIdx}
                                        onClick={(e) => { e.stopPropagation(); setActiveSubBlock(blockId); }}
                                        className={`pl-4 py-1.5 rounded transition flex items-center justify-between cursor-pointer ${activeSubBlock === blockId ? 'bg-blue-800 text-white font-bold' : 'hover:bg-blue-700/50 text-blue-50'}`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="opacity-60 text-[9px] font-mono">{isLast ? '└─' : '├─'}</span>
                                          <span>👤</span>
                                          <span className="truncate">{member.name || `Member ${memIdx + 1}`}</span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const originalMembers = (sec.settings && sec.settings.members) || [];
                                            const newMembers = originalMembers.filter((_: any, idx: number) => idx !== memIdx);
                                            if (activeSubBlock === blockId) setActiveSubBlock(null);
                                            const updated = sections.map(sc => sc.id === sec.id ? { ...sc, settings: { ...sc.settings, members: newMembers } } : sc);
                                            setEditorPage({ ...editorPage, sections: updated });
                                          }}
                                          className="text-[9px] text-red-200 hover:text-red-105 font-bold px-1 ml-1"
                                          title="Remove Member"
                                        >
                                          ❌
                                        </button>
                                      </div>
                                    );
                                  })}
                                </>
                              )}

                              {sec.type === 'stats_grid' && (
                                <>
                                  {((sec.settings && sec.settings.stats) || [
                                    { label: 'Land Audits Done' },
                                    { label: 'BIF Capital Secured' }
                                  ]).map((st: any, stIdx: number, arr: any[]) => {
                                    const blockId = `stat_${stIdx}`;
                                    const isLast = stIdx === arr.length - 1;
                                    return (
                                      <div 
                                        key={stIdx}
                                        onClick={(e) => { e.stopPropagation(); setActiveSubBlock(blockId); }}
                                        className={`pl-4 py-1.5 rounded transition flex items-center justify-between cursor-pointer ${activeSubBlock === blockId ? 'bg-blue-800 text-white font-bold' : 'hover:bg-blue-700/50 text-blue-50'}`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="opacity-60 text-[9px] font-mono">{isLast ? '└─' : '├─'}</span>
                                          <span>📊</span>
                                          <span className="truncate">{st.label || `Stat ${stIdx + 1}`}</span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const originalStats = (sec.settings && sec.settings.stats) || [];
                                            const newStats = originalStats.filter((_: any, idx: number) => idx !== stIdx);
                                            if (activeSubBlock === blockId) setActiveSubBlock(null);
                                            const updated = sections.map(sc => sc.id === sec.id ? { ...sc, settings: { ...sc.settings, stats: newStats } } : sc);
                                            setEditorPage({ ...editorPage, sections: updated });
                                          }}
                                          className="text-[9px] text-red-200 hover:text-red-105 font-bold px-1 ml-1"
                                          title="Remove Stat"
                                        >
                                          ❌
                                        </button>
                                      </div>
                                    );
                                  })}
                                </>
                              )}

                              {['columns', 'slideshow', 'testimonials', 'gallery', 'team_profile', 'stats_grid'].includes(sec.type) && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleSidebarAddBlock(sec.id); }}
                                  className="w-full text-left pl-7 py-1.5 text-[9.5px] uppercase tracking-wider text-blue-200 hover:text-white font-bold flex items-center gap-1 cursor-pointer hover:bg-blue-800/10 rounded transition mt-1"
                                >
                                  <Plus className="w-2.5 h-2.5" /> Add block ({
                                    sec.type === 'columns' ? 'New Column' : 
                                    sec.type === 'slideshow' ? 'New Slide' : 
                                    sec.type === 'testimonials' ? 'New Review' :
                                    sec.type === 'gallery' ? 'Add Image' :
                                    sec.type === 'team_profile' ? 'Add Team Member' :
                                    'Add Stats'
                                  })
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Add Section trigger slot as depicted at the bottom of Template in Shopify */}
                <div className="pt-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAddSectionDropdownOpen(!addSectionDropdownOpen)}
                      className="w-full py-2 bg-blue-50 hover:bg-blue-100 border border-dashed border-blue-300 hover:border-blue-500 rounded-lg text-xs font-bold text-blue-600 flex items-center justify-center gap-1 cursor-pointer transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Section Block
                    </button>

                    {addSectionDropdownOpen && (
                      <div className="absolute left-0 bottom-full mb-2 w-full max-h-72 overflow-y-auto bg-white border border-[#eaeaea] rounded-lg shadow-xl z-50 p-2 space-y-1 scrollbar-thin">
                        <div className="text-[10px] uppercase font-mono font-bold text-slate-400 px-2 py-1 border-b border-[#fafafa] flex justify-between items-center bg-slate-50 rounded-t">
                          <span>Burundi Shop Templates</span>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setAddSectionDropdownOpen(false); }} 
                            className="text-red-500 hover:scale-110 font-sans font-normal text-xs px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        {[
                          { type: 'property_list', label: '🏠 Certified Property List', desc: 'Display validated land listings' },
                          { type: 'banner', label: '🖼️ Hero Image Banner', desc: 'Large high-impact backdrop header with a call-to-action button' },
                          { type: 'columns', label: '💎 Multicolumn Features', desc: 'Symmetrical icon & info pillar grid' },
                          { type: 'slideshow', label: '🌄 Slideshow Carousel', desc: 'Dynamic scrolling photo header' },
                          { type: 'team_profile', label: '👥 Cadastral Audit Team', desc: 'Showcase surveyor and attorney profiles' },
                          { type: 'process_steps', label: '👣 Compliance Workflow', desc: '4 milestones verification cycle' },
                          { type: 'stats_grid', label: '📊 Burundi Stats Figures', desc: 'Grid of capital and audit numbers' },
                          { type: 'testimonials', label: '💬 Client Testimonials', desc: 'Buyer/Diaspora verified feedback list' },
                          { type: 'image_text', label: '🎨 Image with Text Block', desc: 'Side-by-side illustration & details' },
                          { type: 'faqs', label: '❓ FAQ Accordion List', desc: 'Common legal & registration Q&As' },
                          { type: 'richtext', label: '📝 Compliance Document Copy', desc: 'Full-width rich paragraph text layout' },
                          { type: 'video', label: '🎥 Accredited Drone Showcase', desc: 'Embedded video player wrapper' },
                          { type: 'contact_form_banner', label: '📞 Advisory Free Consult', desc: 'Direct lead generation contact form' },
                          { type: 'finances_calculator', label: '🧮 Diaspora Mortgage Tool', desc: 'Financial downpayment estimator' }
                        ].map((tpl) => (
                          <button
                            key={tpl.type}
                            type="button"
                            onClick={() => {
                              handleAddSection(tpl.type as PageSection['type']);
                              setAddSectionDropdownOpen(false);
                            }}
                            className="w-full text-left p-2 rounded hover:bg-blue-50 hover:text-blue-900 group transition-all flex flex-col cursor-pointer border border-transparent hover:border-blue-100"
                          >
                            <span className="text-xs font-bold text-[#303030] group-hover:text-blue-800">{tpl.label}</span>
                            <span className="text-[9.5px] text-slate-500 line-clamp-1">{tpl.desc}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* GROUP C: FOOTER GROUP */}
              <div className="pt-3 border-t border-[#f0f0f0] space-y-1">
                <span className="text-[9.5px] font-extrabold text-[#757575] uppercase tracking-wider block px-1.5 mb-1.5">Footer Group</span>
                
                {/* Global footer copyright brand item */}
                <div 
                  onClick={() => {
                    setActiveSectionId('footer_brand');
                    setActiveSubBlock(null);
                  }}
                  className={`group p-2.5 rounded-md border flex items-center justify-between cursor-pointer transition ${
                    activeSectionId === 'footer_brand'
                      ? 'bg-[#e2f0fd] border-blue-400 text-blue-900'
                      : 'bg-white border-transparent hover:bg-[#f6f6f6] text-[#303030]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-3.5 h-3.5 text-slate-350 shrink-0 cursor-grab" />
                    <div className="text-left">
                      <span className="text-xs font-bold block">🏠 Footer Global Info</span>
                      <span className="text-[9px] text-[#717171] truncate block max-w-[190px] font-mono">{footerCopyrightInput || 'Burundi footer text'}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              </div>

            </div>

            {/* Quick Presets Catalog Panel */}
            <div className="p-3 border-t border-[#e1e1e1] bg-[#fafafa] shrink-0">
              <span className="text-[9px] font-extrabold text-[#616161] uppercase tracking-wider block mb-2">Preset Layout Injectors:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
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
                          imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
                          opacity: 50,
                          bannerHeight: 'large',
                          alignment: 'left',
                          showContainer: true
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
                      }
                    ];
                    setEditorPage({ ...editorPage, sections: agencySections });
                    setActiveSectionId('sec_1');
                    setActiveSubBlock(null);
                  }}
                  className="p-1 px-2.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-[#0052cc] hover:text-white rounded font-bold text-[9.5px] cursor-pointer text-center whitespace-nowrap transition-colors duration-150"
                >
                  🏢 Agency Theme
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const landSections: PageSection[] = [
                      {
                        id: 'sec_11',
                        type: 'banner',
                        backgroundColor: 'bg-slate-950 text-slate-100 border-b border-slate-800',
                        headingColor: 'text-white',
                        textColor: 'text-slate-100',
                        fontSize: 'display',
                        settings: {
                          title: 'Premium Lakefront plots Tanganyika, Rumonge',
                          subtitle: 'Secure parcels with certified boundaries ready for investment.',
                          buttonText: 'View land catalog',
                          imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
                          opacity: 40,
                          bannerHeight: 'medium',
                          alignment: 'center',
                          showContainer: false
                        }
                      }
                    ];
                    setEditorPage({ ...editorPage, sections: landSections });
                    setActiveSectionId('sec_11');
                    setActiveSubBlock(null);
                  }}
                  className="p-1 px-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded font-bold text-[9.5px] cursor-pointer text-center whitespace-nowrap transition-colors duration-150"
                >
                  🗺️ Land Theme
                </button>
              </div>
            </div>
          </aside>

          {/* -------------------------------------------------------------
              COLUMN 2: LARGE MIDDLE LIVE PREVIEW MOCKUP EMULATOR CANVAS (Arrow 2)
              ------------------------------------------------------------- */}
          <main className="flex-grow p-4 lg:p-6 overflow-y-auto flex items-start justify-center bg-[#dbdbdb] h-full relative select-none">
            
            {/* Viewport resizing container */}
            <div 
              style={{ maxWidth: previewSize === 'mobile' ? '375px' : '100%' }}
              className={`w-full bg-white shadow-2xl rounded-2xl overflow-hidden border border-[#cccccc] transition-all duration-300 relative ${
                previewSize === 'mobile' ? 'min-h-[667px]' : 'min-h-full'
              }`}
            >
              
              {/* Simulated browser header bar for desktop mode */}
              <div className="bg-[#eaeaea] border-b border-[#cdcdcd] px-3 py-1.5 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f25f56] inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f4be1a] inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4cd964] inline-block" />
                </div>
                
                {/* Simulated locked secure URL */}
                <div className="flex-grow max-w-sm mx-auto bg-white border border-[#cdcdcd] px-3.5 py-0.5 rounded text-[10px] font-mono text-slate-500 font-bold flex items-center gap-1 justify-center shadow-inner">
                  <span>🔒 https://immoburundi.bi/</span>
                  <span className="text-[#3c8dbc] font-bold">pages/{editorPage.slug}</span>
                </div>
                <div className="w-10" />
              </div>

              {/* LIVE PAGE LAYOUT CHROME RENDER VIEW */}
              <div className="w-full h-full bg-white text-slate-800">
                
                {/* 1. ANNOUNCEMENT BAR (Live state linked) */}
                <div 
                  onClick={() => {
                    setActiveSectionId('announcement_bar');
                    setActiveSubBlock(null);
                  }}
                  style={{ backgroundColor: announcementBg, color: announcementTextCol }}
                  className={`py-2 px-3 text-center text-xs font-semibold cursor-pointer select-none transition-all duration-200 flex items-center justify-center gap-1 ${
                    activeSectionId === 'announcement_bar' ? 'ring-2 ring-blue-500 ring-inset' : ''
                  }`}
                >
                  <p className="truncate font-sans tracking-wide leading-none">{announcementText}</p>
                </div>

                {/* 2. CORPORATE HEADER MENU (Live state linked using headerTitleInput) */}
                <div 
                  onClick={() => {
                    setActiveSectionId('header_brand');
                    setActiveSubBlock(null);
                  }}
                  className={`bg-white border-b border-[#ececec] py-4 px-5 flex items-center justify-between cursor-pointer select-none transition-all duration-200 ${
                    activeSectionId === 'header_brand' ? 'ring-2 ring-blue-500 ring-inset' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Brand logo/title */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shrink-0">
                      <ShieldCheck className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-extrabold font-sans uppercase tracking-tight text-blue-900 leading-none">
                        {headerTitleInput || 'IMMO BURUNDI'}
                      </span>
                      <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">
                        {currentLanguage === 'en' ? 'Verified Workspace' : currentLanguage === 'fr' ? 'Espace Vérifié' : 'Uhakiki Salama'}
                      </span>
                    </div>
                  </div>

                  {/* Menus list */}
                  <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-[#444444] tracking-wide uppercase">
                    <span className="hover:text-blue-600 transition cursor-pointer">{t.navHome}</span>
                    <span className="hover:text-blue-600 transition cursor-pointer">{t.navProperties}</span>
                    <span className="hover:text-blue-600 transition cursor-pointer">{t.navAbout}</span>
                    <span className="hover:text-blue-600 transition cursor-pointer">{t.navContact}</span>
                  </div>

                  {/* Header right icons */}
                  <div className="flex items-center gap-3 text-[#444444] shrink-0">
                    <Search className="w-4 h-4 hover:text-blue-600" />
                    <span className="text-[11px] font-mono text-[#8c8c8c] hidden md:inline">{t.navContact}</span>
                  </div>
                </div>

                {/* 3. DYNAMIC BODY PORTALS LIST (With interactive Shopify border highlight and bottom plus button) */}
                <div className="space-y-0 w-full">
                  {sections.length === 0 ? (
                    <div className="py-24 px-6 text-center max-w-sm mx-auto space-y-4">
                      <Layout className="w-12 h-12 text-[#b0b0b0] mx-auto animate-pulse" />
                      <h4 className="text-sm font-extrabold text-[#303030] uppercase tracking-wide">Interactive Canvas is Empty</h4>
                      <p className="text-xs text-[#717171] leading-relaxed">Click any preset layout button or block in the left panel to populate your theme stack here live.</p>
                    </div>
                  ) : (
                    sections.map((sec, sIdx) => {
                      const isActive = activeSectionId === sec.id;
                      
                      // Dawn style banner specific backgrounds
                      let heightClass = 'py-16 sm:py-24';
                      const s = sec.settings || {};
                      if (s.bannerHeight === 'small') heightClass = 'py-10';
                      else if (s.bannerHeight === 'large') heightClass = 'py-24 sm:py-36';

                      let opacityVal = 40;
                      if (s.opacity !== undefined) opacityVal = parseInt(s.opacity);

                      return (
                        <div 
                          key={sec.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSectionId(sec.id);
                            setActiveSubBlock(null);
                          }}
                          className={`relative w-full group transition-all duration-150 ${
                            isActive 
                              ? 'ring-[3px] ring-blue-600 ring-offset-1 z-20 shadow-xl' 
                              : 'hover:ring-1 hover:ring-slate-400 border-b border-[#eeeeee]'
                          }`}
                        >
                          {/* Top Border Badge showing name (only if active) */}
                          {isActive && (
                            <span className="absolute bottom-3 left-3 z-30 bg-blue-600 text-white text-[9px] font-mono uppercase px-2 rounded-full font-extrabold tracking-widest shadow">
                              Template: {sec.type.replace('_', ' ')}
                            </span>
                          )}

                          {/* Dynamic page content render */}
                          <div className="w-full">
                            {renderMockPreviewSectionContent(sec)}
                          </div>

                          {/* Blue circular PLUS button in bottom border middle (just like Shopify screenshot!) */}
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowInsertCatalogIndex(sIdx);
                              }}
                              className="w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md border hover:scale-110 active:scale-95 transition-all text-xs font-black cursor-pointer"
                              title="Insert new layout block beneath this section"
                            >
                              +
                            </button>
                          </div>

                          {/* Float list of categorized sections to insert directly below */}
                          {showInsertCatalogIndex === sIdx && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-4 mt-2 bg-white border border-[#cfcfcf] shadow-2xl p-3.5 rounded-xl z-50 w-72 max-w-sm text-xs text-left animate-in zoom-in duration-100 select-none">
                              <div className="flex justify-between items-center border-b pb-1.5 mb-2 shrink-0">
                                <span className="font-bold text-[#1a1a1a] uppercase text-[9.5px] font-mono tracking-wider">⚡ Insert brand new block</span>
                                <button onClick={(e) => { e.stopPropagation(); setShowInsertCatalogIndex(null); }} className="text-[#a1a1a1] hover:text-[#303030] font-bold text-xs">✕</button>
                              </div>
                              <span className="text-[8px] uppercase tracking-widest text-[#717171] font-bold block mb-1">Select block type:</span>
                              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                                {[
                                  { k: 'banner', l: 'Main Banner', icon: '🖼️' },
                                  { k: 'property_list', l: 'Properties', icon: '🏡' },
                                  { k: 'columns', l: '3 Pillars', icon: '💎' },
                                  { k: 'testimonials', l: 'Testimonials', icon: '💬' },
                                  { k: 'video', l: 'Drone Video', icon: '📽️' },
                                  { k: 'slideshow', l: 'Carousel Slider', icon: '🎞️' }
                                ].map(item => (
                                  <button
                                    key={item.k}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInsertSectionAfter(sIdx, item.k as any);
                                    }}
                                    className="p-1.5 rounded hover:bg-slate-100 border text-[10px] items-center flex gap-1 font-bold text-slate-800 text-left transition cursor-pointer"
                                  >
                                    <span>{item.icon}</span> <span>{item.l}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>

                {/* 4. LAYOUT GLOBAL FOOTER (Live state linked copyright text) */}
                <div 
                  onClick={() => {
                    setActiveSectionId('footer_brand');
                    setActiveSubBlock(null);
                  }}
                  className={`bg-[#1a1a1a] text-slate-400 py-10 px-6 border-t border-[#333333] cursor-pointer text-center select-none transition-all duration-200 ${
                    activeSectionId === 'footer_brand' ? 'ring-2 ring-blue-500 ring-inset' : 'hover:bg-[#202020]'
                  }`}
                >
                  <p className="text-[11px] max-w-lg mx-auto font-sans leading-relaxed tracking-wide font-normal">
                    {footerCopyrightInput || '© 2026 Gitega national archives. All rights certified IMMO BURUNDI.'}
                  </p>
                  <div className="flex justify-center gap-5 mt-4 text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                    <span>Terms &amp; deeds policy</span>
                    <span>Registry laws</span>
                    <span>Sovereign security indices</span>
                  </div>
                </div>

              </div>
            </div>
          </main>

          {/* -------------------------------------------------------------
              COLUMN 3: SHOPIFY RIGHT INSPECTOR PANEL (ACTIVE SECTION SETTINGS) (Arrow 3)
              ------------------------------------------------------------- */}
          <aside className="w-full lg:w-[350px] shrink-0 bg-white border-l border-[#dcdcdc] flex flex-col overflow-hidden h-full">
            
            {/* Inspector Header with Section Title */}
            <div className="p-3 bg-[#fafafa] border-b border-[#e1e1e1] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-[#1a1a1a] uppercase font-mono tracking-wider">
                  {activeSectionId === 'announcement_bar' 
                    ? 'Announcement bar' 
                    : activeSectionId === 'header_brand' 
                    ? 'Logo/Header settings' 
                    : activeSectionId === 'footer_brand' 
                    ? 'Footer copyright' 
                    : sections.find(s => s.id === activeSectionId)
                    ? sections.find(s => s.id === activeSectionId)?.type?.replace('_', ' ') + ' customizer'
                    : 'Section settings'
                  }
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => alert('Opening additional block tools!')}
                  className="p-1 rounded text-slate-400 hover:bg-[#eaeaea] hover:text-[#1a1a1a] shrink-0 cursor-pointer"
                  title="More block operations"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    setActiveSectionId(null);
                    setActiveSubBlock(null);
                  }}
                  className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-500 shrink-0 cursor-pointer"
                  title="Close settings inspector panels"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inspector Scroll Container */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-white text-xs">
              
              {/* If no section selected */}
              {!activeSectionId && (
                <div className="text-center py-24 text-slate-400 font-mono text-xs leading-relaxed max-w-[210px] mx-auto space-y-3 select-none">
                  <Settings className="w-8 h-8 mx-auto text-slate-350 animate-spin-reverse" />
                  <p>Click on any content block card in the left stack list or hover-click inside the middle preview layout to trigger Shopify settings inspector fields.</p>
                </div>
              )}

              {/* A. If Announcement bar selected */}
              {activeSectionId === 'announcement_bar' && (
                <div className="space-y-4">
                  <span className="text-[9.5px] text-[#717171] uppercase tracking-widest font-extrabold font-mono block">📢 Global Announcement parameters</span>
                  
                  <div className="space-y-1.5">
                    <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Banner Alert Text:</label>
                    <textarea 
                      rows={4}
                      value={announcementText} 
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      className="w-full bg-[#fcfcfc] border border-[#cccccc] hover:border-slate-400 focus:border-blue-500 rounded p-2.5 text-[#303030] focus:outline-none transition leading-relaxed" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-2">
                    <div className="space-y-1.5">
                      <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Background Color:</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={announcementBg} 
                          onChange={(e) => setAnnouncementBg(e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 p-0 cursor-pointer overflow-hidden bg-transparent"
                        />
                        <input 
                          type="text" 
                          value={announcementBg} 
                          onChange={(e) => setAnnouncementBg(e.target.value)}
                          className="w-full text-xs font-mono bg-[#fcfcfc] border border-[#cccccc] rounded p-1 text-[#303030] focus:outline-none focus:border-blue-500 h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Text Color:</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={announcementTextCol} 
                          onChange={(e) => setAnnouncementTextCol(e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 p-0 cursor-pointer overflow-hidden bg-transparent"
                        />
                        <input 
                          type="text" 
                          value={announcementTextCol} 
                          onChange={(e) => setAnnouncementTextCol(e.target.value)}
                          className="w-full text-xs font-mono bg-[#fcfcfc] border border-[#cccccc] rounded p-1 text-[#303030] focus:outline-none focus:border-blue-500 h-8"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[10.5px] leading-relaxed text-blue-850">
                    💡 This announcement bar remains global across all page categories, showcasing prominent real estate certifications instantly.
                  </div>
                </div>
              )}

              {/* B. If Header branding is selected */}
              {activeSectionId === 'header_brand' && (
                <div className="space-y-4">
                  <span className="text-[9.5px] text-[#717171] uppercase tracking-widest font-extrabold font-mono block">🏠 Corporate Header configurations</span>
                  
                  <div className="space-y-1.5">
                    <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Website corporate logo text:</label>
                    <input 
                      type="text" 
                      value={headerTitleInput} 
                      onChange={(e) => setHeaderTitleInput(e.target.value)}
                      className="w-full bg-[#fcfcfc] border border-[#cccccc] hover:border-slate-400 focus:border-blue-500 rounded p-2.5 text-[#303030] focus:outline-none transition" 
                    />
                  </div>

                  <div className="space-y-1 text-[#717171] pt-2">
                    <span className="block font-bold text-[10px] text-slate-800">Menus layout links:</span>
                    <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                      <li>🏠 Home URL (/)</li>
                      <li>📄 Land plots (/land)</li>
                      <li>📞 Contact consult advisor (/contact)</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* C. If Footer copyright is selected */}
              {activeSectionId === 'footer_brand' && (
                <div className="space-y-4">
                  <span className="text-[9.5px] text-[#717171] uppercase tracking-widest font-extrabold font-mono block">🏠 Footer Global labels</span>
                  
                  <div className="space-y-1.5">
                    <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Copyright notice copy lines:</label>
                    <textarea 
                      rows={4}
                      value={footerCopyrightInput} 
                      onChange={(e) => setFooterCopyrightInput(e.target.value)}
                      className="w-full bg-[#fcfcfc] border border-[#cccccc] hover:border-slate-400 focus:border-blue-500 rounded p-2.5 text-[#303030] focus:outline-none transition leading-relaxed" 
                    />
                  </div>
                </div>
              )}

              {/* D. If Dynamic Page Section is selected (e.g. Image banner) */}
              {activeSectionId && 
               ['announcement_bar', 'header_brand', 'footer_brand'].indexOf(activeSectionId) === -1 && 
               sections.find(s => s.id === activeSectionId) && (
                (() => {
                  const sec = sections.find(s => s.id === activeSectionId)!;
                  const s = sec.settings || {};
                  
                  return (
                    <div className="space-y-4">
                      
                      {/* Segment 1: Header / Style scheme */}
                      <div className="space-y-3.5 border-b pb-4">
                        <span className="text-[9.5px] text-[#717171] uppercase tracking-widest font-extrabold font-mono block">🎨 Color scheme & Styles</span>
                        
                        <div>
                          <label className="block text-[#1a1a1a] font-bold text-[10.5px] mb-1">Color Scheme:</label>
                          <select 
                            value={sec.backgroundColor} 
                            onChange={(e) => handleUpdateActiveSectionStyle('backgroundColor', e.target.value)}
                            className="w-full bg-white border border-[#cccccc] hover:border-slate-400 rounded p-2 text-slate-800 text-xs font-semibold cursor-pointer focus:outline-none"
                          >
                            <option value="bg-white text-slate-800 border-none">Scheme 1 (White layout background)</option>
                            <option value="bg-slate-50 text-slate-800 border-none">Scheme 2 (Minimal Ash gray)</option>
                            <option value="bg-slate-900 text-white border-slate-800">Scheme 3 (Dark Slate background)</option>
                            <option value="bg-[#1a1a1a] text-white">Scheme 4 (Premium Pitch black)</option>
                            <option value="bg-blue-900 text-white">Scheme 5 (Strategic Royal Blue)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[#1a1a1a] font-bold text-[10.5px] mb-1">Typography size setting:</label>
                          <select 
                            value={sec.fontSize} 
                            onChange={(e) => handleUpdateActiveSectionStyle('fontSize', e.target.value as any)}
                            className="w-full bg-white border border-[#cccccc] hover:border-slate-400 rounded p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                          >
                            <option value="sm">Small description text</option>
                            <option value="md">Medium standard layout copy text</option>
                            <option value="lg">Large body text scale</option>
                            <option value="display">Bold Display Banner (Premium Scaled)</option>
                          </select>
                        </div>
                      </div>

                      {/* Segment 2: Image banner specific layout (Arrow 3 in absolute detail!) */}
                      {sec.type === 'banner' ? (
                        <div className="space-y-4 pt-1">
                          
                          {/* First Image slot with real uploader */}
                          <div className="space-y-1.5">
                            <label className="block text-[#1a1a1a] font-bold text-[10.5px]">First Image / Background Cover</label>
                            <AdminImageUpload
                              value={s.imageUrl || ''}
                              onChange={(url) => handleUpdateActiveSectionSettings('imageUrl', url)}
                              placeholder="Upload first banner image"
                            />
                          </div>

                          {/* Second Image slot with real uploader */}
                          <div className="space-y-1.5 font-sans">
                            <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Second Image (Split Screen / Blend)</label>
                            <AdminImageUpload
                              value={s.imageUrl2 || ''}
                              onChange={(url) => handleUpdateActiveSectionSettings('imageUrl2', url)}
                              placeholder="Upload split screen image"
                            />
                          </div>

                          {/* Image overlay opacity slider */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between items-center">
                              <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Image overlay opacity</label>
                              <span className="bg-[#f0f0f0] border border-[#cecece] px-2 py-0.5 rounded text-[10px] font-mono text-slate-700 font-bold">
                                {s.opacity || 40} %
                              </span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={s.opacity || 40} 
                              onChange={(e) => handleUpdateActiveSectionSettings('opacity', e.target.value)}
                              className="w-full h-1.5 bg-[#eaeaea] accent-blue-600 rounded-lg appearance-none cursor-pointer" 
                            />
                          </div>

                          {/* Banner height selection */}
                          <div className="space-y-1.5">
                            <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Banner height</label>
                            <select 
                              value={s.bannerHeight || 'large'}
                              onChange={(e) => handleUpdateActiveSectionSettings('bannerHeight', e.target.value)}
                              className="w-full bg-white border border-[#cccccc] hover:border-slate-400 rounded p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                            >
                              <option value="small">Small layout banner style</option>
                              <option value="medium">Medium compact layout height</option>
                              <option value="large">Large aesthetic height height</option>
                            </select>
                            <span className="text-[9.5px] text-[#717171] leading-normal block">
                              For best results, use an image with a spacious 3:2 aspect ratio layout. Let's learn more details.
                            </span>
                          </div>

                          {/* Desktop content position */}
                          <div className="space-y-1.5">
                            <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Desktop content position</label>
                            <select 
                              value={s.desktopContentPosition || 'bottom-center'}
                              onChange={(e) => handleUpdateActiveSectionSettings('desktopContentPosition', e.target.value)}
                              className="w-[#100] bg-white border border-[#cccccc] hover:border-slate-400 rounded p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                            >
                              <option value="top-left">Top Left</option>
                              <option value="top-center">Top Center</option>
                              <option value="middle-center">Middle Center</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="bottom-center">Bottom Center</option>
                            </select>
                          </div>

                          {/* Show container on desktop toggle switch */}
                          <div className="flex items-center justify-between py-2 border-b border-t border-[#f0f0f0]">
                            <label className="text-[#1a1a1a] font-bold text-[10.5px]">Show container on desktop</label>
                            <button
                              type="button" 
                              onClick={() => handleUpdateActiveSectionSettings('showContainer', !s.showContainer)}
                              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                                s.showContainer ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            >
                              <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                                s.showContainer ? 'translate-x-5' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>

                          {/* Desktop content alignment Segmented Buttons layout */}
                          <div className="space-y-1.5">
                            <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Desktop content alignment</label>
                            <div className="grid grid-cols-3 gap-1 bg-[#f4f4f4] rounded-lg p-1 border border-[#e2e2e2]">
                              {['left', 'center', 'right'].map(align => (
                                <button
                                  type="button"
                                  key={align}
                                  onClick={() => handleUpdateActiveSectionSettings('alignment', align)}
                                  className={`py-1 rounded-md text-xs font-black capitalize transition-all ${
                                    s.alignment === align 
                                      ? 'bg-white shadow text-[#1a1a1a] font-black' 
                                      : 'text-slate-500 hover:text-[#1a1a1a]'
                                  }`}
                                >
                                  {align}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom Header Text editing fields */}
                          <div className="space-y-1.5 pt-2 border-t">
                            <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Banner Heading Text</label>
                            <input 
                              type="text" 
                              value={s.title || ''} 
                              onChange={(e) => handleUpdateActiveSectionSettings('title', e.target.value)}
                              className="w-full bg-[#fcfcfc] border border-[#cccccc] hover:border-slate-400 focus:border-blue-500 rounded p-2 text-[#303030] focus:outline-none transition font-sans font-bold" 
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[#1a1a1a] font-bold text-[10.5px]">Image Description</label>
                            <textarea 
                              rows={2.5}
                              value={s.subtitle || ''} 
                              onChange={(e) => handleUpdateActiveSectionSettings('subtitle', e.target.value)}
                              className="w-full bg-[#fcfcfc] border border-[#cccccc] hover:border-slate-400 focus:border-blue-500 rounded p-2 text-[#303030] focus:outline-none transition leading-normal font-sans" 
                            />
                          </div>
                        </div>
                      ) : (
                        /* Universal fields for other sections, styled identically to look professional and cohesive */
                        <div className="space-y-4 pt-1 bg-white">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">📝 Block details inputs</span>
                          <div className="space-y-3 p-3 bg-slate-50/70 border rounded-xl">
                            {renderSectionFieldsInputs(sec, handleUpdateActiveSectionSettings)}
                          </div>
                        </div>
                      )}

                      {/* Animations accordion group */}
                      <div className="pt-2 border-t">
                        <details className="group border rounded-lg bg-white overflow-hidden transition-all text-[#303030]">
                          <summary className="flex justify-between items-center p-3 font-bold text-[10.5px] cursor-pointer bg-[#fafafa] list-none">
                            <span>Animations</span>
                            <span className="transition-transform group-open:rotate-180">▼</span>
                          </summary>
                          <div className="p-3 bg-white space-y-2 border-t">
                            <label className="block text-[10px] font-bold">Image behavior:</label>
                            <select 
                              value={s.imageBehavior || 'ambient'} 
                              onChange={(e) => handleUpdateActiveSectionSettings('imageBehavior', e.target.value)}
                              className="w-full bg-white border border-[#cccccc] rounded p-1.5 focus:outline-none text-xs cursor-pointer"
                            >
                              <option value="ambient">Ambient movement (Flowing visual glide)</option>
                              <option value="fixed">Fixed parallax backdrop</option>
                              <option value="zoom">Magnified Hover Scale</option>
                            </select>
                          </div>
                        </details>
                      </div>

                      {/* Mobile Layout configurations group */}
                      <div className="pt-1.5">
                        <details className="group border rounded-lg bg-white overflow-hidden transition-all text-[#303030]">
                          <summary className="flex justify-between items-center p-3 font-bold text-[10.5px] cursor-pointer bg-[#fafafa] list-none">
                            <span>Mobile Layout</span>
                            <span className="transition-transform group-open:rotate-180">▼</span>
                          </summary>
                          <div className="p-3 bg-white space-y-3.5 border-t">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold">Mobile content alignment:</label>
                              <div className="grid grid-cols-3 gap-1 bg-[#f4f4f4] rounded-lg p-1 border">
                                {['left', 'center', 'right'].map(align => (
                                  <button
                                    type="button"
                                    key={align}
                                    onClick={() => handleUpdateActiveSectionSettings('mobileAlignment', align)}
                                    className={`py-1 rounded text-[10px] font-semibold capitalize bg-transparent ${
                                      s.mobileAlignment === align ? 'bg-white shadow text-[#1a1a1a] font-bold' : 'text-slate-400'
                                    }`}
                                  >
                                    {align}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold">Stack images on mobile</label>
                              <button 
                                type="button"
                                onClick={() => handleUpdateActiveSectionSettings('stackImagesMobile', !s.stackImagesMobile)}
                                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-150 ${s.stackImagesMobile ? 'bg-blue-600' : 'bg-slate-300'}`}
                              >
                                <div className={`bg-white w-3 h-3 rounded-full transform transition-transform duration-150 ${s.stackImagesMobile ? 'translate-x-4' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          </div>
                        </details>
                      </div>

                    </div>
                  );
                })()
              )}

            </div>

            {/* Global theme settings accordion at the bottom as shown in the screenshot */}
            <div className="p-3 border-t bg-[#fafafa] shrink-0 text-left select-none">
              <div 
                onClick={() => alert('Opening Global Theme configurations! You can switch colors from the sidebar tab too.')}
                className="flex justify-between items-center text-xs font-bold text-[#1a1a1a] cursor-pointer hover:text-blue-600 transition"
              >
                <span className="flex items-center gap-1.5">🎨 Theme Settings</span>
                <span>▶</span>
              </div>
            </div>

          </aside>

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
              <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg">
                <span className="text-[9.5px] font-mono text-slate-400 uppercase font-bold">Image Grid ({images.length} pictures)</span>
                <button
                  type="button"
                  onClick={() => {
                    const newImages = [...images, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'];
                    updateFn('images', newImages);
                  }}
                  className="text-[10px] text-blue-400 font-bold hover:text-blue-300 font-mono"
                >
                  + ADD IMAGE BLOCK
                </button>
              </div>
              {images.map((img: string, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-500 font-bold">Image #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = images.filter((_, i) => i !== idx);
                        updateFn('images', newImages);
                      }}
                      className="text-[9px] text-red-400 hover:text-red-300 font-bold"
                    >
                      Remove
                    </button>
                  </div>
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
              <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg">
                <span className="text-[9.5px] font-mono text-slate-400 uppercase font-bold">Team Members ({members.length} persons)</span>
                <button
                  type="button"
                  onClick={() => {
                    const newMembers = [...members, {
                      name: 'New Expert Advisor',
                      role: 'Licensed Property Advisor',
                      bio: 'Helping clients with property validation support.',
                      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
                    }];
                    updateFn('members', newMembers);
                  }}
                  className="text-[10px] text-blue-400 font-bold hover:text-blue-300 font-mono"
                >
                  + ADD TEAM MEMBER
                </button>
              </div>
              {members.map((member: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-500 font-bold">Member #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newMembers = members.filter((_, i: number) => i !== idx);
                        updateFn('members', newMembers);
                      }}
                      className="text-[9px] text-red-400 hover:text-red-300 font-bold"
                    >
                      Remove
                    </button>
                  </div>
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
              <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg">
                <span className="text-[9.5px] font-mono text-slate-400 uppercase font-bold text-slate-300">Metrics Grid ({stats.length} metrics)</span>
                <button
                  type="button"
                  onClick={() => {
                    const newStats = [...stats, { label: 'New Metric Name', value: '100+' }];
                    updateFn('stats', newStats);
                  }}
                  className="text-[10px] text-blue-400 font-bold hover:text-blue-300 font-mono"
                >
                  + ADD STATS
                </button>
              </div>
              {stats.map((stat: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-855 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-500 font-bold font-mono">Stat #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newStats = stats.filter((_, i: number) => i !== idx);
                        updateFn('stats', newStats);
                      }}
                      className="text-[9px] text-red-400 hover:text-red-300 font-bold"
                    >
                      Remove
                    </button>
                  </div>
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
    return (
      <PageSectionsRenderer
        sections={[sec]}
        properties={properties}
        currentLanguage={currentLanguage}
        onViewDetails={(pid) => alert(`Clicked property detail id: ${pid} inside preview simulation layout.`)}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedType="all"
        setSelectedType={() => {}}
        selectedPriceRange="all"
        setSelectedPriceRange={() => {}}
        t={translations[currentLanguage] || translations.en}
      />
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
