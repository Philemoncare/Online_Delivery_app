import React, { useState, useEffect } from 'react';
import { Card, Button, Input, theme } from '../components/UI';
import { authApi } from '../api';

const Settings = ({ user, onRefresh }) => {
    const [activeSection, setActiveSection] = useState('profile');
    const [settings, setSettings] = useState({
        commission_rate: '10',
        min_order_value: '5',
        delivery_base_fare: '10',
        platform_name: 'fDA Delivery',
        contact_email: 'support@fda.com'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        authApi.getSettings().then(res => {
            if (Object.keys(res.data).length > 0) {
                setSettings(prev => ({ ...prev, ...res.data }));
            }
        }).catch(err => console.error("Failed to load settings", err));
    }, []);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = Object.fromEntries(new FormData(e.target));
        try {
            await authApi.updateUser(user.user_id, data);
            showMessage('success', 'Profile updated successfully');
            onRefresh();
        } catch (e) {
            showMessage('danger', 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSystemUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = Object.fromEntries(new FormData(e.target));
        try {
            await authApi.updateSettings(data);
            setSettings(prev => ({ ...prev, ...data }));
            showMessage('success', 'System settings saved');
        } catch (e) {
            showMessage('danger', 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const sections = [
        { id: 'profile', label: 'Admin Profile', icon: '👤' },
        { id: 'platform', label: 'Platform Config', icon: '⚙️' },
        { id: 'commission', label: 'Commission & Fees', icon: '💰' },
        { id: 'delivery', label: 'Delivery Settings', icon: '🛵' },
        { id: 'payments', label: 'Payment Gateway', icon: '💳' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'security', label: 'Security', icon: '🔒' }
    ];

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '32px', letterSpacing: '-1px' }}>System Settings</h1>

            {message.text && (
                <div style={{
                    padding: '16px 24px', borderRadius: '16px', marginBottom: '24px',
                    backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? theme.success : theme.danger,
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    fontWeight: '700', fontSize: '14px'
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '16px', border: 'none',
                                background: activeSection === s.id ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))' : 'transparent',
                                color: activeSection === s.id ? theme.primary : theme.textMuted,
                                cursor: 'pointer', fontWeight: '700', fontSize: '15px', textAlign: 'left', transition: 'all 0.2s',
                                border: activeSection === s.id ? `1px solid ${theme.glassBorder}` : '1px solid transparent'
                            }}
                        >
                            <span>{s.icon}</span> {s.label}
                        </button>
                    ))}
                </div>

                <div style={{ animation: 'slideRight 0.3s ease-out' }}>
                    {activeSection === 'profile' && (
                        <Card title="Administrative Profile">
                            <form onSubmit={handleProfileUpdate} style={{ maxWidth: '500px' }}>
                                <Input name="full_name" label="Full Name" defaultValue={user?.full_name} required />
                                <Input name="email" label="Email Address" defaultValue={user?.email} required />
                                <Input name="phone" label="Phone Number" defaultValue={user?.phone} required />
                                <Button label={loading ? "Saving..." : "Update Profile"} type="submit" disabled={loading} />
                            </form>
                        </Card>
                    )}

                    {activeSection === 'platform' && (
                        <Card title="Platform Configuration">
                            <form onSubmit={handleSystemUpdate} style={{ maxWidth: '500px' }}>
                                <Input name="platform_name" label="Platform Name" defaultValue={settings.platform_name} />
                                <Input name="contact_email" label="Support Email" defaultValue={settings.contact_email} />
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: theme.textMuted, marginBottom: '8px' }}>Maintenance Mode</label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Badge status="INACTIVE" label="OFFLINE" />
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: theme.textMuted }}>Disable all customer orders</span>
                                    </div>
                                </div>
                                <Button label={loading ? "Saving..." : "Save Configuration"} type="submit" disabled={loading} />
                            </form>
                        </Card>
                    )}

                    {activeSection === 'commission' && (
                        <Card title="Revenue & Fees">
                            <form onSubmit={handleSystemUpdate} style={{ maxWidth: '500px' }}>
                                <Input name="commission_rate" label="Platform Commission (%)" type="number" defaultValue={settings.commission_rate} required />
                                <Input name="min_order_value" label="Minimum Order Value (GHS)" type="number" defaultValue={settings.min_order_value} required />
                                <Input name="delivery_base_fare" label="Base Delivery Fare (GHS)" type="number" defaultValue={settings.delivery_base_fare} required />
                                <Button label={loading ? "Saving..." : "Save Financials"} type="submit" disabled={loading} />
                            </form>
                        </Card>
                    )}

                    {activeSection === 'delivery' && (
                        <Card title="Logistics & Delivery">
                            <form onSubmit={handleSystemUpdate} style={{ maxWidth: '500px' }}>
                                <Input name="max_delivery_distance" label="Maximum Delivery Distance (km)" type="number" defaultValue={settings.max_delivery_distance || 15} />
                                <Input name="rider_commission" label="Rider Commission per Order (GHS)" type="number" defaultValue={settings.rider_commission || 5} />
                                <Input name="estimated_prep_time" label="Default Prep Time (mins)" type="number" defaultValue={settings.estimated_prep_time || 20} />
                                <Button label={loading ? "Saving..." : "Save Delivery Settings"} type="submit" disabled={loading} />
                            </form>
                        </Card>
                    )}

                    {activeSection === 'payments' && (
                        <Card title="Financial Integrations">
                            <form onSubmit={handleSystemUpdate} style={{ maxWidth: '500px' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: theme.textMuted, marginBottom: '8px' }}>Active Gateway</label>
                                    <select style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.glassBorder}`, color: theme.text }}>
                                        <option>Paystack (Ghana)</option>
                                        <option>Flutterwave</option>
                                        <option>Stripe (Global)</option>
                                    </select>
                                </div>
                                <Input name="paystack_public_key" label="Paystack Public Key" defaultValue={settings.paystack_public_key || 'pk_test_...'} />
                                <Input name="tax_rate" label="Sales Tax / VAT (%)" type="number" defaultValue={settings.tax_rate || 0} />
                                <Button label={loading ? "Saving..." : "Save Payment Config"} type="submit" disabled={loading} />
                            </form>
                        </Card>
                    )}

                    {activeSection === 'notifications' && (
                        <Card title="System Notifications">
                            <form onSubmit={(e) => { e.preventDefault(); showMessage('success', 'Notification preferences saved'); }} style={{ maxWidth: '500px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[
                                        { key: 'email_orders', label: 'Email for new orders', desc: 'Receive admin email for every new order' },
                                        { key: 'sms_riders', label: 'SMS to riders', desc: 'Auto-send SMS to riders when assigned' },
                                        { key: 'push_customers', label: 'Push to customers', desc: 'Send status updates to customer apps' }
                                    ].map(n => (
                                        <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.glassBorder}` }}>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '14px' }}>{n.label}</div>
                                                <div style={{ fontSize: '12px', color: theme.textMuted }}>{n.desc}</div>
                                            </div>
                                            <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: theme.primary }} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '24px' }}>
                                    <Button label="Save Preferences" type="submit" />
                                </div>
                            </form>
                        </Card>
                    )}

                    {activeSection === 'security' && (
                        <Card title="Security & Access">
                            <form onSubmit={(e) => { e.preventDefault(); showMessage('success', 'Security settings updated'); }} style={{ maxWidth: '500px' }}>
                                <Input name="current_pw" label="Current Password" type="password" />
                                <Input name="new_pw" label="New Password" type="password" />
                                <Input name="confirm_pw" label="Confirm New Password" type="password" />
                                <Button label="Change Access Key" type="submit" />
                                <hr style={{ margin: '32px 0', border: 'none', borderTop: `1px solid ${theme.glassBorder}` }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '700' }}>Two-Factor Authentication</div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted }}>Secure your account with 2FA</div>
                                    </div>
                                    <Badge status="INACTIVE" label="DISABLED" />
                                </div>
                            </form>
                        </Card>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes slideRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
            `}</style>
        </div>
    );
};

export default Settings;
