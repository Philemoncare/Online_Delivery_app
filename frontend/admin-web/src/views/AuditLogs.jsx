import React, { useState } from 'react';
import { Card, Table, theme, Input, Badge } from '../components/UI';

const AuditLogs = ({ logs }) => {
    const [search, setSearch] = useState('');

    const filtered = logs.filter(l =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.details?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease' }}>
            <div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-1px' }}>System Audit Logs</h1>
                <p style={{ color: theme.textMuted, margin: 0, fontWeight: '600' }}>Traceable history of all administrative and system actions</p>
            </div>

            <Card>
                <div style={{ width: '400px', marginBottom: '24px' }}>
                    <Input
                        placeholder="Filter by action or details..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ marginBottom: 0 }}
                        icon="🔍"
                    />
                </div>
                <Table
                    headers={['Event Timestamp', 'Initiator ID', 'System Action', 'Event Details']}
                    data={filtered}
                    renderRow={(log) => (
                        <tr key={log.log_id}>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: '700', fontSize: '13px' }}>{new Date(log.created_at).toLocaleDateString()}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted }}>{new Date(log.created_at).toLocaleTimeString()}</div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.primary }} />
                                    <code style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted }}>{log.user_id.substring(0,8)}...</code>
                                </div>
                            </td>
                            <td style={tdStyle}>
                                <Badge status="CONFIRMED" label={log.action} />
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>{log.details}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>Event Ref: {log.log_id}</div>
                            </td>
                        </tr>
                    )}
                />
            </Card>
        </div>
    );
};

const tdStyle = { padding: '20px 24px', verticalAlign: 'middle' };

export default AuditLogs;
