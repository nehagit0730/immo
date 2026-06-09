import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { getDatabase, saveDatabase } from './database';
import { Property, WebPage, User, EmailLog } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Serve static uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

  // Configure multer storage for local uploading
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Image upload API
  app.post('/api/upload', upload.single('image'), (req: express.Request, res: express.Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const relativeUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: relativeUrl });
  });

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
    const { title, content, slug, sections } = req.body;
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
      sections: sections || [],
      updatedAt: new Date().toISOString()
    };

    db.pages.push(newPage);
    saveDatabase(db);

    res.json(newPage);
  });

  // Edit Page content
  app.put('/api/pages/:id', (req, res) => {
    const { id } = req.params;
    const { title, content, isHomepage, slug, sections } = req.body;
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
    if (sections) {
      page.sections = sections;
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

  // Media Management API - GET List files
  app.get('/api/media', (req, res) => {
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    try {
      const files = fs.readdirSync(uploadDir);
      const mediaList = files.map(file => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        return {
          url: `/uploads/${file}`,
          name: file,
          size: `${Math.round(stats.size / 1024)} KB`,
          uploadedAt: stats.mtime.toISOString()
        };
      });
      // Sort by uploadedAt descending
      mediaList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      res.json(mediaList);
    } catch (e) {
      console.error('Error reading media library:', e);
      res.json([]);
    }
  });

  // Media Management API - DELETE specific filename
  app.delete('/api/media/:filename', (req, res) => {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public/uploads', safeFilename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Media file successfully removed' });
      } catch (e) {
        res.status(500).json({ error: 'Failed to delete file from disk' });
      }
    } else {
      res.status(404).json({ error: 'File not found on system' });
    }
  });


  // ==========================================
  // SITEMAP.XML DYNAMIC GENERATOR
  // ==========================================

  app.get('/sitemap.xml', (req, res) => {
    try {
      const db = getDatabase();
      res.header('Content-Type', 'application/xml');
      
      const host = req.get('host') || 'immoburundi.bi';
      const protocol = req.secure ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      const urls = [
        { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
        { loc: `${baseUrl}/properties`, changefreq: 'daily', priority: '0.9' },
        { loc: `${baseUrl}/about`, changefreq: 'weekly', priority: '0.7' },
        { loc: `${baseUrl}/contact`, changefreq: 'weekly', priority: '0.7' }
      ];

      db.pages.forEach(p => {
        if (!p.isHomepage) {
          urls.push({
            loc: `${baseUrl}/${p.slug}`,
            changefreq: 'weekly',
            priority: '0.8'
          });
        }
      });

      db.properties.forEach(p => {
        if (p.status === 'approved') {
          urls.push({
            loc: `${baseUrl}/properties?id=${p.id}`,
            changefreq: 'weekly',
            priority: '0.6'
          });
        }
      });

      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      res.send(sitemapXml);
    } catch (err) {
      console.error('Error generating sitemap xml:', err);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Internal server error generating dynamic index</error>');
    }
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
    
    // SPA Wildcard fallback for development page-previews / deep links
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Let other assets, static resources or API calls proceed
      if (url.startsWith('/api') || url.startsWith('/uploads') || url.includes('.')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
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
