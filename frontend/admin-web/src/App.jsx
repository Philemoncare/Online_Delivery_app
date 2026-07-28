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
import AIChat from './components/AIChat';

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
            const params = new URLSearchParams();
            params.append('username', email);
            params.append('password', password);
            const r = await authApi.login(params);

            const { access_token, role } = r.data;

            if (role === 'vendor') {
                setIsSuccess(true);
                setTimeout(() => {
                    window.location.href = `http://localhost:5173/?token=${access_token}`;
                }, 1000);
                return;
            }

            if (role !== 'admin') {
                setError("Access Denied: Only platform administrators can enter this command center.");
                setLoading(false);
                return;
            }

            localStorage.setItem('admin_token', access_token);
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
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFF', letterSpacing: '-1px' }}>fDA <span style={{ color: theme.primary }}>CENTRAL</span></div>
                    </div>
                    <div style={{ animation: 'scaleUp 1s ease' }}>
                        <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#FFF', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-2px' }}>Platform <br /> Command Center.</h1>
                        <p style={{ fontSize: '18px', color: theme.textMuted, fontWeight: '500', lineHeight: '1.6', maxWidth: '380px' }}>Master the logistics, manage the marketplace, and drive global growth from your unified administrative hub.</p>
                    </div>
                    <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div><div style={{ fontSize: '28px', fontWeight: '900', color: theme.primary }}>99.9%</div><div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Efficiency</div></div>
                        <div><div style={{ fontSize: '28px', fontWeight: '900', color: theme.primary }}>Global</div><div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Control</div></div>
                    </div>
                </div>
                <div style={authFormPanelStyle}>
                    {isSuccess ? (
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '64px', marginBottom: '20px' }}>🛡️</div><h2 style={{ fontSize: '28px', fontWeight: '900', color: '#FFF' }}>Secure Access</h2><p style={{ color: theme.textMuted, fontWeight: '600' }}>Synchronizing command parameters...</p></div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#FFF', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Admin Login</h3>
                                <p style={{ color: theme.textMuted, margin: 0, fontWeight: '600' }}>Enter your administrative credentials</p>
                            </div>
                            {error && <div style={errorStyle}>{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <Input label="Administrative Email" value={email} onChange={v => setEmail(v.target.value)} placeholder="name@fda.com" required icon="📧" />
                                <div style={{ position: 'relative' }}>
                                    <Input label="Security Password" type={showPassword ? "text" : "password"} value={password} onChange={v => setPassword(v.target.value)} placeholder="••••••••" required icon="🔒" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={togglePasswordStyle}>{showPassword ? 'HIDE' : 'SHOW'}</button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><input type="checkbox" defaultChecked style={{ accentColor: theme.primary, width: '18px', height: '18px' }} /><span style={{ fontSize: '14px', color: theme.textMuted, fontWeight: '600' }}>Secure session</span></label>
                                    <a href="#" style={{ fontSize: '14px', color: theme.primary, fontWeight: '700', textDecoration: 'none' }}>Forgot access?</a>
                                </div>
                                <Button label={loading ? "Verifying..." : "Sign into Command Center"} type="submit" style={{ width: '100%', padding: '18px', fontSize: '16px', borderRadius: '18px' }} disabled={loading} icon={loading ? null : "⚡"} />
                            </form>
                            <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '11px', color: theme.textMuted, fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase' }}>🛡️ Encrypted TLS 1.3 Enterprise Connection</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- AUTH STYLES ---
const authContainerStyle = { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.secondary, backgroundImage: `radial-gradient(circle at 0% 0%, ${theme.primary}15 0%, transparent 50%), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2570')`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden' };
const authPanelStyle = { display: 'flex', width: '1000px', height: '660px', borderRadius: '40px', overflow: 'hidden', animation: 'slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 10 };
const authSidebarStyle = { flex: 1, padding: '60px', backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5)), url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2574')`, backgroundSize: 'cover', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative' };
const authFormPanelStyle = { width: '450px', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' };
const errorStyle = { padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: theme.danger, borderRadius: '16px', fontSize: '14px', fontWeight: '700', marginBottom: '24px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.1)' };
const togglePasswordStyle = { position: 'absolute', right: '16px', top: '42px', background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '12px', fontWeight: '800' };
const authStyles = `@keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } } .glass-card { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); } @media (max-width: 1024px) { .glass-card { width: 90% !important; height: auto !important; flex-direction: column !important; } div[style*="flex: 1"] { display: none !important; } div[style*="width: 450px"] { width: 100% !important; padding: 40px !important; } }`;


export default function App() {
  const [token, setToken] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('token');
    if (t) {
        localStorage.setItem('admin_token', t);
        window.history.replaceState({}, document.title, "/");
        return t;
    }
    return localStorage.getItem('admin_token');
  });
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

  // Polling & WebSockets for real-time updates
  useEffect(() => {
    if (token) {
        // Real-time WebSocket
        const ws = new WebSocket(`ws://localhost:8002/ws/orders/admin`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Global admin update:", data);
            loadAllData();
        };

        const interval = setInterval(loadAllData, 60000); // Polling fallback
        return () => {
            ws.close();
            clearInterval(interval);
        }
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
        {activeTab === 'merchants' && <Merchants restaurants={data.restaurants} users={data.users} stats={data.restaurantStats} onRefresh={() => loadAllData()} />}
        {activeTab === 'users' && <Users users={data.users} orders={data.orders} onRefresh={() => loadAllData()} />}
        {activeTab === 'riders' && <Riders users={data.users} onRefresh={() => loadAllData()} />}
        {activeTab === 'orders' && <Orders orders={data.orders} restaurants={data.restaurants} users={data.users} />}
        {activeTab === 'disputes' && <Disputes disputes={data.disputes} onRefresh={() => loadAllData()} />}
        {activeTab === 'payments' && <Payments payments={data.payments} />}
        {activeTab === 'reports' && <SalesReports analytics={analytics} data={data} />}
        {activeTab === 'audit' && <AuditLogs logs={data.auditLogs} />}
        {activeTab === 'settings' && <Settings user={user} onRefresh={loadAllData} />}
        <AIChat />
    </Layout>
  );
}
