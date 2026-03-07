import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("ecommerce.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'customer',
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL,
    image_url TEXT,
    category_id INTEGER,
    subcategory_id INTEGER,
    featured INTEGER DEFAULT 0,
    best_seller INTEGER DEFAULT 0,
    variations TEXT, -- JSON string for variations like ring sizes
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total REAL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT, -- 'credit_card', 'debit_card', 'pix', 'mercado_pago', 'cash'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Simple migration for payment_method column in orders table
try {
  db.prepare("SELECT payment_method FROM orders LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT");
}

// Simple migration for category columns in products table
try {
  db.prepare("SELECT category_id FROM products LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE products ADD COLUMN category_id INTEGER");
  db.exec("ALTER TABLE products ADD COLUMN subcategory_id INTEGER");
}

// Seed admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  db.prepare("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)").run(
    "admin@wmsemijoias.com",
    "admin123", // In a real app, use hashing
    "admin",
    "Administrator"
  );
}

// Seed sample categories and subcategories
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const cat1 = db.prepare("INSERT INTO categories (name) VALUES (?)").run("Anéis");
  const cat2 = db.prepare("INSERT INTO categories (name) VALUES (?)").run("Colares");
  const cat3 = db.prepare("INSERT INTO categories (name) VALUES (?)").run("Brincos");
  const cat4 = db.prepare("INSERT INTO categories (name) VALUES (?)").run("Pulseiras");

  db.prepare("INSERT INTO subcategories (category_id, name) VALUES (?, ?)").run(cat1.lastInsertRowid, "Solitários");
  db.prepare("INSERT INTO subcategories (category_id, name) VALUES (?, ?)").run(cat1.lastInsertRowid, "Alianças");
  db.prepare("INSERT INTO subcategories (category_id, name) VALUES (?, ?)").run(cat2.lastInsertRowid, "Chokers");
  db.prepare("INSERT INTO subcategories (category_id, name) VALUES (?, ?)").run(cat2.lastInsertRowid, "Longos");

  // Seed sample customers
  db.prepare("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)").run(
    "cliente@exemplo.com",
    "cliente123",
    "customer",
    "Maria Silva"
  );

  // Seed sample orders
  const user = db.prepare("SELECT id FROM users WHERE role = 'customer'").get() as { id: number };
  if (user) {
    db.prepare("INSERT INTO orders (user_id, total, status, payment_method) VALUES (?, ?, ?, ?)").run(
      user.id,
      439.80,
      'completed',
      'pix'
    );
  }

  // Seed default settings
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('mp_public_key', '');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('mp_access_token', '');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('me_token', '');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('me_zip_origin', '');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('me_sandbox', '1');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('banner_title', 'Brilhe com Exclusividade');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('banner_image', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2070');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('logo_url', '');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('footer_address', 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('footer_phone', '(11) 99999-9999');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('footer_whatsapp', '(11) 99999-9999');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('footer_hours', 'Segunda a Sexta: 09h às 18h');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('google_tag_id', '');
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('facebook_pixel_id', '');
}

// Seed sample products if empty
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const sampleProducts = [
    {
      name: "Anel Solitário Brilhante",
      description: "Anel solitário banhado a ouro 18k com zircônia premium.",
      price: 189.90,
      image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800",
      featured: 1,
      best_seller: 1,
      variations: JSON.stringify({ sizes: [12, 14, 16, 18, 20] })
    },
    {
      name: "Colar Elo Português",
      description: "Colar clássico elo português banhado a ouro 18k.",
      price: 249.00,
      image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800",
      featured: 1,
      best_seller: 0,
      variations: JSON.stringify({ lengths: ["45cm", "60cm"] })
    },
    {
      name: "Brinco Argola Cravejada",
      description: "Brinco de argola cravejado com microzircônias.",
      price: 129.90,
      image_url: "https://images.unsplash.com/photo-1535633302704-b02f4fad9315?auto=format&fit=crop&q=80&w=800",
      featured: 0,
      best_seller: 1,
      variations: JSON.stringify({})
    },
    {
      name: "Pulseira Riviera Luxo",
      description: "Pulseira riviera com fecho gaveta e banho de ródio branco.",
      price: 320.00,
      image_url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800",
      featured: 1,
      best_seller: 1,
      variations: JSON.stringify({})
    }
  ];

  const insert = db.prepare(`
    INSERT INTO products (name, description, price, image_url, featured, best_seller, variations)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  sampleProducts.forEach(p => {
    insert.run(p.name, p.description, p.price, p.image_url, p.featured, p.best_seller, p.variations);
  });
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
    res.json(categories);
  });

  // Facebook Product Catalog XML
  app.get("/api/catalog.xml", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all() as any[];
    const settings = db.prepare("SELECT * FROM settings").all() as { key: string, value: string }[];
    const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);
    
    const baseUrl = 'https://' + req.get('host');
    const siteTitle = settingsMap.banner_title || 'WM Semijoias';
    const siteDescription = 'Loja de Semijoias Exclusivas';

    let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>${siteTitle}</title>
<link>${baseUrl}</link>
<description>${siteDescription}</description>
`;

    products.forEach(product => {
      xml += `
<item>
<g:id>${product.id}</g:id>
<g:title>${product.name.replace(/&/g, '&amp;')}</g:title>
<g:description>${product.description.replace(/&/g, '&amp;')}</g:description>
<g:link>${baseUrl}/product/${product.id}</g:link>
<g:image_link>${product.image_url}</g:image_link>
<g:brand>WM Semijoias</g:brand>
<g:condition>new</g:condition>
<g:availability>in stock</g:availability>
<g:price>${product.price.toFixed(2)} BRL</g:price>
</item>`;
    });

    xml += `
</channel>
</rss>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  });

  app.get("/api/subcategories", (req, res) => {
    const subcategories = db.prepare("SELECT * FROM subcategories").all();
    res.json(subcategories);
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } else {
      res.status(401).json({ success: false, message: "Credenciais inválidas" });
    }
  });

  // Admin Product Management
  app.post("/api/admin/products", (req, res) => {
    const { name, description, price, image_url, category_id, subcategory_id, featured, best_seller, variations } = req.body;
    const result = db.prepare(`
      INSERT INTO products (name, description, price, image_url, category_id, subcategory_id, featured, best_seller, variations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, 
      description, 
      price, 
      image_url, 
      category_id || null, 
      subcategory_id || null, 
      featured ? 1 : 0, 
      best_seller ? 1 : 0, 
      JSON.stringify(variations || {})
    );
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.put("/api/admin/products/:id", (req, res) => {
    const { id } = req.params;
    const { name, description, price, image_url, category_id, subcategory_id, featured, best_seller, variations } = req.body;
    db.prepare(`
      UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, category_id = ?, subcategory_id = ?, featured = ?, best_seller = ?, variations = ?
      WHERE id = ?
    `).run(
      name, 
      description, 
      price, 
      image_url, 
      category_id || null, 
      subcategory_id || null, 
      featured ? 1 : 0, 
      best_seller ? 1 : 0, 
      JSON.stringify(variations || {}), 
      id
    );
    res.json({ success: true });
  });

  app.delete("/api/admin/products/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users WHERE role = 'customer'").all();
    res.json(users);
  });

  app.get("/api/admin/orders", (req, res) => {
    const orders = db.prepare(`
      SELECT orders.*, users.name as user_name, users.email as user_email 
      FROM orders 
      JOIN users ON orders.user_id = users.id
      ORDER BY orders.created_at DESC
    `).all();
    res.json(orders);
  });

  // Category Management
  app.post("/api/admin/categories", (req, res) => {
    const { name } = req.body;
    const result = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.put("/api/admin/categories/:id", (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, id);
    res.json({ success: true });
  });

  app.delete("/api/admin/categories/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Subcategory Management
  app.post("/api/admin/subcategories", (req, res) => {
    const { category_id, name } = req.body;
    const result = db.prepare("INSERT INTO subcategories (category_id, name) VALUES (?, ?)").run(category_id, name);
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.put("/api/admin/subcategories/:id", (req, res) => {
    const { id } = req.params;
    const { category_id, name } = req.body;
    db.prepare("UPDATE subcategories SET category_id = ?, name = ? WHERE id = ?").run(category_id, name, id);
    res.json({ success: true });
  });

  app.delete("/api/admin/subcategories/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM subcategories WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Settings Management
  app.get("/api/admin/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post("/api/admin/settings", (req, res) => {
    const settings = req.body;
    const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    Object.entries(settings).forEach(([key, value]) => {
      upsert.run(key, value as string);
    });
    res.json({ success: true });
  });

  // Financial Stats
  app.get("/api/admin/financial-stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        payment_method,
        SUM(total) as total_amount,
        COUNT(*) as order_count
      FROM orders
      WHERE status = 'completed'
      GROUP BY payment_method
    `).all();

    const totalRevenue = db.prepare("SELECT SUM(total) as total FROM orders WHERE status = 'completed'").get() as { total: number };
    const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get() as { count: number };
    const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
    const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get() as { count: number };

    res.json({
      by_method: stats,
      summary: {
        revenue: totalRevenue.total || 0,
        orders: totalOrders.count,
        products: totalProducts.count,
        customers: totalCustomers.count
      }
    });
  });

  // Shipping Calculation (Melhor Envio)
  app.post("/api/shipping/calculate", async (req, res) => {
    const { zip_code, products } = req.body;
    
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const token = settingsObj.me_token;
    const zipOrigin = settingsObj.me_zip_origin;
    const isSandbox = settingsObj.me_sandbox === '1';

    if (!token || !zipOrigin) {
      return res.status(400).json({ error: "Configuração de frete incompleta no painel administrativo." });
    }

    const baseUrl = isSandbox ? 'https://sandbox.melhorenvio.com.br' : 'https://www.melhorenvio.com.br';
    
    try {
      const response = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'WM Semijoias (contato@wmsemijoias.com)'
        },
        body: JSON.stringify({
          from: { postal_code: (zipOrigin || '').replace(/\D/g, '') },
          to: { postal_code: (zip_code || '').replace(/\D/g, '') },
          products: products.map((p: any) => ({
            id: p.id.toString(),
            width: 11,
            height: 11,
            length: 11,
            weight: 0.1, // Default weight for jewelry
            insurance_value: p.price,
            quantity: 1
          }))
        })
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      res.status(500).json({ error: "Erro ao calcular frete." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
