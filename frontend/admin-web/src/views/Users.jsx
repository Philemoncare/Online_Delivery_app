import React, { useState } from 'react';
import { Card, Table, Button, theme, Input, Badge } from '../components/UI';
import { authApi } from '../api';

const Users = ({ users, orders, onRefresh }) => {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [editingUser, setEditingUser] = useState(null);
    const [viewingOrders, setViewingOrders] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const customers = users.filter(u => {
        const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                             u.email.toLowerCase().includes(search.toLowerCase()) ||
                             u.phone.includes(search);
        const matchesStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' && !u.is_suspended) || (filterStatus === 'SUSPENDED' && u.is_suspended);
        return u.role === 'customer' && matchesSearch && matchesStatus;
    });

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
            try {
                await authApi.deleteUser(id);
                showMessage('success', 'Customer deleted successfully');
                onRefresh();
            } catch (e) {
                showMessage('danger', 'Failed to delete customer');
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
                profile_picture_url: previewUrl || editingUser?.profile_picture_url || ''
            };

            if (isAdding) {
                await authApi.register({
                    ...payload,
                    role: 'customer',
                    password: data.password || 'Password123!',
                });
                showMessage('success', 'Customer added successfully');
                setIsAdding(false);
            } else {
                await authApi.updateUser(editingUser.user_id, payload);
                showMessage('success', 'Customer updated successfully');
                setEditingUser(null);
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
            showMessage('success', `Customer ${user.is_suspended ? 'reactivated' : 'suspended'}`);
            onRefresh();
        } catch (e) {
            showMessage('danger', 'Failed to update status');
        }
    };

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Wallet Balance', 'Joined Date', 'Status'];
        const rows = customers.map(u => [
            u.full_name,
            u.email,
            u.phone,
            u.wallet_balance,
            new Date(u.created_at).toLocaleDateString(),
            u.is_suspended ? 'SUSPENDED' : 'ACTIVE'
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Customer Management</h1>
                    <p style={{ color: theme.textMuted, margin: 0, fontWeight: '600' }}>Manage and monitor your platform's users</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button label="Export CSV" variant="secondary" onClick={exportCSV} icon="📥" />
                    <Button label="Add Customer" onClick={() => setIsAdding(true)} icon="➕" />
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
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <Input
                            placeholder="Search by name, email or phone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ marginBottom: 0 }}
                            icon="🔍"
                        />
                    </div>
                    <div style={{ flex: '0 0 auto' }}>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            style={{
                                padding: '14px 16px',
                                borderRadius: '16px',
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${theme.glassBorder}`,
                                color: theme.text,
                                fontWeight: '700',
                                outline: 'none',
                                cursor: 'pointer',
                                height: '50px'
                            }}
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active Only</option>
                            <option value="SUSPENDED">Suspended Only</option>
                        </select>
                    </div>
                </div>

                <Table
                    headers={['Customer Details', 'Financials', 'Account Status', 'Activity', 'Actions']}
                    data={customers}
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
                                        {u.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '15px' }}>{u.full_name}</div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>{u.email}</div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted }}>{u.phone}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>Wallet Balance</div>
                                <div style={{ fontWeight: '900', color: theme.success, fontSize: '16px' }}>GHS {u.wallet_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </td>
                            <td style={tdStyle}>
                                <Badge status={u.is_suspended ? 'CANCELLED' : 'ACTIVE'} label={u.is_suspended ? 'SUSPENDED' : 'ACTIVE'} />
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontSize: '12px', fontWeight: '600' }}>Joined {new Date(u.created_at).toLocaleDateString()}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted }}>ID: {u.user_id.substring(0,8)}...</div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => setViewingOrders(u)}
                                        style={actionBtnStyle(theme.accent)}
                                        title="Order History"
                                    >📋</button>
                                    <button
                                        onClick={() => setEditingUser(u)}
                                        style={actionBtnStyle(theme.primary)}
                                        title="Edit Profile"
                                    >✏️</button>
                                    <button
                                        onClick={() => toggleStatus(u)}
                                        style={actionBtnStyle(u.is_suspended ? theme.success : theme.warning)}
                                        title={u.is_suspended ? "Reactivate" : "Suspend"}
                                    >{u.is_suspended ? '🔓' : '🔒'}</button>
                                    <button
                                        onClick={() => handleDelete(u.user_id)}
                                        style={actionBtnStyle(theme.danger)}
                                        title="Delete Account"
                                    >🗑️</button>
                                </div>
                            </td>
                        </tr>
                    )}
                />
            </Card>

            {viewingOrders && (
                <div style={modalOverlay}>
                    <div style={{ animation: 'modalIn 0.3s ease-out' }}>
                        <Card title={`Order History: ${viewingOrders.full_name}`} style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {orders.filter(o => o.customer_id === viewingOrders.user_id).length > 0 ? (
                                    orders.filter(o => o.customer_id === viewingOrders.user_id).map(o => (
                                        <div key={o.order_id} style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.glassBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '14px' }}>Order #{o.order_id.substring(0,8)}</div>
                                                <div style={{ fontSize: '12px', color: theme.textMuted }}>{new Date(o.placed_at).toLocaleString()}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '900', color: theme.primary }}>GHS {o.total_amount.toFixed(2)}</div>
                                                <Badge status={o.status} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>No orders found for this customer</div>
                                )}
                                <Button label="Close History" variant="secondary" onClick={() => setViewingOrders(null)} style={{ marginTop: '12px' }} />
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {(isAdding || editingUser) && (
                <div style={modalOverlay}>
                    <div style={{ animation: 'modalIn 0.3s ease-out' }}>
                        <Card title={isAdding ? "Register New Customer" : "Edit Customer Profile"} style={{ width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: '100px', height: '100px', borderRadius: '50%',
                                        backgroundImage: `url(${previewUrl || editingUser?.profile_picture_url || 'https://ui-avatars.com/api/?name=' + (editingUser?.full_name || 'User')})`,
                                        backgroundSize: 'cover', backgroundPosition: 'center',
                                        border: `3px solid ${theme.primary}40`, backgroundColor: 'rgba(255,255,255,0.05)'
                                    }} />
                                    <input type="file" id="user-pfp" style={{ display: 'none' }} onChange={handleImageUpload} />
                                    <label htmlFor="user-pfp" style={{
                                        position: 'absolute', bottom: '0', right: '0', width: '32px', height: '32px',
                                        backgroundColor: theme.primary, borderRadius: '50%', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', cursor: 'pointer', border: '2px solid #000', fontSize: '14px'
                                    }}>
                                        {uploading ? '⌛' : '📷'}
                                    </label>
                                </div>
                            </div>
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <Input name="full_name" label="Full Name" defaultValue={editingUser?.full_name} placeholder="John Doe" required />
                                <Input name="email" label="Email Address" type="email" defaultValue={editingUser?.email} placeholder="john@example.com" required />
                                <Input name="phone" label="Phone Number" defaultValue={editingUser?.phone} placeholder="+233..." required />
                                <Input name="address" label="Primary Delivery Address" defaultValue={editingUser?.address} placeholder="123 Street, Accra" />

                                {isAdding && (
                                    <>
                                        <Input name="password" label="Account Password" type="password" placeholder="••••••••" />
                                        <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '12px', color: theme.primary, fontWeight: '600' }}>
                                            Note: If password is left blank, "Password123!" will be assigned.
                                        </div>
                                    </>
                                )}

                                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                    <Button
                                        label="Cancel"
                                        variant="secondary"
                                        onClick={() => { setIsAdding(false); setEditingUser(null); }}
                                        style={{ flex: 1 }}
                                    />
                                    <Button
                                        label={loading ? "Processing..." : (isAdding ? "Register Customer" : "Save Changes")}
                                        type="submit"
                                        style={{ flex: 2 }}
                                        disabled={loading}
                                    />
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
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: `1px solid ${color}30`,
    backgroundColor: `${color}10`,
    color: color,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    transition: 'all 0.2s'
});
const modalOverlay = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001
};

export default Users;
