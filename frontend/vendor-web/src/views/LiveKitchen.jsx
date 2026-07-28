import React from 'react';
import { Card, theme, Badge, Button } from '../components/UI';
import { orderApi } from '../api';

const LiveKitchen = ({ orders, menu, onRefresh }) => {
    const activeOrders = orders.filter(o => ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP'].includes(o.status));
    const recentOrders = orders.filter(o => !['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status)).slice(0, 10);

    const updateStatus = async (id, status) => {
        try {
            await orderApi.updateStatus(id, status);
            onRefresh();
        } catch (e) {
            alert("Failed to update order status");
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Active Orders Queue</h2>
                <div style={{
                    padding: '10px 20px', backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '16px', color: theme.primary, fontWeight: '800', fontSize: '13px',
                    border: '1px solid rgba(245, 158, 11, 0.2)', animation: activeOrders.length > 0 ? 'pulse-glow 2s infinite' : 'none'
                }}>
                    🔥 {activeOrders.length} LIVE ORDERS
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '64px' }}>
                {activeOrders.map(order => (
                    <Card key={order.order_id} style={{
                        border: order.status === 'PLACED' ? `2px solid ${theme.primary}` : `1px solid ${theme.glassBorder}`,
                        boxShadow: order.status === 'PLACED' ? '0 10px 40px rgba(245, 158, 11, 0.2)' : '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                        height: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Order Identifier</div>
                                <div style={{ fontSize: '18px', fontWeight: '900', color: theme.text }}>#{order.order_id.substring(0,8)}</div>
                                <div style={{ fontSize: '13px', color: theme.textMuted, fontWeight: '600', marginTop: '4px' }}>🕑 Received {new Date(order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <Badge status={order.status} />
                        </div>

                        <div style={{ marginBottom: '28px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '20px', padding: '20px', border: `1px solid ${theme.glassBorder}` }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {order.items.map(i => (
                                    <div key={i.order_item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '800', fontSize: '16px' }}>
                                            <span style={{ color: theme.primary, marginRight: '8px' }}>{i.quantity}×</span>
                                            {menu.find(m => m.item_id === i.item_id)?.name || 'Catalog Item'}
                                        </span>
                                        <span style={{ color: theme.textMuted, fontWeight: '700', fontSize: '13px' }}>GH₵ {i.unit_price}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: `1px dashed ${theme.glassBorder}`, fontWeight: '900' }}>
                                <span style={{ color: theme.textMuted, fontSize: '14px', textTransform: 'uppercase' }}>Net Total</span>
                                <span style={{ fontSize: '20px', color: theme.primary }}>GH₵ {order.total_amount}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            {order.status === 'PLACED' && (
                                <>
                                    <Button label="Accept & Print" style={{ flex: 2 }} onClick={() => updateStatus(order.order_id, 'CONFIRMED')} icon="🧾" />
                                    <Button label="Reject" variant="danger" style={{ flex: 1 }} onClick={() => updateStatus(order.order_id, 'CANCELLED')} />
                                </>
                            )}
                            {order.status === 'CONFIRMED' && (
                                <Button label="Start Preparation" style={{ flex: 1 }} onClick={() => updateStatus(order.order_id, 'PREPARING')} icon="👩‍🍳" />
                            )}
                            {order.status === 'PREPARING' && (
                                <Button label="Mark Ready for Pickup" style={{ flex: 1 }} onClick={() => updateStatus(order.order_id, 'READY_FOR_PICKUP')} icon="✅" />
                            )}
                            {order.status === 'READY_FOR_PICKUP' && (
                                <div style={{
                                    flex: 1, textAlign: 'center', padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: theme.success, borderRadius: '16px', fontWeight: '800', fontSize: '13px',
                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}>
                                    ⌛ Waiting for Courier Pickup
                                </div>
                            )}
                            {order.status === 'PICKED_UP' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                    <div style={{
                                        textAlign: 'center', padding: '14px', backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                        color: '#6366F1', borderRadius: '16px', fontWeight: '800', fontSize: '13px',
                                        border: '1px solid rgba(99, 102, 241, 0.2)'
                                    }}>
                                        🛵 Courier en-route to Destination
                                    </div>
                                    <Button label="Complete Flow" variant="outline" style={{ fontSize: '11px', padding: '8px' }} onClick={() => updateStatus(order.order_id, 'COMPLETED')} />
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {activeOrders.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '100px 40px', backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    borderRadius: '32px', border: `2px dashed ${theme.glassBorder}`, marginBottom: '64px'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '24px' }}>👨‍🍳</div>
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Your kitchen is ready for action!</h3>
                    <p style={{ color: theme.textMuted, marginTop: '12px', fontWeight: '600', maxWidth: '400px', marginInline: 'auto' }}>
                        Waiting for new orders from customers. Keep this page open to receive real-time updates.
                    </p>
                </div>
            )}

            <h2 style={{ marginBottom: '32px', fontSize: '24px', fontWeight: '800' }}>Recent Dispatch History</h2>
            <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Transaction Ref</th>
                                <th style={thStyle}>Completion Status</th>
                                <th style={thStyle}>Order Value</th>
                                <th style={thStyle}>Cart Volume</th>
                                <th style={thStyle}>Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map(o => (
                                <tr key={o.order_id} style={{ transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: '900', color: theme.primary }}>#{o.order_id.substring(0,8)}</div>
                                    </td>
                                    <td style={tdStyle}><Badge status={o.status} /></td>
                                    <td style={tdStyle}><span style={{ fontWeight: '900', fontSize: '15px' }}>GH₵ {o.total_amount}</span></td>
                                    <td style={tdStyle}><span style={{ fontWeight: '600', color: theme.textMuted }}>{o.items.length} Cart Items</span></td>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: '600' }}>{new Date(o.placed_at).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '11px', color: theme.textMuted }}>{new Date(o.placed_at).toLocaleTimeString()}</div>
                                    </td>
                                </tr>
                            ))}
                            {recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>No dispatch history available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const thStyle = {
    padding: '20px 24px', fontSize: '11px', fontWeight: '900', color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `1px solid ${theme.glassBorder}`,
    textAlign: 'left'
};
const tdStyle = { padding: '20px 24px', verticalAlign: 'middle' };

export default LiveKitchen;
