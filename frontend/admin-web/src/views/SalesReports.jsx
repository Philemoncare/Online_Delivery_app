import React, { useState } from 'react';
import { Card, theme, Button, Badge, Table } from '../components/UI';

const SalesReports = ({ analytics, data }) => {
    const [filter, setFilter] = useState('ALL');

    const totalRevenue = analytics?.total_revenue || 0;
    const platformEarnings = analytics?.platform_earnings || 0;
    const vendorEarnings = totalRevenue - platformEarnings;
    const avgOrderValue = analytics?.total_orders > 0 ? totalRevenue / analytics?.total_orders : 0;

    const exportCSV = () => {
        const headers = ['Ref', 'Merchant', 'Gross', 'Commission', 'Net', 'Status', 'Date'];
        const rows = data.payments.map(p => {
            const comm = p.amount * 0.1;
            const net = p.amount - comm;
            return [
                p.transaction_ref,
                data.restaurants.find(r => r.restaurant_id === data.orders.find(o => o.order_id === p.order_id)?.restaurant_id)?.name || '---',
                p.amount,
                comm,
                net,
                p.status,
                new Date(p.paid_at || Date.now()).toLocaleDateString()
            ];
        });

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Financial Intelligence</h1>
                    <p style={{ color: theme.textMuted, margin: 0, fontWeight: '600' }}>Deep dive into platform revenue and merchant performance</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button label="Export CSV" variant="secondary" onClick={exportCSV} icon="📥" />
                    <Button label="Print PDF" variant="secondary" onClick={() => window.print()} icon="🖨️" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <Card>
                    <div style={labelStyle}>Gross Merchandise Volume</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: theme.text }}>GH₵ {totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    <div style={{ fontSize: '12px', color: theme.success, marginTop: '8px', fontWeight: '800' }}>
                        <span style={{ marginRight: '4px' }}>▲</span> 12.5% vs Last Month
                    </div>
                </Card>
                <Card>
                    <div style={labelStyle}>Platform Earnings (10%)</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: theme.primary }}>GH₵ {platformEarnings.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '8px', fontWeight: '600' }}>Total Commission Accrued</div>
                </Card>
                <Card>
                    <div style={labelStyle}>Merchant Settlements</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: theme.accent }}>GH₵ {vendorEarnings.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '8px', fontWeight: '600' }}>Net payable to vendors</div>
                </Card>
                <Card>
                    <div style={labelStyle}>Unit Economics</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: theme.text }}>GH₵ {avgOrderValue.toFixed(2)}</div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '8px', fontWeight: '600' }}>Average Transaction Value</div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <Card title="Revenue Flow Trend">
                    <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '20px 10px 10px 10px' }}>
                        {analytics?.sales_trend?.length > 0 ? analytics.sales_trend.map((d, i) => {
                            const max = Math.max(...(analytics?.sales_trend || []).map(t => t.amount), 1);
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    <div
                                        style={{
                                            width: '100%',
                                            background: `linear-gradient(to top, ${theme.primary}, ${theme.accent})`,
                                            height: `${(d.amount/max)*100}%`,
                                            borderRadius: '6px 6px 0 0',
                                            minHeight: '4px',
                                            transition: 'height 0.5s ease',
                                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                                        }}
                                        title={`GH₵ ${d.amount}`}
                                    />
                                    <span style={{ marginTop: '12px', fontSize: '10px', fontWeight: '700', color: theme.textMuted }}>{d.date.split('-')[2]}</span>
                                </div>
                            );
                        }) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted }}>Insufficient historical data</div>}
                    </div>
                </Card>

                <Card title="Merchant Contribution">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {analytics?.top_restaurants?.length > 0 ? analytics.top_restaurants.map((r, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)',
                                border: `1px solid ${theme.glassBorder}`
                            }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '14px' }}>{data.restaurants.find(res => res.restaurant_id === r.id)?.name || 'Merchant'}</div>
                                    <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>{r.orders} successful orders</div>
                                </div>
                                <div style={{ fontWeight: '900', color: theme.primary, fontSize: '15px' }}>GH₵ {r.revenue.toLocaleString()}</div>
                            </div>
                        )) : <div style={{ color: theme.textMuted, textAlign: 'center', padding: '20px' }}>No revenue data</div>}
                    </div>
                </Card>
            </div>

            <Card title="Settlement Ledger">
                <Table
                    headers={['Reference', 'Merchant', 'Gross Sale', 'Comm. (10%)', 'Merchant Net', 'Status', 'Settled Date']}
                    data={data.payments.slice(0, 10)}
                    renderRow={(p) => {
                        const comm = p.amount * 0.1;
                        const net = p.amount - comm;
                        return (
                            <tr key={p.payment_id}>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${theme.glassBorder}`, display: 'inline-block' }}>
                                        {p.transaction_ref?.substring(0,12)}...
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{fontWeight: '700'}}>{data.restaurants.find(r => r.restaurant_id === data.orders.find(o => o.order_id === p.order_id)?.restaurant_id)?.name || '---'}</div>
                                </td>
                                <td style={tdStyle}><span style={{fontWeight: '800'}}>GH₵ {p.amount.toFixed(2)}</span></td>
                                <td style={tdStyle}><span style={{color: theme.danger, fontWeight: '700'}}>- GH₵ {comm.toFixed(2)}</span></td>
                                <td style={tdStyle}><span style={{color: theme.success, fontWeight: '900'}}>GH₵ {net.toFixed(2)}</span></td>
                                <td style={tdStyle}><Badge status={p.status} /></td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{new Date(p.paid_at || Date.now()).toLocaleDateString()}</div>
                                </td>
                            </tr>
                        );
                    }}
                />
            </Card>
        </div>
    );
};

const tdStyle = { padding: '20px 24px', verticalAlign: 'middle' };
const labelStyle = { fontSize: '11px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' };

export default SalesReports;
