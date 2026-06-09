import * as fs from 'fs';
import * as path from 'path';
import { User, Property, WebPage, EmailLog, SystemStats, PageSection } from './src/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Interface for DB JSON
export interface DatabaseSchema {
  users: User[];
  properties: Property[];
  pages: WebPage[];
  emails: EmailLog[];
  stats: SystemStats;
}

// Default property image URLs (premium Unsplash real estate)
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

// Seed initial pages based on user-provided contents
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
      sw: 'Gundua jukwaa la mali isiyohamishika lililolindwa zaidi, lililoidhinishwa na la kitaaluma nchini Burundi. Iwe unatafuta jumba la kifahari huko Bujumbura, maeneo ya biashara huko Gitega, viwanja vya uwekezaji kando ya ziwa huko Rumonge, au usaidizi wa udalali wa kitaalamu, IMMO BURUNDI inaunganisha wamiliki waliothibitishwa na wateja kwa uwazi kabisa.'
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

Our multilingual platform supports English, French, Swahili. We are committed to Transparency, Security, Professionalism, Reliable service, and Innovation in real estate technology.

**Important Notice:** Property verification statuses are based on documents and information presented to IMMO BURUNDI at the time of verification and do not constitute a government ownership guarantee.`,
      fr: `IMMO BURUNDI est un marché immobilier moderne et une plateforme de courtage conçus pour améliorer la transparence, l'accessibilité et la confiance dans le secteur de l'immobilier au Burundi.

Notre mission est de connecter les propriétaires de biens, les acheteurs, les locataires, les investisseurs et les agents grâce à une plateforme numérique sécurisée et professionnelle.

Nous fournissons :
* Annonces immobilières
* Services de vérification de propriété
* Support de location
* Promotion immobilière
* Assistance en courtage de biens immobiliers
* Solutions de gestion de propriété numérique

Notre plateforme associe la technologie, les processus de vérification et la supervision professionnelle pour aider à réduire la fraude et améliorer la confiance dans les transactions immobilières.

IMMO BURUNDI prend en charge :
* Les maisons / villas
* Les terrains / parcelles
* Les propriétés commerciales
* Les habitations en location
* Les opportunités d'investissement

Notre plateforme multilingue prend en charge le français, l'anglais et le swahili. Nous nous engageons à la transparence, à la sécurité, au professionnalisme et au service fiable.`,
      sw: `IMMO BURUNDI ni soko la kisasa la mali isiyohamishika na jukwaa la udalali lililoundwa ili kuboresha uwazi, upatikanaji, na uaminifu katika sekta ya mali isiyohamishika nchini Burundi.

Dhamira yetu ni kuunganisha wamiliki wa mali, wanunuzi, wapangaji, wawekezaji, na mawakala kupitia jukwaa la kisasa la dijiti lililo salama na la kitaalamu.

Tunatoa:
* Orodha za mali
* Huduma za uhakiki wa hati za mali
* Usaidizi wa kupangisha
* Matangazo ya mali
* Usaidizi wa udalali wa mali isiyohamishika
* Suluhisho za usimamizi wa mali kidijiti

Usaidizi wetu unachanganya teknolojia, michakato ya uhakiki, na usimamizi wa kitaalamu ili kusaidia kupunguza utapeli na kuongeza uaminifu katika miamala ya mali.

IMMO BURUNDI inasaidia:
* Nyumba za kuishi
* Viwanja/Ardhi
* Mali za kibiashara
* Nyumba za kukodisha
* Fursa za uwekezaji`
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

A property marked as **"Verified"** or **"Fully Verified"** means that IMMO BURUNDI reviewed and verified the authenticity and consistency of the submitted documents to the best of its operational ability at the time of review.

However, IMMO BURUNDI does not guarantee:
1. Future legal ownership disputes
2. Hidden claims or undisclosed third-party rights
3. Government registry errors
4. Forged documents not reasonably detectable
5. Changes occurring after verification
6. Fraudulent information intentionally concealed by the owner or seller

Verification status is therefore based solely on the documents and information made available to IMMO BURUNDI during the verification process.

#### Users are strongly encouraged to:
* Conduct independent legal due diligence
* Consult qualified legal professionals
* Confirm ownership records with relevant government authorities before completing transactions

IMMO BURUNDI shall not be held legally responsible for disputes, losses, fraud, or ownership conflicts arising from false, incomplete, hidden, or altered information provided by property owners, sellers, agents, or third parties.`,
      fr: `### Clause officielle de non-responsabilité pour la vérification

IMMO BURUNDI effectue la vérification des documents sur la base des documents, dossiers et informations présentés par le propriétaire, le représentant, l'agent ou le vendeur du bien au moment de la vérification.

Un bien marqué comme **"Vérifié"** ou **"Entièrement Vérifié"** signifie qu'IMMO BURUNDI a examiné et vérifié l'authenticité et la cohérence des documents soumis au mieux de ses capacités opérationnelles au moment de l'examen.

Cependant, IMMO BURUNDI ne garantit pas :
1. Les futurs litiges juridiques de propriété
2. Les réclamations cachées ou les droits de tiers non divulgués
3. Les erreurs du registre gouvernemental
4. Les documents falsifiés non détectables de manière raisonnable
5. Les changements survenant après la vérification
6. Les informations frauduleuses intentionnellement dissimulées par le propriétaire ou le vendeur

#### Il est fortement conseillé aux utilisateurs de :
* Mener des vérifications juridiques indépendantes
* Consulter des professionnels du droit qualifiés
* Confirmer les registres de propriété auprès des autorités gouvernementales compétentes avant de conclure des transactions.`,
      sw: `### Kanusho Rasmi la Uhakiki wa Hati

IMMO BURUNDI hufanya uhakiki wa nyaraka kulingana na hati, rekodi, na habari zilizowasilishwa na mmiliki wa mali, mwakilishi, wakala, au muuzaji wakati wa uhakiki.

Mali iliyowekwa alama kama **"Imethibitishwa"** au **"Imethibitishwa Kikamilifu"** inamaanisha kuwa IMMO BURUNDI ilikagua na kuthibitisha ukweli na uthabiti wa hati zilizowasilishwa kwa uwezo wake wote wakati wa ukaguzi.

Hata hivyo, IMMO BURUNDI haidhamini:
1. Migogoro ya umiliki wa kisheria ya baadaye
2. Madai yaliyofichika au haki za watu wengine ambazo hazikutangazwa
3. Makosa ya sajili ya serikali
4. Hati za kughushi ambazo haziwezi kugundulika kwa urahisi
5. Mabadiliko yanayotokea baada ya uhakiki
6. Taarifa za udanganyifu zilizofichwa kwa makusudi na mmiliki au muuzaji`
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

IMMO BURUNDI respects the privacy of all users, clients, agents, and visitors using our platform. This Privacy Policy explains how we collect, use, store, and protect your information. 

By using IMMO BURUNDI services, you agree to the practices described in this Privacy Policy.

#### 2.1 Information We Collect
We may collect the following information:
* **Personal Information**: Full name, phone number, email address, physical address, and identification documents.
* **Property Information**: Property details, deeds, ownership documents, GPS locations, and high-resolution photos/media.
* **Payment Information**: Transaction references, payment proofs, and transactional histories.
* **Technical Information**: Device characteristics, IP addresses, browser information, and application usage activity.

#### 2.2 How We Use Information
We use collected information to:
* Provide platform and marketing services
* Publish approved property listings
* Process strict property verification requests
* Improve platform security and prevent fraud
* Generate data-driven analytics and reports for sellers

#### 2.3 Data Sharing
IMMO BURUNDI does not sell personal information. Information is shared strictly with authorized operational staff and legal entities when required by law or local regulations.`,
      fr: `### POLITIQUE DE CONFIDENTIALITÉ DE IMMO BURUNDI
Date d'effet : 1er Juin 2026

IMMO BURUNDI respecte la vie privée de tous les utilisateurs, clients, agents et visiteurs de notre plateforme. Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos informations.

#### 2.1 Informations que nous collectons
* **Informations personnelles** : Nom complet, numéro de téléphone, adresse e-mail, adresse physique et documents d'identité.
* **Informations sur le bien** : Détails du bien, titres de propriété, documents d'enregistrement, localisations GPS et médias/photos.
* **Informations de paiement** : Références de transaction, preuves de paiement et historique.

#### 2.2 Comment nous utilisons les informations
Nous utilisons ces données pour fournir des services de courtage et d'annonce, valider les processus de vérification et sécuriser la plateforme contre les fraudes.`,
      sw: `### SERA YA FARAGHA YA IMMO BURUNDI
Tarehe ya Kuanza: Juni 1, 2026

IMMO BURUNDI inaheshimu faragha ya watumiaji wote, wateja, mawakala, na wageni wanaotumia jukwaa letu. Sera hii ya faragha inaeleza jinsi tunavyokusanya, kutumia, na kulinda habari zako.`
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

These Terms & Conditions govern the use of the IMMO BURUNDI platform. By accessing or using the platform, users agree to comply with these terms.

#### 3.1 Platform Purpose
IMMO BURUNDI is a real estate marketplace and brokerage platform designed to list, advertise, and facilitate discovery, rental, and sales of properties in Burundi. IMMO BURUNDI is not a governmental land administration or title registry.

#### 3.2 User Qualifications
Users must provide high-integrity, accurate representation documents. We enforce verification processes to keep the Burundian market reputable and clean.

#### 3.3 Property Listings
Property owners, agents, and sellers are fully responsible for the legality, ownership deeds, and accurate mapping details. IMMO BURUNDI stores and audits the history of submissions and reserves the absolute right to suspend accounts or remove listings for misrepresentation.

#### 3.4 Liability Limitation
IMMO BURUNDI provides verification as a supportive oversight service. We shall not be held liable for legal property disputes, external title fraud, or governmental errors. Use of this platform is at the user's voluntary discretion.`,
      fr: `### IMMO BURUNDI CONDITIONS GÉNÉRALES
Date d'effet : 1er Juin 2026

Ces Conditions Générales régissent l'utilisation de la plateforme IMMO BURUNDI. En utilisant notre plateforme, vous acceptez de vous conformer à ces règles.

#### 3.1 Objectif de la plateforme
IMMO BURUNDI est un marché immobilier et un courtier professionnel destiné à publier des annonces immobilières, vérifier les origines cadastrales, et faciliter de manière sécurisée les transactions.`,
      sw: `### SHERIA NA MASHARTI YA IMMO BURUNDI
Tarehe ya Kuanza: Juni 1, 2026

Sheria na Masharti haya yanasimamia matumizi ya jukwaa la IMMO BURUNDI. Kwa kutumia tovuti hii, unakubali kufuata sheria hizi.`
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
* **Email:** support@immoburundi.bi

#### 4.1 Purpose of Agreement
This agreement defines the operational parameters of the real estate listing, brokerage support, legal document verification, and premium banner promotions provided by the Company to the client.

#### 4.2 Fees & Commissions
The client agrees to pay:
* Property Listing & Archiving fee options.
* **Brokerage Commission**: A standard of **2% to 3%** commission upon successful closing of sales, or **1 month's rent** equivalent on verified long-term rentals handled by our agents.
* Document Verification: Free for standard listing, $50 / 100,000 BIF flat-rate for physical ground tracking & cadaster report checks.

#### 4.3 Governing Law
This Agreement is governed strictly by the laws of the Republic of Burundi. Active dispute resolutions shall be submitted to the competent tribunals of Bujumbura.`,
      fr: `### ACCORD DE SERVICE ET MODÈLE DE CONTRAT IMMO BURUNDI

Cet accord de service est conclu entre IMMO BURUNDI et le Client soussigné :

#### INFORMATIONS SUR LA SOCIÉTÉ
* **Nom de l'entreprise :** IMMO BURUNDI S.A.R.L
* **Adresse :** Boulevard de l'Uprona, Rohero, Bujumbura, Burundi
* **Téléphone :** +257 22 22 45 45
* **Email :** support@immoburundi.bi

#### 4.1 Objet du contrat
Cet accord régit les services de référencement, d'assistance juridique de courtage et de promotion de bannières fournis par l'entreprise au client.`,
      sw: `### MKATABA WA HUDUMA NA MASHARTI YA IMMO BURUNDI

Mkataba huu wa kisheria unawekwa kati ya Kampuni ya IMMO BURUNDI na Mteja:`
    },
    isHomepage: false,
    systemPage: true,
    updatedAt: new Date().toISOString()
  }
];

// Seed initial properties
const defaultProperties: Property[] = [
  {
    id: 'p1',
    title: 'Luxury 5-Bedroom Villa at Kiriri Hills',
    description: 'Breathtaking luxury villa situated in the exclusive Kiriri Hillside district, overlooking the magnificent Lake Tanganyika and the Bujumbura city skyline. Features high-security compound walls, premium marble flooring, an open-concept kitchen, elegant terraces, a swimming pool, and pristine verified land title documents. Ready for immediate relocation.',
    price: 320000,
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
    description: 'A premium 3-level commercial building strategically located in Rohero I, the central banking and administrative heart of Bujumbura. Generous parking capacity, dynamic open-floor space, integrated fiber optic networks, central solar backing generators, and fully verified urban planning authorizations. Ideal for embassies, major NGOs, or corporate headquarters.',
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
    description: 'Incredible prime investment parcel right on the sandy shores of Lake Tanganyika, located just outside Rumonge town. Highly desirable for constructing a beachfront resort, luxury lodging, or private vacation villas. Official land registry blueprints and title deeds are verified and authenticated with local registry offices. Water and power connections already set up near the roadside line.',
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
    description: 'Fully furnished, high-end 3-bedroom, 2.5-bathroom rental apartment situated in a secure apartment gated community in Kinindo. High-speed WiFi, modern climate controls (air conditioning), backup solar power inverter, and automated security monitoring systems. Rental price listed is per month, including professional waste collection and community garden maintenance.',
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
    description: 'Fertile, high-elevation farming and development land situated in Gitega, the political capital of Burundi. Perfect soil conditions for coffee planting, cash crops, or building an expansive suburban homestead. Securely fenced with official cadaster demarcations. The property includes clear access roads connecting to the National Route.',
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
    ownerEmail: 'david@immoburundi.bi',
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

// Custom prebuilt beautiful sections
const prebuiltHomeSections: PageSection[] = [
  {
    id: "sec_home_banner",
    type: "banner",
    backgroundColor: "bg-slate-900 text-white",
    headingColor: "text-white",
    textColor: "text-slate-300",
    fontSize: "display",
    settings: {
      title: "Find Your Secure Dream Property in Burundi",
      subtitle: "IMMO BURUNDI is the premier fully verified real estate marketplace. Every title deed is auditable, and every compound is inspected on-site by our local agents.",
      imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      buttonText: "Explore Real Estate"
    }
  },
  {
    id: "sec_home_featured",
    type: "property_list",
    backgroundColor: "bg-white",
    headingColor: "text-slate-900",
    textColor: "text-slate-500",
    fontSize: "lg",
    settings: {
      heading: "Premium Verified Properties",
      subheading: "Every property list item has verified cadastral records checked independently by elite agents on location.",
      limit: "3",
      typeFilter: "all",
      showOnlyVerified: true
    }
  },
  {
    id: "sec_home_calculator",
    type: "finances_calculator",
    backgroundColor: "bg-slate-50/50",
    headingColor: "text-slate-905",
    textColor: "text-slate-650",
    fontSize: "lg",
    settings: {
      title: "Diaspora Capital & Mortgage Estimator",
      subtitle: "Leverage premium local metrics to forecast real estate yields, downpayments, and monthly bank interest charges seamlessly before committing."
    }
  },
  {
    id: "sec_home_columns",
    type: "columns",
    backgroundColor: "bg-slate-50 text-slate-800",
    headingColor: "text-slate-900",
    textColor: "text-slate-650",
    fontSize: "md",
    settings: {
      heading: "Burundi's Trusted Real Estate Standards",
      subheading: "Connecting diaspora investors, private-sector landlords, and active local buyers.",
      columns: [
        { icon: "🛡️", title: "Cadaster Verifications", desc: "Direct title review and matching at national property registry records in Rohero." },
        { icon: "🔑", title: "Electronic Escrow Agreements", desc: "Legally standard bilingual contracts signed electronically to bypass double allocation." },
        { icon: "✈️", title: "Diaspora Support Hub", desc: "Drone inspections, physical land checks, boundaries mapping, and active broker assistance." }
      ]
    }
  },
  {
    id: "sec_home_testimonials",
    type: "testimonials",
    backgroundColor: "bg-white",
    headingColor: "text-slate-900",
    textColor: "text-slate-600",
    fontSize: "md",
    settings: {
      heading: "Endorsed by Diaspora & Residents",
      testimonials: [
        { text: "IMMO BURUNDI saved us from an urban double-allocation trap in Kiriri! Their local title validation is essential.", author: "Gérard Sindayigaya", role: "Diaspora Investor" },
        { text: "Quickest rental broker response rate in Kinindo. Signed bilingual service contract on Sunday and got keys Monday.", author: "Clara Kaneza", role: "Corporate Secretary" }
      ]
    }
  },
  {
    id: "sec_home_brands",
    type: "brands",
    backgroundColor: "bg-slate-50 text-slate-400",
    headingColor: "text-slate-400",
    textColor: "text-slate-400",
    fontSize: "sm",
    settings: {
      brands: ["CADASTRE NATIONAL", "OBR BURUNDI", "BANQUE COMMERCIALE", "REGIDESO"]
    }
  }
];

const prebuiltAboutSections: PageSection[] = [
  {
    id: "sec_about_banner",
    type: "banner",
    backgroundColor: "bg-gradient-to-r from-blue-900 to-slate-950 text-white border-none",
    headingColor: "text-white",
    textColor: "text-slate-200",
    fontSize: "lg",
    settings: {
      title: "About IMMO BURUNDI S.A.R.L",
      subtitle: "Spearheading digital safety, boundary validation, and professional brokerage in the property sector of Burundi.",
      imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      buttonText: "Read Our Framework"
    }
  },
  {
    id: "sec_about_mission",
    type: "image_text",
    backgroundColor: "bg-white",
    headingColor: "text-slate-900",
    textColor: "text-slate-650",
    fontSize: "md",
    settings: {
      heading: "Corporate Mission & Local Support",
      body: "IMMO BURUNDI is a private-sector real estate technology marketplace and professional brokerage provider built to improve transparency and confidence in Burundi's property market.\n\nOperating from Boulevard de l'Uprona, Rohero, Bujumbura, our team conducts physical ground checks, coordinates with national registry representatives, and assists buyers with bilingual paperless contracts to eliminate duplication fraud and create a reliable local hub.",
      imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
      alignment: "left"
    }
  },
  {
    id: "sec_about_featured_land",
    type: "property_list",
    backgroundColor: "bg-slate-50",
    headingColor: "text-slate-900",
    textColor: "text-slate-600",
    fontSize: "md",
    settings: {
      heading: "Elite Land & Investment Portfolios",
      subheading: "Direct beachfront and agricultural plots configured with absolute cadaster boundary guarantees.",
      limit: "3",
      typeFilter: "land",
      showOnlyVerified: false
    }
  },
  {
    id: "sec_about_faqs",
    type: "faqs",
    backgroundColor: "bg-white",
    headingColor: "text-slate-900",
    textColor: "text-slate-655",
    fontSize: "md",
    settings: {
      heading: "Answers to Common Concerns",
      faqs: [
        { q: "How does IMMO BURUNDI verify boundary coordinates?", a: "IMMO BURUNDI coordinates with national cadaster checkers who inspect GPS markers and physical border drawings on-site." },
        { q: "Are standard listings free to post?", a: "Yes! Basic listings are free, whereas full physical document verification and banner promotions have standard flat-rate options." }
      ]
    }
  }
];

// Load Database
export function getDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  let db: DatabaseSchema;
  let fromFile = false;

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      fromFile = true;
    } catch (e) {
      console.error('Error reading database file, resetting to defaults:', e);
      fromFile = false;
    }
  }

  if (!fromFile || !db!) {
    // Create initial database with defaults
    db = {
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
  }

  // Self-heal loaded database sections if they missing
  let changed = false;
  const homePage = db.pages.find((p: any) => p.id === 'home' || p.slug === 'home');
  if (homePage) {
    if (!homePage.sections || homePage.sections.length === 0) {
      homePage.sections = prebuiltHomeSections;
      changed = true;
    } else if (!homePage.sections.some((s: any) => s.type === 'finances_calculator')) {
      const propIdx = homePage.sections.findIndex((s: any) => s.type === 'property_list');
      const calcSec = prebuiltHomeSections.find((s: any) => s.type === 'finances_calculator');
      if (calcSec) {
        if (propIdx !== -1) {
          homePage.sections.splice(propIdx + 1, 0, calcSec);
        } else {
          homePage.sections.push(calcSec);
        }
        changed = true;
      }
    }
  }

  const aboutPage = db.pages.find((p: any) => p.id === 'about' || p.slug === 'about');
  if (aboutPage && (!aboutPage.sections || aboutPage.sections.length === 0)) {
    aboutPage.sections = prebuiltAboutSections;
    changed = true;
  }

  if (changed || !fromFile) {
    saveDatabase(db);
  }

  return db;
}

// Save Database
export function saveDatabase(data: DatabaseSchema) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  
  // Recalculate stats dynamically for accuracy
  data.stats.totalProperties = data.properties.length;
  data.stats.approvedProperties = data.properties.filter(p => p.status === 'approved').length;
  data.stats.pendingProperties = data.properties.filter(p => p.status === 'pending').length;
  data.stats.rejectedProperties = data.properties.filter(p => p.status === 'rejected').length;
  data.stats.totalUsers = data.users.length;

  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}
