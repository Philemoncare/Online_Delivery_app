import React, { useState, useEffect, useMemo } from 'react';
import { Card, theme, Button, Input } from '../components/UI';
import { restaurantApi, authApi } from '../api';

const Settings = ({ restaurant, user, onUpdate }) => {
    const [activeSection, setActiveSection] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [formRestaurant, setFormRestaurant] = useState(restaurant || {});
    const [formUser, setFormUser] = useState(user || {});
    const [hasChanges, setHasChanges] = useState(false);

    // Parse opening hours from string to object
    const initialHours = useMemo(() => {
        try {
            return restaurant?.opening_hours ? JSON.parse(restaurant.opening_hours) : {};
        } catch (e) {
            return {};
        }
    }, [restaurant]);

    const [uploading, setUploading] = useState({ logo: false, cover: false, pfp: false });

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(prev => ({ ...prev, [type]: true }));
        try {
            let res;
            if (type === 'pfp') {
                res = await authApi.uploadImage(file);
                handleUserChange('profile_picture_url', res.data.url);
            } else {
                res = await restaurantApi.uploadImage(file);
                handleRestaurantChange(type === 'logo' ? 'logo_url' : 'cover_image_url', res.data.url);
            }
        } catch (err) {
            alert("Upload failed");
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    useEffect(() => {
        if (restaurant) {
            setFormRestaurant(restaurant);
            try {
                setSchedule(restaurant.opening_hours ? JSON.parse(restaurant.opening_hours) : {});
            } catch(e) { setSchedule({}); }
        }
        if (user) setFormUser(user);
    }, [restaurant, user]);

    const handleRestaurantChange = (field, value) => {
        setFormRestaurant(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleUserChange = (field, value) => {
        setFormUser(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleScheduleChange = (day, field, value) => {
        const newSchedule = {
            ...schedule,
            [day]: { ...schedule[day], [field]: value }
        };
        setSchedule(newSchedule);
        setHasChanges(true);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Update Restaurant Profile
            await restaurantApi.updateProfile(restaurant.restaurant_id, {
                name: formRestaurant.name,
                cuisine_type: formRestaurant.cuisine_type,
                address: formRestaurant.address,
                geo_lat: parseFloat(formRestaurant.geo_lat),
                geo_lng: parseFloat(formRestaurant.geo_lng),
                delivery_radius: parseFloat(formRestaurant.delivery_radius),
                is_open: formRestaurant.is_open,
                is_online: formRestaurant.is_online,
                opening_hours: JSON.stringify(schedule),
                image_url: formRestaurant.image_url,
                logo_url: formRestaurant.logo_url,
                cover_image_url: formRestaurant.cover_image_url
            });

            // Update User Profile
            await authApi.updateMe({
                full_name: formUser.full_name,
                email: formUser.email,
                phone: formUser.phone,
                profile_picture_url: formUser.profile_picture_url,
                notification_preferences: formUser.notification_preferences,
                preferred_language: formUser.preferred_language,
                profile_visibility: formUser.profile_visibility
            });

            setHasChanges(false);
            onUpdate();
            alert("Terminal parameters synchronized successfully! 🚀");
        } catch (err) {
            console.error(err);
            alert("Synchronization failed. Check network availability.");
        } finally {
            setLoading(false);
        }
    };

    const sections = [
        { id: 'profile', label: 'Kitchen Profile', icon: '🏪' },
        { id: 'user', label: 'Owner Account', icon: '👤' },
        { id: 'logistics', label: 'Logistics & Reach', icon: '🛵' },
        { id: 'schedule', label: 'Operating Hours', icon: '📅' },
        { id: 'notifications', label: 'System Alerts', icon: '🔔' },
        { id: 'security', label: 'Cyber Security', icon: '🛡️' }
    ];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '100px', position: 'relative' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '40px', fontWeight: '900', color: theme.text, marginBottom: '8px', letterSpacing: '-1.5px' }}>Terminal Settings</h1>
                <p style={{ color: theme.textMuted, fontSize: '16px', fontWeight: '500' }}>Maintain high-availability operational parameters.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '20px', border: 'none',
                                background: activeSection === s.id ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                color: activeSection === s.id ? theme.primary : theme.textMuted,
                                cursor: 'pointer', fontWeight: '800', fontSize: '15px', textAlign: 'left', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: activeSection === s.id ? `1px solid rgba(245, 158, 11, 0.3)` : '1px solid rgba(255, 255, 255, 0.05)',
                                boxShadow: activeSection === s.id ? '0 4px 20px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            <span style={{ fontSize: '20px', filter: activeSection === s.id ? 'none' : 'grayscale(1)' }}>{s.icon}</span>
                            {s.label}
                        </button>
                    ))}
                </div>

                <div style={{ animation: 'slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    {activeSection === 'profile' && (
                        <Card title="AMA HUB KITCHEN PROFILE">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={labelStyle}>Kitchen Logo</label>
                                        <input type="file" id="logo-upload" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'logo')} />
                                        <label htmlFor="logo-upload" style={{ ...imageUploadPlaceholder, backgroundImage: `url(${formRestaurant.logo_url || formRestaurant.image_url})` }}>
                                            <div style={{...uploadOverlay, opacity: uploading.logo ? 1 : 0}}><span>{uploading.logo ? '⌛' : '📷 UPDATE'}</span></div>
                                        </label>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Storefront Cover</label>
                                        <input type="file" id="cover-upload" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'cover')} />
                                        <label htmlFor="cover-upload" style={{ ...coverUploadPlaceholder, backgroundImage: `url(${formRestaurant.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000'})` }}>
                                            <div style={{...uploadOverlay, opacity: uploading.cover ? 1 : 0}}><span>{uploading.cover ? '⌛' : '🖼️ CHANGE COVER'}</span></div>
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <Input label="Business Name" value={formRestaurant.name || ''} onChange={e => handleRestaurantChange('name', e.target.value)} icon="🏪" />
                                    <Input label="Cuisine Speciality" value={formRestaurant.cuisine_type || ''} onChange={e => handleRestaurantChange('cuisine_type', e.target.value)} placeholder="e.g. Ghanaian cuisine" icon="🍲" />
                                </div>
                                <Input label="Physical Headquarters" value={formRestaurant.address || ''} onChange={e => handleRestaurantChange('address', e.target.value)} icon="📍" />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                    <div style={statusToggleCard(formRestaurant.is_online)}>
                                        <div>
                                            <div style={{ fontWeight: '900', color: theme.text }}>PLATFORM VISIBILITY</div>
                                            <div style={{ fontSize: '12px', color: theme.textMuted }}>Presence on Customer Application</div>
                                        </div>
                                        <input type="checkbox" checked={formRestaurant.is_online} onChange={e => handleRestaurantChange('is_online', e.target.checked)} style={toggleInput} />
                                    </div>
                                    <div style={statusToggleCard(formRestaurant.is_open)}>
                                        <div>
                                            <div style={{ fontWeight: '900', color: theme.text }}>KITCHEN STATUS</div>
                                            <div style={{ fontSize: '12px', color: theme.textMuted }}>Checkout and Order Availability</div>
                                        </div>
                                        <input type="checkbox" checked={formRestaurant.is_open} onChange={e => handleRestaurantChange('is_open', e.target.checked)} style={toggleInput} />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeSection === 'user' && (
                        <Card title="MERCHANT IDENTITY">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: `1px solid ${theme.glassBorder}` }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundImage: `url(${formUser.profile_picture_url || 'https://ui-avatars.com/api/?name=' + formUser.full_name})`, backgroundSize: 'cover', border: `2px solid ${theme.primary}`, position: 'relative' }}>
                                        {uploading.pfp && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '10px' }}>⌛</div>}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{formUser.full_name}</h4>
                                        <p style={{ margin: '4px 0 0 0', color: theme.textMuted, fontSize: '14px' }}>Authenticated Vendor Account</p>
                                    </div>
                                    <input type="file" id="pfp-upload" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'pfp')} />
                                    <label htmlFor="pfp-upload" style={{ marginLeft: 'auto', display: 'inline-block', padding: '10px 20px', backgroundColor: theme.primary + '10', color: theme.primary, borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>
                                        {uploading.pfp ? 'Uploading...' : 'Change Photo'}
                                    </label>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <Input label="Full Name" value={formUser.full_name || ''} onChange={e => handleUserChange('full_name', e.target.value)} icon="👤" />
                                    <Input label="Email Access" value={formUser.email || ''} onChange={e => handleUserChange('email', e.target.value)} icon="📧" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <Input label="Contact Phone" value={formUser.phone || ''} onChange={e => handleUserChange('phone', e.target.value)} icon="📞" />
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={labelStyle}>Preferred Language</label>
                                        <select value={formUser.preferred_language || 'en'} onChange={e => handleUserChange('preferred_language', e.target.value)} style={selectStyle}>
                                            <option value="en">English (US)</option>
                                            <option value="fr">Français</option>
                                            <option value="gh">Twi / Ga</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeSection === 'logistics' && (
                        <Card title="GEO-LOGISTICS CONFIGURATION">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ height: '200px', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                                    <span style={{ fontSize: '40px' }}>🗺️</span>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: '800' }}>Satellite Positioning</div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted }}>Coordinates for precise dispatching</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <Input label="Latitude" type="number" step="0.000001" value={formRestaurant.geo_lat || ''} onChange={e => handleRestaurantChange('geo_lat', e.target.value)} icon="🌐" />
                                    <Input label="Longitude" type="number" step="0.000001" value={formRestaurant.geo_lng || ''} onChange={e => handleRestaurantChange('geo_lng', e.target.value)} icon="🌐" />
                                </div>
                                <div style={{ padding: '24px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))', border: `1px solid ${theme.glassBorder}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <label style={{ ...labelStyle, margin: 0 }}>Operational Radius</label>
                                        <span style={{ color: theme.primary, fontWeight: '900', fontSize: '20px' }}>{formRestaurant.delivery_radius || 0} km</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="50" step="0.5"
                                        value={formRestaurant.delivery_radius || 5}
                                        onChange={e => handleRestaurantChange('delivery_radius', e.target.value)}
                                        style={{ width: '100%', accentColor: theme.primary, cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeSection === 'schedule' && (
                        <Card title="WEEKLY OPERATIONAL WINDOWS">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {days.map(day => (
                                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: `1px solid ${theme.glassBorder}` }}>
                                        <div style={{ width: '100px', fontWeight: '800', color: theme.text }}>{day}</div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <input
                                                type="time"
                                                value={schedule[day]?.open || '08:00'}
                                                onChange={e => handleScheduleChange(day, 'open', e.target.value)}
                                                style={timeInputStyle}
                                            />
                                            <span style={{ color: theme.textMuted }}>to</span>
                                            <input
                                                type="time"
                                                value={schedule[day]?.close || '22:00'}
                                                onChange={e => handleScheduleChange(day, 'close', e.target.value)}
                                                style={timeInputStyle}
                                            />
                                        </div>
                                        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: theme.textMuted }}>
                                            <input
                                                type="checkbox"
                                                checked={schedule[day]?.active !== false}
                                                onChange={e => handleScheduleChange(day, 'active', e.target.checked)}
                                            /> Active
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {hasChanges && (
                <div style={stickyBarContainer}>
                    <div style={stickyBarContent} className="glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={pulseIcon}>⚡</div>
                            <div>
                                <div style={{ fontWeight: '900', color: '#FFF' }}>Unsaved Parameters</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Configuration changes detected in terminal buffer.</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button label="Discard" variant="secondary" onClick={() => { setFormRestaurant(restaurant); setFormUser(user); setHasChanges(false); setSchedule(initialHours); }} />
                            <Button label={loading ? "Synchronizing..." : "Commit Parameters"} onClick={handleSave} disabled={loading} icon={loading ? null : "💾"} />
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
                .glass-card { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
            `}</style>
        </div>
    );
};

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '800', color: theme.textMuted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const imageUploadPlaceholder = { width: '120px', height: '120px', borderRadius: '32px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', border: `2px dashed ${theme.glassBorder}`, cursor: 'pointer', overflow: 'hidden' };
const coverUploadPlaceholder = { width: '100%', height: '120px', borderRadius: '32px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', border: `2px dashed ${theme.glassBorder}`, cursor: 'pointer', overflow: 'hidden' };
const uploadOverlay = { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' };
const statusToggleCard = (isActive) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderRadius: '24px', backgroundColor: isActive ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, transition: 'all 0.3s' });
const toggleInput = { width: '44px', height: '22px', appearance: 'none', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s', outline: 'none' };
const selectStyle = { width: '100%', padding: '14px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.glassBorder}`, color: theme.text, fontSize: '15px', fontWeight: '700', outline: 'none' };
const timeInputStyle = { padding: '8px 12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.glassBorder}`, color: theme.text, fontSize: '14px', fontWeight: '700', outline: 'none' };
const stickyBarContainer = { position: 'fixed', bottom: '32px', left: '320px', right: '32px', display: 'flex', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.3s ease' };
const stickyBarContent = { width: '100%', maxWidth: '900px', padding: '20px 32px', borderRadius: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const pulseIcon = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', animation: 'pulse 2s infinite' };

export default Settings;
