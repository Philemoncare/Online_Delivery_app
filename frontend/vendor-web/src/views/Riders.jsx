import React, { useState, useEffect } from 'react';
import { restaurantApi, authApi } from '../api';
import { theme, Card, Button, Input } from '../components/UI';

const Riders = ({ riders, restaurantId, onRefresh }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [allRiders, setAllRiders] = useState([]); // In a real app, this would be a search
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // For simulation, we'll just show some available riders
        // In reality, vendors would search by phone/email
    }, []);

    const handleAddRider = async (e) => {
        e.preventDefault();
        const riderId = e.target.riderId.value;
        if (!riderId) return;
        setLoading(true);
        try {
            await restaurantApi.addRider(restaurantId, riderId);
            onRefresh();
            setShowAddModal(false);
        } catch (e) {
            alert("Failed to add rider. Verify the ID is correct.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>Your Delivery Team</h2>
                    <p style={{ margin: '4px 0 0 0', color: theme.textMuted, fontWeight: '600' }}>Manage the riders assigned to your kitchen</p>
                </div>
                <Button label="Register New Rider" onClick={() => setShowAddModal(true)} icon="🛵" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {riders.map(rider => (
                    <Card key={rider.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '16px', backgroundColor: theme.primary,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
                            }}>🛵</div>
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: '800' }}>Rider ID: {rider.rider_id.substring(0, 8)}...</div>
                                <div style={{ fontSize: '12px', color: theme.textMuted, fontWeight: '700' }}>Joined {new Date(rider.joined_at).toLocaleDateString()}</div>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <div style={{
                                    padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '900',
                                    backgroundColor: rider.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: rider.status === 'ACTIVE' ? '#10B981' : '#EF4444'
                                }}>
                                    {rider.status}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${theme.glassBorder}` }}>
                                <div style={{ fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', fontWeight: '800' }}>Deliveries</div>
                                <div style={{ fontSize: '18px', fontWeight: '900' }}>142</div>
                            </div>
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${theme.glassBorder}` }}>
                                <div style={{ fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', fontWeight: '800' }}>Rating</div>
                                <div style={{ fontSize: '18px', fontWeight: '900' }}>4.9 ⭐</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button
                                label={rider.status === 'ACTIVE' ? "Suspend" : "Activate"}
                                onClick={() => restaurantApi.updateRiderStatus(restaurantId, rider.rider_id, rider.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE').then(onRefresh)}
                                variant="secondary"
                                style={{ flex: 1 }}
                            />
                            <Button label="Track Live" variant="primary" style={{ flex: 1 }} />
                        </div>
                    </Card>
                ))}
            </div>

            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '400px', padding: '32px', backgroundColor: theme.secondary, borderRadius: '32px', border: `1px solid ${theme.glassBorder}` }} className="glass-card">
                        <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>Add Rider to Team</h3>
                        <p style={{ color: theme.textMuted, marginBottom: '24px', fontWeight: '600' }}>Enter the unique Rider ID to assign them to your kitchen.</p>
                        <form onSubmit={handleAddRider}>
                            <Input name="riderId" label="Rider UUID" placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" required />
                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <Button label="Cancel" onClick={() => setShowAddModal(false)} variant="secondary" style={{ flex: 1 }} />
                                <Button label={loading ? "Verifying..." : "Add to Team"} type="submit" style={{ flex: 1 }} disabled={loading} />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Riders;
