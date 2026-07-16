import React, { useState, useEffect, useCallback } from 'react';
import { authApi, restaurantApi, orderApi } from './api';
import { theme, Card, Button, Input } from './components/UI';
import Layout from './components/Layout';
import LiveKitchen from './views/LiveKitchen';
import MenuCatalog from './views/MenuCatalog';
import SalesReports from './views/SalesReports';
import Settings from './views/Settings';

const Login = ({ onLogin, onSwitchToRegister }) => {
    const [email, setEmail] = useState('vendor@example.com');
    const [password, setPassword] = useState('password123');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.append('username', email);
            params.append('password', password);
            const r = await authApi.login(params);
            setIsSuccess(true);
            setTimeout(() => onLogin(r.data.access_token), 1000);
        } catch (err) {
            setError("Authentication failed. Please check your credentials.");
            setLoading(false);
        }
    };

    return (
        <div style={authContainerStyle}>
            <style>{authStyles}</style>
            <div style={authPanelStyle} className="glass-card">
                <div style={authSidebarStyle}>
                    <div style={{ position: 'absolute', top: '60px', left: '60px' }}>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFF', letterSpacing: '-1px' }}>fDA <span style={{ color: theme.primary }}>KITCHEN</span></div>
                    </div>
                    <div style={{ animation: 'scaleUp 1s ease' }}>
                        <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#FFF', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-2px' }}>Scale Your <br /> Culinary Reach.</h1>
                        <p style={{ fontSize: '18px', color: theme.textMuted, fontWeight: '500', lineHeight: '1.6', maxWidth: '380px' }}>Join the fastest growing food network. Manage orders, track performance, and delight customers—all from one terminal.</p>
                    </div>
                    <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div><div style={{ fontSize: '28px', fontWeight: '900', color: theme.primary }}>5k+</div><div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Daily Users</div></div>
                        <div><div style={{ fontSize: '28px', fontWeight: '900', color: theme.primary }}>Instant</div><div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Payouts</div></div>
                    </div>
                </div>
                <div style={authFormPanelStyle}>
                    {isSuccess ? (
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '64px', marginBottom: '20px' }}>👨‍🍳</div><h2 style={{ fontSize: '28px', fontWeight: '900', color: '#FFF' }}>Kitchen Ready</h2><p style={{ color: theme.textMuted, fontWeight: '600' }}>Opening your restaurant dashboard...</p></div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#FFF', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Merchant Portal</h3>
                                <p style={{ color: theme.textMuted, margin: 0, fontWeight: '600' }}>Sign in to manage your kitchen</p>
                            </div>
                            {error && <div style={errorStyle}>{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <Input label="Merchant Email" value={email} onChange={v => setEmail(v.target.value)} placeholder="chef@yourrestaurant.com" required icon="📧" />
                                <div style={{ position: 'relative' }}>
                                    <Input label="Security Access Key" type={showPassword ? "text" : "password"} value={password} onChange={v => setPassword(v.target.value)} placeholder="••••••••" required icon="🔒" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={togglePasswordStyle}>{showPassword ? 'HIDE' : 'SHOW'}</button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><input type="checkbox" defaultChecked style={{ accentColor: theme.primary, width: '18px', height: '18px' }} /><span style={{ fontSize: '14px', color: theme.textMuted, fontWeight: '600' }}>Keep me logged in</span></label>
                                    <a href="#" style={{ fontSize: '14px', color: theme.primary, fontWeight: '700', textDecoration: 'none' }}>Lost key?</a>
                                </div>
                                <Button label={loading ? "Synchronizing..." : "Enter Kitchen"} type="submit" style={{ width: '100%', padding: '18px', fontSize: '16px', borderRadius: '18px' }} disabled={loading} icon={loading ? null : "🔥"} />
                            </form>
                            <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '14px', color: theme.textMuted, fontWeight: '600' }}>New Merchant? <button onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: theme.primary, textDecoration: 'none', fontWeight: '800', cursor: 'pointer' }}>Apply to join</button></div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const Register = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', password: '', role: 'vendor' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authApi.register(formData);
            setIsSuccess(true);
            setTimeout(onSwitchToLogin, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || "Registration failed. Please check your details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={authContainerStyle}>
            <style>{authStyles}</style>
            <div style={authPanelStyle} className="glass-card">
                <div style={authSidebarStyle}>
                    <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#FFF', letterSpacing: '-2px' }}>Empower Your Restaurant.</h1>
                    <p style={{ color: theme.textMuted, fontSize: '18px', fontWeight: '500', marginTop: '20px' }}>Join thousands of successful merchants growing their business with fDA Logistics.</p>
                </div>
                <div style={authFormPanelStyle}>
                    {isSuccess ? (
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div><h2 style={{ fontSize: '28px', fontWeight: '900', color: '#FFF' }}>Application Received</h2><p style={{ color: theme.textMuted, fontWeight: '600' }}>Your merchant account has been established.</p></div>
                    ) : (
                        <>
                            <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#FFF', marginBottom: '24px' }}>Partner with us</h3>
                            {error && <div style={errorStyle}>{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <Input label="Full Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                                <Input label="Business Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                                <Input label="Contact Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                                <Input label="Secure Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                                <Button label={loading ? "Processing..." : "Create Merchant Account"} type="submit" style={{ width: '100%', marginTop: '20px' }} disabled={loading} />
                            </form>
                            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: theme.textMuted }}>Already a partner? <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '800', cursor: 'pointer' }}>Sign in here</button></div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- AUTH STYLES ---
const authContainerStyle = { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.secondary, backgroundImage: `radial-gradient(circle at 100% 0%, ${theme.primary}10 0%, transparent 40%), url('https://images.unsplash.com/photo-1556742044-3c52d6e88c02?auto=format&fit=crop&q=90&w=2570')`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden' };
const authPanelStyle = { display: 'flex', width: '1000px', height: '660px', borderRadius: '40px', overflow: 'hidden', animation: 'slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 10 };
const authSidebarStyle = { flex: 1, padding: '60px', backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=90&w=2570')`, backgroundSize: 'cover', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative' };
const authFormPanelStyle = { width: '450px', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' };
const errorStyle = { padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: theme.danger, borderRadius: '16px', fontSize: '14px', fontWeight: '700', marginBottom: '24px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.1)' };
const togglePasswordStyle = { position: 'absolute', right: '16px', top: '42px', background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '12px', fontWeight: '800' };
const authStyles = `@keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } } .glass-card { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); } @media (max-width: 1024px) { .glass-card { width: 90% !important; height: auto !important; flex-direction: column !important; } div[style*="flex: 1"] { display: none !important; } div[style*="width: 450px"] { width: 100% !important; padding: 40px !important; } }`;

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('vendor_token'));
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState('login');

  const logout = () => { localStorage.removeItem('vendor_token'); window.location.reload(); };

  const fetchData = useCallback(async (restId) => {
    if (!token || !restId) return;
    try {
      const [oRes, mRes, sRes] = await Promise.all([
        orderApi.getOrders(restId),
        restaurantApi.getMenu(restId),
        orderApi.getStats(restId)
      ]);
      setOrders(oRes.data);
      setMenu(mRes.data);
      setStats(sRes.data);
    } catch (e) { console.error("Sync error", e); }
  }, [token]);

  useEffect(() => {
    if (token) {
        authApi.getMe()
            .then(r => setUser(r.data))
            .catch(logout);

        restaurantApi.getMine()
            .then(r => {
                setRestaurant(r.data);
                fetchData(r.data.restaurant_id);
            })
            .catch(e => {
                console.log("No restaurant profile yet");
                setActiveTab('create-restaurant');
            })
            .finally(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, [token, fetchData]);

  useEffect(() => {
    if (token && restaurant) {
        const i = setInterval(() => fetchData(restaurant.restaurant_id), 5000);
        return () => clearInterval(i);
    }
  }, [token, restaurant, fetchData]);

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        cuisine_type: formData.get('cuisine'),
        address: formData.get('address'),
        geo_lat: 5.60, geo_lng: -0.18,
        image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1000'
    };
    try {
        const res = await restaurantApi.createRestaurant(data);
        setRestaurant(res.data);
        setActiveTab('orders');
    } catch (err) {
        alert("Failed to create restaurant profile");
    } finally {
        setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <style>{`
            @keyframes cook { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
            .chef-loader { font-size: 48px; animation: cook 1.5s infinite ease-in-out; }
        `}</style>
        <div style={{ textAlign: 'center' }}>
            <div className="chef-loader">👨‍🍳</div>
            <div style={{ color: theme.text, fontSize: '18px', fontWeight: '800', marginTop: '16px' }}>Preparing Kitchen Terminal</div>
            <div style={{ color: theme.textMuted, fontSize: '14px', fontWeight: '600', marginTop: '8px' }}>Syncing menu and orders...</div>
        </div>
    </div>
  );

  if (!token) {
    return authView === 'login'
        ? <Login onLogin={t => { localStorage.setItem('vendor_token', t); setToken(t); }} onSwitchToRegister={() => setAuthView('register')} />
        : <Register onSwitchToLogin={() => setAuthView('login')} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} restaurant={restaurant} user={user} onLogout={logout}>
        {activeTab === 'create-restaurant' && (
            <div style={{ maxWidth: '600px', margin: '40px auto' }}>
                <Card title="Establish Your Kitchen Profile">
                    <p style={{ color: theme.textMuted, marginBottom: '24px' }}>Welcome operative. To begin receiving orders, we need to register your restaurant in the fDA network.</p>
                    <form onSubmit={handleCreateRestaurant}>
                        <Input name="name" label="Restaurant Name" placeholder="The Golden Skillet" required />
                        <Input name="cuisine" label="Cuisine Speciality" placeholder="Ghanaian, Continental, etc." required />
                        <Input name="address" label="Physical Address" placeholder="123 High Street, Accra" required />
                        <Button label="Initialize Restaurant Profile" type="submit" style={{ width: '100%', marginTop: '20px' }} />
                    </form>
                </Card>
            </div>
        )}
        {activeTab === 'orders' && <LiveKitchen orders={orders} menu={menu} onRefresh={() => fetchData(restaurant?.restaurant_id)} />}
        {activeTab === 'menu' && <MenuCatalog menu={menu} restaurantId={restaurant?.restaurant_id} onRefresh={() => fetchData(restaurant?.restaurant_id)} />}
        {activeTab === 'reports' && <SalesReports orders={orders} stats={stats} menu={menu} />}
        {activeTab === 'settings' && <Settings restaurant={restaurant} user={user} onUpdate={() => {
            restaurantApi.getMine().then(r => setRestaurant(r.data));
            authApi.getMe().then(r => setUser(r.data));
        }} />}
    </Layout>
  );
}
