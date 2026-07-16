import React from 'react';
import { theme } from './UI';

const NavBtn = ({ active, onClick, label, icon }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            borderRadius: '16px',
            border: 'none',
            background: active ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(249, 115, 22, 0.2))' : 'transparent',
            color: active ? theme.text : theme.textMuted,
            cursor: 'pointer',
            fontWeight: active ? '800' : '600',
            fontSize: '15px',
            textAlign: 'left',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            marginBottom: '8px',
            boxShadow: active ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
            border: active ? `1px solid ${theme.glassBorder}` : '1px solid transparent'
        }}
        onMouseOver={e => !active && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
        onMouseOut={e => !active && (e.currentTarget.style.backgroundColor = 'transparent')}
    >
        <span style={{
            fontSize: '20px',
            filter: active ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' : 'none',
            opacity: active ? 1 : 0.7
        }}>{icon}</span>
        {label}
    </button>
);

const Layout = ({ children, activeTab, onTabChange, restaurant, user, onLogout }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div style={{
            display: 'flex',
            backgroundColor: theme.bg,
            minHeight: '100vh',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: theme.text,
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Background Decorations */}
            <div style={{
                position: 'fixed', top: '-10%', right: '-5%', width: '40%', height: '40%',
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
                filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none'
            }} />
            <div style={{
                position: 'fixed', bottom: '-10%', left: '-5%', width: '40%', height: '40%',
                background: 'radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%)',
                filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none'
            }} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

                @media (max-width: 1024px) {
                    aside.desktop-sidebar { width: 80px !important; padding: 40px 12px !important; }
                    aside.desktop-sidebar span:not(.sidebar-icon) { display: none !important; }
                    aside.desktop-sidebar .brand-text { display: none !important; }
                    main { margin-left: 80px !important; padding: 24px !important; }
                }

                @media (max-width: 768px) {
                    aside.desktop-sidebar { display: none !important; }
                    main { margin-left: 0 !important; padding: 20px !important; }
                    header.mobile-header { display: flex !important; }
                    .mobile-spacer { display: block !important; }
                }
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); borderRadius: 10px; }
            `}</style>

            {/* Mobile Header */}
            <header className="mobile-header" style={{
                display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: '70px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', alignItems: 'center',
                padding: '0 24px', zIndex: 1000, justifyContent: 'space-between', borderBottom: `1px solid ${theme.glassBorder}`
            }}>
                <div style={{ color: theme.primary, fontWeight: '900', fontSize: '22px', letterSpacing: '-1px' }}>fDA KITCHEN</div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.glassBorder}`, borderRadius: '12px', width: '40px', height: '40px', color: '#fff', cursor: 'pointer' }}>
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            </header>

            {isMobileMenuOpen && (
                <div style={{ position: 'fixed', top: '70px', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', zIndex: 999, padding: '24px', overflowY: 'auto' }}>
                    <nav>
                        <NavBtn active={activeTab === 'orders'} onClick={() => { onTabChange('orders'); setIsMobileMenuOpen(false); }} label="Live Kitchen" icon="🔥" />
                        <NavBtn active={activeTab === 'menu'} onClick={() => { onTabChange('menu'); setIsMobileMenuOpen(false); }} label="Menu Catalog" icon="🍴" />
                        <NavBtn active={activeTab === 'reports'} onClick={() => { onTabChange('reports'); setIsMobileMenuOpen(false); }} label="Sales Reports" icon="📈" />
                        <NavBtn active={activeTab === 'settings'} onClick={() => { onTabChange('settings'); setIsMobileMenuOpen(false); }} label="Settings" icon="⚙️" />
                    </nav>
                </div>
            )}

            <aside className="desktop-sidebar" style={{
                width: '280px', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)', padding: '40px 24px', position: 'fixed', top: 0, bottom: 0, left: 0,
                display: 'flex', flexDirection: 'column', zIndex: 100, borderRight: `1px solid ${theme.glassBorder}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#FFF', fontSize: '20px', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)' }}>K</div>
                    <div className="brand-text" style={{ fontSize: '22px', fontWeight: '900', color: theme.text, letterSpacing: '-1px' }}>
                        fDA <span style={{ color: theme.primary, opacity: 0.8 }}>KITCHEN</span>
                    </div>
                </div>

                <nav style={{ flex: 1, overflowY: 'auto' }}>
                    <NavBtn active={activeTab === 'orders'} onClick={() => onTabChange('orders')} label="Live Kitchen" icon="🔥" />
                    <NavBtn active={activeTab === 'menu'} onClick={() => onTabChange('menu')} label="Menu Catalog" icon="🍴" />
                    <NavBtn active={activeTab === 'reports'} onClick={() => onTabChange('reports')} label="Sales Reports" icon="📈" />
                    <NavBtn active={activeTab === 'settings'} onClick={() => onTabChange('settings')} label="Settings" icon="⚙️" />
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '16px',
                        borderRadius: '20px', background: 'rgba(255, 255, 255, 0.03)', border: `1px solid ${theme.glassBorder}`
                    }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
                            {user?.full_name?.charAt(0)}
                        </div>
                        <div className="brand-text">
                            <div style={{ fontSize: '14px', fontWeight: '800', color: theme.text }}>{user?.full_name}</div>
                            <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>Merchant Partner</div>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        style={{
                            width: '100%', padding: '14px', borderRadius: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s'
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            <main style={{ flex: 1, marginLeft: '280px', padding: '48px', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
                <div className="mobile-spacer" style={{ display: 'none', height: '80px' }} />
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '900', letterSpacing: '-1.5px' }}>{restaurant?.name || 'My Kitchen'}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: restaurant?.is_online ? theme.success : theme.danger, boxShadow: `0 0 10px ${restaurant?.is_online ? theme.success : theme.danger}` }} />
                                <span style={{ fontWeight: '800', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: restaurant?.is_online ? theme.success : theme.danger }}>
                                    {restaurant?.is_online ? 'Platform Visible' : 'Platform Hidden'}
                                </span>
                            </div>
                            <div style={{ width: '1px', height: '12px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: restaurant?.is_open ? theme.success : theme.danger, boxShadow: `0 0 10px ${restaurant?.is_open ? theme.success : theme.danger}` }} />
                                <span style={{ fontWeight: '800', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: restaurant?.is_open ? theme.success : theme.danger }}>
                                    {restaurant?.is_open ? 'Kitchen Open' : 'Kitchen Closed'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        padding: '16px 24px', background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '20px', border: `1px solid ${theme.glassBorder}`, textAlign: 'right'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>Daily Target</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: theme.text }}>GHS 2,500.00</div>
                    </div>
                </header>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
