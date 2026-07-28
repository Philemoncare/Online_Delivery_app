import React from 'react';
import { Card, Table, Badge, theme } from '../components/UI';

const Payments = ({ payments }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease' }}>
            <div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Payment Settlements</h1>
                <p style={{ color: theme.textMuted, margin: 0, fontWeight: '600' }}>Monitor all incoming transactions and financial records</p>
            </div>

            <Card>
                <Table
                    headers={['Transaction Reference', 'Associated Order', 'Payout Amount', 'Gateway Provider', 'Settlement Status', 'Processed At']}
                    data={payments}
                    renderRow={(p) => (
                        <tr key={p.payment_id}>
                            <td style={tdStyle}>
                                <div style={{ fontSize: '11px', fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${theme.glassBorder}`, display: 'inline-block' }}>
                                    {p.transaction_ref || 'N/A'}
                                </div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: '700' }}>Order #{p.order_id.substring(0,8)}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted }}>{p.order_id}</div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: '900', color: theme.success, fontSize: '16px' }}>GH₵ {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#000' }}>{p.provider === 'MTN_MOMO' ? 'M' : 'H'}</div>
                                    <span style={{ fontWeight: '700', fontSize: '13px' }}>{p.provider.replace('_', ' ')}</span>
                                </div>
                            </td>
                            <td style={tdStyle}>
                                <Badge status={p.status} />
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: '600', fontSize: '13px' }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'Pending'}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted }}>{p.paid_at ? new Date(p.paid_at).toLocaleTimeString() : 'Awaiting Settlement'}</div>
                            </td>
                        </tr>
                    )}
                />
            </Card>
        </div>
    );
};

const tdStyle = { padding: '20px 24px', verticalAlign: 'middle' };

export default Payments;
