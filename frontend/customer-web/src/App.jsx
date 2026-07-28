import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { theme, Button, Input, GlassCard } from './components/UI';
import { authApi, restaurantApi, orderApi } from './services/api';
import { IMAGES } from './services/images';
import {
    ChevronRight, Star, ShoppingBag, Mail, Lock, User, Phone,
    MapPin, Clock, Heart, Instagram, Twitter, Facebook, Plus, Menu as MenuIcon, X,
    ShieldCheck, Store, Truck, CheckCircle, Search, Filter, ArrowRight,
    CreditCard, Smartphone, LogOut, Settings, Bell, ChevronDown, Eye, EyeOff
} from 'lucide-react';

// --- UTILS ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
    }).format(amount).replace('GHS', 'GH₵');
};

// --- ANIMATION VARIANTS ---
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
};

const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
};

// --- SHARED COMPONENTS ---

const Section = ({ children, style, dark = false, noPadding = false }) => (
    <section style={{
        padding: noPadding ? 0 : '120px 8%',
        backgroundColor: dark ? '#050505' : '#000',
        position: 'relative',
        overflow: 'hidden',
        ...style
    }}>
        {children}
    </section>
);

const Badge = ({ children, color = theme.primary }) => (
    <span style={{
        padding: '6px 14px',
        backgroundColor: `${color}15`,
        color: color,
        borderRadius: '50px',
        fontSize: '11px',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        border: `1px solid ${color}30`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
    }}>
        {children}
    </span>
);

const Navbar = ({ setView, user, cartCount, currentView }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { name: 'Home', view: 'home' },
        { name: 'Menu', view: 'restaurants' },
        { name: 'Specials', view: 'specials' },
        { name: 'About', view: 'aboutus' },
        { name: 'Contact', view: 'contact' }
    ];

    return (
        <>
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, height: scrolled ? '80px' : '100px',
                backgroundColor: scrolled ? 'rgba(0, 0, 0, 0.85)' : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                zIndex: 1000, display: 'flex', alignItems: 'center', padding: '0 8%', justifyContent: 'space-between',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent'
            }}>
                <motion.div
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => setView('home')}
                    style={{ fontSize: '28px', fontWeight: '900', color: theme.primary, cursor: 'pointer', fontFamily: 'serif', letterSpacing: '-1.5px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <div style={{ width: '40px', height: '40px', backgroundColor: theme.primary, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Store color="#000" size={24} />
                    </div>
                    <span>World<span style={{ color: '#FFF' }}>Plate</span></span>
                </motion.div>

                <div className="nav-links" style={{ display: 'flex', gap: '40px' }}>
                    {navItems.map((item, i) => (
                        <motion.button
                            key={item.name}
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            onClick={() => setView(item.view)}
                            style={{
                                background: 'none', border: 'none', color: '#FFF', fontWeight: '700', fontSize: '14px',
                                cursor: 'pointer', position: 'relative', opacity: currentView === item.view ? 1 : 0.6,
                                transition: '0.3s', textTransform: 'uppercase', letterSpacing: '1px'
                            }}
                        >
                            {item.name}
                            {currentView === item.view && (
                                <motion.div layoutId="navUnderline" style={{ position: 'absolute', bottom: '-8px', left: 0, right: 0, height: '2px', backgroundColor: theme.primary }} />
                            )}
                        </motion.button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {user && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setView('cart')}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '16px', transition: '0.3s' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        >
                            <ShoppingBag size={22} />
                            {cartCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-5px', right: '-5px', backgroundColor: theme.primary,
                                    color: '#000', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900',
                                    boxShadow: `0 0 20px ${theme.primary}60`, border: '2px solid #000'
                                }}>{cartCount}</span>
                            )}
                        </motion.button>
                    )}

                    {user ? (
                        <div onClick={() => setView('profile')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '6px 18px 6px 6px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)', transition: '0.3s' }} onMouseOver={e => e.currentTarget.style.borderColor = theme.primary} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: theme.primary, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px' }}>{user.full_name[0]}</div>
                            <div style={{ color: '#FFF', fontSize: '14px', fontWeight: '700' }} className="user-name">{user.full_name.split(' ')[0]}</div>
                        </div>
                    ) : (
                        <Button
                            label="Sign In"
                            onClick={() => setView('login')}
                            style={{ padding: '12px 28px', borderRadius: '50px', fontSize: '14px' }}
                        />
                    )}

                    <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(true)} style={{ display: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', cursor: 'pointer', width: '48px', height: '48px', borderRadius: '16px', alignItems: 'center', justifyContent: 'center' }}>
                        <MenuIcon size={24} />
                    </button>
                </div>
            </nav>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 2000 }}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '350px',
                                backgroundColor: '#0A0A0A', padding: '50px 40px', display: 'flex', flexDirection: 'column',
                                borderLeft: '1px solid rgba(255,255,255,0.05)'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: theme.primary, fontFamily: 'serif' }}>WorldPlate</div>
                                <button onClick={() => setIsMenuOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#FFF', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {navItems.map((item, i) => (
                                    <motion.button
                                        key={item.name}
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                        onClick={() => { setView(item.view); setIsMenuOpen(false); }}
                                        style={{ background: 'none', border: 'none', color: '#FFF', textAlign: 'left', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', opacity: currentView === item.view ? 1 : 0.4 }}
                                    >
                                        {item.name}
                                    </motion.button>
                                ))}
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {user ? (
                                    <>
                                        <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: theme.primary, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' }}>{user.full_name[0]}</div>
                                            <div>
                                                <div style={{ color: '#FFF', fontWeight: '800' }}>{user.full_name}</div>
                                                <div style={{ color: '#666', fontSize: '12px' }}>{user.email}</div>
                                            </div>
                                        </div>
                                        <Button label="My Profile" variant="secondary" onClick={() => { setView('profile'); setIsMenuOpen(false); }} style={{ width: '100%', borderRadius: '16px' }} />
                                        <Button label="Sign Out" variant="danger" onClick={() => { localStorage.removeItem('token'); window.location.reload(); }} style={{ width: '100%', borderRadius: '16px' }} icon={<LogOut size={18}/>} />
                                    </>
                                ) : (
                                    <Button label="Get Started" onClick={() => { setView('login'); setIsMenuOpen(false); }} style={{ width: '100%', borderRadius: '16px' }} />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// --- VIEWS ---

const HomeView = ({ setView, restaurants, featuredItems, categories }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { scrollYProgress } = useScroll();
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        setView({ type: 'restaurants', search: searchQuery });
    };

    return (
        <div style={{ backgroundColor: '#000' }}>
            {/* HERO */}
            <section style={{ height: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '0 8%' }}>
                <motion.div
                    style={{ position: 'absolute', top: '20%', right: '-5%', width: '50vw', height: '50vw', backgroundColor: `${theme.primary}10`, borderRadius: '50%', filter: 'blur(150px)', zIndex: 0 }}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }}
                />

                <div style={{ maxWidth: '800px', zIndex: 10 }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <Badge>Premium Delivery Service</Badge>
                        <h1 style={{ fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: '900', color: '#FFF', lineHeight: '0.9', margin: '24px 0 32px', letterSpacing: '-4px' }}>
                            Crafting <span style={{ color: theme.primary, fontFamily: 'serif', fontStyle: 'italic', fontWeight: '400' }}>Exquisite</span> <br/>
                            Culinary Journeys
                        </h1>
                        <p style={{ color: '#A0A0A0', fontSize: 'clamp(16px, 2vw, 20px)', lineHeight: '1.6', marginBottom: '48px', maxWidth: '600px', fontWeight: '500' }}>
                            Experience the pinnacle of global cuisine delivered with surgical precision. Curated menus from world-class kitchens, now at your fingertips.
                        </p>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '60px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '600px' }}>
                            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', paddingLeft: '20px' }}>
                                <Search size={20} style={{ color: '#666' }} />
                                <input
                                    placeholder="Search cuisines, kitchens, or dishes..."
                                    style={{ background: 'none', border: 'none', color: '#FFF', padding: '15px', fontSize: '16px', outline: 'none', width: '100%' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Button
                                label="Find Food"
                                onClick={handleSearch}
                                style={{ borderRadius: '50px', padding: '0 35px', height: '54px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '30px', marginTop: '40px', alignItems: 'center' }}>
                            <div style={{ display: 'flex' }}>
                                {[1,2,3,4].map(i => <div key={i} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #000', backgroundColor: '#222', marginLeft: i > 1 ? '-15px' : 0, backgroundImage: `url(https://i.pravatar.cc/100?u=${i+10})`, backgroundSize: 'cover' }} />)}
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #000', backgroundColor: theme.primary, marginLeft: '-15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '12px', fontWeight: '900' }}>+2k</div>
                            </div>
                            <div style={{ color: '#FFF', fontSize: '14px', fontWeight: '600' }}>
                                <span style={{ color: theme.primary }}>4.9/5</span> from over 2,000 happy foodies
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: 10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'absolute', right: '5%', top: '20%', zIndex: 5 }}
                    className="hero-image-container"
                >
                    <motion.img
                        style={{ y: y1 }}
                        src={IMAGES.heroRamen}
                        alt="Ramen"
                        style={{ width: '550px', filter: 'drop-shadow(0 50px 100px rgba(255,138,0,0.4))' }}
                    />
                </motion.div>
            </section>

            {/* CATEGORIES */}
            <Section dark>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <Badge>Exploration</Badge>
                    <h2 style={{ color: '#FFF', fontSize: '48px', fontWeight: '900', marginTop: '20px', letterSpacing: '-2px' }}>World <span style={{ color: theme.primary }}>Cuisines</span></h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
                    {(categories.length > 0 ? categories : ['Local', 'Burgers', 'Pizza', 'Asian', 'Healthy', 'Sushi', 'Desserts']).map((cat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: theme.primary }}
                            onClick={() => setView('restaurants')}
                            style={{ padding: '40px 20px', backgroundColor: '#0A0A0A', borderRadius: '32px', border: '1px solid #1A1A1A', cursor: 'pointer', transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)', textAlign: 'center' }}
                        >
                            <div style={{ fontSize: '48px', marginBottom: '20px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>{['🥘', '🍔', '🍕', '🍲', '🥗', '🍣', '🍰'][i % 7]}</div>
                            <div style={{ color: '#FFF', fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>{cat}</div>
                            <div style={{ color: '#444', fontSize: '11px', marginTop: '8px', fontWeight: '700' }}>12+ Kitchens</div>
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* FEATURED RESTAURANTS */}
            <Section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '80px', flexWrap: 'wrap', gap: '30px' }}>
                    <div>
                        <Badge>Recommended</Badge>
                        <h2 style={{ color: '#FFF', fontSize: '48px', fontWeight: '900', margin: '20px 0 0', letterSpacing: '-2px' }}>Featured <span style={{ color: theme.primary }}>Kitchens</span></h2>
                    </div>
                    <Button label="View All Kitchens" variant="secondary" onClick={() => setView('restaurants')} icon={<ArrowRight size={18}/>} />
                </div>

                <div className="restaurant-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
                    {restaurants.slice(0, 3).map((r, i) => (
                        <motion.div
                            key={r.restaurant_id}
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                            onClick={() => setView({ type: 'restaurant-profile', id: r.restaurant_id })}
                            style={{ backgroundColor: '#0A0A0A', borderRadius: '40px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #1A1A1A', transition: '0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                            whileHover={{ y: -15, borderColor: 'rgba(255,255,255,0.2)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
                                <img src={r.image_url || IMAGES.food.pizza} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', top: '25px', right: '25px', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '50px', color: theme.primary, fontSize: '11px', fontWeight: '900', letterSpacing: '1px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {r.is_open ? '● OPEN NOW' : '○ CLOSED'}
                                </div>
                            </div>
                            <div style={{ padding: '40px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#FFF', margin: 0 }}>{r.name}</h3>
                                        <div style={{ color: theme.primary, fontWeight: '800', fontSize: '14px', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>{r.cuisine_type}</div>
                                    </div>
                                    <div style={{ backgroundColor: 'rgba(255,138,0,0.1)', padding: '10px 18px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Star size={18} fill={theme.primary} color={theme.primary} />
                                        <span style={{ color: theme.primary, fontWeight: '900', fontSize: '20px' }}>{(r.rating_avg || 0).toFixed(1)}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '25px', color: '#666', fontSize: '14px', fontWeight: '700', marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #1A1A1A' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18} /> {r.delivery_radius || 5}km</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} /> {25-35}m</div>
                                    <div style={{ color: theme.success, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={18}/> FREE</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* DOWNLOAD SECTION */}
            <Section dark style={{ paddingBottom: '0' }}>
                <div style={{
                    background: 'linear-gradient(135deg, #111 0%, #050505 100%)',
                    borderRadius: '60px 60px 0 0', padding: '100px 8% 0', display: 'flex',
                    alignItems: 'center', gap: '80px', flexWrap: 'wrap', position: 'relative',
                    border: '1px solid #1A1A1A', borderBottom: 'none'
                }}>
                    <div style={{ flex: 1, minWidth: '350px', paddingBottom: '100px' }}>
                        <Badge>Mobile App</Badge>
                        <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: '900', color: '#FFF', margin: '24px 0', lineHeight: '1', letterSpacing: '-3px' }}>
                            Hungry? <br/>
                            <span style={{ color: theme.primary }}>Get the App.</span>
                        </h2>
                        <p style={{ fontSize: '18px', color: '#A0A0A0', marginBottom: '48px', lineHeight: '1.7', maxWidth: '500px' }}>
                            Experience WorldPlate on the go. Real-time tracking, exclusive mobile-only deals, and a faster ordering experience.
                        </p>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                             <motion.button whileHover={{ y: -5 }} style={{ background: '#FFF', color: '#000', padding: '14px 28px', borderRadius: '16px', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Smartphone size={24}/>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase' }}>Available on</div>
                                    <div style={{ fontSize: '18px' }}>App Store</div>
                                </div>
                             </motion.button>
                             <motion.button whileHover={{ y: -5 }} style={{ background: '#FFF', color: '#000', padding: '14px 28px', borderRadius: '16px', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Smartphone size={24}/>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase' }}>Get it on</div>
                                    <div style={{ fontSize: '18px' }}>Google Play</div>
                                </div>
                             </motion.button>
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '350px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <motion.div
                            initial={{ y: 100, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 1 }}
                            style={{
                                width: '320px', height: '550px', backgroundColor: '#000', borderRadius: '40px 40px 0 0',
                                border: '12px solid #1A1A1A', borderBottom: 'none', overflow: 'hidden', position: 'relative',
                                boxShadow: '0 -20px 60px rgba(0,0,0,0.5)'
                            }}
                        >
                            <img src={IMAGES.heroRamen} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '80%' }}>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: theme.primary, marginBottom: '10px' }}>WorldPlate</div>
                                <div style={{ height: '4px', width: '40px', backgroundColor: theme.primary, margin: '0 auto', borderRadius: '2px' }} />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </Section>
        </div>
    );
};

const RestaurantsView = ({ restaurants, setView, onSync, initialSearch = '', notification, showNotify }) => {
    const [search, setSearch] = useState(initialSearch);
    const [category, setCategory] = useState('All');
    const [sortBy, setSortBy] = useState('rating');

    const categories = ['All', ...new Set(restaurants.map(r => r.cuisine_type))];

    const filtered = restaurants.filter(r =>
        (category === 'All' || r.cuisine_type === category) &&
        (r.name.toLowerCase().includes(search.toLowerCase()) || r.cuisine_type.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => {
        if (sortBy === 'rating') return (b.rating_avg || 0) - (a.rating_avg || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
    });

    return (
        <div style={{ backgroundColor: '#000', minHeight: '100vh', paddingTop: '150px' }}>
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 3000, padding: '16px 32px', borderRadius: '50px', backgroundColor: notification.type === 'success' ? theme.success : theme.danger, color: '#000', fontWeight: '900', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        {notification.type === 'success' ? <CheckCircle size={20}/> : <X size={20}/>}
                        {notification.text}
                    </motion.div>
                )}
            </AnimatePresence>
            <Section noPadding>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px', flexWrap: 'wrap', gap: '30px' }}>
                    <div>
                        <Badge>Verified Partners</Badge>
                        <h2 style={{ fontSize: '56px', fontWeight: '900', color: '#FFF', margin: '20px 0 0', letterSpacing: '-3px' }}>The <span style={{ color: theme.primary }}>Collection</span></h2>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', backgroundColor: '#0A0A0A', padding: '15px', borderRadius: '30px', border: '1px solid #1A1A1A' }}>
                         <div style={{ position: 'relative', display: 'flex', alignItems: 'center', paddingLeft: '15px', width: '300px' }}>
                            <Search size={18} style={{ color: '#666' }} />
                            <input
                                placeholder="Search by name or cuisine..."
                                style={{ background: 'none', border: 'none', color: '#FFF', padding: '10px', fontSize: '14px', outline: 'none', width: '100%' }}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div style={{ width: '1px', backgroundColor: '#1A1A1A', height: '30px', alignSelf: 'center' }} />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            style={{ background: 'none', color: '#FFF', border: 'none', padding: '0 15px', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="rating">Top Rated</option>
                            <option value="name">Alphabetical</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '60px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'none' }}>
                    {categories.map(c => (
                        <button
                            key={c}
                            onClick={() => setCategory(c)}
                            style={{
                                padding: '12px 28px', borderRadius: '50px', border: '1px solid',
                                borderColor: category === c ? theme.primary : '#1A1A1A',
                                backgroundColor: category === c ? `${theme.primary}15` : '#0A0A0A',
                                color: category === c ? theme.primary : '#666',
                                fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.3s'
                            }}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '120px 40px', backgroundColor: '#0A0A0A', borderRadius: '40px', border: '1px solid #1A1A1A' }}>
                        <div style={{ fontSize: '72px', marginBottom: '32px' }}>🔎</div>
                        <h3 style={{ color: '#FFF', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>No Results Found</h3>
                        <p style={{ color: '#666', marginTop: '16px', marginBottom: '40px', maxWidth: '400px', marginInline: 'auto', lineHeight: '1.7' }}>We couldn't find any kitchens matching your current search or filters.</p>
                        <Button label="Reset Filters" onClick={() => { setSearch(''); setCategory('All'); }} variant="secondary" style={{ marginInline: 'auto' }} />
                    </motion.div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '40px', marginBottom: '100px' }}>
                        {filtered.map((r, i) => (
                            <motion.div
                                key={r.restaurant_id}
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                onClick={() => setView({ type: 'restaurant-profile', id: r.restaurant_id })}
                                style={{ backgroundColor: '#0A0A0A', borderRadius: '40px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #1A1A1A', transition: '0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                whileHover={{ y: -10, borderColor: theme.primary }}
                            >
                                <div style={{ position: 'relative', height: '260px', overflow: 'hidden' }}>
                                    <img src={r.image_url || IMAGES.food.pizza} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', top: '24px', right: '24px', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '50px', color: theme.primary, fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>
                                        {r.is_open ? '● OPEN' : '○ CLOSED'}
                                    </div>
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }} />
                                    <div style={{ position: 'absolute', bottom: '25px', left: '30px' }}>
                                         <Badge color={theme.primary}>{r.cuisine_type}</Badge>
                                    </div>
                                </div>
                                <div style={{ padding: '35px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <h3 style={{ fontSize: '26px', fontWeight: '900', color: '#FFF', margin: 0 }}>{r.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.primary }}>
                                            <Star size={18} fill={theme.primary} />
                                            <span style={{ fontWeight: '900', fontSize: '18px' }}>{(r.rating_avg || 0).toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5', marginBottom: '25px', height: '3em', overflow: 'hidden' }}>{r.address}</p>
                                    <div style={{ display: 'flex', gap: '20px', color: '#444', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '25px', borderTop: '1px solid #1A1A1A' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16}/> 30 min</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={16}/> Free Delivery</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
};

const RestaurantProfileView = ({ id, setView, onAddToCart, restaurant, setRestaurant }) => {
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [rRes, mRes] = await Promise.all([
                    restaurantApi.getRestaurant(id),
                    restaurantApi.getMenu(id)
                ]);
                setRestaurant(rRes.data);
                setMenu(mRes.data || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
        window.scrollTo(0, 0);
    }, [id, setRestaurant]);

    if (loading) return (
        <div style={{ height: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '50px', height: '50px', border: '5px solid #222', borderTopColor: theme.primary, borderRadius: '50%' }} />
        </div>
    );
    if (!restaurant) return <div style={{ height: '100vh', backgroundColor: '#000', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Error loading profile.</div>;

    return (
        <div style={{ backgroundColor: '#000', minHeight: '100vh' }}>
            {/* HERO */}
            <div style={{ position: 'relative', height: '60vh', overflow: 'hidden' }}>
                <img src={restaurant.image_url || IMAGES.heroRamen} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, #000 0%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: '60px', left: '8%', right: '8%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '40px' }}>
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                        <Badge>{restaurant.cuisine_type} Specialist</Badge>
                        <h1 style={{ fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: '900', color: '#FFF', margin: '20px 0', letterSpacing: '-3px', lineHeight: 1 }}>{restaurant.name}</h1>
                        <div style={{ display: 'flex', gap: '30px', color: '#A0A0A0', fontWeight: '700' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MapPin size={20} color={theme.primary} /> {restaurant.address}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Star size={20} fill={theme.primary} color={theme.primary} /> <span style={{ color: '#FFF' }}>{(restaurant.rating_avg || 0).toFixed(1)} Rating</span></div>
                        </div>
                    </motion.div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                         <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', padding: '25px 40px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: theme.primary }}>25-35</div>
                            <div style={{ fontSize: '11px', color: '#666', fontWeight: '900', textTransform: 'uppercase', marginTop: '5px', letterSpacing: '1px' }}>Minutes</div>
                         </div>
                         <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', padding: '25px 40px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: theme.success }}>FREE</div>
                            <div style={{ fontSize: '11px', color: '#666', fontWeight: '900', textTransform: 'uppercase', marginTop: '5px', letterSpacing: '1px' }}>Delivery</div>
                         </div>
                    </div>
                </div>
            </div>

            <Section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '42px', fontWeight: '900', color: '#FFF', letterSpacing: '-2px' }}>Menu <span style={{ color: theme.primary }}>Selection</span></h2>
                    <div style={{ color: '#666', fontWeight: '700' }}>{menu.length} Items Available</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '40px', paddingBottom: '100px' }}>
                    {menu.map((item, i) => (
                        <motion.div
                            key={item.item_id}
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            style={{ backgroundColor: '#0A0A0A', borderRadius: '40px', overflow: 'hidden', border: '1px solid #1A1A1A', position: 'relative' }}
                            whileHover={{ borderColor: theme.primary, y: -10 }}
                        >
                            <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
                                <img src={item.image_url || IMAGES.food.burger} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '8px 15px', borderRadius: '50px', color: '#FFF', fontWeight: '900', fontSize: '18px' }}>
                                    {formatCurrency(item.price)}
                                </div>
                            </div>
                            <div style={{ padding: '35px' }}>
                                <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#FFF', marginBottom: '15px' }}>{item.name}</h3>
                                <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.7', marginBottom: '35px', height: '4.8em', overflow: 'hidden' }}>{item.description || "Gourmet selection crafted for the ultimate taste experience."}</p>
                                <Button label="Add to Order" onClick={() => onAddToCart(item, restaurant)} style={{ width: '100%', borderRadius: '50px' }} icon={<Plus size={20} />} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Section>
        </div>
    );
};

const CartView = ({ cart, onRemove, setView, notification, showNotify }) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 15;
    const serviceFee = 5;
    const total = subtotal + deliveryFee + serviceFee;

    return (
        <div style={{ backgroundColor: '#000', minHeight: '100vh', paddingTop: '150px' }}>
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 3000, padding: '16px 32px', borderRadius: '50px', backgroundColor: notification.type === 'success' ? theme.success : theme.danger, color: '#000', fontWeight: '900', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        {notification.type === 'success' ? <CheckCircle size={20}/> : <X size={20}/>}
                        {notification.text}
                    </motion.div>
                )}
            </AnimatePresence>
            <Section noPadding>
                <div style={{ marginBottom: '60px' }}>
                    <Badge>Shopping Cart</Badge>
                    <h2 style={{ fontSize: '56px', fontWeight: '900', color: '#FFF', margin: '20px 0 0', letterSpacing: '-3px' }}>Your <span style={{ color: theme.primary }}>Order</span></h2>
                </div>

                {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '120px 40px', backgroundColor: '#0A0A0A', borderRadius: '60px', border: '1px solid #1A1A1A' }}>
                        <div style={{ width: '120px', height: '120px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 40px' }}>
                            <ShoppingBag size={60} style={{ opacity: 0.2 }} />
                        </div>
                        <h3 style={{ color: '#FFF', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>Cart is Empty</h3>
                        <p style={{ color: '#666', marginTop: '16px', marginBottom: '48px', maxWidth: '400px', marginInline: 'auto', lineHeight: '1.7' }}>Browse our selection of gourmet kitchens to start your culinary journey.</p>
                        <Button label="Explore Kitchens" onClick={() => setView('restaurants')} style={{ marginInline: 'auto', borderRadius: '50px' }} />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '60px', alignItems: 'flex-start', marginBottom: '120px' }} className="cart-grid">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {cart.map((item, i) => (
                                <motion.div
                                    key={item.item_id}
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                    style={{ backgroundColor: '#0A0A0A', padding: '30px', borderRadius: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #1A1A1A' }}
                                >
                                    <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                                        <div style={{ width: '100px', height: '100px', borderRadius: '24px', overflow: 'hidden' }}>
                                            <img src={item.image_url || IMAGES.food.burger} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div>
                                            <h4 style={{ color: '#FFF', fontSize: '22px', fontWeight: '900' }}>{item.name}</h4>
                                            <div style={{ display: 'flex', gap: '20px', marginTop: '10px', alignItems: 'center' }}>
                                                <div style={{ color: theme.primary, fontWeight: '900', fontSize: '20px' }}>{formatCurrency(item.price)}</div>
                                                <div style={{ width: '1px', height: '15px', backgroundColor: '#222' }} />
                                                <div style={{ color: '#666', fontWeight: '700', fontSize: '14px' }}>Quantity: <span style={{ color: '#FFF' }}>{item.quantity}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onRemove(item.item_id)}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: theme.danger, cursor: 'pointer', width: '54px', height: '54px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}
                                    >
                                        <X size={24} />
                                    </motion.button>
                                </motion.div>
                            ))}
                        </div>

                        <div style={{ backgroundColor: '#0A0A0A', padding: '50px', borderRadius: '50px', border: '1px solid #1A1A1A', position: 'sticky', top: '120px' }}>
                            <h3 style={{ color: '#FFF', marginBottom: '40px', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>Checkout Detail</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontWeight: '700' }}>
                                    <span>Subtotal</span>
                                    <span style={{ color: '#FFF' }}>{formatCurrency(subtotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontWeight: '700' }}>
                                    <span>Delivery Fee</span>
                                    <span style={{ color: '#FFF' }}>{formatCurrency(deliveryFee)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontWeight: '700' }}>
                                    <span>Service Fee</span>
                                    <span style={{ color: '#FFF' }}>{formatCurrency(serviceFee)}</span>
                                </div>

                                <div style={{ height: '1px', backgroundColor: '#1A1A1A', margin: '15px 0' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <span style={{ color: '#FFF', fontWeight: '900', fontSize: '20px' }}>Grand Total</span>
                                    <span style={{ color: theme.primary, fontWeight: '900', fontSize: '36px', letterSpacing: '-1px' }}>{formatCurrency(total)}</span>
                                </div>

                                <Button
                                    label="Secure Checkout"
                                    onClick={() => setView('checkout')}
                                    style={{ width: '100%', borderRadius: '50px', padding: '24px', marginTop: '20px' }}
                                    icon={<ChevronRight size={22}/>}
                                />

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginTop: '20px', color: '#444' }}>
                                    <ShieldCheck size={16}/>
                                    <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Encrypted & Secure</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Section>
        </div>
    );
};

const CheckoutView = ({ cart, setView, onOrderSuccess, notification, showNotify, user }) => {
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState(user?.phone || '');
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('momo');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + 15 + 5;

    const handlePlaceOrder = async () => {
        if (!address || !phone || !fullName) return showNotify("Please establish all delivery coordinates and identity.", "error");
        setLoading(true);
        try {
            const orderData = {
                restaurant_id: cart[0].restaurant_id,
                total_amount: total,
                delivery_address: `${fullName} | ${address}`,
                geo_lat: 5.60,
                geo_lng: -0.18,
                items: cart.map(i => ({
                    item_id: i.item_id,
                    quantity: i.quantity,
                    unit_price: i.price
                }))
            };
            const res = await orderApi.createOrder(orderData);
            showNotify(`Order Transmitted! ID: ${res.data.order_id.substring(0,8).toUpperCase()}`);
            setTimeout(() => {
                onOrderSuccess();
                setView('profile');
            }, 2000);
        } catch (e) { showNotify("Failed to transmit order.", "error"); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ backgroundColor: '#000', minHeight: '100vh', paddingTop: '150px' }}>
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 3000, padding: '16px 32px', borderRadius: '50px', backgroundColor: notification.type === 'success' ? theme.success : theme.danger, color: '#000', fontWeight: '900', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        {notification.type === 'success' ? <CheckCircle size={20}/> : <X size={20}/>}
                        {notification.text}
                    </motion.div>
                )}
            </AnimatePresence>
            <Section noPadding>
                <div style={{ marginBottom: '60px' }}>
                    <Badge>Final Step</Badge>
                    <h2 style={{ fontSize: '56px', fontWeight: '900', color: '#FFF', margin: '20px 0 0', letterSpacing: '-3px' }}>Complete <span style={{ color: theme.primary }}>Purchase</span></h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '60px', alignItems: 'flex-start', marginBottom: '120px' }} className="checkout-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        <div style={{ backgroundColor: '#0A0A0A', padding: '50px', borderRadius: '50px', border: '1px solid #1A1A1A' }}>
                            <h3 style={{ color: '#FFF', marginBottom: '40px', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>Recipient Identity</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <Input label="Full Name" placeholder="Philemon..." value={fullName} onChange={e => setFullName(e.target.value)} icon={<User size={22}/>} />
                                <Input label="Email Confirmation" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} icon={<Mail size={22}/>} />
                                <Input label="Contact Terminal" placeholder="+233..." value={phone} onChange={e => setPhone(e.target.value)} icon={<Phone size={22}/>} />
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#0A0A0A', padding: '50px', borderRadius: '50px', border: '1px solid #1A1A1A' }}>
                            <h3 style={{ color: '#FFF', marginBottom: '40px', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>Delivery Address</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <Input label="Digital Address / Location" placeholder="e.g. GA-123-4567, Osu, Accra" value={address} onChange={e => setAddress(e.target.value)} icon={<MapPin size={22}/>} />
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#0A0A0A', padding: '50px', borderRadius: '50px', border: '1px solid #1A1A1A' }}>
                            <h3 style={{ color: '#FFF', marginBottom: '40px', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>Payment Method</h3>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPaymentMethod('momo')}
                                    style={{ flex: 1, minWidth: '200px', padding: '35px', borderRadius: '32px', border: '2px solid', borderColor: paymentMethod === 'momo' ? theme.primary : '#1A1A1A', backgroundColor: paymentMethod === 'momo' ? `${theme.primary}10` : 'rgba(255,255,255,0.02)', textAlign: 'center', cursor: 'pointer', transition: '0.3s' }}
                                >
                                    <div style={{ width: '60px', height: '60px', backgroundColor: paymentMethod === 'momo' ? theme.primary : 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: paymentMethod === 'momo' ? '#000' : '#666' }}>
                                        <Smartphone size={32}/>
                                    </div>
                                    <div style={{ color: '#FFF', fontWeight: '900', fontSize: '18px' }}>Mobile Money</div>
                                    <div style={{ color: '#666', fontSize: '12px', marginTop: '5px', fontWeight: '700' }}>MTN / Vodafone / AirtelTigo</div>
                                </motion.div>
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPaymentMethod('card')}
                                    style={{ flex: 1, minWidth: '200px', padding: '35px', borderRadius: '32px', border: '2px solid', borderColor: paymentMethod === 'card' ? theme.primary : '#1A1A1A', backgroundColor: paymentMethod === 'card' ? `${theme.primary}10` : 'rgba(255,255,255,0.02)', textAlign: 'center', cursor: 'pointer', transition: '0.3s' }}
                                >
                                    <div style={{ width: '60px', height: '60px', backgroundColor: paymentMethod === 'card' ? theme.primary : 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: paymentMethod === 'card' ? '#000' : '#666' }}>
                                        <CreditCard size={32}/>
                                    </div>
                                    <div style={{ color: '#FFF', fontWeight: '900', fontSize: '18px' }}>Debit / Credit Card</div>
                                    <div style={{ color: '#666', fontSize: '12px', marginTop: '5px', fontWeight: '700' }}>Visa / Mastercard</div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#0A0A0A', padding: '50px', borderRadius: '50px', border: '1px solid #1A1A1A', position: 'sticky', top: '120px' }}>
                        <h3 style={{ color: '#FFF', marginBottom: '40px', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>Order Summary</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                            {cart.map(i => (
                                <div key={i.item_id} style={{ display: 'flex', justifyContent: 'space-between', color: '#A0A0A0', fontSize: '14px', fontWeight: '700' }}>
                                    <span>{i.quantity}x {i.name}</span>
                                    <span style={{ color: '#FFF' }}>{formatCurrency(i.price * i.quantity)}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: '40px', marginBottom: '40px' }}>
                            <div style={{ fontSize: '14px', color: '#666', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Total to Pay</div>
                            <div style={{ fontSize: '48px', fontWeight: '900', color: theme.primary, letterSpacing: '-2px' }}>{formatCurrency(total)}</div>
                        </div>

                        <Button
                            label={loading ? "Processing..." : "Place Order Now"}
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            style={{ width: '100%', borderRadius: '50px', padding: '24px' }}
                            icon={loading ? null : <ShieldCheck size={22}/>}
                        />
                        <p style={{ color: '#444', fontSize: '12px', marginTop: '25px', textAlign: 'center', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Secure Payment by Paystack Protocol</p>
                    </div>
                </div>
            </Section>
        </div>
    );
};

const ProfileView = ({ user, setView, showNotify, notification }) => {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('orders');
    const [reviewing, setReviewing] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    // Form states for settings
    const [profileForm, setProfileForm] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    const [addresses, setAddresses] = useState(() => {
        try { return JSON.parse(user?.address || '[]'); } catch(e) { return []; }
    });

    const loadOrders = async () => {
        if (!user) return;
        try {
            const res = await orderApi.getOrders();
            setOrders(res.data.sort((a,b) => new Date(b.placed_at) - new Date(a.placed_at)));
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (!user) return;
        loadOrders();
        const ws = new WebSocket(`ws://localhost:8002/ws/orders/customer_${user.user_id}`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Update:", data);
            loadOrders();
        };
        return () => ws.close();
    }, [user?.user_id]);

    if (!user) return (
        <div style={{ height: '100vh', backgroundColor: '#000', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Authenticating...
        </div>
    );

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authApi.updateMe(profileForm);
            showNotify("Identity synchronization complete.");
        } catch (e) { showNotify("Failed to update profile", "error"); }
        finally { setLoading(false); }
    };

    const handleAddressSave = async (newAddr) => {
        const updated = [...addresses, newAddr];
        setLoading(true);
        try {
            await authApi.updateMe({ address: JSON.stringify(updated) });
            setAddresses(updated);
            showNotify("New coordinate established.");
        } catch (e) { showNotify("Failed to save address", "error"); }
        finally { setLoading(false); }
    };

    const submitReview = async () => {
        try {
            await restaurantApi.submitReview(reviewing.order_id, { rating, comment });
            showNotify("Culinary feedback transmitted! 🌟");
            setReviewing(null);
        } catch (e) { showNotify("Failed to transmit review.", "error"); }
    };

    return (
        <div style={{ backgroundColor: '#000', minHeight: '100vh', paddingTop: '150px' }}>
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 3000, padding: '16px 32px', borderRadius: '50px', backgroundColor: notification.type === 'success' ? theme.success : theme.danger, color: '#000', fontWeight: '900', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        {notification.type === 'success' ? <CheckCircle size={20}/> : <X size={20}/>}
                        {notification.text}
                    </motion.div>
                )}
            </AnimatePresence>
            <Section noPadding>
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '60px', alignItems: 'flex-start', marginBottom: '120px' }} className="profile-grid">
                    {/* SIDEBAR */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div style={{ backgroundColor: '#0A0A0A', padding: '40px', borderRadius: '40px', border: '1px solid #1A1A1A', textAlign: 'center' }}>
                            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 25px' }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: theme.primary, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: '900', border: '4px solid #1A1A1A' }}>{user.full_name[0]}</div>
                                <div style={{ position: 'absolute', bottom: 5, right: 5, width: '32px', height: '32px', backgroundColor: theme.success, borderRadius: '50%', border: '4px solid #0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={16} color="#FFF"/>
                                </div>
                            </div>
                            <h3 style={{ color: '#FFF', fontSize: '24px', fontWeight: '900', marginBottom: '5px' }}>{user.full_name}</h3>
                            <p style={{ color: '#666', fontSize: '14px', fontWeight: '600' }}>{user.email}</p>
                            <div style={{ marginTop: '20px' }}>
                                <Badge>Verified User</Badge>
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#0A0A0A', padding: '15px', borderRadius: '40px', border: '1px solid #1A1A1A', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { id: 'orders', name: 'Order History', icon: <ShoppingBag size={20}/> },
                                { id: 'addresses', name: 'My Addresses', icon: <MapPin size={20}/> },
                                { id: 'payments', name: 'Payments', icon: <CreditCard size={20}/> },
                                { id: 'settings', name: 'Account Settings', icon: <Settings size={20}/> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '15px', padding: '18px 25px', borderRadius: '25px',
                                        background: activeTab === tab.id ? `${theme.primary}15` : 'transparent',
                                        color: activeTab === tab.id ? theme.primary : '#666',
                                        border: 'none', cursor: 'pointer', fontWeight: '800', transition: '0.3s', textAlign: 'left'
                                    }}
                                >
                                    {tab.icon}
                                    {tab.name}
                                </button>
                            ))}
                            <button
                                onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '18px 25px', borderRadius: '25px', background: 'none', color: theme.danger, border: 'none', cursor: 'pointer', fontWeight: '800', transition: '0.3s', textAlign: 'left', marginTop: '10px' }}
                            >
                                <LogOut size={20}/>
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div style={{ backgroundColor: '#0A0A0A', padding: '50px', borderRadius: '50px', border: '1px solid #1A1A1A', minHeight: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
                             <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#FFF', letterSpacing: '-1.5px' }}>
                                {activeTab === 'orders' ? 'Order History' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                             </h2>
                             {activeTab === 'orders' && <Badge color={theme.success}>{orders.length} Completed</Badge>}
                        </div>

                        {activeTab === 'orders' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {orders.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                                        <div style={{ fontSize: '64px', opacity: 0.1, marginBottom: '20px' }}>🗃️</div>
                                        <p style={{ color: '#444', fontWeight: '900', fontSize: '18px' }}>No orders found in your history.</p>
                                        <Button label="Place Your First Order" onClick={() => setView('restaurants')} variant="secondary" style={{ marginTop: '30px', marginInline: 'auto' }} />
                                    </div>
                                ) : orders.map(o => (
                                    <motion.div
                                        key={o.order_id}
                                        whileHover={{ x: 10, borderColor: 'rgba(255,255,255,0.15)' }}
                                        style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '32px', border: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '25px', transition: '0.3s' }}
                                    >
                                        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: 'rgba(255,138,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.primary }}>
                                                <ShoppingBag size={30} />
                                            </div>
                                            <div>
                                                <div style={{ color: '#FFF', fontWeight: '900', fontSize: '20px', letterSpacing: '-0.5px' }}>#{o.order_id.substring(0,8).toUpperCase()}</div>
                                                <div style={{ color: '#666', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Clock size={14}/> {new Date(o.placed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#FFF', fontWeight: '900', fontSize: '24px' }}>{formatCurrency(o.total_amount)}</div>
                                            <div style={{
                                                fontSize: '11px', color: o.status === 'DELIVERED' ? theme.success : theme.primary,
                                                fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px',
                                                background: o.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,138,0,0.1)',
                                                padding: '6px 14px', borderRadius: '50px', marginTop: '10px', display: 'inline-block'
                                            }}>{o.status}</div>

                                            {o.status === 'DELIVERED' && !reviewing && (
                                                <button onClick={() => setReviewing(o)} style={{ display: 'block', width: '100%', marginTop: '15px', background: 'none', border: 'none', color: theme.primary, fontWeight: '900', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Rate Order →</button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : activeTab === 'settings' ? (
                            <form onSubmit={handleProfileUpdate} style={{ maxWidth: '500px', animation: 'fadeInUp 0.4s' }}>
                                <Input label="Full Name" value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} icon={<User size={18}/>} />
                                <Input label="Email Access" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} icon={<Mail size={18}/>} />
                                <Input label="Phone Terminal" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} icon={<Phone size={18}/>} />
                                <Button label={loading ? "Synchronizing..." : "Update Identity"} type="submit" style={{ marginTop: '20px', borderRadius: '50px' }} />
                            </form>
                        ) : activeTab === 'payments' ? (
                            <div style={{ animation: 'fadeInUp 0.4s' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
                                    <div style={{ padding: '30px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{ width: '50px', height: '50px', backgroundColor: '#FFD70015', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD700' }}>
                                                <Smartphone size={24}/>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: '#FFF' }}>MTN Mobile Money</div>
                                                <div style={{ fontSize: '13px', color: '#666' }}>Primary Wallet: {user.phone}</div>
                                            </div>
                                        </div>
                                        <Badge color={theme.success}>Active</Badge>
                                    </div>
                                    <div style={{ padding: '30px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '32px', border: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{ width: '50px', height: '50px', backgroundColor: '#FFF15', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                                                <CreditCard size={24}/>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: '#FFF' }}>Visa ending in 4242</div>
                                                <div style={{ fontSize: '13px', color: '#666' }}>Expired 12/24</div>
                                            </div>
                                        </div>
                                        <Button label="Renew" variant="secondary" size="small" />
                                    </div>
                                </div>
                                <Button label="Add New Payment Method" variant="secondary" style={{ borderRadius: '50px' }} icon={<Plus size={18}/>} />
                            </div>
                        ) : activeTab === 'addresses' ? (
                            <div style={{ animation: 'fadeInUp 0.4s' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
                                    {addresses.length === 0 ? <p style={{ color: '#444', fontWeight: '700' }}>No addresses stored in memory.</p> : addresses.map((a, i) => (
                                        <div key={i} style={{ padding: '25px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                <MapPin size={20} color={theme.primary} />
                                                <div style={{ fontWeight: '700', color: '#FFF' }}>{a}</div>
                                            </div>
                                            <button onClick={() => {
                                                const filtered = addresses.filter((_, idx) => idx !== i);
                                                authApi.updateMe({ address: JSON.stringify(filtered) }).then(() => setAddresses(filtered));
                                            }} style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}>REMOVE</button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '32px', border: '1px solid #1A1A1A' }}>
                                    <h4 style={{ color: '#FFF', marginBottom: '20px', fontSize: '18px' }}>Establish New coordinate</h4>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <input id="new-addr-input" placeholder="Enter delivery address..." style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid #1A1A1A', borderRadius: '15px', padding: '0 20px', color: '#FFF', outline: 'none' }} />
                                        <Button label="Save" onClick={() => {
                                            const val = document.getElementById('new-addr-input').value;
                                            if (val) {
                                                handleAddressSave(val);
                                                document.getElementById('new-addr-input').value = '';
                                            }
                                        }} style={{ borderRadius: '15px' }} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                                <div style={{ fontSize: '64px', opacity: 0.1, marginBottom: '20px' }}>🔒</div>
                                <p style={{ color: '#444', fontWeight: '900', fontSize: '18px' }}>This section is currently under encryption.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Section>

            {reviewing && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ backgroundColor: '#0A0A0A', padding: '60px', borderRadius: '50px', width: '100%', maxWidth: '500px', border: '1px solid #1A1A1A' }}>
                        <h3 style={{ color: '#FFF', fontSize: '32px', fontWeight: '900', marginBottom: '15px', letterSpacing: '-1px' }}>Rate Experience</h3>
                        <p style={{ color: '#666', marginBottom: '40px' }}>How was your order from our kitchen? Your feedback helps us maintain excellence.</p>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '40px', justifyContent: 'center' }}>
                            {[1,2,3,4,5].map(i => (
                                <button key={i} onClick={() => setRating(i)} style={{ fontSize: '48px', background: 'none', border: 'none', cursor: 'pointer', color: i <= rating ? theme.primary : '#1A1A1A', transition: '0.2s' }}>★</button>
                            ))}
                        </div>
                        <Input label="Share your thoughts" value={comment} onChange={e => setComment(e.target.value)} placeholder="E.g. The food was incredible and arrival was prompt!" />
                        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                            <Button label="Cancel" variant="secondary" onClick={() => setReviewing(null)} style={{ flex: 1, borderRadius: '50px' }} />
                            <Button label="Submit Feedback" onClick={submitReview} style={{ flex: 1, borderRadius: '50px' }} />
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const LoginView = ({ setAuthView, onLogin }) => {
    const [email, setEmail] = useState('customer@example.com');
    const [password, setPassword] = useState('password123');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [isMerchant, setIsMerchant] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const fd = new URLSearchParams();
            fd.append('username', email);
            fd.append('password', password);
            const res = await authApi.login(fd);
            const { access_token, redirect_url } = res.data;
            localStorage.setItem('token', access_token);

            if (redirect_url.includes('pending-verification')) {
                setError(res.data.role === 'vendor' ?
                    'Your Merchant Application is currently under review. Our team will notify you once approved.' :
                    'Your account is currently pending verification.');
                localStorage.removeItem('token');
                return;
            }

            if (redirect_url.includes('vendor')) window.location.href = `http://localhost:5173/?token=${access_token}`;
            else if (redirect_url.includes('admin')) window.location.href = `http://localhost:5174/?token=${access_token}`;
            else {
                const me = await authApi.getMe();
                onLogin(me.data);
            }
        } catch (err) {
            setError('Invalid credentials. Please verify your email and password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', backgroundColor: '#050505' }}>
            {/* Left Side: Branding/Image (Desktop only) */}
            <div className="auth-hero" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', background: 'linear-gradient(135deg, #0A0A0A 0%, #000 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: `${theme.primary}10`, borderRadius: '50%', filter: 'blur(120px)' }} />

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ fontSize: '32px', fontWeight: '900', color: theme.primary, fontFamily: 'serif', letterSpacing: '-1.5px', marginBottom: '60px', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        <div style={{ width: '45px', height: '45px', backgroundColor: theme.primary, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Store color="#000" size={28} />
                        </div>
                        <span>fDA <span style={{ color: '#FFF' }}>KITCHEN</span></span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: '900', color: '#FFF', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-2px' }}
                    >
                        Scale Your <br/>
                        <span style={{ color: theme.primary, fontFamily: 'serif', fontStyle: 'italic', fontWeight: '400' }}>Culinary</span> Reach.
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ color: '#666', fontSize: '18px', maxWidth: '400px', lineHeight: '1.6', fontWeight: '500' }}
                    >
                        Join the fastest growing food network. Manage orders, track performance, and delight customers—all from one terminal.
                    </motion.p>

                    <div style={{ marginTop: '80px', display: 'flex', gap: '60px' }}>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '900', color: theme.primary }}>5k+</div>
                            <div style={{ color: '#444', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Users</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '900', color: theme.primary }}>Instant</div>
                            <div style={{ color: '#444', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Payouts</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ width: '100%', maxWidth: '450px' }}
                >
                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#FFF', marginBottom: '12px', letterSpacing: '-1px' }}>{isMerchant ? 'Merchant Portal' : 'Customer Portal'}</h1>
                        <p style={{ color: '#666', fontWeight: '600' }}>Sign in to manage your {isMerchant ? 'kitchen' : 'orders'}</p>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
                        <Input
                            label={isMerchant ? "Merchant Email" : "Email Address"}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            icon={<Mail size={20}/>}
                            placeholder={isMerchant ? "vendor@example.com" : "customer@example.com"}
                        />
                        <div style={{ position: 'relative' }}>
                            <Input
                                label="Security Access Key"
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                icon={<Lock size={20}/>}
                                placeholder="••••••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: '20px', top: '48px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', transition: '0.3s', fontSize: '10px', fontWeight: '800' }}
                            >
                                {showPass ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#666', fontSize: '13px', fontWeight: '600' }}>
                                <input type="checkbox" style={{ accentColor: theme.primary }} defaultChecked /> Keep me logged in
                            </label>
                            <button type="button" style={{ background: 'none', border: 'none', color: theme.primary, fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>Lost key?</button>
                        </div>

                        {error && (
                            <div style={{ backgroundColor: `${theme.danger}10`, border: `1px solid ${theme.danger}30`, padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', color: theme.danger }}>
                                <X size={20} />
                                <span style={{ fontSize: '13px', fontWeight: '600' }}>{error}</span>
                            </div>
                        )}

                        <Button
                            label={loading ? "Verifying..." : `🔥 Enter ${isMerchant ? 'Kitchen' : 'Portal'}`}
                            type="submit"
                            style={{ width: '100%', padding: '24px', borderRadius: '16px', fontSize: '16px' }}
                            disabled={loading}
                        />
                    </form>

                    <div style={{ marginTop: '40px', textAlign: 'center' }}>
                        <p style={{ color: '#666', fontSize: '14px', fontWeight: '700' }}>
                            {isMerchant ? 'New Merchant?' : 'Need a merchant account?'}
                            <button
                                onClick={() => isMerchant ? setAuthView('register') : setIsMerchant(true)}
                                style={{ color: theme.primary, background: 'none', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '14px', marginLeft: '8px' }}
                            >
                                Apply to join
                            </button>
                        </p>
                        {isMerchant && (
                             <button
                                onClick={() => setIsMerchant(false)}
                                style={{ color: '#444', background: 'none', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '12px', marginTop: '20px', textDecoration: 'underline' }}
                             >
                                Back to Customer Sign In
                             </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const RegisterView = ({ setAuthView }) => {
    const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', role: 'customer' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authApi.register(form);
            setIsRegistered(true);
        } catch (err) {
            setError('Registration failed. This email or phone might already be in use.');
        } finally {
            setLoading(false);
        }
    };

    if (isRegistered) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', padding: '20px' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ backgroundColor: '#0A0A0A', padding: '60px', borderRadius: '50px', width: '100%', maxWidth: '500px', border: '1px solid #1A1A1A', textAlign: 'center' }}>
                    <div style={{ fontSize: '72px', marginBottom: '32px' }}>{form.role === 'vendor' ? '🚀' : '✅'}</div>
                    <h3 style={{ color: '#FFF', fontSize: '32px', fontWeight: '900', marginBottom: '15px', letterSpacing: '-1px' }}>
                        {form.role === 'vendor' ? 'Application Received' : 'Welcome to fDA'}
                    </h3>
                    <p style={{ color: '#666', marginBottom: '40px', lineHeight: '1.6', fontSize: '18px' }}>
                        {form.role === 'vendor'
                            ? 'Your merchant account is currently under review. Our operations team will validate your credentials and notify you once your kitchen is live.'
                            : 'Your account has been successfully established. You can now access the global gourmet network.'}
                    </p>
                    <Button label="Back to Login" onClick={() => setAuthView('login')} style={{ width: '100%', borderRadius: '50px', padding: '20px' }} />
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', backgroundColor: '#050505' }}>
            <div className="auth-hero" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', background: 'linear-gradient(225deg, #0A0A0A 0%, #000 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position: 'absolute', top: '10%', right: '-10%', width: '60%', height: '60%', background: `${theme.primary}10`, borderRadius: '50%', filter: 'blur(120px)' }} />

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ fontSize: '32px', fontWeight: '900', color: theme.primary, fontFamily: 'serif', letterSpacing: '-1.5px', marginBottom: '60px', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        <div style={{ width: '45px', height: '45px', backgroundColor: theme.primary, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Store color="#000" size={28} />
                        </div>
                        <span>fDA <span style={{ color: '#FFF' }}>NETWORK</span></span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: '900', color: '#FFF', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-2px' }}
                    >
                        Join the <br/>
                        <span style={{ color: theme.primary, fontFamily: 'serif', fontStyle: 'italic', fontWeight: '400' }}>Future</span> of Food.
                    </motion.h2>

                    <p style={{ color: '#666', fontSize: '18px', maxWidth: '400px', lineHeight: '1.6', fontWeight: '500' }}>
                        Select your operative role and initialize your profile on the fDA network.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ width: '100%', maxWidth: '450px' }}
                >
                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#FFF', marginBottom: '12px', letterSpacing: '-1px' }}>Initialize Profile</h1>
                        <p style={{ color: '#666', fontWeight: '600' }}>Complete the application to join the ecosystem</p>
                    </div>

                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                            {['customer', 'vendor'].map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setForm({...form, role})}
                                    style={{
                                        flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid',
                                        borderColor: form.role === role ? theme.primary : '#1A1A1A',
                                        backgroundColor: form.role === role ? `${theme.primary}10` : 'transparent',
                                        color: form.role === role ? theme.primary : '#666',
                                        fontWeight: '800', textTransform: 'uppercase', fontSize: '12px', cursor: 'pointer', transition: '0.3s'
                                    }}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                             <Input
                                label="Identity"
                                value={form.full_name}
                                onChange={e => setForm({...form, full_name: e.target.value})}
                                required
                                icon={<User size={18}/>}
                                placeholder="Full Name"
                            />
                            <Input
                                label="Terminal"
                                value={form.phone}
                                onChange={e => setForm({...form, phone: e.target.value})}
                                required
                                icon={<Phone size={18}/>}
                                placeholder="+233..."
                            />
                        </div>
                        <Input
                            label="Communication"
                            type="email"
                            value={form.email}
                            onChange={e => setForm({...form, email: e.target.value})}
                            required
                            icon={<Mail size={20}/>}
                            placeholder="agent@example.com"
                        />
                        <Input
                            label="Access Key"
                            type="password"
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                            required
                            icon={<Lock size={20}/>}
                            placeholder="Min. 8 characters"
                        />

                        {error && (
                            <div style={{ backgroundColor: `${theme.danger}10`, border: `1px solid ${theme.danger}30`, padding: '16px', borderRadius: '12px', marginBottom: '24px', color: theme.danger, fontSize: '13px', fontWeight: '600', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <X size={20}/> {error}
                            </div>
                        )}

                        <Button
                            label={loading ? "Processing..." : form.role === 'vendor' ? "Submit Merchant Application" : "Initialize Customer Account"}
                            type="submit"
                            style={{ width: '100%', padding: '20px', borderRadius: '16px', marginTop: '10px' }}
                            disabled={loading}
                        />
                    </form>

                    <div style={{ marginTop: '40px', textAlign: 'center' }}>
                        <p style={{ color: '#666', fontSize: '14px', fontWeight: '700' }}>
                            Existing operative?
                            <button
                                onClick={() => setAuthView('login')}
                                style={{ color: theme.primary, background: 'none', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '14px', marginLeft: '8px', textDecoration: 'underline' }}
                            >
                                Back to Terminal
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// --- MAIN APP ---

export default function App() {
    const [view, setView] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            try { return JSON.parse(decodeURIComponent(hash)); }
            catch(e) { return hash; }
        }
        return 'home';
    });

    const [restaurants, setRestaurants] = useState([]);
    const [featuredItems, setFeaturedItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [activeRestaurant, setActiveRestaurant] = useState(null);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [notification, setNotification] = useState(null);

    const showNotify = (text, type = 'success') => {
        setNotification({ text, type });
        setTimeout(() => setNotification(null), 4000);
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash) {
                try { setView(JSON.parse(decodeURIComponent(hash))); }
                catch(e) { setView(hash); }
            } else {
                setView('home');
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleSetView = (v) => {
        window.location.hash = encodeURIComponent(JSON.stringify(v));
    };

    const init = async () => {
        setLoading(true);
        try {
            const [res, items, cats, promos] = await Promise.all([
                restaurantApi.getRestaurants(),
                restaurantApi.getFeaturedItems(),
                restaurantApi.getCategories(),
                restaurantApi.getPromotions()
            ]);
            setRestaurants(res.data || []);
            setFeaturedItems(items.data || []);
            setCategories(cats.data || []);
            setPromotions(promos.data || []);
        } catch (e) { console.error(e); }

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await authApi.getMe();
                setUser(res.data);
            } catch (e) { localStorage.removeItem('token'); }
        }
        setLoading(false);
    };

    useEffect(() => {
        init();
        window.scrollTo(0, 0);
    }, [view]);

    const onAddToCart = (item, restaurant) => {
        if (!user) return setView('login');
        if (activeRestaurant && activeRestaurant.restaurant_id !== restaurant.restaurant_id) {
            if (!window.confirm("Replace current cart from another restaurant?")) return;
            setCart([{ ...item, quantity: 1, restaurant_id: restaurant.restaurant_id }]);
            setActiveRestaurant(restaurant);
        } else {
            const existing = cart.find(i => i.item_id === item.item_id);
            if (existing) {
                setCart(cart.map(i => i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i));
            } else {
                setCart([...cart, { ...item, quantity: 1, restaurant_id: restaurant.restaurant_id }]);
            }
            setActiveRestaurant(restaurant);
        }
        // Could use a toast notification here instead of alert
    };

    if (loading) return (
        <div style={{ height: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '60px', height: '60px', border: '6px solid #1A1A1A', borderTopColor: theme.primary, borderRadius: '50%' }} />
        </div>
    );

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#FFF', backgroundColor: '#000', minHeight: '100vh' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,900;1,400&display=swap');

                * { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
                input::placeholder { color: #444; }
                select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }

                @media (max-width: 1024px) {
                    .nav-links, .user-name { display: none !important; }
                    .mobile-menu-btn { display: flex !important; }
                }

                @media (max-width: 768px) {
                    .restaurant-grid, .cart-grid, .checkout-grid, .profile-grid {
                        grid-template-columns: 1fr !important; gap: 30px !important;
                    }
                    .hero-image-container, .auth-hero { display: none !important; }
                    .hero-section { text-align: center; justify-content: center !important; }
                    .hero-section h1 { margin-inline: auto; }
                    .hero-section p { margin-inline: auto; }
                    .hero-section > div:nth-child(2) { margin-inline: auto; }
                    .footer-grid { grid-template-columns: 1fr !important; gap: 50px !important; text-align: center !important; }
                    .footer-grid > div { display: flex; flex-direction: column; align-items: center; }
                }
            `}</style>

            {view !== 'login' && view !== 'register' && (
                <Navbar
                    user={user}
                    setView={handleSetView}
                    currentView={typeof view === 'string' ? view : view.type}
                    cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
                />
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={typeof view === 'string' ? view : view.type + (view.id || view.search || '')}
                    variants={fadeInUp} initial="initial" animate="animate" exit="exit"
                >
                    {view === 'home' && <HomeView setView={handleSetView} restaurants={restaurants} featuredItems={featuredItems} categories={categories} />}
                    {(view === 'restaurants' || (typeof view === 'object' && view.type === 'restaurants')) && (
                        <RestaurantsView restaurants={restaurants} setView={handleSetView} onSync={init} initialSearch={typeof view === 'object' ? view.search : ''} notification={notification} showNotify={showNotify} />
                    )}
                    {typeof view === 'object' && view.type === 'restaurant-profile' && (
                        <RestaurantProfileView id={view.id} setView={handleSetView} onAddToCart={onAddToCart} restaurant={activeRestaurant} setRestaurant={setActiveRestaurant} />
                    )}
                    {view === 'cart' && <CartView cart={cart} onRemove={(id) => setCart(cart.filter(i => i.item_id !== id))} setView={handleSetView} notification={notification} showNotify={showNotify} />}
                    {view === 'checkout' && <CheckoutView cart={cart} setView={handleSetView} onOrderSuccess={() => setCart([])} notification={notification} showNotify={showNotify} user={user} />}
                    {view === 'profile' && <ProfileView user={user} setView={handleSetView} showNotify={showNotify} notification={notification} />}
                    {view === 'login' && <LoginView setAuthView={handleSetView} onLogin={(u) => { setUser(u); handleSetView('home'); }} />}
                    {view === 'register' && <RegisterView setAuthView={handleSetView} />}
    {/* Informational Views */}
    {view === 'aboutus' && (
        <div style={{ backgroundColor: '#000', minHeight: '100vh', paddingTop: '150px' }}>
            <Section>
                <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto 100px' }}>
                    <Badge>Our Identity</Badge>
                    <h2 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: '900', color: '#FFF', margin: '24px 0', letterSpacing: '-3px', lineHeight: 1 }}>Bridging <span style={{ color: theme.primary }}>Global Flavors</span></h2>
                    <p style={{ color: '#A0A0A0', fontSize: '20px', lineHeight: '1.8', fontWeight: '500' }}>
                        WorldPlate is West Africa's premier gourmet delivery network. We don't just deliver food; we deliver a curated selection of the world's finest culinary experiences.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '100px' }}>
                    {[
                        { title: 'The Mission', desc: 'To empower culinary entrepreneurs with elite technology, making global cuisines accessible everywhere.', icon: <Store size={32}/> },
                        { title: 'The Vision', desc: 'To become the most trusted culinary logistics ecosystem in Africa, recognized for quality and speed.', icon: <Truck size={32}/> },
                        { title: 'The standard', desc: 'Every meal must meet our gold standard. Transparent pricing and honest timelines, always.', icon: <ShieldCheck size={32}/> }
                    ].map((item, i) => (
                        <div key={i} style={{ backgroundColor: '#0A0A0A', padding: '50px', borderRadius: '40px', border: '1px solid #1A1A1A' }}>
                            <div style={{ color: theme.primary, marginBottom: '25px' }}>{item.icon}</div>
                            <h3 style={{ color: '#FFF', fontSize: '24px', fontWeight: '900', marginBottom: '15px' }}>{item.title}</h3>
                            <p style={{ color: '#666', lineHeight: '1.6', fontSize: '15px' }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    )}

    {view === 'specials' && (
        <div style={{ backgroundColor: '#000', minHeight: '100vh', paddingTop: '150px' }}>
            <Section>
                <div style={{ marginBottom: '80px' }}>
                    <Badge>Daily Selection</Badge>
                    <h2 style={{ fontSize: '56px', fontWeight: '900', color: '#FFF', margin: '20px 0 0', letterSpacing: '-3px' }}>The <span style={{ color: theme.primary }}>Exclusives</span></h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px', marginBottom: '80px' }}>
                    {promotions.map((promo, i) => (
                        <motion.div key={i} whileHover={{ scale: 1.02 }} style={{ backgroundColor: '#0A0A0A', borderRadius: '40px', overflow: 'hidden', display: 'flex', border: '1px solid #1A1A1A' }}>
                            <img src={promo.image_url || IMAGES.promoPizza} style={{ width: '40%', objectFit: 'cover' }} />
                            <div style={{ padding: '40px', flex: 1 }}>
                                <Badge color={theme.primary}>{promo.discount_percentage}% OFF</Badge>
                                <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#FFF', margin: '15px 0' }}>{promo.title}</h3>
                                <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6', fontSize: '14px' }}>{promo.description}</p>
                                <Button label="Claim Deal" variant="secondary" onClick={() => setView('restaurants')} style={{ borderRadius: '50px' }} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Section>
        </div>
    )}

    {view === 'contact' && (
        <div style={{ backgroundColor: '#000', minHeight: '100vh', paddingTop: '150px' }}>
            <Section>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }} className="contact-grid">
                    <div>
                        <Badge>Support Center</Badge>
                        <h2 style={{ fontSize: '56px', fontWeight: '900', color: '#FFF', margin: '20px 0 30px', letterSpacing: '-3px' }}>Get in <span style={{ color: theme.primary }}>Touch</span></h2>
                        <p style={{ color: '#A0A0A0', fontSize: '18px', lineHeight: '1.7', marginBottom: '50px' }}>
                            Have questions about our gourmet network? Our tactical support team is available 24/7 to assist with your culinary inquiries.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {[
                                { icon: <Mail size={24}/>, label: 'Transmission', value: 'hq@worldplate.com' },
                                { icon: <Phone size={24}/>, label: 'Hotline', value: '+233 (0) WORLD-PLATE' },
                                { icon: <MapPin size={24}/>, label: 'Headquarters', value: '123 Gourmet Sector, Accra' }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ width: '50px', height: '50px', backgroundColor: 'rgba(255,138,0,0.1)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.primary }}>{item.icon}</div>
                                    <div>
                                        <div style={{ color: '#444', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</div>
                                        <div style={{ color: '#FFF', fontWeight: '700' }}>{item.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ backgroundColor: '#0A0A0A', padding: '60px', borderRadius: '50px', border: '1px solid #1A1A1A' }}>
                        <h3 style={{ color: '#FFF', fontSize: '24px', fontWeight: '900', marginBottom: '40px' }}>Send Message</h3>
                        <Input label="Identity" placeholder="Your full name" icon={<User size={18}/>} />
                        <Input label="Communication" placeholder="email@example.com" icon={<Mail size={18}/>} />
                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#666', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Message</label>
                            <textarea
                                placeholder="How can we assist you today?"
                                style={{ width: '100%', height: '150px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', color: '#FFF', fontSize: '15px', outline: 'none', transition: '0.3s' }}
                                onFocus={e => e.target.style.borderColor = theme.primary}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>
                        <Button label="Dispatch Message" style={{ width: '100%', borderRadius: '50px', padding: '20px' }} icon={<ArrowRight size={20}/>} />
                    </div>
                </div>
            </Section>
        </div>
    )}

    {/* Fallback for other missing views */}
    {!['home', 'restaurants', 'aboutus', 'specials', 'contact', 'cart', 'checkout', 'profile', 'login', 'register'].includes(typeof view === 'string' ? view : view.type) && (
        <Section style={{ paddingTop: '200px', minHeight: '80vh', textAlign: 'center' }}>
            <Badge>404</Badge>
            <h2 style={{ fontSize: '48px', fontWeight: '900', color: '#FFF', marginTop: '20px' }}>Node <span style={{ color: theme.primary }}>Not Found</span></h2>
            <p style={{ color: '#666', marginTop: '20px' }}>The requested coordinate does not exist in the WorldPlate network.</p>
            <Button label="Return to Origin" onClick={() => setView('home')} style={{ marginTop: '40px', marginInline: 'auto' }} />
        </Section>
    )}
</motion.div>
</AnimatePresence>

{view !== 'login' && view !== 'register' && (
    <footer style={{ padding: '100px 8% 50px', backgroundColor: '#050505', borderTop: '1px solid #111' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '80px', marginBottom: '80px' }} className="footer-grid">
            <div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: theme.primary, marginBottom: '30px', fontFamily: 'serif', letterSpacing: '-1.5px' }}>WorldPlate</div>
                <p style={{ color: '#666', lineHeight: '1.8', fontSize: '15px', maxWidth: '350px' }}>The premier gourmet network connecting world-class kitchens with culinary enthusiasts across the continent. Experience the elite standard of food delivery.</p>
                <div style={{ display: 'flex', gap: '20px', marginTop: '35px' }}>
                    {[Facebook, Twitter, Instagram].map((Icon, i) => (
                        <motion.button key={i} whileHover={{ y: -5, color: theme.primary }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1A1A1A', color: '#FFF', width: '45px', height: '45px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Icon size={20} />
                        </motion.button>
                    ))}
                </div>
            </div>
            <div>
                <h4 style={{ color: '#FFF', fontWeight: '900', marginBottom: '30px', fontSize: '18px', letterSpacing: '-0.5px' }}>Navigation</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {['Home', 'Restaurants', 'Specials', 'About Us'].map(l => <button key={l} onClick={() => setView(l.toLowerCase().replace(' ', ''))} style={{ background: 'none', border: 'none', color: '#666', textAlign: 'left', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: '0.3s' }} onMouseOver={e => e.currentTarget.style.color = '#FFF'}>{l}</button>)}
                </div>
            </div>
            <div>
                <h4 style={{ color: '#FFF', fontWeight: '900', marginBottom: '30px', fontSize: '18px', letterSpacing: '-0.5px' }}>Network</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button onClick={() => window.location.href = 'http://localhost:5173'} style={{ background: 'none', border: 'none', color: '#666', textAlign: 'left', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Partner Kitchens</button>
                    <button onClick={() => setView('becomerider')} style={{ background: 'none', border: 'none', color: '#666', textAlign: 'left', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Join as Rider</button>
                    <button style={{ background: 'none', border: 'none', color: '#666', textAlign: 'left', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Press Room</button>
                </div>
            </div>
            <div>
                <h4 style={{ color: '#FFF', fontWeight: '900', marginBottom: '30px', fontSize: '18px', letterSpacing: '-0.5px' }}>Gourmet Newsletter</h4>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '25px', lineHeight: '1.6' }}>Subscribe to receive exclusive invites to secret menus and flash sales.</p>
                <div style={{ display: 'flex', gap: '10px', background: '#0A0A0A', padding: '8px', borderRadius: '20px', border: '1px solid #1A1A1A' }}>
                    <input
                        placeholder="Email address"
                        value={newsletterEmail}
                        onChange={e => setNewsletterEmail(e.target.value)}
                        style={{ background: 'none', border: 'none', padding: '10px 15px', color: '#FFF', flex: 1, outline: 'none', fontSize: '14px' }}
                    />
                    <button
                        onClick={() => newsletterEmail && setNewsletterEmail('')}
                        style={{ background: theme.primary, border: 'none', borderRadius: '15px', padding: '12px 25px', fontWeight: '900', cursor: 'pointer', color: '#000', fontSize: '13px' }}
                    >Join</button>
                </div>
            </div>
        </div>
        <div style={{ borderTop: '1px solid #111', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <p style={{ color: '#444', fontSize: '13px', fontWeight: '700' }}>© 2026 WORLDPLATE GOURMET NETWORK. LOGISTICS SECURED.</p>
            <div style={{ display: 'flex', gap: '30px' }}>
                {['Privacy Policy', 'Terms of Service', 'Cookie Settings'].map(l => <button key={l} style={{ background: 'none', border: 'none', color: '#444', fontSize: '12px', fontWeight: '800', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>{l}</button>)}
            </div>
        </div>
    </footer>
)}
</div>
);
}

