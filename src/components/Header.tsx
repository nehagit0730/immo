import { useState } from 'react';
import { User } from '../types';
import { Language, translations } from '../translations';
import { ShieldCheck, User as UserIcon, LogOut, Globe, Menu, X, ChevronDown, Award } from 'lucide-react';
import { getThemeSettings } from '../theme';

interface HeaderProps {
  user: User | null;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onNavigate: (view: string, pageId?: string) => void;
  currentView: string;
}

export default function Header({
  user,
  currentLanguage,
  onLanguageChange,
  onLoginClick,
  onLogoutClick,
  onNavigate,
  currentView
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [legalDropdownOpen, setLegalDropdownOpen] = useState(false);
  
  const { colors, headerTitle } = getThemeSettings();
  const t = translations[currentLanguage];

  const handleLinkClick = (view: string, pageId?: string) => {
    onNavigate(view, pageId);
    setMobileMenuOpen(false);
    setLegalDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white text-slate-800 border-b border-slate-200 shadow-sm h-16 flex items-center shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center cursor-pointer" onClick={() => handleLinkClick('home')}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl mr-3 shadow-sm ${colors.primaryBg} ${colors.primaryHover} transition-colors`}>
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className={`font-sans font-black leading-none text-base tracking-tight flex items-center ${colors.primaryText}`}>
                {headerTitle}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.14em] leading-none mt-1">
                {currentLanguage === 'en' ? 'Verified Workspace' : currentLanguage === 'fr' ? 'Espace Vérifié' : 'Uhakiki Salama'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 font-bold text-xs uppercase tracking-widest text-[#475569]">
            <button 
              onClick={() => handleLinkClick('home')}
              className={`pb-1 transition-all cursor-pointer hover:opacity-80 ${
                currentView === 'home' 
                  ? `${colors.primaryText} border-b-2 ${colors.primaryBorder} font-extrabold` 
                  : 'text-slate-600'
              }`}
            >
              {t.navHome}
            </button>
            <button 
              onClick={() => handleLinkClick('about')}
              className={`pb-1 transition-all cursor-pointer hover:opacity-80 ${
                currentView === 'about' 
                  ? `${colors.primaryText} border-b-2 ${colors.primaryBorder} font-extrabold` 
                  : 'text-slate-600'
              }`}
            >
              {t.navAbout}
            </button>

            {/* Legal Pages Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLegalDropdownOpen(!legalDropdownOpen)}
                className={`flex items-center pb-1 transition-all focus:outline-none cursor-pointer hover:opacity-80 ${
                  ['disclaimer', 'agreement', 'privacy', 'terms'].includes(currentView)
                    ? `${colors.primaryText} border-b-2 ${colors.primaryBorder} font-extrabold`
                    : 'text-slate-600'
                }`}
              >
                <span>{currentLanguage === 'en' ? 'Integrity' : currentLanguage === 'fr' ? 'Conformité' : 'Sheria'}</span>
                <ChevronDown className={`w-3.5 h-3.5 ml-1 transform transition-transform ${legalDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {legalDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLegalDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-md bg-white border border-slate-200 z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => handleLinkClick('disclaimer')}
                        className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors uppercase font-bold tracking-wider ${colors.primaryText}`}
                      >
                        {t.navDisclaimer}
                      </button>
                      <button
                        onClick={() => handleLinkClick('agreement')}
                        className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors font-extrabold uppercase tracking-wider border-t border-slate-100 ${colors.primaryText}`}
                      >
                        ✍️ {t.navAgreement}
                      </button>
                      <button
                        onClick={() => handleLinkClick('privacy')}
                        className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors uppercase font-bold tracking-wider border-t border-slate-100 ${colors.primaryText}`}
                      >
                        {t.navPrivacy}
                      </button>
                      <button
                        onClick={() => handleLinkClick('terms')}
                        className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors uppercase font-bold tracking-wider border-t border-slate-100 ${colors.primaryText}`}
                      >
                        {t.navTerms}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => handleLinkClick('contact')}
              className={`pb-1 transition-all cursor-pointer hover:opacity-80 ${
                currentView === 'contact' 
                  ? `${colors.primaryText} border-b-2 ${colors.primaryBorder} font-extrabold` 
                  : 'text-slate-600'
              }`}
            >
              {t.navContact}
            </button>
          </nav>

          {/* Controls: Language and Login */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector */}
            <div className="flex items-center space-x-1.5 border border-slate-200 px-2.5 py-1 rounded-sm bg-slate-50">
              <Globe className="w-3.5 h-3.5 text-slate-500 mr-0.5" />
              {(['en', 'fr', 'sw'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                    currentLanguage === lang 
                      ? `${colors.primaryBg} text-white font-extrabold` 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* User Account / Dashboard Buttons */}
            {user ? (
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <button
                  onClick={() => handleLinkClick(user.role === 'admin' ? 'admin-dashboard' : 'client-dashboard')}
                  className={`flex items-center text-blue-750 border px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${colors.lightBg} ${colors.lightBorder}`}
                >
                  <Award className="w-3.5 h-3.5 mr-1.5" />
                  {user.role === 'admin' ? t.navAdminDash : t.navClientDash}
                </button>
                <div className="text-right hidden xl:block">
                  <div className="text-xs font-bold text-slate-800 leading-none">{user.name}</div>
                  <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mt-0.5">{user.role}</div>
                </div>
                <button 
                  onClick={onLogoutClick}
                  className="p-1.5 rounded-sm text-slate-400 hover:text-red-750 hover:bg-slate-100 transition-all cursor-pointer"
                  title={t.navLogout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className={`flex items-center text-white px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer ${colors.primaryBg} ${colors.primaryHover}`}
              >
                <UserIcon className="w-3.5 h-3.5 mr-1.5" />
                {t.navLogin}
              </button>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Quick Mobile Language Selector */}
            <div className="flex items-center space-x-1 border border-slate-200 px-1.5 py-0.5 rounded-sm bg-slate-50">
              {(['en', 'fr', 'sw'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-1.5 text-[10px] font-mono rounded-sm cursor-pointer ${
                    currentLanguage === lang 
                      ? 'bg-blue-700 text-white font-bold' 
                      : 'text-slate-500'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 py-3 px-4 space-y-2 text-slate-800 shadow-lg animate-in slide-in-from-top duration-150 absolute top-16 left-0 w-full z-45">
          <button 
            onClick={() => handleLinkClick('home')}
            className={`block w-full text-left px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider ${
              currentView === 'home' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.navHome}
          </button>
          <button 
            onClick={() => handleLinkClick('about')}
            className={`block w-full text-left px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider ${
              currentView === 'about' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.navAbout}
          </button>

          <span className="block px-3 pt-2 pb-1 text-[9px] font-mono tracking-widest text-slate-400 uppercase font-bold">
            {currentLanguage === 'en' ? 'LEGAL & INTEGRITY' : 'CONFORMITÉ ET DOCUMENTS'}
          </span>
          <button 
            onClick={() => handleLinkClick('disclaimer')}
            className={`block w-full text-left px-5 py-1.5 text-xs text-slate-600 uppercase font-bold tracking-wider hover:bg-slate-50 ${
              currentView === 'disclaimer' ? 'text-blue-700 font-extrabold' : ''
            }`}
          >
            {t.navDisclaimer}
          </button>
          <button 
            onClick={() => handleLinkClick('agreement')}
            className={`block w-full text-left px-5 py-1.5 text-xs text-slate-600 uppercase font-bold tracking-wider hover:bg-slate-50 ${
              currentView === 'agreement' ? 'text-blue-700 font-extrabold' : ''
            }`}
          >
            ✍️ {t.navAgreement}
          </button>
          <button 
            onClick={() => handleLinkClick('privacy')}
            className={`block w-full text-left px-5 py-1.5 text-xs text-slate-600 uppercase font-bold tracking-wider hover:bg-slate-50 ${
              currentView === 'privacy' ? 'text-blue-700 font-extrabold' : ''
            }`}
          >
            {t.navPrivacy}
          </button>
          <button 
            onClick={() => handleLinkClick('terms')}
            className={`block w-full text-left px-5 py-1.5 text-xs text-slate-600 uppercase font-bold tracking-wider hover:bg-slate-50 ${
              currentView === 'terms' ? 'text-blue-700 font-extrabold' : ''
            }`}
          >
            {t.navTerms}
          </button>

          <button 
            onClick={() => handleLinkClick('contact')}
            className={`block w-full text-left px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider ${
              currentView === 'contact' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.navContact}
          </button>

          {/* Account Section Mobile */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            {user ? (
              <>
                <div className="px-3 text-xs font-bold text-slate-800 uppercase tracking-wider">{user.name} ({user.role})</div>
                <button
                  onClick={() => handleLinkClick(user.role === 'admin' ? 'admin-dashboard' : 'client-dashboard')}
                  className="flex items-center w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/50 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider"
                >
                  <Award className="w-4 h-4 mr-2" />
                  {user.role === 'admin' ? t.navAdminDash : t.navClientDash}
                </button>
                <button
                  onClick={onLogoutClick}
                  className="flex items-center w-full bg-red-50 hover:bg-red-105 text-red-700 border border-red-200/50 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t.navLogout}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="flex items-center justify-center w-full bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider shadow-sm"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                {t.navLogin}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
