import React, { useState, useMemo } from 'react';
import { Card, theme, Button, Badge } from '../components/UI';

const StatCard = ({ title, value, icon, color = theme.primary, trend }) => (
    <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: theme.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: theme.text, letterSpacing: '-1px' }}>{value}</div>
                {trend !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', color: trend >= 0 ? theme.success : theme.danger, fontSize: '13px', fontWeight: '700' }}>
                        <span>{trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%</span>
                        <span style={{ color: theme.textMuted, fontWeight: '500' }}>vs last period</span>
                    </div>
                )}
            </div>
            <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: `${color}15`, fontSize: '28px', border: `1px solid ${color}20` }}>{icon}</div>
        </div>
    </Card>
);

const SalesReports = ({ orders, stats, menu }) => {
    const [timeframe, setTimeframe] = useState('MONTH');

    const salesTrend = useMemo(() => {
        if (!stats?.revenue_trend) return [];
        return stats.revenue_trend.map(d => ({
            day: d.date.split('-')[2], // Day number
            amount: d.amount
        }));
    }, [stats]);

    const metrics = useMemo(() => ({
        revenue: timeframe === 'TODAY' ? stats?.today_sales : (timeframe === 'WEEK' ? stats?.weekly_sales : stats?.total_revenue),
        orders: orders?.length || 0,
        avgValue: stats?.avg_order_value || 0,
        successRate: orders?.length ? Math.round((stats?.completed_count / orders.length) * 100) : 0
    }), [stats, orders, timeframe]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '40px', fontWeight: '900', color: theme.text, marginBottom: '8px', letterSpacing: '-1.5px' }}>Kitchen Intelligence</h1>
                    <p style={{ color: theme.textMuted, fontSize: '16px', fontWeight: '500' }}>Real-time performance metrics and financial telemetry.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <select
                        value={timeframe}
                        onChange={e => setTimeframe(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="TODAY">Last 24 Hours</option>
                        <option value="WEEK">Last 7 Days</option>
                        <option value="MONTH">Monthly Overview</option>
                    </select>
                    <Button label="Export Financial Data" variant="secondary" icon="📥" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <StatCard title="Gross Revenue" value={`GHS ${metrics.revenue?.toLocaleString() || '0.00'}`} icon="💰" color={theme.success} trend={12.5} />
                <StatCard title="Avg Basket Value" value={`GHS ${metrics.avgValue.toFixed(2)}`} icon="📊" color={theme.primary} trend={-2.1} />
                <StatCard title="Total Volume" value={metrics.orders} icon="📦" color={theme.accent} trend={8.4} />
                <StatCard title="Kitchen Success" value={`${metrics.successRate}%`} icon="🎯" color="#6366F1" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
                <Card title="REVENUE FLOW (DAILY SATELLITE)">
                    <div style={{ height: '350px', display: 'flex', alignItems: 'flex-end', gap: '24px', padding: '20px 10px' }}>
                        {salesTrend.length > 0 ? salesTrend.map((d, i) => {
                             const max = Math.max(...salesTrend.map(t => t.amount), 1);
                             const height = (d.amount / max) * 100;
                             return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    <div style={{
                                        width: '100%',
                                        background: `linear-gradient(to top, ${theme.primary}40, ${theme.primary})`,
                                        height: `${Math.max(height, 5)}%`,
                                        borderRadius: '12px 12px 4px 4px',
                                        transition: 'height 1s cubic-bezier(0.16, 1, 0.3, 1)',
                                        boxShadow: `0 4px 20px ${theme.primary}20`
                                    }} />
                                    <span style={{ marginTop: '16px', fontSize: '12px', fontWeight: '800', color: theme.textMuted }}>{d.day}</span>
                                </div>
                             );
                        }) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted }}>Insufficient trend data</div>}
                    </div>
                </Card>

                <Card title="PLATINUM MENU ITEMS">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats?.popular_items?.map((item, i) => {
                            const menuItem = menu.find(m => m.item_id === item.id);
                            return (
                                <div key={i} style={popularItemRow}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={rankBadge(i)}>{i+1}</div>
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '15px' }}>{menuItem?.name || 'Unknown Item'}</div>
                                            <div style={{ fontSize: '12px', color: theme.textMuted }}>{item.count} units distributed</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '900', color: theme.primary }}>GHS {menuItem?.price || '0.00'}</div>
                                </div>
                            );
                        })}
                        {(!stats?.popular_items || stats.popular_items.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
                                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📡</div>
                                <div style={{ fontWeight: '700' }}>Awaiting Market Traction</div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                <Card title="CUSTOMER SENTIMENT">
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                        <div style={{ fontSize: '64px', fontWeight: '900', color: theme.warning, letterSpacing: '-2px' }}>4.9</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '16px', fontSize: '20px' }}>
                            {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: theme.warning }}>{s}</span>)}
                        </div>
                        <Badge status="READY_FOR_PICKUP" label="TOP RATED KITCHEN" />
                    </div>
                </Card>

                <Card title="OPERATIONAL EFFICIENCY">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <EfficiencyRow label="Order Prep Precision" value="98.2%" />
                        <EfficiencyRow label="Logistics Handover" value="3.8m" />
                        <EfficiencyRow label="Inventory Health" value="Optimal" />
                    </div>
                </Card>

                <Card title="DISTRIBUTION STATUS">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <OutcomeStat label="COMPLETED" value={stats?.completed_count || 0} color={theme.success} />
                        <OutcomeStat label="CANCELLED" value={stats?.cancelled_count || 0} color={theme.danger} />
                        <OutcomeStat label="ACTIVE" value={stats?.active_order_count || 0} color={theme.accent} />
                        <OutcomeStat label="PENDING" value={orders?.filter(o => o.status === 'PLACED').length || 0} color={theme.primary} />
                    </div>
                </Card>
            </div>
        </div>
    );
};

const selectStyle = { padding: '12px 20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.glassBorder}`, color: theme.text, fontSize: '14px', fontWeight: '800', outline: 'none', cursor: 'pointer' };
const popularItemRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: `1px solid ${theme.glassBorder}` };
const rankBadge = (i) => ({ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: i === 0 ? theme.primary : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: i === 0 ? '#000' : theme.text, fontSize: '14px' });
const EfficiencyRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: `1px solid ${theme.glassBorder}` }}>
        <span style={{ fontSize: '14px', color: theme.textMuted, fontWeight: '600' }}>{label}</span>
        <span style={{ fontSize: '15px', fontWeight: '900', color: theme.text }}>{value}</span>
    </div>
);
const OutcomeStat = ({ label, value, color }) => (
    <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.glassBorder}`, textAlign: 'center' }}>
        <div style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '20px', fontWeight: '900', color }}>{value}</div>
    </div>
);

export default SalesReports;
