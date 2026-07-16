import React, { useState } from 'react';
import { Card, theme, Badge, Button } from '../components/UI';

const StatCard = ({ title, value, subtitle, icon, color = theme.primary }) => (
    <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: theme.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>{title}</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: theme.text }}>{value}</div>
                {subtitle && <div style={{ fontSize: '12px', color: theme.success, marginTop: '8px', fontWeight: '600' }}>{subtitle}</div>}
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: `${color}15`, fontSize: '24px' }}>
                {icon}
            </div>
        </div>
    </Card>
);

const Dashboard = ({ analytics, data, onRefresh }) => {
    const [dateRange, setDateRange] = useState('all');

    const handleRangeChange = (e) => {
        const range = e.target.value;
        setDateRange(range);
        onRefresh(range);
    };

    const stats = [
        { title: 'Gross Revenue', value: `GHS ${analytics?.total_revenue?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}`, icon: '💰', color: theme.success },
        { title: 'Net Platform Fee', value: `GHS ${analytics?.platform_earnings?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}`, subtitle: '10% Revenue Share', icon: '🏦', color: theme.primary },
        { title: 'Successful Orders', value: analytics?.total_orders || '0', icon: '📦', color: theme.accent },
        { title: 'Avg. Order Basket', value: `GHS ${(analytics?.total_orders > 0 ? analytics.total_revenue / analytics.total_orders : 0).toFixed(2)}`, icon: '🛒', color: theme.warning }
    ];

    const orderStats = [
        { label: 'Pending', count: analytics?.orders_by_status?.PLACED || 0, color: theme.warning, icon: '⏳' },
        { label: 'In Kitchen', count: (analytics?.orders_by_status?.CONFIRMED || 0) + (analytics?.orders_by_status?.PREPARING || 0), color: theme.primary, icon: '🍳' },
        { label: 'Out for Delivery', count: analytics?.orders_by_status?.PICKED_UP || 0, color: theme.accent, icon: '🛵' },
        { label: 'Completed', count: (analytics?.orders_by_status?.DELIVERED || 0) + (analytics?.orders_by_status?.COMPLETED || 0), color: theme.success, icon: '✅' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Live Systems Active</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <select
                        value={dateRange}
                        onChange={handleRangeChange}
                        style={{ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${theme.border}`, fontWeight: '700', outline: 'none', backgroundColor: theme.cardBg, color: theme.text }}
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="all">All Time</option>
                    </select>
                    <Button label="Generate Report" variant="secondary" onClick={() => alert("Report generated & downloaded.")} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                {stats.map((s, i) => <StatCard key={i} {...s} />)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                {orderStats.map((s, i) => (
                    <Card key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted, marginBottom: '5px' }}>{s.label.toUpperCase()}</div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: s.color }}>{s.count}</div>
                            </div>
                            <div style={{ fontSize: '20px' }}>{s.icon}</div>
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <Card title="Revenue Trend (Last 12 Days)">
                    <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '20px 10px 10px 10px' }}>
                        {analytics?.sales_trend?.length > 0 ? analytics.sales_trend.map((d, i) => {
                            const max = Math.max(...(analytics?.sales_trend || []).map(t => t.amount), 1);
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    <div
                                        style={{
                                            width: '100%',
                                            backgroundColor: theme.primary,
                                            height: `${(d.amount/max)*100}%`,
                                            borderRadius: '6px 6px 0 0',
                                            minHeight: '4px',
                                            transition: 'height 0.5s ease',
                                            cursor: 'pointer'
                                        }}
                                        title={`GHS ${d.amount}`}
                                    />
                                    <span style={{ marginTop: '12px', fontSize: '10px', fontWeight: '700', color: theme.textMuted }}>{d.date.split('-')[2]}</span>
                                </div>
                            );
                        }) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted }}>Insufficient data for trend</div>}
                    </div>
                </Card>

                <Card title="Top Performing Merchants">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {analytics?.top_restaurants?.length > 0 ? analytics.top_restaurants.map((r, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '12px', backgroundColor: theme.bg }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '14px' }}>{data.restaurants.find(res => res.restaurant_id === r.id)?.name || 'Unknown Merchant'}</div>
                                    <div style={{ fontSize: '12px', color: theme.textMuted }}>{r.orders} orders</div>
                                </div>
                                <div style={{ fontWeight: '900', color: theme.primary }}>GHS {r.revenue.toLocaleString()}</div>
                            </div>
                        )) : <div style={{ color: theme.textMuted, textAlign: 'center', padding: '20px' }}>No merchants found</div>}
                    </div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <Card title="Popular Items Platform-wide">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {analytics?.popular_items?.length > 0 ? analytics.popular_items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: `1px solid ${theme.border}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: `${theme.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: theme.primary }}>
                                        #{i+1}
                                    </div>
                                    <span style={{ fontWeight: '700' }}>{item.id.substring(0,8)}...</span>
                                </div>
                                <span style={{ color: theme.primary, fontWeight: '800' }}>{item.count} Sold</span>
                            </div>
                        )) : <div style={{ color: theme.textMuted, textAlign: 'center', padding: '20px' }}>No items found</div>}
                    </div>
                </Card>
                <Card title="Top Fleet Members">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {analytics?.top_riders?.length > 0 ? analytics.top_riders.map((rider, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: `1px solid ${theme.border}` }}>
                                <span style={{ fontWeight: '700' }}>{data.users.find(u => u.user_id === rider.id)?.full_name || 'Rider ID: ' + rider.id.substring(0,8)}</span>
                                <Badge status="ACTIVE" label={`${rider.deliveries} Deliveries`} />
                            </div>
                        )) : <div style={{ color: theme.textMuted, textAlign: 'center', padding: '20px' }}>No riders active</div>}
                    </div>
                </Card>
            </div>

            <Card title="Recent Orders Stream">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                        <tr style={{ textAlign: 'left', borderBottom: `2px solid ${theme.border}` }}>
                            <th style={thStyle}>Order ID</th>
                            <th style={thStyle}>Merchant</th>
                            <th style={thStyle}>Customer</th>
                            <th style={thStyle}>Amount</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...data.orders].sort((a, b) => new Date(b.placed_at) - new Date(a.placed_at)).slice(0, 5).map(o => (
                            <tr key={o.order_id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                <td style={tdStyle}>#{o.order_id.substring(0,8)}</td>
                                <td style={tdStyle}>{data.restaurants.find(r => r.restaurant_id === o.restaurant_id)?.name || '---'}</td>
                                <td style={tdStyle}>{data.users.find(u => u.user_id === o.customer_id)?.full_name || '---'}</td>
                                <td style={tdStyle}>GHS {o.total_amount}</td>
                                <td style={tdStyle}><Badge status={o.status} /></td>
                                <td style={tdStyle}>{new Date(o.placed_at).toLocaleTimeString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </Card>
        </div>
    );
};

const thStyle = { padding: '16px 12px', fontSize: '11px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' };
const tdStyle = { padding: '16px 12px', fontSize: '14px' };

export default Dashboard;
