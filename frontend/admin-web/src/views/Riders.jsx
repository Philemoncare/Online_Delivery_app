import React, { useState } from 'react';
import { Card, Table, Button, theme, Input, Badge } from '../components/UI';
import { authApi } from '../api';

const Riders = ({ users, onRefresh }) => {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [editingRider, setEditingRider] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const riders = users.filter(u => {
        const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                             u.email.toLowerCase().includes(search.toLowerCase()) ||
                             u.phone.includes(search);
        const matchesStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' && !u.is_suspended) || (filterStatus === 'SUSPENDED' && u.is_suspended);
        return u.role === 'rider' && matchesSearch && matchesStatus;
    });

    const handleDelete = async (id) => {
        if (window.confirm("Delete this rider from the fleet?")) {
            try {
                await authApi.deleteUser(id);
                showMessage('success', 'Rider removed from fleet');
                onRefresh();
            } catch (e) {
                showMessage('danger', 'Failed to remove rider');
            }
        }
    };

    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await authApi.uploadImage(file);
            setPreviewUrl(res.data.url);
        } catch (err) {
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            const payload = {
                ...data,
                profile_picture_url: previewUrl || editingRider?.profile_picture_url || ''
            };

            if (isAdding) {
                await authApi.register({
                    ...payload,
                    role: 'rider',
                    password: data.password || 'RiderPassword123!',
                });
                showMessage('success', 'Rider registered successfully');
                setIsAdding(false);
            } else {
                await authApi.updateUser(editingRider.user_id, payload);
                showMessage('success', 'Rider profile updated');
                setEditingRider(null);
            }
            setPreviewUrl('');
            onRefresh();
        } catch (e) {
            showMessage('danger', e.response?.data?.detail || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (user) => {
        try {
            await authApi.updateUser(user.user_id, { is_suspended: !user.is_suspended });
            showMessage('success', `Rider ${user.is_suspended ? 'reactivated' : 'suspended'}`);
            onRefresh();
        } catch (e) {
            showMessage('danger', 'Failed to update status');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Fleet Management</h1>
                    <p style={{ color: theme.textMuted, margin: 0, fontWeight: '600' }}>Monitor and manage your delivery partners</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button label="Register New Rider" onClick={() => setIsAdding(true)} icon="🛵" />
                </div>
            </div>

            {message.text && (
                <div style={{
                    padding: '16px 24px',
                    borderRadius: '16px',
                    backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? theme.success : theme.danger,
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}

            <Card>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <Input
                            placeholder="Search by name, email or vehicle..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ marginBottom: 0 }}
                            icon="🔍"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        style={{
                            padding: '0 16px',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${theme.glassBorder}`,
                            color: theme.text,
                            fontWeight: '700',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="SUSPENDED">Suspended Only</option>
                    </select>
                </div>

                <Table
                    headers={['Rider Details', 'Vehicle Info', 'Performance', 'Account Status', 'Actions']}
                    data={riders}
                    renderRow={(u) => (
                        <tr key={u.user_id}>
                            <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '14px',
                                        background: `linear-gradient(135deg, ${theme.primary}20, ${theme.accent}20)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '800',
                                        color: theme.primary,
                                        fontSize: '18px',
                                        border: `1px solid ${theme.primary}40`
                                    }}>
                                        🛵
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '15px' }}>{u.full_name}</div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>{u.email}</div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted }}>{u.phone}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontSize: '13px', fontWeight: '700' }}>{u.vehicle_info || '---'}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted }}>ID Ref: {u.id_details || 'N/A'}</div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800', fontSize: '15px' }}>
                                    <span>4.9</span>
                                    <span style={{ color: theme.warning }}>★</span>
                                </div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>148 Deliveries</div>
                            </td>
                            <td style={tdStyle}>
                                <Badge status={u.is_suspended ? 'CANCELLED' : 'ACTIVE'} label={u.is_suspended ? 'SUSPENDED' : 'ON DUTY'} />
                            </td>
                            <td style={tdStyle}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => setEditingRider(u)} style={actionBtnStyle(theme.primary)} title="Edit Profile">✏️</button>
                                    <button onClick={() => toggleStatus(u)} style={actionBtnStyle(u.is_suspended ? theme.success : theme.warning)} title={u.is_suspended ? "Reactivate" : "Suspend"}>{u.is_suspended ? '🔓' : '🔒'}</button>
                                    <button onClick={() => handleDelete(u.user_id)} style={actionBtnStyle(theme.danger)} title="Remove Rider">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    )}
                />
            </Card>

            {(isAdding || editingRider) && (
                <div style={modalOverlay}>
                    <div style={{ animation: 'modalIn 0.3s ease-out' }}>
                        <Card title={isAdding ? "Register New Fleet Member" : "Edit Rider Profile"} style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: '100px', height: '100px', borderRadius: '50%',
                                        backgroundImage: `url(${previewUrl || editingRider?.profile_picture_url || 'https://via.placeholder.com/100?text=Rider'})`,
                                        backgroundSize: 'cover', backgroundPosition: 'center',
                                        border: `3px solid ${theme.primary}40`, backgroundColor: 'rgba(255,255,255,0.05)'
                                    }} />
                                    <input type="file" id="rider-pfp" style={{ display: 'none' }} onChange={handleImageUpload} />
                                    <label htmlFor="rider-pfp" style={{
                                        position: 'absolute', bottom: '0', right: '0', width: '32px', height: '32px',
                                        backgroundColor: theme.primary, borderRadius: '50%', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', cursor: 'pointer', border: '2px solid #000', fontSize: '14px'
                                    }}>
                                        {uploading ? '⌛' : '📷'}
                                    </label>
                                </div>
                            </div>
                            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <Input name="full_name" label="Full Name" defaultValue={editingRider?.full_name} placeholder="John Doe" required />
                                </div>
                                <Input name="email" label="Email Address" type="email" defaultValue={editingRider?.email} placeholder="john@fleet.com" required />
                                <Input name="phone" label="Phone Number" defaultValue={editingRider?.phone} placeholder="+233..." required />
                                <Input name="vehicle_info" label="Vehicle Details" defaultValue={editingRider?.vehicle_info} placeholder="Honda Civic - GS-1234" required />
                                <Input name="id_details" label="License / ID Number" defaultValue={editingRider?.id_details} placeholder="ID-99887766" required />
                                <div style={{ gridColumn: 'span 2' }}>
                                    <Input name="address" label="Home Address" defaultValue={editingRider?.address} placeholder="Accra, Ghana" />
                                </div>
                                {isAdding && (
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <Input name="password" label="Account Password" type="password" placeholder="••••••••" />
                                        <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '12px', color: theme.primary, fontWeight: '600' }}>
                                            Note: If password is left blank, "RiderPassword123!" will be assigned.
                                        </div>
                                    </div>
                                )}

                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '20px' }}>
                                    <Button label="Cancel" variant="secondary" onClick={() => { setIsAdding(false); setEditingRider(null); }} style={{ flex: 1 }} />
                                    <Button label={loading ? "Processing..." : (isAdding ? "Register Rider" : "Save Changes")} type="submit" style={{ flex: 2 }} disabled={loading} />
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
};

const tdStyle = { padding: '20px 24px', verticalAlign: 'middle' };
const actionBtnStyle = (color) => ({
    width: '36px', height: '36px', borderRadius: '10px', border: `1px solid ${color}30`, backgroundColor: `${color}10`, color: color, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', transition: 'all 0.2s'
});
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 };

export default Riders;
