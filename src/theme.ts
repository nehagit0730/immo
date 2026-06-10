export type ThemeSchema = 'blue' | 'slate' | 'emerald' | 'indigo' | 'rose' | 'amber' | 'teal';

export interface ThemeColors {
  primaryBg: string;      // e.g. bg-blue-600
  primaryHover: string;   // e.g. hover:bg-blue-700
  primaryText: string;    // e.g. text-blue-600
  primaryBorder: string;  // e.g. border-blue-600
  lightBg: string;        // e.g. bg-blue-50/50
  lightBorder: string;    // e.g. border-blue-100
  gradientHero: string;   // for high-tech background gradients
  badgeClass: string;     // color scheme specific status badge
}

export const themesMap: Record<ThemeSchema, ThemeColors> = {
  blue: {
    primaryBg: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryText: 'text-blue-600',
    primaryBorder: 'border-blue-600',
    lightBg: 'bg-blue-50/40',
    lightBorder: 'border-blue-100',
    gradientHero: 'from-blue-900/40 to-transparent',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  },
  slate: {
    primaryBg: 'bg-slate-800',
    primaryHover: 'hover:bg-slate-900',
    primaryText: 'text-slate-800',
    primaryBorder: 'border-slate-800',
    lightBg: 'bg-slate-100/50',
    lightBorder: 'border-slate-200',
    gradientHero: 'from-slate-800/40 to-transparent',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  },
  emerald: {
    primaryBg: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryText: 'text-emerald-600',
    primaryBorder: 'border-emerald-600',
    lightBg: 'bg-emerald-50/40',
    lightBorder: 'border-emerald-100',
    gradientHero: 'from-emerald-900/40 to-transparent',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  indigo: {
    primaryBg: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    primaryText: 'text-indigo-600',
    primaryBorder: 'border-indigo-600',
    lightBg: 'bg-indigo-50/40',
    lightBorder: 'border-indigo-100',
    gradientHero: 'from-indigo-900/40 to-transparent',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
  },
  rose: {
    primaryBg: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    primaryText: 'text-rose-600',
    primaryBorder: 'border-rose-600',
    lightBg: 'bg-rose-50/40',
    lightBorder: 'border-rose-100',
    gradientHero: 'from-rose-900/40 to-transparent',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  },
  amber: {
    primaryBg: 'bg-amber-500',
    primaryHover: 'hover:bg-amber-600',
    primaryText: 'text-amber-655',
    primaryBorder: 'border-amber-500',
    lightBg: 'bg-amber-50/40',
    lightBorder: 'border-amber-100',
    gradientHero: 'from-amber-900/40 to-transparent',
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  },
  teal: {
    primaryBg: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    primaryText: 'text-teal-600',
    primaryBorder: 'border-teal-600',
    lightBg: 'bg-teal-50/40',
    lightBorder: 'border-teal-100',
    gradientHero: 'from-teal-900/40 to-transparent',
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
  }
};

export function getThemeSettings() {
  const schema = (localStorage.getItem('ib_theme') as ThemeSchema) || 'blue';
  const header = localStorage.getItem('ib_header') || 'IMMO BURUNDI';
  const footer = localStorage.getItem('ib_footer') || '© 2026 IMMO BURUNDI Private Limited. All rights reserved.';
  const announcement = localStorage.getItem('ib_announcement') || '🌿 Secure Cadastral Approvals & Land Registration In Burundi Since 2018';
  
  return {
    schema,
    colors: themesMap[schema] || themesMap.blue,
    headerTitle: header,
    footerCopyright: footer,
    announcementText: announcement
  };
}
