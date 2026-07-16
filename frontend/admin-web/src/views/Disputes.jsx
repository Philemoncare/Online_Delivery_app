import React from 'react';
import { Card, Table, Badge, Button, theme } from '../components/UI';
import { orderApi } from '../api';

const Disputes = ({ disputes, onRefresh }) => {

    const handleResolve = async (id) => {
        if (window.confirm("Mark this dispute as RESOLVED?")) {
            try {
                await orderApi.resolveDispute(id);
                onRefresh();
            } catch (e) {
                alert("Failed to resolve dispute");
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease' }}>
            <div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Dispute Resolution</h1>
                <p style={{ color: theme.textMuted, margin: 0, fontWeight: '600' }}>Manage customer complaints and ticket resolution</p>
            </div>

            <Card>
                <Table
                    headers={['Ticket Reference', 'Affected Order', 'Issue Category', 'Current State', 'Created On', 'Actions']}
                    data={disputes}
                    renderRow={(d) => (
                        <tr key={d.dispute_id}>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: '900', color: theme.primary, fontSize: '13px' }}>#{d.dispute_id.substring(0,8)}</div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: '700' }}>Order #{d.order_id.substring(0,8)}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted }}>Ref ID: {d.order_id}</div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: '700', fontSize: '14px' }}>{d.reason}</div>
                                <div style={{ fontSize: '12px', color: theme.textMuted }}>{d.description || 'No additional details provided.'}</div>
                            </td>
                            <td style={tdStyle}><Badge status={d.status} /></td>
                            <td style={tdStyle}>
                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{new Date(d.created_at).toLocaleDateString()}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted }}>{new Date(d.created_at).toLocaleTimeString()}</div>
                            </td>
                            <td style={tdStyle}>
                                {d.status === 'OPEN' ? (
                                    <Button
                                        label="Resolve Ticket"
                                        variant="primary"
                                        style={{ padding: '8px 16px', fontSize: '12px' }}
                                        onClick={() => handleResolve(d.dispute_id)}
                                        icon="✅"
                                    />
                                ) : (
                                    <span style={{ color: theme.success, fontWeight: '800', fontSize: '12px' }}>CLOSED</span>
                                )}
                            </td>
                        </tr>
                    )}
                />
            </Card>
        </div>
    );
};

const tdStyle = { padding: '20px 24px', verticalAlign: 'middle' };

export default Disputes;
