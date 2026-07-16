import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { authApi, orderApi, restaurantApi, paymentApi } from './api';
import { theme, Card, Button, Input } from './components/UI';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Merchants from './views/Merchants';
import Users from './views/Users';
import Riders from './views/Riders';
import Orders from './views/Orders';
import Disputes from './views/Disputes';
import AuditLogs from './views/AuditLogs';
import Payments from './views/Payments';
import SalesReports from './views/SalesReports';
import Settings from './views/Settings';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('admin@example.com');
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
            const fd = new URLSearchParams();
            fd.append('username', email);
            fd.append('password', password);
            const r = await authApi.login(fd);
            setIsSuccess(true);
            setTimeout(() => onLogin(r.data.access_token), 1000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.secondary,
            backgroundImage: `radial-gradient(circle at 0% 0%, ${theme.primary}15 0%, transparent 50%),
                             radial-gradient(circle at 100% 100%, ${theme.accent}15 0%, transparent 50%),
                             url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2570')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <style>{`
                @keyframes float { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } 100% { transform: translateY(0px) rotate(0deg); } }
                @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes successBeat { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
                .glass-panel {
                    backdrop-filter: blur(24px) saturate(180%);
                    -webkit-backdrop-filter: blur(24px) saturate(180%);
                    background-color: rgba(15, 23, 42, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
            `}</style>

            <div style={{
                display: 'flex',
                width: '1000px',
                height: '640px',
                borderRadius: '32px',
                overflow: 'hidden',
                animation: 'fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                zIndex: 10
            }} className="glass-panel">

                {/* Left Side: Illustration & Welcome */}
                <div style={{
                    flex: 1,
                    padding: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5)), url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2574')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: '#FFF',
                    position: 'relative'
                }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: '#FFF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.primary, fontWeight: '900', fontSize: '24px' }}>f</div>
                            <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-1px' }}>fDA CENTRAL</span>
                        </div>
                        <h2 style={{ fontSize: '42px', fontWeight: '900', lineHeight: '1.1', marginBottom: '20px', letterSpacing: '-2px' }}>Empowering the Future of Food Delivery.</h2>
                        <p style={{ fontSize: '16px', fontWeight: '500', opacity: 0.9, lineHeight: '1.6', maxWidth: '340px' }}>Master the logistics, manage the marketplace, and drive growth from your command center.</p>
                    </div>

                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '900' }}>24/7</div>
                                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.7 }}>Uptime</div>
                            </div>
                            <div style={{ width: '1px', height: '30px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '900' }}>99.9%</div>
                                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.7 }}>Efficiency</div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative element */}
                    <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '240px', height: '240px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                </div>

                {/* Right Side: Login Form */}
                <div style={{ width: '460px', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'transparent' }}>
                    {isSuccess ? (
                        <div style={{ textAlign: 'center', animation: 'successBeat 0.5s ease' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '40px', backgroundColor: theme.success, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '40px' }}>✓</div>
                            <h2 style={{ fontSize: '28px', fontWeight: '900', color: theme.text, marginBottom: '8px' }}>Identity Verified</h2>
                            <p style={{ color: theme.textMuted, fontWeight: '600' }}>Synchronizing your dashboard...</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ fontSize: '28px', fontWeight: '900', color: theme.text, margin: '0 0 8px 0', letterSpacing: '-1px' }}>Welcome Back</h3>
                                <p style={{ color: theme.textMuted, margin: 0, fontWeight: '600', fontSize: '15px' }}>Please enter your administrative credentials</p>
                            </div>

                            {error && (
                                <div style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)', color: theme.danger, padding: '16px', borderRadius: '16px',
                                    fontSize: '13px', fontWeight: '700', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.1)', textAlign: 'center'
                                }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <Input
                                    label="Administrative Email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="name@fda.com"
                                    required
                                    icon="📧"
                                />

                                <div style={{ position: 'relative' }}>
                                    <Input
                                        label="Security Password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        icon="🔒"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '16px', top: '42px', background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}
                                    >
                                        {showPassword ? 'HIDE' : 'SHOW'}
                                    </button>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', padding: '0 4px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${theme.glassBorder}`,
                                            backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: theme.primary }} />
                                        </div>
                                        <span style={{ fontSize: '14px', color: theme.textMuted, fontWeight: '600' }}>Remember session</span>
                                    </label>
                                    <a href="#" style={{ fontSize: '14px', color: theme.primary, fontWeight: '700', textDecoration: 'none' }}>Forgot Access?</a>
                                </div>

                                <Button
                                    label={loading ? "Verifying..." : "Sign into Command Center"}
                                    type="submit"
                                    style={{ width: '100%', padding: '18px', fontSize: '16px', borderRadius: '18px' }}
                                    disabled={loading}
                                    icon={loading ? null : "⚡"}
                                />
                            </form>

                            <div style={{ marginTop: '40px', textAlign: 'center', borderTop: `1px solid ${theme.glassBorder}`, paddingTop: '24px' }}>
                                <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                    🛡️ Encrypted TLS 1.3 Enterprise Connection
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile View Support - Hidden on desktop via layout above */}
            <style>{`
                @media (max-width: 1024px) {
                    .glass-panel { width: 90% !important; height: auto !important; flex-direction: column !important; }
                    div[style*="flex: 1"] { display: none !important; }
                    div[style*="width: 460px"] { width: 100% !important; padding: 40px !important; }
                }
            `}</style>
        </div>
    );
};


export default function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [data, setData] = useState({ users: [], restaurants: [], orders: [], disputes: [], auditLogs: [], payments: [], restaurantStats: {} });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  const loadAllData = useCallback(async (range = 'all') => {
    if (!token) return;
    try {
      const [aRes, uRes, rRes, oRes, dRes, pRes, rsRes] = await Promise.all([
        orderApi.getAnalytics(range),
        authApi.getUsers(),
        restaurantApi.getRestaurants(),
        orderApi.getOrders(),
        orderApi.getDisputes(),
        paymentApi.getPayments(),
        orderApi.getRestaurantStats()
      ]);
      setAnalytics(aRes.data);
      let logs = [];
      try { const lRes = await authApi.getAuditLogs(); logs = lRes.data; } catch(e) {}
      setData({
        users: uRes.data,
        restaurants: rRes.data,
        orders: oRes.data,
        disputes: dRes.data,
        auditLogs: logs,
        payments: pRes.data,
        restaurantStats: rsRes.data
      });
    } catch (e) {
      console.error("Sync error", e);
    } finally {
        setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
        authApi.getMe()
            .then(res => {
                if(res.data.role !== 'admin') {
                    alert("Unauthorized access");
                    logout();
                } else {
                    setUser(res.data);
                    loadAllData();
                }
            })
            .catch(() => {
                logout();
                setLoading(false);
            });
    } else {
        setLoading(false);
    }
  }, [token, loadAllData]);

  // Polling for real-time updates
  useEffect(() => {
    if (token) {
        const interval = setInterval(loadAllData, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }
  }, [token, loadAllData]);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <style>{`
            @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0.5; transform: scale(0.98); } }
            .loader-logo { width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, ${theme.primary}, ${theme.accent}); display: flex; alignItems: center; justifyContent: center; color: white; font-size: 32px; font-weight: 900; margin: 0 auto 24px; animation: pulse 2s infinite; box-shadow: 0 10px 30px ${theme.primary}40; }
        `}</style>
        <div style={{ textAlign: 'center' }}>
            <div className="loader-logo">f</div>
            <div style={{ color: theme.text, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>Initializing Systems</div>
            <div style={{ color: theme.textMuted, fontSize: '14px', fontWeight: '600', marginTop: '8px' }}>Authenticating with fDA Central Secure Gateway...</div>
        </div>
    </div>
  );

  if (!token) return <Login onLogin={t => { localStorage.setItem('admin_token', t); setToken(t); }} />;

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} user={user} onLogout={logout}>
        {activeTab === 'dashboard' && <Dashboard analytics={analytics} data={data} onRefresh={loadAllData} />}
        {activeTab === 'merchants' && <Merchants restaurants={data.restaurants} stats={data.restaurantStats} onRefresh={() => loadAllData()} />}
        {activeTab === 'users' && <Users users={data.users} orders={data.orders} onRefresh={() => loadAllData()} />}
        {activeTab === 'riders' && <Riders users={data.users} onRefresh={() => loadAllData()} />}
        {activeTab === 'orders' && <Orders orders={data.orders} restaurants={data.restaurants} users={data.users} />}
        {activeTab === 'disputes' && <Disputes disputes={data.disputes} onRefresh={() => loadAllData()} />}
        {activeTab === 'payments' && <Payments payments={data.payments} />}
        {activeTab === 'reports' && <SalesReports analytics={analytics} data={data} />}
        {activeTab === 'audit' && <AuditLogs logs={data.auditLogs} />}
        {activeTab === 'settings' && <Settings user={user} onRefresh={loadAllData} />}
    </Layout>
  );
}
