import React, { useState } from 'react';
import { theme } from './UI';

const NavItem = ({ active, onClick, label, icon }) => (
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
            background: active ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))' : 'transparent',
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
            filter: active ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : 'none',
            opacity: active ? 1 : 0.7
        }}>{icon}</span>
        {label}
    </button>
);

const Layout = ({ children, activeTab, onTabChange, user, onLogout }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                position: 'fixed',
                top: '-10%',
                right: '-5%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                filter: 'blur(80px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'fixed',
                bottom: '-10%',
                left: '-5%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                filter: 'blur(80px)',
                zIndex: 0,
                pointerEvents: 'none'
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
                    .stat-grid { grid-template-columns: 1fr !important; }
                    .card-grid { grid-template-columns: 1fr !important; }
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); borderRadius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
            `}</style>

            {/* Mobile Header */}
            <header className="mobile-header" style={{
                display: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(12px)',
                alignItems: 'center',
                padding: '0 24px',
                zIndex: 1000,
                justifyContent: 'space-between',
                borderBottom: `1px solid ${theme.glassBorder}`
            }}>
                <div style={{ color: theme.primary, fontWeight: '900', fontSize: '22px', letterSpacing: '-1px' }}>fDA</div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.glassBorder}`, borderRadius: '12px', width: '40px', height: '40px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div style={{
                    position: 'fixed',
                    top: '70px',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 999,
                    padding: '24px',
                    overflowY: 'auto'
                }}>
                    <nav>
                        <NavItem active={activeTab === 'dashboard'} onClick={() => { onTabChange('dashboard'); setIsMobileMenuOpen(false); }} label="Overview" icon="📊" />
                        <NavItem active={activeTab === 'merchants'} onClick={() => { onTabChange('merchants'); setIsMobileMenuOpen(false); }} label="Merchants" icon="🏪" />
                        <NavItem active={activeTab === 'users'} onClick={() => { onTabChange('users'); setIsMobileMenuOpen(false); }} label="Customers" icon="👥" />
                        <NavItem active={activeTab === 'riders'} onClick={() => { onTabChange('riders'); setIsMobileMenuOpen(false); }} label="Fleet" icon="🛵" />
                        <NavItem active={activeTab === 'orders'} onClick={() => { onTabChange('orders'); setIsMobileMenuOpen(false); }} label="Order Stream" icon="🛰️" />
                        <NavItem active={activeTab === 'payments'} onClick={() => { onTabChange('payments'); setIsMobileMenuOpen(false); }} label="Payments" icon="💳" />
                        <NavItem active={activeTab === 'reports'} onClick={() => { onTabChange('reports'); setIsMobileMenuOpen(false); }} label="Sales Reports" icon="📈" />
                        <NavItem active={activeTab === 'disputes'} onClick={() => { onTabChange('disputes'); setIsMobileMenuOpen(false); }} label="Disputes" icon="⚖️" />
                        <NavItem active={activeTab === 'audit'} onClick={() => { onTabChange('audit'); setIsMobileMenuOpen(false); }} label="Audit Logs" icon="📜" />
                        {user?.is_super_admin && <NavItem active={activeTab === 'config'} onClick={() => { onTabChange('config'); setIsMobileMenuOpen(false); }} label="Platform Config" icon="🛡️" />}
                        <NavItem active={activeTab === 'settings'} onClick={() => { onTabChange('settings'); setIsMobileMenuOpen(false); }} label="Settings" icon="⚙️" />
                    </nav>
                </div>
            )}

            {/* Sidebar Desktop */}
            <aside className="desktop-sidebar" style={{
                width: '280px',
                backgroundColor: user?.is_super_admin ? 'rgba(88, 28, 135, 0.4)' : 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '40px 24px',
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: 0,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100,
                borderRight: `1px solid ${theme.glassBorder}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `linear-gradient(135deg, ${user?.is_super_admin ? '#9333ea' : theme.primary}, ${user?.is_super_admin ? '#db2777' : theme.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#FFF', fontSize: '20px', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)' }}>{user?.is_super_admin ? 'S' : 'f'}</div>
                    <div className="brand-text" style={{ fontSize: '22px', fontWeight: '900', color: theme.text, letterSpacing: '-1px' }}>
                        fDA <span style={{ color: user?.is_super_admin ? '#c026d3' : theme.primary, opacity: 0.8 }}>{user?.is_super_admin ? 'MASTER' : 'CENTRAL'}</span>
                    </div>
                </div>

                <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                    <NavItem active={activeTab === 'dashboard'} onClick={() => onTabChange('dashboard')} label="Overview" icon="📊" />
                    <NavItem active={activeTab === 'merchants'} onClick={() => onTabChange('merchants')} label="Merchants" icon="🏪" />
                    <NavItem active={activeTab === 'users'} onClick={() => onTabChange('users')} label="Customers" icon="👥" />
                    <NavItem active={activeTab === 'riders'} onClick={() => onTabChange('riders')} label="Fleet" icon="🛵" />
                    <NavItem active={activeTab === 'orders'} onClick={() => onTabChange('orders')} label="Order Stream" icon="🛰️" />
                    <NavItem active={activeTab === 'payments'} onClick={() => onTabChange('payments')} label="Payments" icon="💳" />
                    <NavItem active={activeTab === 'reports'} onClick={() => onTabChange('reports')} label="Sales Reports" icon="📈" />
                    <NavItem active={activeTab === 'disputes'} onClick={() => onTabChange('disputes')} label="Disputes" icon="⚖️" />
                    <NavItem active={activeTab === 'audit'} onClick={() => onTabChange('audit')} label="Audit Logs" icon="📜" />
                    {user?.is_super_admin && <NavItem active={activeTab === 'config'} onClick={() => onTabChange('config')} label="Platform Config" icon="🛡️" />}
                    <NavItem active={activeTab === 'settings'} onClick={() => onTabChange('settings')} label="Settings" icon="⚙️" />
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px',
                        padding: '16px',
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${theme.glassBorder}`
                    }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: user?.is_super_admin ? '#db2777' : theme.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '18px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                            {user?.full_name?.charAt(0)}
                        </div>
                        <div className="brand-text">
                            <div style={{ fontSize: '14px', fontWeight: '800', color: theme.text }}>{user?.full_name}</div>
                            <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.is_super_admin ? 'Super Controller' : 'Admin Panel'}</div>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    >
                        🔒 End Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: '280px',
                padding: '48px',
                minWidth: 0,
                position: 'relative',
                zIndex: 1,
                maxHeight: '100vh',
                overflowY: 'auto'
            }}>
                <div className="mobile-spacer" style={{ display: 'none', height: '80px' }} />
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
