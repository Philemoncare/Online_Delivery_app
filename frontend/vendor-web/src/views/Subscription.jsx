import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../api';
import { theme, Card, Button } from '../components/UI';

const PlanCard = ({ plan, current, onSelect }) => (
    <Card style={{
        border: current ? `2px solid ${theme.primary}` : `1px solid ${theme.glassBorder}`,
        backgroundColor: current ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.02)',
        position: 'relative',
        transition: 'all 0.3s'
    }}>
        {current && <div style={{
            position: 'absolute', top: '12px', right: '12px',
            backgroundColor: theme.primary, color: '#000', padding: '4px 12px',
            borderRadius: '20px', fontSize: '11px', fontWeight: '900'
        }}>ACTIVE PLAN</div>}

        <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>{plan.name}</h3>
        <div style={{ fontSize: '32px', fontWeight: '900', color: theme.primary, marginBottom: '24px' }}>
            GH₵ {plan.price}<span style={{ fontSize: '14px', color: theme.textMuted }}>/{plan.period}</span>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0' }}>
            {plan.features.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '14px', color: theme.textMuted, fontWeight: '600' }}>
                    <span style={{ color: theme.primary }}>✓</span> {f}
                </li>
            ))}
        </ul>

        <Button
            label={current ? "Current Plan" : "Upgrade to " + plan.name}
            disabled={current}
            onClick={() => onSelect(plan.id)}
            style={{ width: '100%' }}
            variant={current ? "secondary" : "primary"}
        />
    </Card>
);

const Subscription = ({ activeSubscription, restaurantId, onRefresh }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const plans = [
        { id: 'WEEKLY', name: 'Starter Weekly', price: '50.00', period: 'week', features: ['Unlimited Orders', '2 Team Members', 'Basic Analytics', 'Email Support'] },
        { id: 'MONTHLY', name: 'Growth Monthly', price: '180.00', period: 'month', features: ['Unlimited Orders', '10 Team Members', 'Advanced Analytics', 'Priority Support', 'Featured Search Result'] },
        { id: 'ANNUAL', name: 'Enterprise Annual', price: '1,800.00', period: 'year', features: ['Everything in Growth', 'Unlimited Team Members', 'Custom Reports', '24/7 Account Manager', '2 Months Free'] }
    ];

    useEffect(() => {
        if (restaurantId) {
            restaurantApi.getSubscriptions(restaurantId).then(res => setHistory(res.data));
        }
    }, [restaurantId]);

    const handleSubscribe = async (planId) => {
        if (!window.confirm(`Are you sure you want to subscribe to the ${planId} plan?`)) return;
        setLoading(true);
        try {
            await restaurantApi.subscribe(restaurantId, planId);
            onRefresh();
            const res = await restaurantApi.getSubscriptions(restaurantId);
            setHistory(res.data);
        } catch (e) {
            alert("Subscription failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', marginBottom: '48px' }}>
                {plans.map(p => (
                    <PlanCard
                        key={p.id}
                        plan={p}
                        current={activeSubscription?.plan_type === p.id}
                        onSelect={handleSubscribe}
                    />
                ))}
            </div>

            <Card title="Billing & Subscription History">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${theme.glassBorder}`, textAlign: 'left' }}>
                            <th style={{ padding: '16px', color: theme.textMuted }}>Plan Type</th>
                            <th style={{ padding: '16px', color: theme.textMuted }}>Amount Paid</th>
                            <th style={{ padding: '16px', color: theme.textMuted }}>Status</th>
                            <th style={{ padding: '16px', color: theme.textMuted }}>Start Date</th>
                            <th style={{ padding: '16px', color: theme.textMuted }}>Expiry Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(sub => (
                            <tr key={sub.subscription_id} style={{ borderBottom: `1px solid ${theme.glassBorder}`, fontSize: '14px' }}>
                                <td style={{ padding: '16px', fontWeight: '800' }}>{sub.plan_type}</td>
                                <td style={{ padding: '16px', fontWeight: '700' }}>GH₵ {sub.amount}</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '900',
                                        backgroundColor: sub.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                        color: sub.status === 'ACTIVE' ? '#10B981' : theme.textMuted
                                    }}>
                                        {sub.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', color: theme.textMuted }}>{new Date(sub.start_date).toLocaleDateString()}</td>
                                <td style={{ padding: '16px', color: theme.textMuted }}>{new Date(sub.end_date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default Subscription;
