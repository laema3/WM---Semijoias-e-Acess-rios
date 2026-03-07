import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, Instagram, Facebook, Phone, MessageSquare, Bot, Plus, Edit2, Trash2, ChevronRight, LayoutDashboard, Package, Users, Settings, LogOut, BarChart3, CreditCard, Layers, Tag, DollarSign, Wallet, Zap, Truck, Smartphone, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Category, Subcategory, User as UserType } from './types';
import AIAgent from './components/AIAgent';
import { db, auth } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

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
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-black/5"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <img 
          src={product.image_url || 'https://picsum.photos/seed/jewelry/400/500'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
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
      <div className="p-5">
        <h3 className="text-sm font-medium text-black/60 uppercase tracking-wider mb-1">Semi Joia</h3>
        <h2 className="text-lg font-serif font-bold mb-2">{product.name}</h2>
        <p className="text-xl font-bold text-primary drop-shadow-sm">
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
          className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl"
        >
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const userCredential = await import('firebase/auth').then(module => 
          module.createUserWithEmailAndPassword(auth, email, password)
        );
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          role: 'admin',
          name: 'Admin',
          created_at: new Date().toISOString()
        });

        alert('Conta criada! Você já está logado.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar.');
      console.error(err);
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
          <p className="text-black/60">{isRegistering ? 'Criar nova conta admin' : 'Acesso restrito para administradores'}</p>
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
              required
            />
          </div>
          <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-primary hover:text-black transition-all mt-4">
            {isRegistering ? 'CRIAR CONTA' : 'ENTRAR NO PAINEL'}
          </button>
          <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-center text-sm text-black/60 hover:text-black">
            {isRegistering ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
          </button>
          <Link to="/" className="text-center text-sm text-black/40 hover:text-black">Voltar para a loja</Link>
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

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [subToDelete, setSubToDelete] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/admin/login');
      } else {
        fetchAll();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAll = () => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
    // fetchUsers(); // Users are managed by Firebase Auth
    // fetchOrders(); // Orders collection
    // fetchFinancialStats(); // Calculate from orders
    fetchSettings();
  };

  const fetchFinancialStats = async () => {
    // Calculate stats from orders collection locally or via cloud function
    // For now, we'll just use a placeholder or calculate from fetched orders
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
    const querySnapshot = await getDocs(collection(db, 'products'));
    const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
    setProducts(productsData);
  };

  const fetchCategories = async () => {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
    setCategories(categoriesData);
  };

  const fetchSubcategories = async () => {
    const querySnapshot = await getDocs(collection(db, 'subcategories'));
    const subcategoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subcategory[];
    setSubcategories(subcategoriesData);
  };

  const handleDelete = async () => {
    if (productToDelete) {
      await deleteDoc(doc(db, 'products', String(productToDelete)));
      setIsConfirmOpen(false);
      setProductToDelete(null);
      fetchProducts();
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
      await addDoc(collection(db, 'products'), editingProduct);
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
          <button 
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'clients' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <Users size={20} /> Clientes
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <ShoppingBag size={20} /> Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('financial')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'financial' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <DollarSign size={20} /> Financeiro
          </button>
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
          <button 
            onClick={() => setActiveTab('general_config')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'general_config' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <Settings size={20} /> Geral
          </button>
          <button 
            onClick={() => setActiveTab('marketing_config')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'marketing_config' ? 'bg-primary text-black font-bold' : 'hover:bg-white/5 text-white/60'}`}
          >
            <Share2 size={20} /> Marketing
          </button>
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
          <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
          <button 
            onClick={() => { setEditingProduct({}); setIsModalOpen(true); }}
            className="bg-black text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-primary hover:text-black transition-all font-bold"
          >
            <Plus size={20} /> Novo Produto
          </button>
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
                <button 
                  onClick={() => { setEditingProduct({}); setIsModalOpen(true); }}
                  className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Produto</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Preço</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Status</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
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
                          {product.featured === 1 && <span className="bg-primary/20 text-black text-[10px] font-bold px-2 py-1 rounded">Destaque</span>}
                          {product.best_seller === 1 && <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded">Best Seller</span>}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                            className="p-2 hover:bg-primary/20 text-black rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => { setProductToDelete(product.id); setIsConfirmOpen(true); }}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-bold">Categorias</h3>
                <button 
                  onClick={() => { setEditingCategory({}); setIsCatModalOpen(true); }}
                  className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <Plus size={16} /> Nova Categoria
                </button>
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
                          <button 
                            onClick={() => { setEditingCategory(cat); setIsCatModalOpen(true); }}
                            className="p-2 hover:bg-primary/20 text-black rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('Excluir esta categoria?')) {
                                setCatToDelete(cat.id);
                                handleDeleteCategory();
                              }
                            }}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
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
                <button 
                  onClick={() => { setEditingSubcategory({}); setIsSubModalOpen(true); }}
                  className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <Plus size={16} /> Nova Subcategoria
                </button>
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
                          <button 
                            onClick={() => { setEditingSubcategory(sub); setIsSubModalOpen(true); }}
                            className="p-2 hover:bg-primary/20 text-black rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('Excluir esta subcategoria?')) {
                                setSubToDelete(sub.id);
                                handleDeleteSubcategory();
                              }
                            }}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
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

          {activeTab === 'clients' && (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">Cliente</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40">E-mail</th>
                    <th className="p-6 font-bold uppercase text-xs tracking-widest text-black/40 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div className="font-bold">{user.name}</div>
                        </div>
                      </td>
                      <td className="p-6 text-black/60">{user.email}</td>
                      <td className="p-6 text-right">
                        <button className="p-2 hover:bg-primary/20 text-black rounded-lg transition-colors">
                          <Edit2 size={18} />
                        </button>
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
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">URL da Imagem</label>
                  <input 
                    type="text" 
                    value={editingProduct?.image_url || ''}
                    onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary" 
                  />
                </div>
                {editingProduct?.image_url && (
                  <div className="col-span-2 flex justify-center p-4 bg-neutral-50 rounded-2xl">
                    <img src={editingProduct.image_url} className="h-32 rounded-xl shadow-sm" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Categoria</label>
                  <select 
                    value={editingProduct?.category_id || ''}
                    onChange={e => setEditingProduct({...editingProduct, category_id: parseInt(e.target.value)})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecionar Categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40">Subcategoria</label>
                  <select 
                    value={editingProduct?.subcategory_id || ''}
                    onChange={e => setEditingProduct({...editingProduct, subcategory_id: parseInt(e.target.value)})}
                    className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecionar Subcategoria</option>
                    {subcategories
                      .filter(sub => !editingProduct?.category_id || sub.category_id === editingProduct.category_id)
                      .map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                  </select>
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
                    onChange={e => setEditingSubcategory({...editingSubcategory, category_id: parseInt(e.target.value)})}
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

function AppContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(productsData);
    }, (error) => {
      console.error("Error fetching products:", error);
    });

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      setCategories(categoriesData);
    }, (error) => {
      console.error("Error fetching categories:", error);
    });

    const unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      const settingsData: any = {};
      snapshot.forEach(doc => {
        settingsData[doc.id] = doc.data().value;
      });
      setSettings(settingsData);
    }, (error) => {
      console.error("Error fetching settings:", error);
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

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          {/* Store Routes */}
          <Route path="/" element={
            <>
              <AnalyticsTracker settings={settings} />
              <Header cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} logoUrl={settings?.logo_url} />
              <Home products={products} onAddToCart={addToCart} settings={settings} />
              <Footer settings={settings} />
              <FloatingButtons />
              <InstallPrompt />
              <AIAgent />
            </>
          } />
          <Route path="/shop" element={
            <>
              <Header cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} logoUrl={settings?.logo_url} />
              <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-12">
                  <aside className="w-full md:w-64">
                    <h3 className="text-xl font-bold mb-6 border-b pb-2">Categorias</h3>
                    <ul className="flex flex-col gap-3">
                      <li>
                        <button className="text-black hover:text-primary font-bold transition-colors">Todos os Produtos</button>
                      </li>
                      {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                        <li key={cat.id}>
                          <button className="text-black/60 hover:text-primary transition-colors">{cat.name}</button>
                        </li>
                      ))}
                    </ul>
                  </aside>
                  <div className="flex-1">
                    <h1 className="text-4xl font-serif font-bold mb-12">Nossa Loja</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {products.map(product => (
                        <Link key={product.id} to={`/product/${product.id}`}>
                          <ProductCard product={product} onAddToCart={addToCart} />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <Footer settings={settings} />
              <FloatingButtons />
              <InstallPrompt />
              <AIAgent />
            </>
          } />
          <Route path="/product/:id" element={
            <>
              <Header cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} logoUrl={settings?.logo_url} />
              <ProductDetail products={products} onAddToCart={addToCart} />
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
    </Router>
  );
}
