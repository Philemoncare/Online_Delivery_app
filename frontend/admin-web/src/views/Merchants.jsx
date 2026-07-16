import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, theme, Input } from '../components/UI';
import { restaurantApi, authApi, orderApi } from '../api';

const Merchants = ({ restaurants, stats, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [merchantMenu, setMerchantMenu] = useState([]);
    const [merchantStats, setMerchantStats] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleViewMerchant = async (merchant) => {
        setSelectedMerchant(merchant);
        setIsEditing(false);
        setLoadingDetails(true);
        try {
            const [menuRes, statsRes] = await Promise.all([
                restaurantApi.getMenu(merchant.restaurant_id),
                orderApi.getMerchantStats(merchant.restaurant_id)
            ]);
            setMerchantMenu(menuRes.data);
            setMerchantStats(statsRes.data);
        } catch (e) {
            console.error("Failed to load details", e);
        } finally {
            setLoadingDetails(false);
        }
    };

    const filtered = restaurants.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleStatus = async (restaurant) => {
        try {
            await restaurantApi.updateStatus(restaurant.restaurant_id, !restaurant.is_open);
            showMessage('success', `Merchant ${restaurant.is_open ? 'suspended' : 'activated'} successfully`);
            onRefresh();
        } catch (e) {
            showMessage('danger', 'Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this merchant? This action cannot be undone and will delete all menu items.")) {
            try {
                await restaurantApi.deleteRestaurant(id);
                showMessage('success', 'Merchant removed from platform');
                onRefresh();
            } catch (e) {
                showMessage('danger', 'Failed to delete merchant');
            }
        }
    };

    const handleSaveMerchant = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);

        try {
            if (isAdding) {
                const userData = {
                    full_name: formData.get('owner_name'),
                    email: formData.get('email'),
                    password: formData.get('password') || 'Vendor123!',
                    phone: formData.get('phone'),
                    role: 'vendor'
                };
                const userRes = await authApi.register(userData);
                const ownerId = userRes.data.user_id;

                const restaurantData = {
                    name: formData.get('name'),
                    cuisine_type: formData.get('cuisine'),
                    address: formData.get('address'),
                    delivery_radius: parseFloat(formData.get('radius') || 5),
                    opening_hours: formData.get('hours'),
                    geo_lat: parseFloat(formData.get('lat') || 0),
                    geo_lng: parseFloat(formData.get('lng') || 0),
                    owner_id: ownerId
                };
                await restaurantApi.createRestaurant(restaurantData);
                showMessage('success', 'Merchant and Vendor account created successfully');
                setIsAdding(false);
            } else {
                const data = {
                    name: formData.get('name'),
                    cuisine_type: formData.get('cuisine'),
                    address: formData.get('address'),
                    delivery_radius: parseFloat(formData.get('radius') || 5),
                    opening_hours: formData.get('hours'),
                    geo_lat: parseFloat(formData.get('lat') || 0),
                    geo_lng: parseFloat(formData.get('lng') || 0)
                };
                await restaurantApi.updateRestaurant(selectedMerchant.restaurant_id, data);
                showMessage('success', 'Merchant profile updated');
                setIsEditing(false);
                setSelectedMerchant(null);
            }
            onRefresh();
        } catch (err) {
            showMessage('danger', err.response?.data?.detail || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        const headers = ['Business Name', 'Cuisine', 'Address', 'Status', 'Rating', 'Total Revenue'];
        const rows = filtered.map(r => {
            const mStats = stats[r.restaurant_id] || { total_revenue: 0 };
            return [
                r.name,
                r.cuisine_type || 'General',
                `"${r.address}"`,
                r.is_open ? 'OPEN' : 'CLOSED',
                r.rating_avg,
                mStats.total_revenue
            ];
        });

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `merchants_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-1.5px' }}>Merchant Registry</h1>
                    <p style={{ color: theme.textMuted, margin: 0, fontWeight: '600' }}>Platform operations and vendor management console</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button label="Export Registry" variant="secondary" onClick={exportCSV} icon="📥" />
                    <Button label="Add Merchant" onClick={() => setIsAdding(true)} icon="🏪" />
                </div>
            </div>

            {message.text && (
                <div style={messageStyle(message.type)}>{message.text}</div>
            )}

            <Card>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <Input placeholder="Search merchants..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ marginBottom: 0 }} icon="🔍" />
                    </div>
                </div>

                <Table
                    headers={['Merchant Info', 'Operational Status', 'Business Stats', 'Platform Status', 'Actions']}
                    data={filtered}
                    renderRow={(r) => {
                        const mStats = stats[r.restaurant_id] || { total_revenue: 0, total_orders: 0 };
                        return (
                        <tr key={r.restaurant_id}>
                            <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ ...avatarStyle, backgroundImage: `url(${r.image_url || 'https://via.placeholder.com/100?text=Food'})` }} />
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '16px' }}>{r.name}</div>
                                        <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>{r.cuisine_type || 'General'}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={tdStyle}>
                                <Badge status={r.is_open ? 'READY_FOR_PICKUP' : 'CANCELLED'} label={r.is_open ? 'KITCHEN OPEN' : 'KITCHEN CLOSED'} />
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: '800' }}>GHS {mStats.total_revenue.toLocaleString()} <span style={{ color: theme.textMuted, fontSize: '11px' }}>Rev</span></div>
                                <div style={{ fontSize: '11px', color: theme.warning }}>★ {r.rating_avg || '0.0'} Rating ({mStats.total_orders} orders)</div>
                            </td>
                            <td style={tdStyle}>
                                <Badge status={r.is_online ? 'ACTIVE' : 'OFFLINE'} label={r.is_online ? 'VISIBLE' : 'HIDDEN'} />
                            </td>
                            <td style={tdStyle}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleViewMerchant(r)} style={actionBtnStyle(theme.primary)}>👁️</button>
                                    <button onClick={() => { setSelectedMerchant(r); setIsEditing(true); }} style={actionBtnStyle(theme.accent)}>✏️</button>
                                    <button onClick={() => handleToggleStatus(r)} style={actionBtnStyle(r.is_open ? theme.warning : theme.success)}>{r.is_open ? '⏸️' : '▶️'}</button>
                                    <button onClick={() => handleDelete(r.restaurant_id)} style={actionBtnStyle(theme.danger)}>🗑️</button>
                                </div>
                            </td>
                        </tr>
                    )}}
                />
            </Card>

            {(selectedMerchant || isAdding) && (
                <div style={modalOverlay}>
                    <div style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)', width: '100%', maxWidth: '900px' }}>
                        <Card style={{ maxHeight: '90vh', overflowY: 'auto' }} title={isAdding ? "Register New Merchant" : (isEditing ? "Modify Business Parameters" : `${selectedMerchant.name.toUpperCase()} INTELLIGENCE`)}>
                            {isEditing || isAdding ? (
                                <form onSubmit={handleSaveMerchant} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                    {isAdding && (
                                        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: `1px solid ${theme.glassBorder}` }}>
                                            <div style={{ gridColumn: '1 / -1', marginBottom: '10px' }}><h4 style={{ margin: 0, color: theme.primary, fontSize: '14px', textTransform: 'uppercase' }}>Vendor Access Control</h4></div>
                                            <Input name="owner_name" label="Legal Representative" placeholder="John Doe" required />
                                            <Input name="email" label="Security Email" type="email" placeholder="john@example.com" required />
                                            <Input name="phone" label="Contact Line" placeholder="+233..." required />
                                            <Input name="password" label="Initial Key" type="password" placeholder="••••••••" required />
                                        </div>
                                    )}
                                    <div style={{ gridColumn: '1 / -1' }}><Input name="name" label="Business Name" defaultValue={selectedMerchant?.name} required /></div>
                                    <Input name="cuisine" label="Culinary Speciality" defaultValue={selectedMerchant?.cuisine_type} />
                                    <Input name="hours" label="Opening Schedule" defaultValue={selectedMerchant?.opening_hours} />
                                    <div style={{ gridColumn: '1 / -1' }}><Input name="address" label="Physical HQ" defaultValue={selectedMerchant?.address} required /></div>
                                    <Input name="lat" label="Latitude" type="number" step="0.000001" defaultValue={selectedMerchant?.geo_lat || 5.6037} required />
                                    <Input name="lng" label="Longitude" type="number" step="0.000001" defaultValue={selectedMerchant?.geo_lng || -0.1870} required />
                                    <Input name="radius" label="Logistics Radius (km)" type="number" step="0.1" defaultValue={selectedMerchant?.delivery_radius || 5} required />

                                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '20px' }}>
                                        <Button label="Discard" variant="secondary" onClick={() => { setSelectedMerchant(null); setIsEditing(false); setIsAdding(false); }} style={{ flex: 1 }} />
                                        <Button label={loading ? "Synchronizing..." : "Commit Parameters"} type="submit" style={{ flex: 2 }} disabled={loading} />
                                    </div>
                                </form>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {/* TELEMETRY ROW */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                        <TelemetryStat label="Total Volume" value={merchantStats?.total_order_count || 0} icon="📦" />
                                        <TelemetryStat label="Gross Revenue" value={`GHS ${merchantStats?.total_revenue?.toLocaleString() || 0}`} icon="💰" color={theme.success} />
                                        <TelemetryStat label="Active Orders" value={merchantStats?.active_order_count || 0} icon="🔥" color={theme.warning} />
                                        <TelemetryStat label="Success Rate" value={`${merchantStats?.total_order_count ? Math.round((merchantStats.completed_count / merchantStats.total_order_count) * 100) : 0}%`} icon="🎯" />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <div>
                                            <h4 style={sectionTitleStyle}>Culinary Catalog</h4>
                                            {loadingDetails ? <div style={loaderStyle}>Syncing menu...</div> : (
                                                <div style={catalogListStyle}>
                                                    {merchantMenu.map(item => (
                                                        <div key={item.item_id} style={catalogItemStyle}>
                                                            <div style={{ fontWeight: '700' }}>{item.name}</div>
                                                            <div style={{ color: theme.primary, fontWeight: '900' }}>GHS {item.price}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 style={sectionTitleStyle}>Logistics & Footprint</h4>
                                            <div style={geoCardStyle}>
                                                <div style={geoRowStyle}><span>Service Area</span><strong>{selectedMerchant.delivery_radius || 5}km</strong></div>
                                                <div style={geoRowStyle}><span>Coordinates</span><strong>{selectedMerchant.geo_lat}, {selectedMerchant.geo_lng}</strong></div>
                                                <div style={geoRowStyle}><span>Platform Status</span><Badge status={selectedMerchant.is_online ? 'ACTIVE' : 'OFFLINE'} label={selectedMerchant.is_online ? 'VISIBLE' : 'HIDDEN'} /></div>
                                            </div>
                                            <Button label="View Live Map" variant="secondary" style={{ width: '100%', marginTop: '16px' }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Button label="Close Overview" variant="secondary" onClick={() => setSelectedMerchant(null)} style={{ flex: 1 }} />
                                        <Button label="Administrative Privilege: Edit" style={{ flex: 1 }} onClick={() => setIsEditing(true)} />
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

const TelemetryStat = ({ label, value, icon, color = theme.primary }) => (
    <div style={{ padding: '16px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.glassBorder}`, textAlign: 'center' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>{icon}</div>
        <div style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: '900', color: color }}>{value}</div>
    </div>
);

const messageStyle = (type) => ({ padding: '16px 24px', borderRadius: '16px', backgroundColor: type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: type === 'success' ? theme.success : theme.danger, border: `1px solid ${type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, fontWeight: '700', fontSize: '14px' });
const avatarStyle = { width: '50px', height: '50px', borderRadius: '14px', backgroundSize: 'cover', backgroundPosition: 'center', border: `1px solid ${theme.glassBorder}` };
const tdStyle = { padding: '20px 24px', verticalAlign: 'middle' };
const actionBtnStyle = (color) => ({ width: '36px', height: '36px', borderRadius: '10px', border: `1px solid ${color}30`, backgroundColor: `${color}10`, color: color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', transition: 'all 0.2s' });
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px' };
const sectionTitleStyle = { margin: '0 0 16px 0', fontSize: '14px', fontWeight: '900', color: theme.primary, textTransform: 'uppercase', letterSpacing: '1px' };
const catalogListStyle = { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' };
const catalogItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.glassBorder}`, fontSize: '14px' };
const geoCardStyle = { padding: '20px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.glassBorder}`, display: 'flex', flexDirection: 'column', gap: '12px' };
const geoRowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: theme.textMuted };
const loaderStyle = { padding: '40px', textAlign: 'center', color: theme.textMuted, fontStyle: 'italic' };

export default Merchants;
