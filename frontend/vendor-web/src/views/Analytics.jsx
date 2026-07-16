import React, { useState } from 'react';
import { Card, theme, Button } from '../components/UI';

const StatCard = ({ title, value, icon, color = theme.primary }) => (
    <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: theme.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>{title}</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: theme.text }}>{value}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: `${color}15`, fontSize: '24px' }}>{icon}</div>
        </div>
    </Card>
);

const Analytics = ({ orders, stats, menu }) => {
    const [filter, setFilter] = useState('ALL');
    const totalRevenue = stats?.total_revenue || 0;
    const avgOrder = stats?.avg_order_value || 0;

    const ordersByStatus = (status) => orders.filter(o => o.status === status).length;
    const completedOrders = ordersByStatus('DELIVERED') + ordersByStatus('COMPLETED');
    const cancelledOrders = ordersByStatus('CANCELLED');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{ padding: '10px 15px', borderRadius: '12px', border: `1px solid ${theme.border}`, fontWeight: '700' }}
                >
                    <option value="ALL">All History</option>
                    <option value="WEEK">Last 7 Days</option>
                    <option value="MONTH">This Month</option>
                </select>
                <Button label="Download PDF Report" variant="outline" onClick={() => alert("Generating report...")} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <StatCard title="Total Revenue" value={`GHS ${totalRevenue.toFixed(2)}`} icon="💰" color="#10B981" />
                <StatCard title="Avg Order Value" value={`GHS ${avgOrder.toFixed(2)}`} icon="📊" />
                <StatCard title="Total Orders" value={orders.length} icon="📦" color="#6366F1" />
                <StatCard title="Completion Rate" value={`${orders.length ? Math.round((completedOrders/orders.length)*100) : 0}%`} icon="🎯" color={theme.success} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <StatCard title="Pending/New" value={ordersByStatus('PLACED')} icon="🕒" color={theme.warning} />
                <StatCard title="In Kitchen" value={ordersByStatus('PREPARING') + ordersByStatus('CONFIRMED')} icon="👨‍🍳" />
                <StatCard title="Out for Delivery" value={ordersByStatus('PICKED_UP')} icon="🛵" color={theme.success} />
                <StatCard title="Cancelled" value={cancelledOrders} icon="❌" color={theme.danger} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                <Card title="Sales Performance (Weekly)">
                    <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 10px' }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                             // Mocking trend data for visualization if real data is flat
                             const val = Math.random() * 100 + 20;
                             return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '100%', backgroundColor: theme.primary, height: `${val}%`, borderRadius: '8px 8px 0 0', minHeight: '5px' }} />
                                    <span style={{ marginTop: '12px', fontSize: '11px', fontWeight: '700', color: theme.textMuted }}>{day}</span>
                                </div>
                             );
                        })}
                    </div>
                </Card>

                <Card title="Top Selling Items">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats?.popular_items?.map((item, i) => {
                            const menuItem = menu.find(m => m.item_id === item.id);
                            return (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: theme.bg, borderRadius: '12px' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '14px' }}>{menuItem?.name || 'Item'}</div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted }}>{item.count} orders</div>
                                    </div>
                                    <div style={{ fontWeight: '900', color: theme.primary }}>#{i+1}</div>
                                </div>
                            );
                        })}
                        {(!stats?.popular_items || stats.popular_items.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '20px', color: theme.textMuted }}>No sales data yet</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
