import React, { useState, useEffect, useCallback } from 'react';
import { authApi, restaurantApi, orderApi } from './api';
import { theme, Card, Button, Input } from './components/UI';
import Layout from './components/Layout';
import LiveKitchen from './views/LiveKitchen';
import MenuCatalog from './views/MenuCatalog';
import SalesReports from './views/SalesReports';
import Riders from './views/Riders';
import Subscription from './views/Subscription';
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

            const { access_token, role } = r.data;

            if (role === 'admin') {
                setIsSuccess(true);
                setTimeout(() => {
                    window.location.href = `http://localhost:5174/?token=${access_token}`;
                }, 1000);
                return;
            }

            if (role !== 'vendor') {
                setError("Access Denied: Only Merchants can enter this portal.");
                setLoading(false);
                return;
            }

            localStorage.setItem('vendor_token', access_token);
            setIsSuccess(true);
            setTimeout(() => {
                onLogin(access_token);
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.detail || "Authentication failed.");
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
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '', password: '', role: 'vendor',
        qualification: 'I own a restaurant.',
        res_name: '', cuisine: '', address: '', prep_time: '25',
        plan: 'MONTHLY'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleRegister = async () => {
        setLoading(true);
        try {
            await authApi.register(formData);
            nextStep();
        } catch (err) {
            setError(err.response?.data?.detail || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            setTimeout(() => {
                setStep(7);
                setTimeout(onSwitchToLogin, 3000);
            }, 1500);
        } catch (err) {
            setError("Failed to finalize onboarding.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={authContainerStyle}>
            <style>{authStyles}</style>
            <div style={authPanelStyle} className="glass-card">
                <div style={authSidebarStyle}>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: theme.primary, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Step {step} of 7</div>
                        <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#FFF', lineHeight: '1.1', letterSpacing: '-2px' }}>
                            {step === 1 && "Create Merchant Account"}
                            {step === 2 && "Terms & Privacy"}
                            {step === 3 && "Vendor Qualification"}
                            {step === 4 && "Restaurant Profile"}
                            {step === 5 && "Documentation"}
                            {step === 6 && "Subscription"}
                            {step === 7 && "Final Review"}
                        </h1>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '18px', color: theme.textMuted, fontWeight: '500', lineHeight: '1.6' }}>
                            {step === 1 && "Join the elite network of fDA restaurant partners."}
                            {step === 4 && "This information will be visible to thousands of customers."}
                            {step === 6 && "Choose the plan that fits your business scale."}
                        </p>
                    </div>
                </div>

                <div style={authFormPanelStyle}>
                    {error && <div style={errorStyle}>{error}</div>}

                    {step === 1 && (
                        <div style={{ animation: 'fadeIn 0.5s' }}>
                            <Input label="Full Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="John Chef" />
                            <Input label="Business Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="chef@kitchen.com" />
                            <Input label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+233..." />
                            <Input label="Secure Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                            <Button label={loading ? "Processing..." : "Continue"} onClick={handleRegister} style={{ width: '100%', marginTop: '20px' }} disabled={loading} />
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ animation: 'fadeIn 0.5s' }}>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', marginBottom: '24px', fontSize: '13px', color: theme.textMuted, lineHeight: '1.6' }}>
                                <h4 style={{ color: '#FFF', marginBottom: '10px' }}>Merchant Agreement</h4>
                                <p>By proceeding, you agree to the fDA Logistics platform terms of service. You commit to providing high-quality food, maintaining hygiene standards, and fulfilling orders within the estimated preparation time...</p>
                                <p>Fees: The platform charges a subscription fee based on your selected plan. No per-order commission is taken unless otherwise specified in your region.</p>
                            </div>
                            <Button label="I Accept & Agree" onClick={nextStep} style={{ width: '100%' }} />
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ animation: 'fadeIn 0.5s' }}>
                            <h4 style={{ color: '#FFF', marginBottom: '20px' }}>Why do you want to become a partner?</h4>
                            {['I own a restaurant.', 'I operate a cloud kitchen.', 'I manage a food truck.', 'I sell homemade meals.'].map(opt => (
                                <button key={opt} onClick={() => setFormData({...formData, qualification: opt})} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `1px solid ${formData.qualification === opt ? theme.primary : theme.glassBorder}`, backgroundColor: formData.qualification === opt ? 'rgba(245, 158, 11, 0.1)' : 'transparent', color: formData.qualification === opt ? theme.primary : theme.text, textAlign: 'left', marginBottom: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                    {opt}
                                </button>
                            ))}
                            <Button label="Continue" onClick={nextStep} style={{ width: '100%', marginTop: '20px' }} />
                        </div>
                    )}

                    {step === 4 && (
                        <div style={{ animation: 'fadeIn 0.5s' }}>
                            <Input label="Restaurant Name" value={formData.res_name} onChange={e => setFormData({...formData, res_name: e.target.value})} placeholder="The Golden Skillet" />
                            <Input label="Cuisine Type" value={formData.cuisine} onChange={e => setFormData({...formData, cuisine: e.target.value})} placeholder="Ghanaian, Continental" />
                            <Input label="Physical Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Osu, Accra" />
                            <Button label="Save Profile Details" onClick={nextStep} style={{ width: '100%', marginTop: '20px' }} />
                        </div>
                    )}

                    {step === 5 && (
                        <div style={{ animation: 'fadeIn 0.5s', textAlign: 'center' }}>
                            <div style={{ padding: '40px', border: `2px dashed ${theme.glassBorder}`, borderRadius: '24px', marginBottom: '24px' }}>
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
                                <div style={{ fontWeight: '800', color: theme.text }}>Upload Business Docs</div>
                                <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>Registration Certificate / ID</div>
                            </div>
                            <Button label="Proceed to Payment" onClick={nextStep} style={{ width: '100%' }} />
                        </div>
                    )}

                    {step === 6 && (
                        <div style={{ animation: 'fadeIn 0.5s' }}>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                {['WEEKLY', 'MONTHLY', 'ANNUAL'].map(p => (
                                    <button key={p} onClick={() => setFormData({...formData, plan: p})} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${formData.plan === p ? theme.primary : theme.glassBorder}`, backgroundColor: formData.plan === p ? 'rgba(245, 158, 11, 0.1)' : 'transparent', color: formData.plan === p ? theme.primary : theme.text, fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <div style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '20px', marginBottom: '24px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted }}>TOTAL DUE</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: '#FFF' }}>GH₵ {formData.plan === 'WEEKLY' ? '50.00' : formData.plan === 'MONTHLY' ? '180.00' : '1,800.00'}</div>
                            </div>
                            <Button label="Confirm & Pay" onClick={handleFinalize} style={{ width: '100%' }} disabled={loading} />
                        </div>
                    )}

                    {step === 7 && (
                        <div style={{ animation: 'fadeIn 0.5s', textAlign: 'center' }}>
                            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏁</div>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#FFF', marginBottom: '12px' }}>Review in Progress</h3>
                            <p style={{ color: theme.textMuted, fontWeight: '600', lineHeight: '1.6' }}>Our administrators are validating your application. You will receive an email once your kitchen is live.</p>
                        </div>
                    )}

                    {step < 7 && (
                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Cancel Registration</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ReviewModal = ({ onLogout }) => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
        <style>{`
            @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
            .review-card { animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); max-width: 480px; width: 100%; }
        `}</style>
        <div className="review-card">
            <Card>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '24px', animation: 'float 3s ease-in-out infinite' }}>🚀</div>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#FFF', marginBottom: '12px', letterSpacing: '-1px' }}>Application Received</h2>
                    <p style={{ color: theme.textMuted, fontSize: '16px', lineHeight: '1.6', marginBottom: '32px', fontWeight: '500' }}>
                        Your merchant account is currently <span style={{ color: theme.primary, fontWeight: '800' }}>under review</span> by our operations team.
                        We are validating your kitchen credentials and documentation.
                    </p>
                    <div style={{ padding: '20px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '20px', border: `1px solid rgba(245, 158, 11, 0.2)`, marginBottom: '32px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: theme.primary, textTransform: 'uppercase', letterSpacing: '1px' }}>Estimated Time</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFF', marginTop: '4px' }}>24 - 48 Hours</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button label="Sign Out" variant="secondary" onClick={onLogout} style={{ flex: 1 }} />
                        <Button label="Refresh Status" onClick={() => window.location.reload()} style={{ flex: 2 }} />
                    </div>
                </div>
            </Card>
        </div>
    </div>
);

// --- AUTH STYLES ---
const authContainerStyle = { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.secondary, backgroundImage: `radial-gradient(circle at 100% 0%, ${theme.primary}10 0%, transparent 40%), url('https://images.unsplash.com/photo-1556742044-3c52d6e88c02?auto=format&fit=crop&q=90&w=2570')`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden' };
const authPanelStyle = { display: 'flex', width: '1000px', height: '660px', borderRadius: '40px', overflow: 'hidden', animation: 'slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 10 };
const authSidebarStyle = { flex: 1, padding: '60px', backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=90&w=2570')`, backgroundSize: 'cover', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative' };
const authFormPanelStyle = { width: '450px', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' };
const errorStyle = { padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: theme.danger, borderRadius: '16px', fontSize: '14px', fontWeight: '700', marginBottom: '24px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.1)' };
const togglePasswordStyle = { position: 'absolute', right: '16px', top: '42px', background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '12px', fontWeight: '800' };
const authStyles = `@keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } } .glass-card { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); } @media (max-width: 1024px) { .glass-card { width: 90% !important; height: auto !important; flex-direction: column !important; } div[style*="flex: 1"] { display: none !important; } div[style*="width: 450px"] { width: 100% !important; padding: 40px !important; } }`;

export default function App() {
  const [token, setToken] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('token');
    if (t) {
        localStorage.setItem('vendor_token', t);
        window.history.replaceState({}, document.title, "/");
        return t;
    }
    return localStorage.getItem('vendor_token');
  });
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [riders, setRiders] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState('login');

  const logout = () => { localStorage.removeItem('vendor_token'); window.location.reload(); };

  const fetchData = useCallback(async (restId) => {
    if (!token || !restId) return;
    try {
      const [oRes, mRes, sRes, rRes, subRes] = await Promise.all([
        orderApi.getOrders(restId).catch(() => ({ data: [] })),
        restaurantApi.getMenu(restId).catch(() => ({ data: [] })),
        orderApi.getStats(restId).catch(() => ({ data: {} })),
        restaurantApi.getRiders(restId).catch(() => ({ data: [] })),
        restaurantApi.getActiveSubscription(restId).catch(() => ({ data: null }))
      ]);
      setOrders(oRes.data);
      setMenu(mRes.data);
      setStats(sRes.data);
      setRiders(rRes.data);
      setActiveSubscription(subRes.data);
    } catch (e) { console.error("Sync error", e); }
  }, [token]);

  useEffect(() => {
    if (token) {
        authApi.getMe()
            .then(r => {
                if (r.data.role !== 'vendor') {
                    alert("Unauthorized access to Merchant Portal");
                    logout();
                } else {
                    setUser(r.data);
                }
            })
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
        const ws = new WebSocket(`ws://localhost:8002/ws/orders/vendor_${restaurant.restaurant_id}`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            fetchData(restaurant.restaurant_id);
        };
        const i = setInterval(() => fetchData(restaurant.restaurant_id), 30000);
        return () => {
            ws.close();
            clearInterval(i);
        };
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
        geo_lat: 5.6037, // Default Accra Lat
        geo_lng: -0.1870, // Default Accra Lng
        image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1000',
        is_open: true,
        is_online: true,
        delivery_radius: 5.0
    };
    try {
        const res = await restaurantApi.createRestaurant(data);
        setRestaurant(res.data);
        setActiveTab('orders');
        fetchData(res.data.restaurant_id);
    } catch (err) {
        console.error("Restaurant creation failed:", err);
        alert("Failed to create restaurant profile: " + (err.response?.data?.detail || "Unknown error"));
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

  const isPending = user?.verification_status === 'PENDING' && user?.role === 'vendor';

  return (
    <>
      {isPending && <ReviewModal onLogout={logout} />}
      <Layout activeTab={activeTab} onTabChange={setActiveTab} restaurant={restaurant} user={user} onLogout={logout}>
        {!restaurant ? (
            <div style={{ maxWidth: '600px', margin: '40px auto' }}>
                <Card title="Establish Your Kitchen Profile">
                    <p style={{ color: theme.textMuted, marginBottom: '24px' }}>Welcome operative. To begin receiving orders, we need to register your restaurant in the fDA network.</p>
                    <form onSubmit={handleCreateRestaurant}>
                        <Input name="name" label="Restaurant Name" placeholder="The Golden Skillet" required />
                        <Input name="cuisine" label="Cuisine Speciality" placeholder="Ghanaian, Continental, etc." required />
                        <Input name="address" label="Physical Address" placeholder="123 High Street, Accra" required />
                        <Button label={loading ? "Initializing..." : "Initialize Restaurant Profile"} type="submit" style={{ width: '100%', marginTop: '20px' }} disabled={loading} />
                    </form>
                </Card>
            </div>
        ) : (
            <>
                {activeTab === 'orders' && <LiveKitchen orders={orders} menu={menu} onRefresh={() => fetchData(restaurant?.restaurant_id)} />}
                {activeTab === 'menu' && <MenuCatalog menu={menu} restaurantId={restaurant?.restaurant_id} onRefresh={() => fetchData(restaurant?.restaurant_id)} />}
                {activeTab === 'riders' && <Riders riders={riders} restaurantId={restaurant?.restaurant_id} onRefresh={() => fetchData(restaurant?.restaurant_id)} />}
                {activeTab === 'subscription' && <Subscription activeSubscription={activeSubscription} restaurantId={restaurant?.restaurant_id} onRefresh={() => fetchData(restaurant?.restaurant_id)} />}
                {activeTab === 'reports' && <SalesReports orders={orders} stats={stats} menu={menu} />}
                {activeTab === 'settings' && <Settings restaurant={restaurant} user={user} onUpdate={() => {
                    restaurantApi.getMine().then(r => setRestaurant(r.data));
                    authApi.getMe().then(r => setUser(r.data));
                }} />}
            </>
        )}
      </Layout>
    </>
  );
}
