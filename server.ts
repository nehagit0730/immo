import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDatabase, saveDatabase } from './database';
import { Property, WebPage, User, EmailLog } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to generate IDs
  const generateId = () => Math.random().toString(36).substring(2, 11);

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const db = getDatabase();
    
    // Check for admin
    if (email === 'admin@immoburundi.bi' && password === 'ImmoBurundiAdmin2026!') {
      const adminUser = db.users.find(u => u.role === 'admin');
      return res.json({ success: true, user: adminUser });
    }

    // Check for clients
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      // In a real application we would hash, here we do simple simulation
      // For demo, client email password is "client" or same as email prefix, or user can create
      return res.json({ success: true, user });
    }

    return res.status(401).json({ error: 'Invalid email or password. Use demo credentials shown on the login page.' });
  });

  // Register Client
  app.post('/api/auth/register', (req, res) => {
    const { email, name, phone, password } = req.body;
    const db = getDatabase();

    if (!email || !name || !phone) {
      return res.status(400).json({ error: 'Please provide email, name, and phone number.' });
    }

    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email already registered. Please log in.' });
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
    saveDatabase(db);

    res.json({ success: true, user: newUser });
  });


  // ==========================================
  // PROPERTIES CRUD ENDPOINTS
  // ==========================================

  // Get Properties
  app.get('/api/properties', (req, res) => {
    const { role, ownerId } = req.query;
    const db = getDatabase();

    let properties = [...db.properties];

    // Filter by client ownership
    if (ownerId && role !== 'admin') {
      properties = properties.filter(p => p.ownerId === ownerId);
    } else if (role !== 'admin') {
      // General public only sees approved listings
      properties = properties.filter(p => p.status === 'approved');
    }

    res.json(properties);
  });

  // Create Property Listing
  app.post('/api/properties', (req, res) => {
    const { 
      title, description, price, currency, type, location, city, 
      bedrooms, bathrooms, area, images, ownerId, role 
    } = req.body;

    const db = getDatabase();

    if (!title || !description || !price || !location || !city) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Resolve owner information
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

    // Default premium images if none supplied
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
      status: role === 'admin' ? 'approved' : 'pending', // Admins are auto-approved
      verified: role === 'admin', // Admins are auto-verified
      createdAt: new Date().toISOString()
    };

    db.properties.push(newProperty);
    saveDatabase(db);

    res.json(newProperty);
  });

  // Edit / Update Property
  app.put('/api/properties/:id', (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const db = getDatabase();

    const idx = db.properties.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const current = db.properties[idx];
    
    // Merge update
    db.properties[idx] = {
      ...current,
      ...updateData,
      // Reset status to pending if updated by a non-admin client to re-verify
      status: updateData.role === 'admin' ? current.status : 'pending'
    };

    saveDatabase(db);
    res.json(db.properties[idx]);
  });

  // Delete Property
  app.delete('/api/properties/:id', (req, res) => {
    const { id } = req.params;
    const db = getDatabase();

    const idx = db.properties.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }

    db.properties.splice(idx, 1);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Admin Review Submissions (Approve or Reject with Reason)
  app.post('/api/properties/:id/review', (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // status fits 'approved' | 'rejected'
    const db = getDatabase();

    const property = db.properties.find(p => p.id === id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    property.status = status;
    if (status === 'rejected') {
      property.rejectionReason = rejectionReason || 'Information declared does not match cadastral documents.';
    } else {
      property.rejectionReason = undefined;
    }

    // SIMULATED EMAIL NOTIFICATION LOGGING
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

    db.emails.unshift(mockEmail); // Add to beginning of log
    saveDatabase(db);

    res.json({ success: true, property, email: mockEmail });
  });

  // Admin Verification Toggle
  app.post('/api/properties/:id/verify', (req, res) => {
    const { id } = req.params;
    const db = getDatabase();

    const property = db.properties.find(p => p.id === id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    property.verified = !property.verified;
    saveDatabase(db);

    res.json({ success: true, property });
  });


  // ==========================================
  // PAGES ENDPOINTS (ADMIN CONTENT MANAGER)
  // ==========================================

  // Get Pages
  app.get('/api/pages', (req, res) => {
    const db = getDatabase();
    res.json(db.pages);
  });

  // Create Custom Page
  app.post('/api/pages', (req, res) => {
    const { title, content, slug } = req.body;
    const db = getDatabase();

    if (!title || !content || !slug) {
      return res.status(400).json({ error: 'Missing title, content, or slug' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (db.pages.some(p => p.slug === cleanSlug)) {
      return res.status(400).json({ error: 'A page with this URL slug already exists.' });
    }

    const newPage: WebPage = {
      id: 'page_' + generateId(),
      slug: cleanSlug,
      title,
      content,
      isHomepage: false,
      systemPage: false,
      updatedAt: new Date().toISOString()
    };

    db.pages.push(newPage);
    saveDatabase(db);

    res.json(newPage);
  });

  // Edit Page content
  app.put('/api/pages/:id', (req, res) => {
    const { id } = req.params;
    const { title, content, isHomepage, slug } = req.body;
    const db = getDatabase();

    const page = db.pages.find(p => p.id === id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (title) page.title = title;
    if (content) page.content = content;
    if (slug && !page.systemPage) {
      page.slug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    }

    if (isHomepage === true) {
      // Set all other pages isHomepage = false
      db.pages.forEach(p => {
        p.isHomepage = (p.id === id);
      });
    }

    page.updatedAt = new Date().toISOString();
    saveDatabase(db);

    res.json(db.pages);
  });

  // Delete Custom Page
  app.delete('/api/pages/:id', (req, res) => {
    const { id } = req.params;
    const db = getDatabase();

    const pageIdx = db.pages.findIndex(p => p.id === id);
    if (pageIdx === -1) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (db.pages[pageIdx].systemPage) {
      return res.status(400).json({ error: 'Predefined system legal files or templates cannot be deleted.' });
    }

    db.pages.splice(pageIdx, 1);
    saveDatabase(db);
    res.json({ success: true });
  });


  // ==========================================
  // SYSTEM UTILITY ENDPOINTS
  // ==========================================

  // Email Notification Log
  app.get('/api/emails', (req, res) => {
    const db = getDatabase();
    res.json(db.emails);
  });

  // Analytics Stats
  app.get('/api/stats', (req, res) => {
    const db = getDatabase();
    res.json(db.stats);
  });


  // ==========================================
  // VITE DEV SERVER OR STATIC SERVING MIDDLEWARE
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server IMMO BURUNDI active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Critical Server Fails:', err);
});
