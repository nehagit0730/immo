export interface TranslationMap {
  en: string;
  fr: string;
  sw: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'client';
  createdAt: string;
}

export type PropertyType = 'house' | 'land' | 'commercial' | 'rental' | 'investment';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number; // in USD or BIF (will display both nicely based on conversion)
  currency: 'USD' | 'BIF';
  type: PropertyType;
  location: string;
  city: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string; // e.g. "250 sqm" or "1000 sqm"
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  verified: boolean;
  gpsLocation?: string;
  createdAt: string;
}

export interface WebPage {
  id: string;
  slug: string;
  title: TranslationMap;
  content: TranslationMap;
  isHomepage: boolean;
  systemPage: boolean; // if true, it's one of the predefined pages
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  status: 'sent';
  sentAt: string;
  type: 'approval' | 'rejection';
  propertyTitle: string;
}

export interface SystemStats {
  totalProperties: number;
  approvedProperties: number;
  pendingProperties: number;
  rejectedProperties: number;
  totalUsers: number;
  totalViews: number; // simulated
  totalInquiries: number; // simulated
}
