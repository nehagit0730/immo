import { Property, WebPage, User, EmailLog, SystemStats } from './types';

// Keep reference to original window.fetch before it gets overridden
const originalFetch = typeof window !== 'undefined' ? window.fetch : null;

// Client-side simulated database schema
export interface LocalDatabaseSchema {
  users: User[];
  properties: Property[];
  pages: WebPage[];
  emails: EmailLog[];
  stats: SystemStats;
}

const PROPERTY_IMAGES = {
  villa: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
  ],
  apartment: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
  ],
  commercial: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
  ],
  land: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80'
  ]
};

const defaultPages: WebPage[] = [
  {
    id: 'home',
    slug: 'home',
    title: {
      en: 'Welcome to IMMO BURUNDI',
      fr: 'Bienvenue chez IMMO BURUNDI',
      sw: 'Karibu kwenye IMMO BURUNDI'
    },
    content: {
      en: 'Discover the most secure, verified, and professional real estate platform in Burundi. Whether you are looking for a luxury villa in Bujumbura, commercial spaces in Gitega, beachfront investment plots in Rumonge, or professional brokerage assistance, IMMO BURUNDI connects verified owners and clients with absolute transparency. Experience the difference of premium verified documents and active support.',
      fr: 'Découvrez la plateforme immobilière la plus sécurisée, vérifiée et professionnelle du Burundi. Que vous recherchiez une villa de luxe à Bujumbura, des espaces commerciaux à Gitega, des terrains d\'investissement au bord du lac à Rumonge, ou une assistance en courtage professionnel, IMMO BURUNDI met en relation des propriétaires vérifiés et des clients en toute transparence.',
      sw: 'Gundua jukwaa la mali isiyohamishika lililolindwa zaidi, lililoidhinishwa na la kitaaluma nchini Burundi. Orodha za mali zimethibitishwa na jukwaa letu.'
    },
    isHomepage: true,
    systemPage: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'about',
    slug: 'about',
    title: {
      en: 'About IMMO BURUNDI',
      fr: 'À Propos de IMMO BURUNDI',
      sw: 'Kuhusu IMMO BURUNDI'
    },
    content: {
      en: `IMMO BURUNDI is a modern real estate marketplace and brokerage platform designed to improve transparency, accessibility, and trust in the real estate sector of Burundi.

Our mission is to connect property owners, buyers, tenants, investors, and agents through a secure and professional digital platform.

We provide:
* Property listings
* Property verification services
* Rental support
* Property promotion
* Real estate brokerage assistance
* Digital property management solutions

Our platform combines technology, verification processes, and professional oversight to help reduce fraud and improve confidence in property transactions.

IMMO BURUNDI supports:
* Houses
* Land
* Commercial properties
* Rental properties
* Investment opportunities

Our multilingual platform supports English, French, Swahili.`,
      fr: `IMMO BURUNDI est un marché immobilier moderne et une plateforme de courtage conçus pour améliorer la transparence, l'accessibilité et la confiance dans le secteur de l'immobilier au Burundi.

Notre mission est de connecter les propriétaires de biens, les acheteurs, les locataires, les investisseurs et les agents grâce à une plateforme numérique sécurisée et professionnelle.

Nous fournissons :
* Annonces immobilières
* Services de vérification de propriété
* Support de location
* Promotion immobilière`,
      sw: `IMMO BURUNDI ni soko la kisasa la mali isiyohamishika na jukwaa la udalali lililoundwa ili kuboresha uwazi, upatikanaji, na uaminifu katika sekta ya mali isiyohamishika nchini Burundi.`
    },
    isHomepage: false,
    systemPage: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'disclaimer',
    slug: 'verification-disclaimer',
    title: {
      en: 'Property Verification Disclaimer',
      fr: 'Clause d\'Exclusion de Responsabilité de Vérification',
      sw: 'Kanusho la Uhakiki wa Mali'
    },
    content: {
      en: `### Official Verification Disclaimer

IMMO BURUNDI performs document verification based on the documents, records, and information presented by the property owner, representative, agent, or seller at the time of verification.

A property marked as **"Verified"** or **"Fully Verified"** means that IMMO BURUNDI reviewed and verified the authenticity and consistency of the submitted documents to the best of its operational capability at the time of review.`,
      fr: `### Clause officielle de non-responsabilité pour la vérification

IMMO BURUNDI effectue la vérification des documents sur la base des documents, dossiers et informations présentés par le propriétaire, le représentant, l'agent ou le vendeur du bien au moment de la vérification.`,
      sw: `### Kanusho Rasmi la Uhakiki wa Hati

IMMO BURUNDI hufanya uhakiki wa nyaraka kulingana na hati, rekodi, na habari zilizowasilishwa na mmiliki wa mali, mwakilishi, wakala, au muuzaji wakati wa uhakiki.`
    },
    isHomepage: false,
    systemPage: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'privacy',
    slug: 'privacy-policy',
    title: {
      en: 'Privacy Policy',
      fr: 'Politique de Confidentialité',
      sw: 'Sera ya Faragha'
    },
    content: {
      en: `### IMMO BURUNDI PRIVACY POLICY
Effective Date: June 1, 2026

IMMO BURUNDI respects the privacy of all users, clients, agents, and visitors using our platform.`,
      fr: `### POLITIQUE DE CONFIDENTIALITÉ DE IMMO BURUNDI
Date d'effet : 1er Juin 2026

IMMO BURUNDI respecte la vie privée de tous les utilisateurs, clients, agents et visiteurs de notre plateforme.`,
      sw: `### SERA YA FARAGHA YA IMMO BURUNDI

IMMO BURUNDI inaheshimu faragha ya watumiaji wote, wateja, mawakala, na wageni wanaotumia jukwaa letu.`
    },
    isHomepage: false,
    systemPage: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'terms',
    slug: 'terms-and-conditions',
    title: {
      en: 'Terms & Conditions',
      fr: 'Conditions Générales',
      sw: 'Sheria na Masharti'
    },
    content: {
      en: `### IMMO BURUNDI TERMS & CONDITIONS
Effective Date: June 1, 2026

These Terms & Conditions govern the use of the IMMO BURUNDI platform. By accessing or using the platform, users agree to comply with these terms.`,
      fr: `### IMMO BURUNDI CONDITIONS GÉNÉRALES
Date d'effet : 1er Juin 2026

Ces Conditions Générales régissent l'utilisation de la plateforme IMMO BURUNDI. En utilisant notre plateforme, vous acceptez de vous conformer à ces règles.`,
      sw: `### SHERIA NA MASHARTI YA IMMO BURUNDI

Sheria na Masharti haya yanasimamia matumizi ya jukwaa la IMMO BURUNDI.`
    },
    isHomepage: false,
    systemPage: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'agreement',
    slug: 'service-agreement',
    title: {
      en: 'Service Agreement & Contract',
      fr: 'Contrat de Prestation de Service',
      sw: 'Mkataba wa Huduma'
    },
    content: {
      en: `### IMMO BURUNDI SERVICE AGREEMENT & CONTRACT TEMPLATE

This legally binding Agreement is entered into between:

#### COMPANY INFORMATION
* **Company Name:** IMMO BURUNDI (Private Limited, Burundi)
* **Address:** Boulevard de l'Uprona, Rohero, Bujumbura, Burundi
* **Phone:** +257 22 22 45 45
* **Email:** support@immoburundi.bi`,
      fr: `### ACCORD DE SERVICE ET MODÈLE DE CONTRAT IMMO BURUNDI

Cet accord de service est conclu entre IMMO BURUNDI et le Client soussigné :`,
      sw: `### MKATABA WA HUDUMA NA MASHARTI YA IMMO BURUNDI

Mkataba huu wa kisheria unawekwa kati ya Kampuni ya IMMO BURUNDI na Mteja:`
    },
    isHomepage: false,
    systemPage: true,
    updatedAt: new Date().toISOString()
  }
];

const defaultProperties: Property[] = [
  {
    id: 'p1',
    title: 'Luxury 5-Bedroom Villa at Kiriri Hills',
    description: 'Breathtaking luxury villa situated in the exclusive Kiriri Hillside district, overlooking the magnificent Lake Tanganyika and the Bujumbura city skyline. Features high-security compound walls, premium marble flooring, an open-concept kitchen, elegant terraces, a swimming pool, and pristine verified land title documents. Ready for immediate relocation.',
    price: 320005,
    currency: 'USD',
    type: 'house',
    location: 'Avenue de la Colline, Kiriri',
    city: 'Bujumbura',
    bedrooms: 5,
    bathrooms: 4,
    area: '450 sqm',
    images: [PROPERTY_IMAGES.villa[0], PROPERTY_IMAGES.villa[1]],
    ownerId: 'admin',
    ownerName: 'Immo Burundi Brokerage',
    ownerPhone: '+257 22 22 45 45',
    ownerEmail: 'brokerage@immoburundi.bi',
    status: 'approved',
    verified: true,
    gpsLocation: '-3.3768, 29.3812',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p2',
    title: 'Modern Commercial Office Complex in Rohero I',
    description: 'A premium 3-level commercial building strategically located in Rohero I, the central banking and administrative heart of Bujumbura. Generous parking capacity, dynamic open-floor space, integrated fiber optic networks, central solar backing generators, and fully verified urban planning authorizations.',
    price: 850000,
    currency: 'USD',
    type: 'commercial',
    location: 'Boulevard de l\'Uprona, Rohero I',
    city: 'Bujumbura',
    area: '1200 sqm',
    images: [PROPERTY_IMAGES.commercial[0], PROPERTY_IMAGES.commercial[1]],
    ownerId: 'admin',
    ownerName: 'Immo Burundi Brokerage',
    ownerPhone: '+257 22 22 45 45',
    ownerEmail: 'brokerage@immoburundi.bi',
    status: 'approved',
    verified: true,
    gpsLocation: '-3.3854, 29.3644',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p3',
    title: 'Pristine Beachfront Investment Land in Rumonge',
    description: 'Incredible prime investment parcel right on the sandy shores of Lake Tanganyika, located just outside Rumonge town. Highly desirable for constructing a beachfront resort, luxury lodging, or private vacation villas.',
    price: 180000000,
    currency: 'BIF',
    type: 'investment',
    location: 'Route de Rumonge, Beachfront Zone',
    city: 'Rumonge',
    area: '2500 sqm',
    images: [PROPERTY_IMAGES.land[0], PROPERTY_IMAGES.land[1]],
    ownerId: 'admin',
    ownerName: 'Immo Burundi Brokerage',
    ownerPhone: '+257 22 22 45 45',
    ownerEmail: 'brokerage@immoburundi.bi',
    status: 'approved',
    verified: true,
    gpsLocation: '-3.9712, 29.4355',
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p4',
    title: 'Elegant 3-Bedroom Rental Apartment in Kinindo',
    description: 'Fully furnished, high-end 3-bedroom, 2.5-bathroom rental apartment situated in a secure apartment gated community in Kinindo.',
    price: 2400000,
    currency: 'BIF',
    type: 'rental',
    location: 'Avenue de la Plage, Kinindo',
    city: 'Bujumbura',
    bedrooms: 3,
    bathrooms: 2,
    area: '180 sqm',
    images: [PROPERTY_IMAGES.apartment[0], PROPERTY_IMAGES.apartment[1]],
    ownerId: 'admin',
    ownerName: 'Immo Burundi Brokerage',
    ownerPhone: '+257 22 22 45 45',
    ownerEmail: 'brokerage@immoburundi.bi',
    status: 'approved',
    verified: false,
    gpsLocation: '-3.4124, 29.3511',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p5',
    title: 'Excellent Farming & Agricultural Plot in Gitega',
    description: 'Fertile, high-elevation farming and development land situated in Gitega, the political capital of Burundi. Perfect soil conditions for coffee planting, cash crops, or building an expansive suburban homestead. Securely fenced with official cadaster demarcations.',
    price: 65000000,
    currency: 'BIF',
    type: 'land',
    location: 'Karera Development Sector',
    city: 'Gitega',
    area: '5000 sqm',
    images: [PROPERTY_IMAGES.land[1], PROPERTY_IMAGES.land[0]],
    ownerId: 'user_david',
    ownerName: 'David Nduwimana',
    ownerPhone: '+257 79 99 88 77',
    ownerEmail: 'client@immoburundi.bi',
    status: 'pending',
    verified: false,
    gpsLocation: '-3.4285, 29.9248',
    createdAt: new Date().toISOString()
  }
];

const defaultUsers: User[] = [
  {
    id: 'admin',
    email: 'admin@immoburundi.bi',
    name: 'Administrator',
    phone: '+257 22 22 45 45',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_david',
    email: 'client@immoburundi.bi',
    name: 'David Nduwimana',
    phone: '+257 79 99 88 77',
    role: 'client',
    createdAt: new Date().toISOString()
  }
];

// In-memory cache to guarantee database state persistence even if localStorage is full/blocked due to base64 images
let simulatedDbCache: LocalDatabaseSchema | null = null;

// Load Database from localStorage
function getLocalDatabase(): LocalDatabaseSchema {
  if (simulatedDbCache) {
    return simulatedDbCache;
  }

  const stored = localStorage.getItem('ib_db');
  if (stored) {
    try {
      simulatedDbCache = JSON.parse(stored);
      return simulatedDbCache!;
    } catch (e) {
      console.error('Failed to parse local simulated db, resetting to defaults', e);
    }
  }

  const initialData: LocalDatabaseSchema = {
    users: defaultUsers,
    properties: defaultProperties,
    pages: defaultPages,
    emails: [],
    stats: {
      totalProperties: 5,
      approvedProperties: 4,
      pendingProperties: 1,
      rejectedProperties: 0,
      totalUsers: 2,
      totalViews: 1250,
      totalInquiries: 48
    }
  };
  simulatedDbCache = initialData;
  saveLocalDatabase(initialData);
  return initialData;
}

// Save Database to localStorage
function saveLocalDatabase(db: LocalDatabaseSchema) {
  // Recalculate stats dynamically for accuracy
  db.stats.totalProperties = db.properties.length;
  db.stats.approvedProperties = db.properties.filter(p => p.status === 'approved').length;
  db.stats.pendingProperties = db.properties.filter(p => p.status === 'pending').length;
  db.stats.rejectedProperties = db.properties.filter(p => p.status === 'rejected').length;
  db.stats.totalUsers = db.users.length;
  
  // Always update in-memory cache
  simulatedDbCache = db;
  
  try {
    localStorage.setItem('ib_db', JSON.stringify(db));
  } catch (err) {
    console.error('[IMMO BURUNDI LOCAL STORAGE ERROR] Quota limits exceeded or localStorage blocked. Saving in-memory state.', err);
  }
}

// Intercept window.fetch globally to allow client-only deployment on Vercel
export async function ibFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // Check if the request targets /api
  if (!urlStr.includes('/api/')) {
    return originalFetch ? originalFetch(input, init) : window.fetch(input, init);
  }

  // Determine if we are deployed on Vercel, or if mock mode is forced, or if the server response is invalid html
  const isVercel = window.location.hostname.includes('vercel.app') || window.location.search.includes('mock=true');

  if (!isVercel) {
    try {
      // Run check to see if server-side is alive and returns JSON properly
      const response = originalFetch ? await originalFetch(input, init) : await window.fetch(input, init);
      const contentType = response.headers.get('content-type') || '';
      
      // If it's a 404 or page is HTML (like Vercel default SPA HTML)
      if (response.status === 404 || contentType.includes('text/html')) {
        console.warn(`[IMMO BURUNDI API REDIRECT] Received HTML or 404 on ${urlStr}. Falling back to clean localStorage simulation mode.`);
        // Continue to simulation below
      } else {
        return response;
      }
    } catch (err) {
      console.warn('[IMMO BURUNDI API REDIRECT] Server-side is unreachable, switching to localStorage simulation.', err);
      // Continue to simulation below
    }
  }

  // Parse path and query params for routing
  const url = new URL(urlStr, window.location.origin);
  const pathname = url.pathname;
  const searchParams = url.searchParams;
  const method = init?.method?.toUpperCase() || 'GET';
  const bodyStr = init?.body ? String(init.body) : null;
  let body: any = null;
  if (bodyStr) {
    try {
      body = JSON.parse(bodyStr);
    } catch {
      // Ignore
    }
  }

  const db = getLocalDatabase();
  const generateId = () => Math.random().toString(36).substring(2, 11);

  console.log(`[SIMULATED BACKEND API] ${method} ${pathname}`, { query: Object.fromEntries(searchParams.entries()), body });

    // =============================
    // ROUTER SIMULATION
    // =============================

    // 1. GET /api/properties
    if (pathname === '/api/properties' && method === 'GET') {
      const role = searchParams.get('role');
      const ownerId = searchParams.get('ownerId');

      let properties = [...db.properties];

      if (ownerId && role !== 'admin') {
        properties = properties.filter(p => p.ownerId === ownerId);
      } else if (role !== 'admin') {
        properties = properties.filter(p => p.status === 'approved');
      }

      return new Response(JSON.stringify(properties), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. POST /api/properties
    if (pathname === '/api/properties' && method === 'POST') {
      const { 
        title, description, price, currency, type, location, city, 
        bedrooms, bathrooms, area, images, ownerId, role 
      } = body;

      if (!title || !description || !price || !location || !city) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let ownerName = 'Admin Brokerage';
      let ownerPhone = '+257 22 22 45 45';
      let ownerEmail = 'brokerage@immoburundi.bi';

      if (ownerId && ownerId !== 'admin') {
        const owner = db.users.find(u => u.id === ownerId);
        if (owner) {
          ownerName = owner.name;
          ownerPhone = owner.phone;
          ownerEmail = owner.email;
        }
      }

      const fallbackImagesByProperty = {
        house: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        land: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
        commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        rental: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        investment: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80'
      };

      const finalImages = images && images.length > 0 && images[0] !== '' 
        ? images 
        : [fallbackImagesByProperty[type as keyof typeof fallbackImagesByProperty] || fallbackImagesByProperty.house];

      const newProperty: Property = {
        id: 'p_' + generateId(),
        title,
        description,
        price: Number(price),
        currency: currency || 'USD',
        type,
        location,
        city,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        area: area || undefined,
        images: finalImages,
        ownerId: ownerId || 'admin',
        ownerName,
        ownerPhone,
        ownerEmail,
        status: role === 'admin' ? 'approved' : 'pending',
        verified: role === 'admin',
        createdAt: new Date().toISOString()
      };

      db.properties.push(newProperty);
      saveLocalDatabase(db);

      return new Response(JSON.stringify(newProperty), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. PUT /api/properties/:id
    if (pathname.startsWith('/api/properties/') && method === 'PUT') {
      const segments = pathname.split('/');
      const id = segments[segments.length - 1];

      const idx = db.properties.findIndex(p => p.id === id);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: 'Property not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const current = db.properties[idx];
      db.properties[idx] = {
        ...current,
        ...body,
        status: body.role === 'admin' ? current.status : 'pending'
      };

      saveLocalDatabase(db);

      return new Response(JSON.stringify(db.properties[idx]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. DELETE /api/properties/:id
    if (pathname.startsWith('/api/properties/') && method === 'DELETE') {
      const segments = pathname.split('/');
      const id = segments[segments.length - 1];

      const idx = db.properties.findIndex(p => p.id === id);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: 'Property not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      db.properties.splice(idx, 1);
      saveLocalDatabase(db);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. POST /api/properties/:id/review
    if (pathname.startsWith('/api/properties/') && pathname.endsWith('/review') && method === 'POST') {
      const segments = pathname.split('/');
      const id = segments[segments.length - 2];
      const { status, rejectionReason } = body;

      const property = db.properties.find(p => p.id === id);
      if (!property) {
        return new Response(JSON.stringify({ error: 'Property not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      property.status = status;
      if (status === 'rejected') {
        property.rejectionReason = rejectionReason || 'Information declared does not match cadastral documents.';
      } else {
        property.rejectionReason = undefined;
      }

      const emailSubject = status === 'approved' 
        ? `🎉 Congratulations! Your listing "${property.title}" has been approved`
        : `⚠️ Update Required: Your listing "${property.title}" has been rejected`;

      const emailBody = status === 'approved'
        ? `Dear ${property.ownerName},

We are thrilled to inform you that your property listing "${property.title}" located at "${property.location}, ${property.city}" has been thoroughly reviewed and Approved by the IMMO BURUNDI administrative panel.

Your listing is now officially live, fully discoverable, and searchable by potential buyers and tenants on our public marketplace!

You can track inquiries, views, and manage your listing directly from your Client Dashboard.

Thank you for choosing to list with Burundi's most trusted real estate ecosystem.

Best Regards,
The IMMO BURUNDI Verification Team
support@immoburundi.bi | +257 22 22 45 45`
        : `Dear ${property.ownerName},

Thank you for submitting your property listing "${property.title}" located at "${property.location}, ${property.city}" to IMMO BURUNDI.

We regret to inform you that after reviewing your uploaded information against cadastral references, your listing was NOT approved for public display at this time.

**Reason for Rejection:**
"${property.rejectionReason}"

**What should you do next?**
1. Log into your IMMO BURUNDI Client Dashboard.
2. Select the listing and make the necessary corrections or update document files.
3. Resubmit it for re-approval.

We are committed to maintaining a clean, highly reliable, and fraudulent-free platform in Burundi. Thank you for your understanding.

Best Regards,
The IMMO BURUNDI Compliance Team
support@immoburundi.bi | +257 22 22 45 45`;

      const mockEmail: EmailLog = {
        id: 'email_' + generateId(),
        recipientEmail: property.ownerEmail,
        recipientName: property.ownerName,
        subject: emailSubject,
        body: emailBody,
        status: 'sent',
        sentAt: new Date().toISOString(),
        type: status as 'approval' | 'rejection',
        propertyTitle: property.title
      };

      db.emails.unshift(mockEmail);
      saveLocalDatabase(db);

      return new Response(JSON.stringify({ success: true, property, email: mockEmail }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. POST /api/properties/:id/verify
    if (pathname.startsWith('/api/properties/') && pathname.endsWith('/verify') && method === 'POST') {
      const segments = pathname.split('/');
      const id = segments[segments.length - 2];

      const property = db.properties.find(p => p.id === id);
      if (!property) {
        return new Response(JSON.stringify({ error: 'Property not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      property.verified = !property.verified;
      saveLocalDatabase(db);

      return new Response(JSON.stringify({ success: true, property }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 7. GET /api/pages
    if (pathname === '/api/pages' && method === 'GET') {
      return new Response(JSON.stringify(db.pages), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 8. POST /api/pages
    if (pathname === '/api/pages' && method === 'POST') {
      const { title, content, slug, sections } = body;

      if (!title || !content || !slug) {
        return new Response(JSON.stringify({ error: 'Missing title, content, or slug' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      if (db.pages.some(p => p.slug === cleanSlug)) {
        return new Response(JSON.stringify({ error: 'A page with this URL slug already exists.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const newPage: WebPage = {
        id: 'page_' + generateId(),
        slug: cleanSlug,
        title: typeof title === 'object' ? title : { en: title, fr: title, sw: title },
        content: typeof content === 'object' ? content : { en: content, fr: content, sw: content },
        isHomepage: false,
        systemPage: false,
        sections: sections || [],
        updatedAt: new Date().toISOString()
      };

      db.pages.push(newPage);
      saveLocalDatabase(db);

      return new Response(JSON.stringify(newPage), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 9. PUT /api/pages/:id
    if (pathname.startsWith('/api/pages/') && method === 'PUT') {
      const segments = pathname.split('/');
      const id = segments[segments.length - 1];
      const { title, content, isHomepage, slug, sections } = body;

      const page = db.pages.find(p => p.id === id);
      if (!page) {
        return new Response(JSON.stringify({ error: 'Page not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (title) {
        page.title = typeof title === 'object' ? title : { ...page.title, en: title };
      }
      if (content) {
        page.content = typeof content === 'object' ? content : { ...page.content, en: content };
      }
      if (slug && !page.systemPage) {
        page.slug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      }
      if (sections) {
        page.sections = sections;
      }

      if (isHomepage === true) {
        db.pages.forEach(p => {
          p.isHomepage = (p.id === id);
        });
      }

      page.updatedAt = new Date().toISOString();
      saveLocalDatabase(db);

      return new Response(JSON.stringify(db.pages), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 10. DELETE /api/pages/:id
    if (pathname.startsWith('/api/pages/') && method === 'DELETE') {
      const segments = pathname.split('/');
      const id = segments[segments.length - 1];

      const pageIdx = db.pages.findIndex(p => p.id === id);
      if (pageIdx === -1) {
        return new Response(JSON.stringify({ error: 'Page not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (db.pages[pageIdx].systemPage) {
        return new Response(JSON.stringify({ error: 'Predefined system legal files or templates cannot be deleted.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      db.pages.splice(pageIdx, 1);
      saveLocalDatabase(db);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 11. GET /api/emails
    if (pathname === '/api/emails' && method === 'GET') {
      return new Response(JSON.stringify(db.emails), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 12. GET /api/stats
    if (pathname === '/api/stats' && method === 'GET') {
      return new Response(JSON.stringify(db.stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 13. POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { email, password } = body;

      if (email === 'admin@immoburundi.bi' && password === 'ImmoBurundiAdmin2026!') {
        const adminUser = db.users.find(u => u.role === 'admin');
        return new Response(JSON.stringify({ success: true, user: adminUser }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        return new Response(JSON.stringify({ success: true, user }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid email or password. Use demo credentials shown on the login page.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 14. POST /api/auth/register
    if (pathname === '/api/auth/register' && method === 'POST') {
      const { email, name, phone } = body;

      if (!email || !name || !phone) {
        return new Response(JSON.stringify({ error: 'Please provide email, name, and phone number.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return new Response(JSON.stringify({ error: 'Email already registered. Please log in.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const newUser: User = {
        id: 'user_' + generateId(),
        email,
        name,
        phone,
        role: 'client',
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);
      saveLocalDatabase(db);

      return new Response(JSON.stringify({ success: true, user: newUser }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 15. GET /api/media
    if (pathname === '/api/media' && method === 'GET') {
      const storedMedia = localStorage.getItem('ib_media');
      let mediaList = [];
      if (storedMedia) {
        try {
          mediaList = JSON.parse(storedMedia);
        } catch {
          mediaList = [];
        }
      }
      if (!mediaList || mediaList.length === 0) {
        mediaList = [
          { url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80", name: "kiriri_hill_villa.jpg", size: "450 KB", uploadedAt: "2026-06-02T10:00:00Z" },
          { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80", name: "rohero_executive_suite.jpg", size: "320 KB", uploadedAt: "2026-06-01T15:30:00Z" },
          { url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80", name: "rumonge_beach_plot.jpg", size: "610 KB", uploadedAt: "2026-05-31T09:15:00Z" },
          { url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80", name: "gitega_commercial_center.jpg", size: "780 KB", uploadedAt: "2026-05-30T14:45:00Z" }
        ];
        localStorage.setItem('ib_media', JSON.stringify(mediaList));
      }
      return new Response(JSON.stringify(mediaList), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 16. DELETE /api/media/:filename
    if (pathname.startsWith('/api/media/') && method === 'DELETE') {
      const segments = pathname.split('/');
      const filename = decodeURIComponent(segments[segments.length - 1]);
      const storedMedia = localStorage.getItem('ib_media');
      let mediaList = [];
      if (storedMedia) {
        try {
          mediaList = JSON.parse(storedMedia);
        } catch {
          mediaList = [];
        }
      }
      mediaList = mediaList.filter((m: any) => m.name !== filename);
      localStorage.setItem('ib_media', JSON.stringify(mediaList));

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 17. POST /api/upload (Simulated image upload to mock library)
    if (pathname === '/api/upload' && method === 'POST') {
      const storedMedia = localStorage.getItem('ib_media');
      let mediaList = [];
      if (storedMedia) {
        try {
          mediaList = JSON.parse(storedMedia);
        } catch {
          mediaList = [];
        }
      }

      let url = `https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=${Math.floor(Math.random() * 100)}`;
      let name = `uploaded_asset_${generateId()}.jpg`;
      let size = `${Math.floor(Math.random() * 500) + 120} KB`;

      const isFormData = init && init.body && (
        init.body instanceof FormData ||
        (typeof init.body === 'object' && 
         init.body !== null && 
         typeof (init.body as any).get === 'function' && 
         typeof (init.body as any).append === 'function')
      );

      if (isFormData) {
        const fileObj = (init!.body as any).get('image');
        const isFileOrBlob = fileObj && (
          fileObj instanceof File || 
          fileObj instanceof Blob ||
          (typeof fileObj === 'object' && 
           fileObj !== null && 
           typeof (fileObj as any).slice === 'function' &&
           'name' in fileObj)
        );

        if (isFileOrBlob) {
          name = (fileObj as any).name || name;
          size = (fileObj as any).size ? `${Math.round((fileObj as any).size / 1024)} KB` : size;
          try {
            const rawUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('Failed to read file'));
              reader.readAsDataURL(fileObj as Blob);
            });

            // Compress image down to max 640x480 size to save localStorage quota (essential to prevent QuotaExceededError!)
            url = await new Promise<string>((resolve) => {
              if (typeof window === 'undefined' || typeof document === 'undefined') {
                resolve(rawUrl);
                return;
              }
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
                    resolve(rawUrl);
                    return;
                  }
                  ctx.drawImage(img, 0, 0, width, height);
                  const compressed = canvas.toDataURL('image/jpeg', 0.55); // compressed to save quota
                  resolve(compressed);
                } catch (err) {
                  console.warn('Canvas compression failure', err);
                  resolve(rawUrl);
                }
              };
              img.onerror = () => resolve(rawUrl);
              img.src = rawUrl;
            });
          } catch (e) {
            console.warn('[IMMO BURUNDI API REDIRECT] Failed to read uploaded file as base64 data-url. Using generic unsplash fallback.', e);
          }
        }
      }

      const uploadedAt = new Date().toISOString();

      const newMedia = { url, name, size, uploadedAt };
      mediaList.unshift(newMedia);
      
      try {
        localStorage.setItem('ib_media', JSON.stringify(mediaList));
      } catch (quotaErr) {
        console.warn('LocalStorage quota exceeded for media list, using in-memory fallback', quotaErr);
      }

      return new Response(JSON.stringify({ success: true, url }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fallback 404 for simulated APIs
    return new Response(JSON.stringify({ error: 'API route not simulated' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
}

export function setupApiMock() {
  try {
    Object.defineProperty(window, 'fetch', {
      value: ibFetch,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (error) {
    console.warn('[IMMO BURUNDI Mock] Overriding window.fetch failed. Fallback direct imports will be used.', error);
  }
}
