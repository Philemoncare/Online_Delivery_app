import React, { useState } from 'react';
import { Card, Table, Badge, Button, theme, Input } from '../components/UI';

const Orders = ({ orders, restaurants, users }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const filtered = [...orders].sort((a, b) => new Date(b.placed_at) - new Date(a.placed_at)).filter(o =>
        (o.order_id.toLowerCase().includes(search.toLowerCase()) ||
         restaurants.find(r => r.restaurant_id === o.restaurant_id)?.name.toLowerCase().includes(search.toLowerCase()) ||
         users.find(u => u.user_id === o.customer_id)?.full_name.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter === 'ALL' || o.status === statusFilter)
    );

    const exportOrders = () => {
        const headers = ['Order ID', 'Merchant', 'Customer', 'Amount', 'Status', 'Date', 'Address'];
        const rows = filtered.map(o => [
            `#${o.order_id.substring(0,8)}`,
            restaurants.find(r => r.restaurant_id === o.restaurant_id)?.name || 'Unknown',
            users.find(u => u.user_id === o.customer_id)?.full_name || 'Unknown',
            o.total_amount,
            o.status,
            new Date(o.placed_at).toLocaleString(),
            o.delivery_address.replace(/,/g, ' ')
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
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
                    <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Order Stream</h1>
                    <p style={{ color: theme.textMuted, margin: 0, fontWeight: '600' }}>Monitor live transactions and delivery progress</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button label="Export History" variant="secondary" onClick={exportOrders} icon="📥" />
                </div>
            </div>

            <Card>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <Input
                            placeholder="Search by Order ID, Merchant or Customer..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ marginBottom: 0 }}
                            icon="🔍"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
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
                        <option value="ALL">All Statuses</option>
                        <option value="PLACED">Placed</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY_FOR_PICKUP">Ready</option>
                        <option value="PICKED_UP">Picked Up</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                <Table
                    headers={['Order ID', 'Merchant / Customer', 'Financials', 'Timeline', 'Current Status', 'Actions']}
                    data={filtered}
                    renderRow={(o) => (
                        <tr key={o.order_id}>
                            <td style={tdStyle}>
                                <div style={{
                                    padding: '8px 12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${theme.glassBorder}`, display: 'inline-block',
                                    fontWeight: '900', color: theme.primary, fontSize: '13px'
                                }}>
                                    #{o.order_id.substring(0,8)}
                                </div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: '800', fontSize: '15px' }}>{restaurants.find(r => r.restaurant_id === o.restaurant_id)?.name || '---'}</div>
                                <div style={{ fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>To: {users.find(u => u.user_id === o.customer_id)?.full_name || '---'}</div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Grand Total</div>
                                <div style={{ fontWeight: '900', color: theme.text, fontSize: '16px' }}>GHS {o.total_amount.toFixed(2)}</div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontSize: '12px', fontWeight: '600' }}>{new Date(o.placed_at).toLocaleDateString()}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted }}>{new Date(o.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                            <td style={tdStyle}><Badge status={o.status} /></td>
                            <td style={tdStyle}>
                                <Button label="Details" variant="secondary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => setSelectedOrder(o)} />
                            </td>
                        </tr>
                    )}
                />
            </Card>

            {selectedOrder && (
                <div style={modalOverlay}>
                    <div style={{ animation: 'modalIn 0.3s ease-out' }}>
                        <Card style={{ width: '600px' }} title={`Order Analysis #${selectedOrder.order_id.substring(0,8)}`}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.glassBorder}` }}>
                                    <div>
                                        <div style={labelStyle}>Current Logistics State</div>
                                        <Badge status={selectedOrder.status} />
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={labelStyle}>Order Placement Time</div>
                                        <div style={{ fontWeight: '700' }}>{new Date(selectedOrder.placed_at).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: theme.textMuted }}>CUSTOMER & DESTINATION</h4>
                                        <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.glassBorder}` }}>
                                            <div style={{ fontWeight: '800', marginBottom: '4px' }}>{users.find(u => u.user_id === selectedOrder.customer_id)?.full_name}</div>
                                            <div style={{ fontSize: '13px', color: theme.textMuted }}>{selectedOrder.delivery_address}</div>
                                            <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '8px' }}>📞 {users.find(u => u.user_id === selectedOrder.customer_id)?.phone}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: theme.textMuted }}>MERCHANT SOURCE</h4>
                                        <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.glassBorder}` }}>
                                            <div style={{ fontWeight: '800', marginBottom: '4px' }}>{restaurants.find(r => r.restaurant_id === selectedOrder.restaurant_id)?.name}</div>
                                            <div style={{ fontSize: '13px', color: theme.textMuted }}>{restaurants.find(r => r.restaurant_id === selectedOrder.restaurant_id)?.address}</div>
                                            <div style={{ fontSize: '11px', color: theme.primary, marginTop: '8px', fontWeight: '800' }}>DISPATCH RADIUS: {restaurants.find(r => r.restaurant_id === selectedOrder.restaurant_id)?.delivery_radius || 5}KM</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: theme.textMuted }}>ASSIGNED COURIER</h4>
                                    <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.glassBorder}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {selectedOrder.rider_id ? (
                                            <>
                                                <div style={{ fontSize: '24px' }}>🛵</div>
                                                <div>
                                                    <div style={{ fontWeight: '800' }}>{users.find(u => u.user_id === selectedOrder.rider_id)?.full_name}</div>
                                                    <div style={{ fontSize: '12px', color: theme.textMuted }}>ID: {selectedOrder.rider_id}</div>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ color: theme.warning, fontWeight: '700', fontSize: '13px' }}>⚠️ NO COURIER ASSIGNED YET</div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ borderTop: `1px solid ${theme.glassBorder}`, paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button label="Close" variant="secondary" onClick={() => setSelectedOrder(null)} style={{ flex: 1 }} />
                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                        <div style={labelStyle}>Total Payout</div>
                                        <div style={{ fontSize: '24px', fontWeight: '900', color: theme.primary }}>GHS {selectedOrder.total_amount.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
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
const labelStyle = { fontSize: '11px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px' };

export default Orders;
