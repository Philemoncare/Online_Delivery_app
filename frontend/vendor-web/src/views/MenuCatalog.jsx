import React, { useState } from 'react';
import { Card, theme, Button, Input, Badge } from '../components/UI';
import { restaurantApi } from '../api';

const MenuCatalog = ({ menu, restaurantId, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const filteredMenu = menu.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase()))
    );

    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const res = await restaurantApi.uploadImage(file);
            setPreviewUrl(res.data.url);
        } catch (err) {
            alert("Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!restaurantId) {
            alert("Terminal Error: Kitchen profile not found. Please sync your settings.");
            return;
        }

        setLoading(true);
        const form = e.target;
        const formData = new FormData(form);

        const data = {
            name: formData.get('name'),
            price: parseFloat(formData.get('price')) || 0,
            description: formData.get('description') || '',
            category: formData.get('category') || 'General',
            stock_level: parseInt(formData.get('stock')) || 0,
            is_available: form.elements.available.checked,
            is_featured: form.elements.featured.checked,
            image_url: previewUrl || editingItem?.image_url || ''
        };

        try {
            if (editingItem) {
                await restaurantApi.updateMenuItem(editingItem.item_id, data);
            } else {
                await restaurantApi.addMenuItem(restaurantId, data);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setPreviewUrl('');
            onRefresh();
        } catch (err) {
            console.error("Save error:", err);
            alert("Critical Error: Failed to synchronize menu update. " + (err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || ""));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Permanently remove this item from your digital catalog?")) {
            try {
                await restaurantApi.deleteMenuItem(id);
                onRefresh();
            } catch (e) {
                alert("Delete failed");
            }
        }
    };

    const toggleAvailability = async (item) => {
        try {
            await restaurantApi.updateMenuItem(item.item_id, {
                ...item,
                is_available: !item.is_available
            });
            onRefresh();
        } catch (e) {
            alert("Availability toggle failed");
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '-1.5px' }}>Kitchen Catalog</h2>
                    <p style={{ color: theme.textMuted, margin: '4px 0 0 0', fontWeight: '600' }}>Manage food inventory and platform listings.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '300px' }}>
                        <Input
                            placeholder="Search catalog..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ marginBottom: 0 }}
                            icon="🔍"
                        />
                    </div>
                    <Button label="Add Product" onClick={() => { setEditingItem(null); setPreviewUrl(''); setIsModalOpen(true); }} icon="🍱" />
                </div>
            </div>

            <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Product Detail</th>
                                <th style={thStyle}>Stock</th>
                                <th style={thStyle}>Unit Price</th>
                                <th style={thStyle}>Listing</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMenu.map(item => (
                                <tr key={item.item_id} style={{ transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                width: '56px', height: '56px', borderRadius: '16px',
                                                backgroundImage: `url(${item.image_url || 'https://via.placeholder.com/100?text=Food'})`,
                                                backgroundSize: 'cover', backgroundPosition: 'center',
                                                border: `1px solid ${theme.glassBorder}`
                                            }} />
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '16px', color: theme.text }}>{item.name} {item.is_featured && <span title="Featured Item">⭐</span>}</div>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{item.category || 'General'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: '800', fontSize: '15px' }}>{item.stock_level} Units</div>
                                        <div style={{ fontSize: '11px', color: item.stock_level > 5 ? theme.success : theme.danger, fontWeight: '700' }}>
                                            {item.stock_level > 5 ? 'STOCKED' : 'LOW SUPPLY'}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: '900', color: theme.text, fontSize: '16px' }}>GHS {parseFloat(item.price).toFixed(2)}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <Badge status={item.is_available ? 'COMPLETED' : 'CANCELLED'} label={item.is_available ? 'LISTED' : 'HIDDEN'} />
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => { setEditingItem(item); setPreviewUrl(item.image_url || ''); setIsModalOpen(true); }} style={actionBtnStyle(theme.primary)}>✏️</button>
                                            <button onClick={() => toggleAvailability(item)} style={actionBtnStyle(item.is_available ? theme.danger : theme.success)} title={item.is_available ? "Hide from Store" : "List on Store"}>{item.is_available ? '⏸️' : '▶️'}</button>
                                            <button onClick={() => handleDelete(item.item_id)} style={actionBtnStyle(theme.danger)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredMenu.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '80px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🍱</div>
                                        <div style={{ fontWeight: '800', color: theme.textMuted, fontSize: '18px' }}>Digital catalog is empty.</div>
                                        <p style={{ color: theme.textMuted, marginTop: '8px' }}>Start adding your culinary creations to receive orders.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isModalOpen && (
                <div style={modalOverlay}>
                    <div style={{ animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', width: '100%', maxWidth: '600px' }}>
                        <Card title={editingItem ? 'MODIFY PRODUCT' : 'NEW CATALOG ITEM'}>
                            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <Input name="name" label="Product Name" defaultValue={editingItem?.name} required placeholder="e.g. Traditional Jollof" />
                                </div>
                                <Input name="price" label="Unit Price (GHS)" type="number" step="0.01" defaultValue={editingItem?.price} required />
                                <Input name="stock" label="Stock Level" type="number" defaultValue={editingItem?.stock_level || 0} required />
                                <Input name="category" label="Menu Category" defaultValue={editingItem?.category} placeholder="Main Dishes" />

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={labelStyleModal}>Product Image</label>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{
                                            width: '100px', height: '100px', borderRadius: '16px',
                                            backgroundImage: `url(${previewUrl || editingItem?.image_url || 'https://via.placeholder.com/100?text=Food'})`,
                                            backgroundSize: 'cover', backgroundPosition: 'center',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${theme.glassBorder}`
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="menu-img-upload" />
                                            <label htmlFor="menu-img-upload" style={{
                                                display: 'inline-block', padding: '12px 20px', backgroundColor: theme.primary + '20',
                                                color: theme.primary, borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '14px'
                                            }}>
                                                {uploading ? 'UPLOADING...' : 'UPLOAD NEW IMAGE'}
                                            </label>
                                            <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '8px' }}>JPG, PNG or WEBP. Max 5MB.</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={labelStyleModal}>Description</label>
                                    <textarea name="description" defaultValue={editingItem?.description} style={textareaStyle} placeholder="Briefly describe the product..." />
                                </div>

                                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={toggleCardStyle}>
                                        <div>
                                            <div style={{ fontWeight: '900', color: theme.text, fontSize: '14px' }}>LISTING STATUS</div>
                                            <div style={{ fontSize: '12px', color: theme.textMuted }}>Show or hide this item from customers</div>
                                        </div>
                                        <input name="available" type="checkbox" defaultChecked={editingItem ? editingItem.is_available : true} style={checkboxStyle} />
                                    </div>

                                    <div style={toggleCardStyle}>
                                        <div>
                                            <div style={{ fontWeight: '900', color: theme.text, fontSize: '14px' }}>FEATURED STATUS</div>
                                            <div style={{ fontSize: '12px', color: theme.textMuted }}>Highlight this product at the top of your menu</div>
                                        </div>
                                        <input name="featured" type="checkbox" defaultChecked={editingItem?.is_featured || false} style={checkboxStyle} />
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '16px', marginTop: '24px' }}>
                                    <Button label="Cancel" variant="secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }} />
                                    <Button label={loading ? "Synchronizing..." : (editingItem ? 'Update Item' : 'Publish to Store')} type="submit" style={{ flex: 2 }} disabled={loading} icon={loading ? null : "🚀"} />
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes modalIn { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
        </div>
    );
};

const thStyle = {
    padding: '24px', fontSize: '11px', fontWeight: '900', color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: `1px solid ${theme.glassBorder}`,
    textAlign: 'left'
};
const tdStyle = { padding: '24px', verticalAlign: 'middle' };
const actionBtnStyle = (color) => ({
    width: '40px', height: '40px', borderRadius: '12px', border: `1px solid ${color}30`, backgroundColor: `${color}10`, color: color, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.3s'
});
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px' };
const textareaStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: `1px solid ${theme.glassBorder}`, fontSize: '15px', outline: 'none', boxSizing: 'border-box', height: '120px', resize: 'none', backgroundColor: 'rgba(255,255,255,0.03)', color: theme.text, transition: 'all 0.2s' };
const labelStyleModal = { display: 'block', fontSize: '13px', fontWeight: '800', color: theme.textMuted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const toggleCardStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: `1px solid ${theme.glassBorder}` };
const checkboxStyle = { width: '24px', height: '24px', cursor: 'pointer', accentColor: theme.primary };

export default MenuCatalog;
