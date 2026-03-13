import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, Instagram, Facebook, Phone, MessageSquare, Bot, Plus, Edit2, Trash2, ChevronRight, LayoutDashboard, Package, Users, Settings, LogOut, BarChart3, CreditCard, Layers, Tag, DollarSign, Wallet, Zap, Truck, Smartphone, Share2, Upload, Eye, EyeOff, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Category, Subcategory, User as UserType } from './types';
import AIAgent from './components/AIAgent';
import { db, auth, storage, finalConfig, checkConnection } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, setDoc, getDoc, onSnapshot, getCountFromServer, getDocFromServer, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import Papa from 'papaparse';
import JSZip from 'jszip';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't throw here to avoid crashing the whole app, but we log it clearly
}

// --- Shared Components ---

const FloatingButtons = () => (
  <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-40">
    <motion.button 
      whileHover={{ scale: 1.1 }}
      className="w-14 h-14 bg-green-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-green-600 transition-colors"
    >
      <MessageSquare size={28} />
    </motion.button>
    <motion.button 
      whileHover={{ scale: 1.1 }}
      className="w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-neutral-800 transition-colors"
    >
      <Phone size={28} />
    </motion.button>
  </div>
);

// --- Store Components ---

const AnalyticsTracker = ({ settings }: { settings: any }) => {
  useEffect(() => {
    if (settings?.google_tag_id) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.google_tag_id}`;
      document.head.appendChild(script);

      const inlineScript = document.createElement('script');
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.google_tag_id}');
      `;
      document.head.appendChild(inlineScript);
    }

    if (settings?.facebook_pixel_id) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${settings.facebook_pixel_id}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }
  }, [settings]);

  return null;
};

const InstallPrompt = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const count = parseInt(localStorage.getItem('install_prompt_count') || '0');
    if (count < 2) {
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem('install_prompt_count', (count + 1).toString());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80"
      >
        <div className="bg-black text-white p-6 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <button onClick={() => setShow(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary text-black rounded-2xl flex items-center justify-center">
              <Smartphone size={24} />
            </div>
            <div>
              <h4 className="font-bold">Instalar App</h4>
              <p className="text-xs text-white/60">Acesse a WM Semijoias com um toque.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              alert('Para instalar: Clique no ícone de compartilhar do seu navegador e selecione "Adicionar à Tela de Início".');
              setShow(false);
            }}
            className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-yellow-500 transition-all"
          >
            INSTALAR AGORA
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const Header = ({ cartCount, onOpenCart, logoUrl }: { cartCount: number, onOpenCart: () => void, logoUrl?: string }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black py-3 shadow-lg' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button className="lg:hidden text-primary" onClick={() => setIsMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
            ) : (
              <div className="text-2xl font-serif font-bold tracking-tighter text-primary">
                WM <span className="text-white">SEMIJOIAS</span>
              </div>
            )}
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-white/80 hover:text-primary transition-colors uppercase tracking-widest">Início</Link>
            <Link to="/shop" className="text-sm font-medium text-white/80 hover:text-primary transition-colors uppercase tracking-widest">Loja</Link>
            <Link to="/contact" className="text-sm font-medium text-white/80 hover:text-primary transition-colors uppercase tracking-widest">Contato</Link>
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <button className="text-white hover:text-primary transition-colors">
            <Search size={20} />
          </button>
          <button onClick={() => navigate('/admin/login')} className="text-white hover:text-primary transition-colors">
            <User size={20} />
          </button>
          <button onClick={onOpenCart} className="relative text-white hover:text-primary transition-colors">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

const ProductCard = ({ product, onAddToCart }: { product: Product, onAddToCart: (p: Product) => void }) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-black/5 flex flex-col h-full"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 flex items-center justify-center">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-black/20 flex flex-col items-center gap-2">
            <ShoppingBag size={48} />
            <span className="text-xs font-bold uppercase tracking-widest">Sem Imagem</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <button 
            onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
            className="w-full bg-primary text-black font-bold py-3 rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-lg"
          >
            ADICIONAR AO CARRINHO
          </button>
        </div>
        {(product.featured === 1 || product.featured === true) && (
          <span className="absolute top-4 left-4 bg-primary text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Destaque
          </span>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-sm font-medium text-black/60 uppercase tracking-wider mb-1">{product.category || 'Semi Joia'}</h3>
        <h2 className="text-lg font-serif font-bold mb-2 flex-1 line-clamp-2">{product.name}</h2>
        <p className="text-xl font-bold text-primary drop-shadow-sm mt-auto">
          R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </motion.div>
  );
};

const Footer = ({ settings }: { settings: any }) => (
  <footer className="bg-black text-white pt-20 pb-10 border-t border-white/10">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
      <div className="col-span-1 md:col-span-1">
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt="Logo" className="h-12 object-contain mb-6" />
        ) : (
          <h2 className="text-2xl font-serif font-bold text-primary mb-6">WM SEMIJOIAS</h2>
        )}
        <p className="text-white/60 leading-relaxed mb-6">
          Elegância e sofisticação em cada detalhe. Joias e semijoias criadas para momentos inesquecíveis.
        </p>
        <div className="flex gap-4">
          <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-primary hover:text-black transition-all">
            <Instagram size={18} />
          </a>
          <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-primary hover:text-black transition-all">
            <Facebook size={18} />
          </a>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-primary">Links Úteis</h3>
        <ul className="flex flex-col gap-4 text-white/60">
          <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
          <li><Link to="/shop" className="hover:text-primary transition-colors">Loja</Link></li>
          <li><Link to="/contact" className="hover:text-primary transition-colors">Contato</Link></li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-primary">Atendimento</h3>
        <ul className="flex flex-col gap-4 text-white/60">
          <li className="flex items-center gap-3"><Phone size={16} className="text-primary" /> {settings?.footer_phone || '(11) 99999-9999'}</li>
          {settings?.footer_whatsapp && (
            <li className="flex items-center gap-3"><MessageSquare size={16} className="text-primary" /> WhatsApp: {settings.footer_whatsapp}</li>
          )}
          <li className="flex items-center gap-3"><Bot size={16} className="text-primary" /> {settings?.footer_hours || 'Segunda a Sexta: 09h às 18h'}</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-primary">Endereço</h3>
        <p className="text-white/60 leading-relaxed">
          {settings?.footer_address || 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP'}
        </p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 pt-10 border-t border-white/10 text-center text-white/40 text-sm">
      © {new Date().getFullYear()} WM SEMIJOIAS E ACESSÓRIOS. Todos os direitos reservados.
    </div>
  </footer>
);

// --- Pages ---

const Home = ({ products, onAddToCart, settings }: { products: Product[], onAddToCart: (p: Product) => void, settings: any }) => {
  const featuredProducts = products.filter(p => p.featured === 1 || p.featured === true);
  const bestSellers = products.filter(p => p.best_seller === 1 || p.best_seller === true);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-50">
          <img 
            src={settings?.banner_image || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2070"} 
            alt="Hero" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary font-bold tracking-[0.3em] uppercase mb-6"
          >
            Nova Coleção {new Date().getFullYear()}
          </motion.h3>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-serif font-bold text-white mb-8 leading-tight"
          >
            {settings?.banner_title || 'Brilhe com Exclusividade'}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/shop" className="bg-primary text-black font-bold px-10 py-4 rounded-full hover:bg-yellow-500 transition-all shadow-xl hover:shadow-primary/20 inline-block">
              VER PRODUTOS
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-16">
            <div>
              <h3 className="text-primary font-bold uppercase tracking-widest mb-2">Seleção Especial</h3>
              <h2 className="text-4xl font-serif font-bold">Destaques da Semana</h2>
            </div>
            <Link to="/shop" className="text-black font-bold border-b-2 border-primary pb-1 hover:text-primary transition-colors">Ver Tudo</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.length > 0 ? (
              featuredProducts.map(product => (
                <Link key={product.id} to={`/product/${product.id}`}>
                  <ProductCard product={product} onAddToCart={onAddToCart} />
                </Link>
              ))
            ) : (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-neutral-100 aspect-[4/5] rounded-2xl" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Banner Section */}
      <section className="py-20 bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <img 
              src="https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=1000" 
              alt="Banner" 
              className="rounded-3xl shadow-2xl relative z-10"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-white">
            <h2 className="text-5xl font-serif font-bold mb-8 leading-tight">
              Qualidade que <span className="text-primary">Transforma</span> seu Visual
            </h2>
            <p className="text-white/60 text-lg mb-10 leading-relaxed">
              Nossas peças são banhadas com tecnologia de ponta, garantindo durabilidade e um brilho incomparável. Descubra a perfeição em cada detalhe.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-primary font-bold text-3xl mb-2">1 ano</h4>
                <p className="text-white/40 uppercase text-xs tracking-widest">Garantia Total</p>
              </div>
              <div>
                <h4 className="text-primary font-bold text-3xl mb-2">100%</h4>
                <p className="text-white/40 uppercase text-xs tracking-widest">Hipoalergênico</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-primary font-bold uppercase tracking-widest mb-2">Os Queridinhos</h3>
            <h2 className="text-4xl font-serif font-bold">Mais Vendidos</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {bestSellers.length > 0 ? (
              bestSellers.map(product => (
                <Link key={product.id} to={`/product/${product.id}`}>
                  <ProductCard product={product} onAddToCart={onAddToCart} />
                </Link>
              ))
            ) : (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-neutral-200 aspect-[4/5] rounded-2xl" />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductDetail = ({ products, onAddToCart }: { products: Product[], onAddToCart: (p: Product) => void }) => {
  const { id } = useParams();
  const product = products.find(p => String(p.id) === id);
  const [selectedVariation, setSelectedVariation] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(false);

  if (!product) return <div className="pt-40 text-center">Produto não encontrado</div>;

  const variations = typeof product.variations === 'string' ? JSON.parse(product.variations || '{}') : (product.variations || {});
  const variationKey = Object.keys(variations)[0];
  const variationValues = variationKey ? variations[variationKey] : [];

  const calculateShipping = async () => {
    if (zipCode.length >= 8) {
      setLoadingShipping(true);
      try {
        const res = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zip_code: zipCode,
            products: [product]
          })
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setShippingOptions(data.filter((o: any) => !o.error));
        } else {
          alert(data.error || "Erro ao calcular frete");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingShipping(false);
      }
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-neutral-100 flex items-center justify-center"
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="text-black/20 flex flex-col items-center gap-4">
              <ShoppingBag size={64} />
              <span className="text-sm font-bold uppercase tracking-widest">Imagem Indisponível</span>
            </div>
          )}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <h3 className="text-primary font-bold uppercase tracking-widest mb-4">Semi Joia Premium</h3>
          <h1 className="text-5xl font-serif font-bold mb-6">{product.name}</h1>
          <p className="text-3xl font-bold text-primary mb-8">R$ {product.price.toLocaleString('pt-BR')}</p>
          <p className="text-black/60 leading-relaxed mb-10">{product.description}</p>

          {variationKey && (
            <div className="mb-10">
              <label className="text-xs font-bold uppercase tracking-widest text-black/40 block mb-4">Selecione o {variationKey === 'sizes' ? 'Aro' : 'Tamanho'}</label>
              <div className="flex flex-wrap gap-3">
                {variationValues.map((v: any) => (
                  <button 
                    key={v}
                    onClick={() => setSelectedVariation(v)}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold transition-all ${selectedVariation === v ? 'border-primary bg-primary text-black' : 'border-black/5 hover:border-primary'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-10">
            <button 
              onClick={() => onAddToCart(product)}
              className="flex-1 bg-black text-white font-bold py-5 rounded-2xl hover:bg-primary hover:text-black transition-all shadow-xl"
            >
              ADICIONAR AO CARRINHO
            </button>
          </div>

          <div className="bg-neutral-50 p-6 rounded-2xl border border-black/5">
            <h4 className="font-bold mb-4 flex items-center gap-2"><Truck size={18} /> Calcular Frete (Melhor Envio)</h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="00000-000" 
                value={zipCode}
                onChange={e => setZipCode(e.target.value)}
                className="flex-1 p-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-primary" 
              />
              <button 
                onClick={calculateShipping} 
                disabled={loadingShipping}
                className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-primary hover:text-black transition-all disabled:opacity-50"
              >
                {loadingShipping ? 'Calculando...' : 'Calcular'}
              </button>
            </div>
            {shippingOptions.length > 0 && (
              <div className="mt-6 flex flex-col gap-3">
                {shippingOptions.map((option: any) => (
                  <div key={option.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-black/5">
                    <div className="flex items-center gap-3">
                      <img src={option.company.picture} alt={option.company.name} className="w-8 h-8 object-contain" />
                      <div>
                        <div className="font-bold text-sm">{option.name}</div>
                        <div className="text-[10px] text-black/40 uppercase font-bold">{option.delivery_range.min}-{option.delivery_range.max} dias úteis</div>
                      </div>
                    </div>
                    <div className="font-bold text-primary">R$ {parseFloat(option.price).toLocaleString('pt-BR')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-black/5">
            <h4 className="font-bold mb-4 uppercase tracking-widest text-xs text-black/40">Compartilhar Produto</h4>
            <div className="flex gap-4 flex-wrap">
              <button 
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
              >
                <Facebook size={16} /> Facebook
              </button>
              <button 
                onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Olha que incrível esse produto da WM Semijoias: ${product.name} - ${window.location.href}`)}`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
              >
                <MessageSquare size={16} /> WhatsApp
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product.name,
                      text: `Confira ${product.name} na WM Semijoias`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copiado para a área de transferência!');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-primary hover:text-black transition-all"
              >
                <Share2 size={16} /> Copiar Link
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Contact = () => (
  <div className="pt-40 pb-20 px-4 max-w-4xl mx-auto">
    <div className="text-center mb-16">
      <h1 className="text-5xl font-serif font-bold mb-4">Fale Conosco</h1>
      <p className="text-black/60">Estamos aqui para tirar suas dúvidas e ajudar na sua compra.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="flex flex-col gap-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
            <Phone size={24} />
          </div>
          <div>
            <h4 className="font-bold mb-1">Telefone / WhatsApp</h4>
            <p className="text-black/60">(11) 99999-9999</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
            <MessageSquare size={24} />
          </div>
          <div>
            <h4 className="font-bold mb-1">E-mail</h4>
            <p className="text-black/60">contato@wmsemijoias.com</p>
          </div>
        </div>
      </div>
      <form className="flex flex-col gap-4">
        <input type="text" placeholder="Seu Nome" className="p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
        <input type="email" placeholder="Seu E-mail" className="p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
        <textarea placeholder="Sua Mensagem" className="p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary h-32" />
        <button className="bg-black text-white font-bold py-4 rounded-xl hover:bg-primary hover:text-black transition-all">ENVIAR MENSAGEM</button>
      </form>
    </div>
  </div>
);

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        const userCredential = await import('firebase/auth').then(module => 
          module.createUserWithEmailAndPassword(auth, email, password)
        );
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          role: email === 'camillasites@gmail.com' ? 'admin' : 'viewer',
          name: email.split('@')[0],
          created_at: new Date().toISOString()
        });

        alert('Conta criada! Você já está logado. Peça ao administrador para liberar seu acesso.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/admin/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Tente fazer login ou redefina sua senha.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(err.message || 'Erro ao autenticar.');
      }
      console.error(err);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail acima para redefinir a senha.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
      alert('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de redefinição.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="bg-primary p-10 text-center">
          <h2 className="text-3xl font-serif font-bold mb-2">Painel Admin</h2>
          <p className="text-black/60">{isRegistering ? 'Criar conta de acesso' : 'Acesso restrito para equipe'}</p>
        </div>
        <form onSubmit={handleLogin} className="p-10 flex flex-col gap-6">
          {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium">{error}</div>}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@wmsemijoias.com" 
              className="w-full p-4 bg-neutral-100 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full p-4 bg-neutral-100 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
              required={!resetSent}
            />
          </div>
          <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-primary hover:text-black transition-all mt-4">
            {isRegistering ? 'CRIAR CONTA' : 'ENTRAR NO PAINEL'}
          </button>
          
          <div className="flex flex-col gap-4 text-center mt-4 border-t pt-6">
            <button 
              type="button" 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setResetSent(false); }}
              className="text-sm font-bold text-black/60 hover:text-black transition-colors"
            >
              {isRegistering ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
            </button>
            
            {!isRegistering && (
              <button 
                type="button" 
                onClick={handleResetPassword}
                className="text-sm font-medium text-primary hover:text-black transition-colors"
              >
                Esqueci minha senha
              </button>
            )}
          </div>
          <Link to="/" className="text-center text-sm text-black/40 hover:text-black mt-2">Voltar para a loja</Link>
        </form>
      </motion.div>
    </div>
  );
};

// --- Admin Dashboard Component ---
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [financialStats, setFinancialStats] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentImportingProduct, setCurrentImportingProduct] = useState('');
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Firestore document size
        alert("A imagem deve ter no máximo 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [currentProductPage, setCurrentProductPage] = useState(1);
  const productsPerPage = 20;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8", // Tenta UTF-8 primeiro
      transformHeader: (h) => h.trim().toLowerCase(), // Normaliza os cabeçalhos para minúsculo
      complete: (results) => {
        console.log("CSV parsed successfully. Items:", results.data.length);
        setImportData(results.data);
        setImportPreview(results.data.slice(0, 5));
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Erro ao ler o arquivo CSV.");
      }
    });
  };

  const cleanCategoryName = (grupo: string) => {
    if (!grupo) return 'Geral';
    const parts = grupo.split('>');
    return parts[parts.length - 1].trim();
  };

  const processImport = async () => {
    console.log("Iniciando importação...");
    if (importData.length === 0) return;
    
    setIsImporting(true);
    setImportProgress(0);
    setCurrentImportingProduct('Iniciando...');
    let importedCount = 0;

    try {
      const totalItems = importData.length;
      const batchSize = 500;
      let batch = writeBatch(db);
      let batchCount = 0;
      
      // 1. Carregar categorias e produtos existentes para evitar duplicatas e leituras excessivas
      const [categoriesSnapshot, productsSnapshot] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'products'))
      ]);
      
      const categoryMap = new Map<string, string>();
      categoriesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.name) categoryMap.set(data.name.toLowerCase().trim(), doc.id);
      });

      const productMap = new Map<string, string>(); // Código -> ID
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.code) productMap.set(data.code.toString().trim(), doc.id);
      });

      // Função auxiliar para obter ou criar categoria (localmente)
      const getOrCreateCategory = (categoryName: string): string => {
        const cleanName = categoryName.trim();
        const lowerName = cleanName.toLowerCase();
        if (categoryMap.has(lowerName)) return categoryMap.get(lowerName)!;
        
        // Cria ID temporário e registra
        const newId = doc(collection(db, 'categories')).id;
        batch.set(doc(db, 'categories', newId), { 
          name: cleanName,
          created_at: new Date().toISOString()
        });
        categoryMap.set(lowerName, newId);
        return newId;
      };

      for (let i = 0; i < importData.length; i++) {
        const item = importData[i];
        if (!item.nome && !item.produto) continue;

        const priceStr = item.preço || item.preco || item.valor || '0';
        const price = parseFloat(priceStr.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
        const costStr = item.custo || '0';
        const cost = parseFloat(costStr.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim());

        const productCode = (item.código || item.codigo || item.code || '').toString().trim();
        const productName = item.nome || item.produto || 'Produto Sem Nome';
        const categoryName = cleanCategoryName(item.grupo || item.categoria);
        const categoryId = getOrCreateCategory(categoryName);

        const product: any = {
          name: productName,
          price: isNaN(price) ? 0 : price,
          cost_price: isNaN(cost) ? 0 : cost,
          description: (item.cor ? `Cor: ${item.cor}\n` : '') + (item.tamanho ? `Tamanho: ${item.tamanho}\n` : '') + (item.ref ? `Ref: ${item.ref}\n` : '') + (item.descricao || ''),
          category: categoryName,
          category_id: categoryId,
          images: [], 
          featured: false,
          best_seller: false,
          stock: parseInt(item.quantidade || '0'),
          supplier: item.nomefornecedor || '',
          code: productCode,
          created_at: new Date().toISOString()
        };

        const productId = productMap.has(productCode) ? productMap.get(productCode)! : doc(collection(db, 'products')).id;
        batch.set(doc(db, 'products', productId), product, { merge: true });
        
        batchCount++;
        importedCount++;

        if (batchCount === batchSize) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }

        setImportProgress(Math.round(((i + 1) / totalItems) * 100));
        setCurrentImportingProduct(productName);
      }

      if (batchCount > 0) {
        await batch.commit();
      }
      
      // alert(`${importedCount} produtos importados com sucesso!`);
      // setIsImportModalOpen(false); // Não fechar automaticamente
      setImportData([]);
      setImportPreview([]);
      fetchProducts();
      fetchCategories();
    } catch (error) {
      console.error("Error importing products:", error);
      alert("Erro ao importar produtos. Verifique o console para mais detalhes.");
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      setCurrentImportingProduct('');
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setCurrentImportingProduct('Descompactando ZIP...');
    setImportProgress(0);

    try {
      const zip = await JSZip.loadAsync(file);
      const files = Object.keys(zip.files).filter(f => !zip.files[f].dir && /\.(jpg|jpeg|png|webp)$/i.test(f));
      const totalFiles = files.length;
      let processedFiles = 0;

      for (const filename of files) {
        const fileData = await zip.files[filename].async('blob');
        const storageRef = ref(storage, `products/${filename}`);
        
        await uploadBytes(storageRef, fileData);
        const downloadURL = await getDownloadURL(storageRef);

        // Tenta encontrar o produto pelo nome do arquivo (sem extensão)
        const productName = filename.split('.')[0];
        const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase() || p.code === productName);

        if (product) {
          await updateDoc(doc(db, 'products', String(product.id)), {
            images: [downloadURL]
          });
        }

        processedFiles++;
        setImportProgress(Math.round((processedFiles / totalFiles) * 100));
        setCurrentImportingProduct(`Processando: ${filename}`);
      }

      alert(`Upload de ${processedFiles} imagens concluído!`);
    } catch (error) {
      console.error("Erro ao processar ZIP:", error);
      alert("Erro ao processar o arquivo ZIP.");
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      setCurrentImportingProduct('');
    }
  };

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [subToDelete, setSubToDelete] = useState<string | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/admin/login');
      } else {
        if (user.email === 'camillasites@gmail.com') {
          setCurrentUserRole('admin');
        } else {
          try {
            const userDoc = await getDocFromServer(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              setCurrentUserRole(userDoc.data().role as any);
            } else {
              setCurrentUserRole('viewer');
            }
          } catch (e) {
            setCurrentUserRole('viewer');
          }
        }
        fetchAll();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAll = () => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
    fetchUsers();
    // fetchOrders(); // Orders collection
    fetchFinancialStats(); // Calculate from orders
    fetchSettings();
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserType[];
      setUsers(usersData);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
    }
  };

  const fetchFinancialStats = async () => {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map(doc => doc.data());
      
      const totalRevenue = ordersData.reduce((acc, order) => acc + (order.total || 0), 0);
      const totalOrders = ordersData.length;
      
      // Calculate payment method stats
      const methodStats: any = {};
      ordersData.forEach(order => {
        const method = order.payment_method || 'unknown';
        if (!methodStats[method]) {
          methodStats[method] = { total_amount: 0, order_count: 0, payment_method: method };
        }
        methodStats[method].total_amount += (order.total || 0);
        methodStats[method].order_count += 1;
      });
      
      const byMethod = Object.values(methodStats);
      
      // Get counts for dashboard
      const productsSnapshot = await getCountFromServer(collection(db, 'products'));
      const customersSnapshot = await getCountFromServer(collection(db, 'users')); // Assuming users collection exists
      
      setFinancialStats({
        summary: {
          revenue: totalRevenue,
          orders: totalOrders,
          products: productsSnapshot.data().count,
          customers: customersSnapshot.data().count
        },
        by_method: byMethod
      });
    } catch (error) {
      console.error("Error fetching financial stats:", error);
      // Fallback for empty state
      setFinancialStats({
        summary: { revenue: 0, orders: 0, products: 0, customers: 0 },
        by_method: []
      });
    }
  };

  const fetchSettings = async () => {
    const settingsSnapshot = await getDocs(collection(db, 'settings'));
    const settingsData: any = {};
    settingsSnapshot.forEach(doc => {
      settingsData[doc.id] = doc.data().value;
    });
    setSettings(settingsData);
  };

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      console.log('fetchProducts loaded:', productsData.length);
      productsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setProducts(productsData);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'products');
    }
  };

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      categoriesData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setCategories(categoriesData);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'categories');
    }
  };

  const fetchSubcategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'subcategories'));
      const subcategoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subcategory[];
      setSubcategories(subcategoriesData);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'subcategories');
    }
  };

  const handleDelete = async () => {
    if (productToDelete) {
      await deleteDoc(doc(db, 'products', String(productToDelete)));
      setIsConfirmOpen(false);
      setProductToDelete(null);
      fetchProducts();
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const newActiveStatus = (product.active === 0 || product.active === false) ? 1 : 0;
      await updateDoc(doc(db, 'products', String(product.id)), {
        active: newActiveStatus
      });
      fetchProducts();
    } catch (error) {
      console.error("Error toggling product status:", error);
      alert("Erro ao alterar status do produto.");
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory?.id) {
      await updateDoc(doc(db, 'categories', String(editingCategory.id)), editingCategory);
    } else {
      await addDoc(collection(db, 'categories'), editingCategory);
    }
    setIsCatModalOpen(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleDeleteCategory = async () => {
    if (catToDelete) {
      await deleteDoc(doc(db, 'categories', String(catToDelete)));
      setCatToDelete(null);
      fetchCategories();
    }
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubcategory?.id) {
      await updateDoc(doc(db, 'subcategories', String(editingSubcategory.id)), editingSubcategory);
    } else {
      await addDoc(collection(db, 'subcategories'), editingSubcategory);
    }
    setIsSubModalOpen(false);
    setEditingSubcategory(null);
    fetchSubcategories();
  };

  const handleDeleteSubcategory = async () => {
    if (subToDelete) {
      await deleteDoc(doc(db, 'subcategories', String(subToDelete)));
      setSubToDelete(null);
      fetchSubcategories();
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser.id) {
        await updateDoc(doc(db, 'users', editingUser.id), {
          name: editingUser.name,
          role: editingUser.role
        });
      } else {
        const { initializeApp } = await import('firebase/app');
        const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
        
        const secondaryApp = initializeApp(finalConfig, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);
        
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, editingUser.email, editingUser.password);
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: editingUser.email,
          role: editingUser.role,
          name: editingUser.name,
          created_at: new Date().toISOString()
        });
        
        await signOut(secondaryAuth);
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      alert('Erro ao salvar usuário: ' + error.message);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      fetchUsers();
    } catch (error) {
      alert('Erro ao atualizar permissão. Apenas administradores podem fazer isso.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const [key, value] of Object.entries(settings)) {
      await setDoc(doc(db, 'settings', key), { value });
    }
    alert('Configurações salvas com sucesso!');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct?.id) {
      const { id, ...data } = editingProduct;
      await updateDoc(doc(db, 'products', String(id)), data);
    } else {
      await addDoc(collection(db, 'products'), { ...editingProduct, active: 1 });
    }
    
    setIsModalOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-black text-white flex flex-col">
        <div className="p-8 border-b border-white/10">
          <h1 className="text-xl font-serif font-bold text-primary">WM ADMIN</h1>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <BarChart3 size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <Package size={20} /> Produtos
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'categories' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <Tag size={20} /> Categorias
          </button>
          <button 
            onClick={() => setActiveTab('subcategories')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'subcategories' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <Layers size={20} /> Subcategorias
          </button>
          {currentUserRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'clients' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
            >
              <Users size={20} /> Equipe e Usuários
            </button>
          )}
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <ShoppingBag size={20} /> Pedidos
          </button>
          {currentUserRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('financial')}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'financial' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
            >
              <DollarSign size={20} /> Financeiro
            </button>
          )}
          <button 
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'payments' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <CreditCard size={20} /> Pagamentos
          </button>
          <button 
            onClick={() => setActiveTab('shipping_config')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'shipping_config' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <Truck size={20} /> Frete
          </button>
          {currentUserRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('general_config')}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'general_config' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
            >
              <Settings size={20} /> Geral
            </button>
          )}
          {currentUserRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('marketing_config')}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'marketing_config' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
            >
              <Share2 size={20} /> Marketing
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => { localStorage.removeItem('admin_user'); navigate('/admin/login'); }}
            className="flex items-center gap-3 p-4 w-full text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white p-6 shadow-sm flex items-center justify-between">
          <h2 className="text-2xl font-bold capitalize">{activeTab === 'clients' ? 'Equipe e Usuários' : activeTab}</h2>
          {currentUserRole !== 'viewer' && activeTab === 'products' && (
            <button 
              onClick={() => { setEditingProduct({}); setIsModalOpen(true); }}
              className="bg-black text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-primary hover:text-black transition-all font-bold"
            >
              <Plus size={20} /> Novo Produto
            </button>
          )}
        </header>

        <main className="p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
          {activeTab === 'dashboard' && financialStats && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black/40 uppercase tracking-wider">Receita Total</div>
                      <div className="text-2xl font-bold">R$ {financialStats.summary.revenue.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                      <ShoppingBag size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black/40 uppercase tracking-wider">Total Pedidos</div>
                      <div className="text-2xl font-bold">{financialStats.summary.orders}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
                      <Package size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black/40 uppercase tracking-wider">Produtos</div>
                      <div className="text-2xl font-bold">{financialStats.summary.products}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                      <Users size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black/40 uppercase tracking-wider">Clientes</div>
                      <div className="text-2xl font-bold">{financialStats.summary.customers}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Vendas por Método</h3>
                  <div className="flex flex-col gap-4">
                    {financialStats.by_method.map((m: any) => (
                      <div key={m.payment_method} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <CreditCard size={18} />
                          </div>
                          <span className="font-bold capitalize">{(m.payment_method || 'Outro').replace('_', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">R$ {m.total_amount.toLocaleString('pt-BR')}</div>
                          <div className="text-xs text-black/40">{m.order_count} pedidos</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-black text-white p-8 rounded-3xl shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-2">Meta Mensal</h3>
                    <p className="text-white/60 mb-8">Você atingiu 75% da sua meta de vendas este mês.</p>
                    <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden mb-4">
                      <div className="bg-primary h-full w-3/4" />
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>R$ 15.000,00</span>
                      <span className="text-primary">R$ 20.000,00</span>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-bold">Lista de Produtos</h3>
                {currentUserRole !== 'viewer' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsImportModalOpen(true)}
                      className="bg-neutral-100 text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-200 transition-all"
                    >
                      <Upload size={16} /> Importar
                    </button>
                    <button 
                      onClick={() => { setEditingProduct({}); setIsModalOpen(true); }}
                      className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                )}
              </div>
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Código</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Produto</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Preço</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Status</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.slice((currentProductPage - 1) * productsPerPage, currentProductPage * productsPerPage).map(product => (
                    <tr key={product.id} className={`hover:bg-neutral-50 transition-colors ${(product.active === 0 || product.active === false) ? 'opacity-50' : ''}`}>
                      <td className="p-6 text-black/60">{product.code || '-'}</td>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <img src={product.image_url} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <div className="font-bold">{product.name}</div>
                            <div className="text-xs text-black/40">ID: #{product.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 font-medium">R$ {product.price.toLocaleString('pt-BR')}</td>
                      <td className="p-6">
                        <div className="flex gap-2">
                          {(product.active === 0 || product.active === false) && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded">Inativo</span>}
                          {product.active !== 0 && product.active !== false && <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded">Ativo</span>}
                          {product.featured === 1 && <span className="bg-primary/20 text-black text-[10px] font-bold px-2 py-1 rounded">Destaque</span>}
                          {product.best_seller === 1 && <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded">Best Seller</span>}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2">
                          {currentUserRole !== 'viewer' && (
                            <>
                              <button 
                                onClick={() => handleToggleActive(product)}
                                className={`p-2 rounded-lg transition-colors ${(product.active === 0 || product.active === false) ? 'hover:bg-green-50 text-green-500' : 'hover:bg-orange-50 text-orange-500'}`}
                                title={(product.active === 0 || product.active === false) ? "Ativar Produto" : "Inativar Produto"}
                              >
                                {(product.active === 0 || product.active === false) ? <Eye size={18} /> : <EyeOff size={18} />}
                              </button>
                              <button 
                                onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                                className="p-2 hover:bg-primary/20 text-black rounded-lg transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                            </>
                          )}
                          {currentUserRole === 'admin' && (
                            <button 
                              onClick={() => { setProductToDelete(String(product.id)); setIsConfirmOpen(true); }}
                              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {products.length > productsPerPage && (
                <div className="p-6 border-t flex items-center justify-between bg-neutral-50">
                  <div className="text-sm text-black/60 font-medium">
                    Mostrando {(currentProductPage - 1) * productsPerPage + 1} a {Math.min(currentProductPage * productsPerPage, products.length)} de {products.length} produtos
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentProductPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentProductPage === 1}
                      className="px-4 py-2 rounded-xl border bg-white text-sm font-bold disabled:opacity-50 hover:bg-neutral-100 transition-colors"
                    >
                      Anterior
                    </button>
                    <button 
                      onClick={() => setCurrentProductPage(prev => Math.min(prev + 1, Math.ceil(products.length / productsPerPage)))}
                      disabled={currentProductPage === Math.ceil(products.length / productsPerPage)}
                      className="px-4 py-2 rounded-xl border bg-white text-sm font-bold disabled:opacity-50 hover:bg-neutral-100 transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-bold">Categorias</h3>
                {currentUserRole !== 'viewer' && (
                  <button 
                    onClick={() => { setEditingCategory({}); setIsCatModalOpen(true); }}
                    className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    <Plus size={16} /> Nova Categoria
                  </button>
                )}
              </div>
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">ID</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Nome</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-6 font-mono text-xs">#{cat.id}</td>
                      <td className="p-6 font-bold">{cat.name}</td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2">
                          {currentUserRole !== 'viewer' && (
                            <button 
                              onClick={() => { setEditingCategory(cat); setIsCatModalOpen(true); }}
                              className="p-2 hover:bg-primary/20 text-black rounded-lg transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {currentUserRole === 'admin' && (
                            <button 
                              onClick={() => {
                                if (window.confirm('Excluir esta categoria?')) {
                                  setCatToDelete(String(cat.id));
                                  handleDeleteCategory();
                                }
                              }}
                              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'subcategories' && (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-bold">Subcategorias</h3>
                {currentUserRole !== 'viewer' && (
                  <button 
                    onClick={() => { setEditingSubcategory({}); setIsSubModalOpen(true); }}
                    className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    <Plus size={16} /> Nova Subcategoria
                  </button>
                )}
              </div>
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">ID</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Nome</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Categoria Pai</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subcategories.map(sub => (
                    <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-6 font-mono text-xs">#{sub.id}</td>
                      <td className="p-6 font-bold">{sub.name}</td>
                      <td className="p-6 text-black/60">
                        {categories.find(c => c.id === sub.category_id)?.name || 'N/A'}
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2">
                          {currentUserRole !== 'viewer' && (
                            <button 
                              onClick={() => { setEditingSubcategory(sub); setIsSubModalOpen(true); }}
                              className="p-2 hover:bg-primary/20 text-black rounded-lg transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {currentUserRole === 'admin' && (
                            <button 
                              onClick={() => {
                                if (window.confirm('Excluir esta subcategoria?')) {
                                  setSubToDelete(String(sub.id));
                                  handleDeleteSubcategory();
                                }
                              }}
                              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'financial' && financialStats && (
            <div className="flex flex-col gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm">
                <h3 className="text-xl font-bold mb-8">Controle Financeiro</h3>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                    <div className="text-sm font-bold text-green-600 uppercase tracking-wider mb-2">Receitas (Vendas)</div>
                    <div className="text-3xl font-bold text-green-700">R$ {financialStats.summary.revenue.toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                    <div className="text-sm font-bold text-red-600 uppercase tracking-wider mb-2">Despesas (Contas)</div>
                    <div className="text-3xl font-bold text-red-700">R$ 0,00</div>
                  </div>
                  <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                    <div className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">Saldo</div>
                    <div className="text-3xl font-bold text-blue-700">R$ {financialStats.summary.revenue.toLocaleString('pt-BR')}</div>
                  </div>
                </div>

                {/* Contas a Pagar Section */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-lg">Contas a Pagar</h4>
                    <button className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all">
                      <Plus size={16} /> Nova Conta
                    </button>
                  </div>
                  <div className="bg-neutral-50 rounded-2xl p-8 text-center border border-neutral-100">
                    <p className="text-black/40 font-medium">Nenhuma conta cadastrada.</p>
                  </div>
                </div>

                {/* Payment Methods Breakdown */}
                <h4 className="font-bold text-lg mb-4">Recebimentos por Método</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {['credit_card', 'debit_card', 'pix', 'mercado_pago', 'cash'].map(method => {
                    const data = financialStats.by_method.find((m: any) => m.payment_method === method) || { total_amount: 0, order_count: 0 };
                    return (
                      <div key={method} className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            {method === 'pix' ? <Zap size={20} /> : <CreditCard size={20} />}
                          </div>
                          <span className="font-bold capitalize">{method.replace('_', ' ')}</span>
                        </div>
                        <div className="text-2xl font-bold mb-1">R$ {data.total_amount.toLocaleString('pt-BR')}</div>
                        <div className="text-xs text-black/40 font-bold uppercase tracking-wider">{data.order_count} Recebimentos</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm max-w-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                  <CreditCard size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Configuração Mercado Pago</h3>
                  <p className="text-black/60">Configure suas chaves de API para aceitar pagamentos.</p>
                </div>
              </div>
              <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Public Key</label>
                  <input 
                    type="password" 
                    value={settings.mp_public_key || ''}
                    onChange={e => setSettings({...settings, mp_public_key: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="APP_USR-..."
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Access Token</label>
                  <input 
                    type="password" 
                    value={settings.mp_access_token || ''}
                    onChange={e => setSettings({...settings, mp_access_token: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="APP_USR-..."
                  />
                </div>
                <button type="submit" className="bg-black text-white py-4 rounded-xl font-bold hover:bg-primary hover:text-black transition-all mt-4">
                  SALVAR CONFIGURAÇÕES
                </button>
              </form>
            </div>
          )}

          {activeTab === 'shipping_config' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm max-w-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                  <Truck size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Configuração Melhor Envio</h3>
                  <p className="text-black/60">Configure seu token e CEP de origem para o cálculo de frete.</p>
                </div>
              </div>
              <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Token Melhor Envio</label>
                  <textarea 
                    value={settings.me_token || ''}
                    onChange={e => setSettings({...settings, me_token: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary h-32 text-sm" 
                    placeholder="Cole seu token aqui..."
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">CEP de Origem</label>
                  <input 
                    type="text" 
                    value={settings.me_zip_origin || ''}
                    onChange={e => setSettings({...settings, me_zip_origin: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="00000-000"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={settings.me_sandbox === '1'}
                    onChange={e => setSettings({...settings, me_sandbox: e.target.checked ? '1' : '0'})}
                    className="w-5 h-5 accent-primary" 
                  />
                  <label className="text-sm font-bold">Modo Sandbox (Teste)</label>
                </div>
                <button type="submit" className="bg-black text-white py-4 rounded-xl font-bold hover:bg-primary hover:text-black transition-all mt-4">
                  SALVAR CONFIGURAÇÕES
                </button>
              </form>
            </div>
          )}

          {activeTab === 'marketing_config' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm max-w-4xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center">
                  <Share2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Configurações de Marketing</h3>
                  <p className="text-black/60">Conecte suas ferramentas de anúncio e rastreamento.</p>
                </div>
              </div>
              <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6">
                  <h4 className="font-bold border-b pb-2">Rastreamento</h4>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Google Tag Manager ID (GTM-XXXX)</label>
                    <input 
                      type="text" 
                      value={settings.google_tag_id || ''}
                      onChange={e => setSettings({...settings, google_tag_id: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                      placeholder="GTM-XXXXXX"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Facebook Pixel ID</label>
                    <input 
                      type="text" 
                      value={settings.facebook_pixel_id || ''}
                      onChange={e => setSettings({...settings, facebook_pixel_id: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                      placeholder="1234567890"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <h4 className="font-bold border-b pb-2">Catálogo de Produtos (Facebook/Instagram)</h4>
                  <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                    <p className="text-sm text-black/60 mb-4">
                      Use este link para criar seu Catálogo de Produtos no Gerenciador de Comércio do Facebook. Isso permitirá criar anúncios dinâmicos e ativar o Instagram Shopping.
                    </p>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-black/40">URL do Feed XML</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly
                          value={`${window.location.origin}/api/catalog.xml`}
                          className="w-full p-3 bg-white rounded-lg border text-sm text-black/60 select-all" 
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api/catalog.xml`);
                            alert('Link copiado!');
                          }}
                          className="bg-black text-white px-4 rounded-lg font-bold text-xs hover:bg-primary hover:text-black transition-all"
                        >
                          COPIAR
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-primary hover:text-black transition-all">
                    SALVAR CONFIGURAÇÕES DE MARKETING
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'general_config' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm max-w-4xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
                  <Settings size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Configurações Gerais</h3>
                  <p className="text-black/60">Personalize o visual e as informações da sua loja.</p>
                </div>
              </div>
              <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6">
                  <h4 className="font-bold border-b pb-2">Banner Inicial</h4>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Título do Banner</label>
                    <input 
                      type="text" 
                      value={settings.banner_title || ''}
                      onChange={e => setSettings({...settings, banner_title: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Imagem do Banner (URL)</label>
                    <input 
                      type="text" 
                      value={settings.banner_image || ''}
                      onChange={e => setSettings({...settings, banner_image: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    />
                  </div>
                  
                  <h4 className="font-bold border-b pb-2 mt-4">Identidade</h4>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">URL da Logomarca</label>
                    <input 
                      type="text" 
                      value={settings.logo_url || ''}
                      onChange={e => setSettings({...settings, logo_url: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    />
                  </div>

                  <h4 className="font-bold border-b pb-2 mt-8">Status da Loja</h4>
                  <div className="flex items-center gap-3 mt-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.maintenance_mode === '1'}
                        onChange={e => setSettings({...settings, maintenance_mode: e.target.checked ? '1' : '0'})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ml-3 text-sm font-medium text-gray-900">Modo Manutenção</span>
                    </label>
                  </div>
                  <p className="text-xs text-black/40 mt-1">
                    Quando ativado, apenas administradores poderão acessar a loja. Clientes verão uma página de aviso.
                  </p>
                </div>

                <div className="flex flex-col gap-6">
                  <h4 className="font-bold border-b pb-2">Informações do Rodapé</h4>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Endereço Completo</label>
                    <textarea 
                      value={settings.footer_address || ''}
                      onChange={e => setSettings({...settings, footer_address: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary h-24" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Telefone</label>
                    <input 
                      type="text" 
                      value={settings.footer_phone || ''}
                      onChange={e => setSettings({...settings, footer_phone: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">WhatsApp</label>
                    <input 
                      type="text" 
                      value={settings.footer_whatsapp || ''}
                      onChange={e => setSettings({...settings, footer_whatsapp: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Horário de Atendimento</label>
                    <input 
                      type="text" 
                      value={settings.footer_hours || ''}
                      onChange={e => setSettings({...settings, footer_hours: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-primary hover:text-black transition-all">
                    SALVAR TODAS AS CONFIGURAÇÕES
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'clients' && currentUserRole === 'admin' && (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-bold">Equipe e Usuários</h3>
                <button 
                  onClick={() => { setEditingUser({ role: 'viewer' }); setIsUserModalOpen(true); }}
                  className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <Plus size={16} /> Novo Usuário
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Usuário</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">E-mail</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Nível de Acesso</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                            {user.name?.charAt(0) || '@'}
                          </div>
                          <div className="font-bold">{user.name}</div>
                        </div>
                      </td>
                      <td className="p-6 text-black/60">{user.email}</td>
                      <td className="p-6">
                        <select
                          value={user.role || 'viewer'}
                          onChange={(e) => handleRoleChange(String(user.id), e.target.value)}
                          disabled={user.email === 'camillasites@gmail.com' || currentUserRole !== 'admin'}
                          className="p-2 bg-neutral-100 rounded-lg outline-none text-sm font-medium"
                        >
                          <option value="admin">Administrador (Total)</option>
                          <option value="editor">Editor (Lançamentos)</option>
                          <option value="viewer">Visualizador / Cliente</option>
                        </select>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }}
                            className="p-2 hover:bg-primary/20 text-black rounded-lg transition-colors"
                            disabled={user.email === 'camillasites@gmail.com'}
                          >
                            <Edit2 size={18} />
                          </button>
                          {currentUserRole === 'admin' && user.email !== 'camillasites@gmail.com' && (
                            <button 
                              onClick={async () => {
                                if (window.confirm('Excluir este usuário? O acesso dele será revogado.')) {
                                  try {
                                    await deleteDoc(doc(db, 'users', String(user.id)));
                                    fetchUsers();
                                  } catch (error) {
                                    alert('Erro ao excluir usuário. Apenas administradores podem fazer isso.');
                                  }
                                }
                              }}
                              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Pedido</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Cliente</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Total</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-6 font-bold">#{order.id}</td>
                      <td className="p-6">
                        <div className="font-medium">{order.user_name}</div>
                        <div className="text-xs text-black/40">{order.user_email}</div>
                      </td>
                      <td className="p-6 font-bold">R$ {order.total.toLocaleString('pt-BR')}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {order.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Excluir Produto?</h3>
              <p className="text-black/60 mb-8">Esta ação não pode ser desfeita. Tem certeza que deseja remover este item?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 py-3 font-bold text-black/40 hover:text-black transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold">{editingProduct?.id ? 'Editar Produto' : 'Novo Produto'}</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 grid grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
                <div className="col-span-2 flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Nome do Produto</label>
                  <input 
                    type="text" 
                    value={editingProduct?.name || ''}
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    required 
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Código do Produto</label>
                  <input 
                    type="text" 
                    value={editingProduct?.code || ''}
                    onChange={e => setEditingProduct({...editingProduct, code: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingProduct?.price || ''}
                    onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Imagem do Produto</label>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full p-3 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm" 
                    />
                    <div className="text-xs text-black/40 text-center">OU</div>
                    <input 
                      type="text" 
                      value={editingProduct?.image_url || ''}
                      onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                      placeholder="Cole a URL da imagem aqui"
                    />
                  </div>
                </div>
                {editingProduct?.image_url && (
                  <div className="col-span-2 flex justify-center p-4 bg-neutral-50 rounded-2xl">
                    <img src={editingProduct.image_url} className="h-32 rounded-xl shadow-sm object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Categoria</label>
                  <div className="flex gap-2">
                    <select 
                      value={editingProduct?.category_id || ''}
                      onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Selecionar Categoria</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      onClick={async () => {
                        const name = window.prompt("Nome da nova categoria:");
                        if (name) {
                          try {
                            const docRef = await addDoc(collection(db, 'categories'), { name, created_at: new Date().toISOString() });
                            setCategories(prev => [...prev, { id: docRef.id, name } as Category]);
                            setEditingProduct(prev => ({ ...prev, category_id: docRef.id }));
                          } catch (e) {
                            alert("Erro ao criar categoria");
                          }
                        }
                      }}
                      className="bg-black text-white px-4 rounded-xl hover:bg-primary hover:text-black transition-all"
                      title="Adicionar Nova Categoria"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Subcategoria</label>
                  <div className="flex gap-2">
                    <select 
                      value={editingProduct?.subcategory_id || ''}
                      onChange={e => setEditingProduct({...editingProduct, subcategory_id: e.target.value})}
                      className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Selecionar Subcategoria</option>
                      {subcategories
                        .filter(sub => !editingProduct?.category_id || String(sub.category_id) === String(editingProduct.category_id))
                        .map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                    </select>
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!editingProduct?.category_id) {
                          alert("Selecione uma categoria primeiro.");
                          return;
                        }
                        const name = window.prompt("Nome da nova subcategoria:");
                        if (name) {
                          try {
                            const docRef = await addDoc(collection(db, 'subcategories'), { 
                              name, 
                              category_id: editingProduct.category_id,
                              created_at: new Date().toISOString() 
                            });
                            setSubcategories(prev => [...prev, { id: docRef.id, name, category_id: editingProduct.category_id } as Subcategory]);
                            setEditingProduct(prev => ({ ...prev, subcategory_id: docRef.id }));
                          } catch (e) {
                            alert("Erro ao criar subcategoria");
                          }
                        }
                      }}
                      className="bg-black text-white px-4 rounded-xl hover:bg-primary hover:text-black transition-all"
                      title="Adicionar Nova Subcategoria"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Variações (JSON - ex: {"{\"sizes\": [12, 14]}"})</label>
                  <textarea 
                    value={typeof editingProduct?.variations === 'string' ? editingProduct.variations : JSON.stringify(editingProduct?.variations || {})}
                    onChange={e => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setEditingProduct({...editingProduct, variations: parsed});
                      } catch {
                        setEditingProduct({...editingProduct, variations: e.target.value as any});
                      }
                    }}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary h-24 font-mono text-sm" 
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Descrição</label>
                  <textarea 
                    value={editingProduct?.description || ''}
                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary h-32" 
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={editingProduct?.featured === 1}
                    onChange={e => setEditingProduct({...editingProduct, featured: e.target.checked ? 1 : 0})}
                    className="w-5 h-5 accent-primary" 
                  />
                  <label className="text-sm font-bold">Destaque na Home</label>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={editingProduct?.best_seller === 1}
                    onChange={e => setEditingProduct({...editingProduct, best_seller: e.target.checked ? 1 : 0})}
                    className="w-5 h-5 accent-primary" 
                  />
                  <label className="text-sm font-bold">Mais Vendido</label>
                </div>
                <div className="col-span-2 pt-6 border-t flex justify-end gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 font-bold text-black/40 hover:text-black">Cancelar</button>
                  <button type="submit" className="bg-black text-white px-10 py-3 rounded-xl font-bold hover:bg-primary hover:text-black transition-all">
                    SALVAR PRODUTO
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCatModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCatModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold">{editingCategory?.id ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                <button onClick={() => setIsCatModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveCategory} className="p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Nome da Categoria</label>
                  <input 
                    type="text" 
                    value={editingCategory?.name || ''}
                    onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    required 
                  />
                </div>
                <div className="pt-6 border-t flex justify-end gap-4">
                  <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-8 py-3 font-bold text-black/40 hover:text-black">Cancelar</button>
                  <button type="submit" className="bg-black text-white px-10 py-3 rounded-xl font-bold hover:bg-primary hover:text-black transition-all">
                    SALVAR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subcategory Modal */}
      <AnimatePresence>
        {isSubModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold">{editingSubcategory?.id ? 'Editar Subcategoria' : 'Nova Subcategoria'}</h3>
                <button onClick={() => setIsSubModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveSubcategory} className="p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Categoria Pai</label>
                  <select 
                    value={editingSubcategory?.category_id || ''}
                    onChange={e => setEditingSubcategory({...editingSubcategory, category_id: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Selecionar Categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Nome da Subcategoria</label>
                  <input 
                    type="text" 
                    value={editingSubcategory?.name || ''}
                    onChange={e => setEditingSubcategory({...editingSubcategory, name: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    required 
                  />
                </div>
                <div className="pt-6 border-t flex justify-end gap-4">
                  <button type="button" onClick={() => setIsSubModalOpen(false)} className="px-8 py-3 font-bold text-black/40 hover:text-black">Cancelar</button>
                  <button type="submit" className="bg-black text-white px-10 py-3 rounded-xl font-bold hover:bg-primary hover:text-black transition-all">
                    SALVAR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b flex items-center justify-between bg-neutral-50">
                <h3 className="text-xl font-bold">{editingUser?.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button onClick={() => setIsUserModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveUser} className="p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Nome</label>
                  <input 
                    type="text" 
                    value={editingUser?.name || ''}
                    onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                    required 
                  />
                </div>
                {!editingUser?.id && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-black/40">E-mail</label>
                      <input 
                        type="email" 
                        value={editingUser?.email || ''}
                        onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                        className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                        required 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-black/40">Senha</label>
                      <input 
                        type="password" 
                        value={editingUser?.password || ''}
                        onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                        className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                        required 
                      />
                    </div>
                  </>
                )}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Nível de Acesso</label>
                  <select 
                    value={editingUser?.role || 'viewer'}
                    onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="admin">Administrador (Total)</option>
                    <option value="editor">Editor (Lançamentos)</option>
                    <option value="viewer">Visualizador / Cliente</option>
                  </select>
                </div>
                <div className="pt-6 border-t flex justify-end gap-4">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-8 py-3 font-bold text-black/40 hover:text-black">Cancelar</button>
                  <button type="submit" className="bg-black text-white px-10 py-3 rounded-xl font-bold hover:bg-primary hover:text-black transition-all">
                    SALVAR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Importar Produtos (CSV)</h2>
                <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2">Selecione o arquivo CSV</label>
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isImporting}
                    className="w-full p-3 border rounded-xl disabled:opacity-50"
                  />
                  <p className="text-xs text-neutral-500 mt-2">
                    O arquivo deve conter colunas como: Nome, Preco, Descricao, Categoria, Imagem (URL).
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2">Selecione o arquivo ZIP de Imagens</label>
                  <input 
                    type="file" 
                    accept=".zip"
                    onChange={handleZipUpload}
                    disabled={isImporting}
                    className="w-full p-3 border rounded-xl disabled:opacity-50"
                  />
                  <p className="text-xs text-neutral-500 mt-2">
                    O nome dos arquivos de imagem deve corresponder ao nome ou código do produto.
                  </p>
                </div>

                {isImporting && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span>Importando: {currentImportingProduct}</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-black h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${importProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {importPreview.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold mb-2">Pré-visualização (5 primeiros itens)</h3>
                    <div className="overflow-x-auto border rounded-xl">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50">
                          <tr>
                            {Object.keys(importPreview[0]).map(key => (
                              <th key={key} className="p-2 border-b font-bold">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row, i) => (
                            <tr key={i} className="border-b last:border-0">
                              {Object.values(row).map((val: any, j) => (
                                <td key={j} className="p-2 truncate max-w-[150px]">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-neutral-50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  className="px-6 py-3 rounded-xl font-bold hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button 
                  onClick={processImport}
                  disabled={importData.length === 0 || isImporting}
                  className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importando...' : `Importar ${importData.length > 0 ? `(${importData.length} itens)` : ''}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado.</h1>
            <p className="text-neutral-600 mb-4">Ocorreu um erro inesperado na aplicação.</p>
            <pre className="bg-neutral-100 p-4 rounded-lg text-xs overflow-auto mb-6 text-red-800">
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-neutral-800 transition-all"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const Shop = ({ products, categories, onAddToCart, settings }: { products: Product[], categories: Category[], onAddToCart: (p: Product) => void, settings: any }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  const filteredProducts = selectedCategory === 'Todos' 
    ? products 
    : products.filter(p => p.category_id === selectedCategory || (p as any).category === categories.find(c => c.id === selectedCategory)?.name);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12">
        <aside className="w-full md:w-64">
          <h3 className="text-xl font-bold mb-6 border-b pb-2">Categorias</h3>
          <ul className="flex flex-col gap-3">
            <li>
              <button 
                onClick={() => setSelectedCategory('Todos')}
                className={`font-bold transition-colors ${selectedCategory === 'Todos' ? 'text-primary' : 'text-black hover:text-primary'}`}
              >
                Todos os Produtos
              </button>
            </li>
            {[...categories].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(cat => (
              <li key={cat.id}>
                <button 
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`transition-colors text-left ${selectedCategory === String(cat.id) ? 'text-primary font-bold' : 'text-black/60 hover:text-primary'}`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="flex-1">
          <h1 className="text-4xl font-serif font-bold mb-12">Nossa Loja</h1>
          {filteredProducts.length === 0 ? (
            <p className="text-black/60">Nenhum produto encontrado nesta categoria.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {currentProducts.map(product => (
                  <Link key={product.id} to={`/product/${product.id}`}>
                    <ProductCard product={product} onAddToCart={onAddToCart} />
                  </Link>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-2">
                  <button 
                    onClick={() => {
                      setCurrentPage(prev => Math.max(prev - 1, 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl border bg-white text-sm font-bold disabled:opacity-50 hover:bg-neutral-100 transition-colors"
                  >
                    Anterior
                  </button>
                  <div className="text-sm font-medium px-4">
                    Página {currentPage} de {totalPages}
                  </div>
                  <button 
                    onClick={() => {
                      setCurrentPage(prev => Math.min(prev + 1, totalPages));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl border bg-white text-sm font-bold disabled:opacity-50 hover:bg-neutral-100 transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const GlobalLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the click is on a button, a, or has an onClick
      const isClickable = target.closest('button') || target.closest('a') || target.closest('[role="button"]');
      
      if (isClickable) {
        setIsLoading(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsLoading(false), 1000);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-white/60 backdrop-blur-sm flex items-center justify-center pointer-events-none"
        >
          <div className="relative w-24 h-24 animate-[spin_1.5s_linear_infinite]">
            {/* Ring Base */}
            <div className="absolute inset-2 rounded-full border-[4px] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
            {/* Diamond */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.8)] bg-white/50 rounded-full p-1">
              <Gem size={28} fill="#D4AF37" fillOpacity="0.3" strokeWidth={1.5} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MaintenancePage = ({ settings }: { settings: any }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 p-4 text-center">
      <div className="bg-white p-12 rounded-3xl shadow-xl max-w-lg w-full flex flex-col items-center">
        <Link to="/admin/login" className="w-20 h-20 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-6 hover:bg-yellow-100 transition-colors">
          <Settings size={40} />
        </Link>
        <h1 className="text-3xl font-bold mb-4">Em Manutenção</h1>
        <p className="text-neutral-600 mb-8">
          Estamos realizando algumas melhorias em nossa loja. Voltaremos em breve!
        </p>
        {settings?.footer_whatsapp && (
          <a 
            href={`https://wa.me/${settings.footer_whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all flex items-center gap-2"
          >
            <MessageSquare size={20} />
            Fale Conosco no WhatsApp
          </a>
        )}
      </div>
    </div>
  );
};

const MaintenanceCheck = ({ settings, children }: { settings: any, children: React.ReactNode }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (settings?.maintenance_mode === '1' && !isAdmin) {
    return <MaintenancePage settings={settings} />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const testConnection = async () => {
    if (!db) {
      setIsConnected(false);
      return;
    }
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      setIsConnected(true);
    } catch (error) {
      console.error("Connection test failed:", error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (!db) return;

    // Connection Test
    testConnection();

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      console.log('Products loaded:', productsData.length);
      productsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setProducts(productsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      categoriesData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setCategories(categoriesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    const unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      const settingsData: any = {};
      snapshot.forEach(doc => {
        settingsData[doc.id] = doc.data().value;
      });
      setSettings(settingsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings');
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSettings();
    };
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const activeProducts = products.filter(p => p.active !== 0 && p.active !== false);

  return (
    <Router>
      {isConnected === false && (
        <div className="fixed top-4 left-4 z-[200] bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
          <span>Desconectado</span>
          <button onClick={testConnection} className="underline hover:text-red-100">Tentar reconectar</button>
        </div>
      )}
      <GlobalLoader />
      <MaintenanceCheck settings={settings}>
        <div className="min-h-screen flex flex-col">
          <Routes>
          {/* Store Routes */}
          <Route path="/" element={
            <>
              <AnalyticsTracker settings={settings} />
              <Header cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} logoUrl={settings?.logo_url} />
              <Home products={activeProducts} onAddToCart={addToCart} settings={settings} />
              <Footer settings={settings} />
              <FloatingButtons />
              <InstallPrompt />
              <AIAgent />
            </>
          } />
          <Route path="/shop" element={
            <>
              <Header cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} logoUrl={settings?.logo_url} />
              <Shop products={activeProducts} categories={categories} onAddToCart={addToCart} settings={settings} />
              <Footer settings={settings} />
              <FloatingButtons />
              <InstallPrompt />
              <AIAgent />
            </>
          } />
          <Route path="/product/:id" element={
            <>
              <Header cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} logoUrl={settings?.logo_url} />
              <ProductDetail products={activeProducts} onAddToCart={addToCart} />
              <Footer settings={settings} />
              <FloatingButtons />
              <InstallPrompt />
              <AIAgent />
            </>
          } />
          <Route path="/contact" element={
            <>
              <Header cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} logoUrl={settings?.logo_url} />
              <Contact />
              <Footer settings={settings} />
              <FloatingButtons />
              <InstallPrompt />
              <AIAgent />
            </>
          } />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
        </Routes>

        {/* Cart Drawer */}
        <AnimatePresence>
          {isCartOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCartOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-xl font-bold uppercase tracking-widest">Seu Carrinho</h2>
                  <button onClick={() => setIsCartOpen(false)} className="text-black/40 hover:text-black">
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-black/40">
                      <ShoppingBag size={64} className="mb-4 opacity-20" />
                      <p>Seu carrinho está vazio</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {cart.map(item => (
                        <div key={item.id} className="flex gap-4">
                          <img src={item.image_url} alt={item.name} className="w-20 h-24 object-cover rounded-lg" referrerPolicy="no-referrer" />
                          <div className="flex-1">
                            <h3 className="font-bold">{item.name}</h3>
                            <p className="text-sm text-black/60">Qtd: {item.quantity}</p>
                            <p className="text-primary font-bold">R$ {(item.price * item.quantity).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-6 border-t bg-neutral-50">
                  <div className="flex justify-between mb-6">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg text-primary">
                      R$ {cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-primary hover:text-black transition-all">
                      FINALIZAR COMPRA
                    </button>
                    <button className="w-full bg-[#009EE3] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                      Pagar com Mercado Pago
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      </MaintenanceCheck>
    </Router>
  );
}
