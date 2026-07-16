import React from 'react';

export const theme = {
    primary: '#F59E0B',
    primaryDark: '#D97706',
    secondary: '#0F172A',
    bg: '#0F172A',
    card: 'rgba(30, 41, 59, 0.7)',
    glassBg: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.1)',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    white: '#FFFFFF',
    accent: '#F97316'
};

export const Card = ({ children, style, title, action, onClick }) => (
    <div
        onClick={onClick}
        style={{
            backgroundColor: theme.card,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '28px',
            padding: '28px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            border: `1px solid ${theme.glassBorder}`,
            cursor: onClick ? 'pointer' : 'default',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            ...style
        }}
    >
        {(title || action) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                {title && <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: theme.text, letterSpacing: '-0.5px' }}>{title}</h3>}
                {action}
            </div>
        )}
        <div style={{ flex: 1 }}>{children}</div>
    </div>
);

export const Badge = ({ status, label }) => {
    const s = status?.toUpperCase() || 'UNKNOWN';
    const colors = {
        PLACED: { bg: 'rgba(99, 102, 241, 0.2)', text: '#6366F1', border: 'rgba(99, 102, 241, 0.3)' },
        CONFIRMED: { bg: 'rgba(139, 92, 246, 0.2)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.3)' },
        PREPARING: { bg: 'rgba(245, 158, 11, 0.2)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
        READY_FOR_PICKUP: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
        PICKED_UP: { bg: 'rgba(217, 70, 239, 0.2)', text: '#D946EF', border: 'rgba(217, 70, 239, 0.3)' },
        DELIVERED: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22C55E', border: 'rgba(34, 197, 94, 0.3)' },
        COMPLETED: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22C55E', border: 'rgba(34, 197, 94, 0.3)' },
        CANCELLED: { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' }
    }[s] || { bg: 'rgba(148, 163, 184, 0.2)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)' };

    return (
        <span style={{
            padding: '4px 14px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '900',
            backgroundColor: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase'
        }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.text }} />
            {label || s.replace(/_/g, ' ')}
        </span>
    );
};

export const Button = ({ label, onClick, variant = 'primary', style, type = 'button', disabled, icon }) => {
    const variants = {
        primary: {
            bg: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
            color: '#FFF',
            shadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
        },
        secondary: {
            bg: 'rgba(255, 255, 255, 0.05)',
            color: theme.text,
            border: `1px solid ${theme.glassBorder}`,
            shadow: 'none'
        },
        outline: {
            bg: 'transparent',
            color: theme.text,
            border: `1px solid ${theme.glassBorder}`,
            shadow: 'none'
        },
        danger: {
            bg: 'rgba(239, 68, 68, 0.1)',
            color: '#EF4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            shadow: 'none'
        }
    };
    const v = variants[variant] || variants.primary;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '12px 24px',
                borderRadius: '16px',
                border: v.border || 'none',
                background: v.bg,
                color: v.color,
                fontWeight: '800',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: disabled ? 0.5 : 1,
                boxShadow: v.shadow,
                outline: 'none',
                ...style
            }}
            onMouseOver={e => !disabled && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={e => !disabled && (e.currentTarget.style.transform = 'translateY(0)')}
        >
            {icon}
            {label}
        </button>
    );
};

export const Input = ({ label, icon, ...props }) => (
    <div style={{ marginBottom: '20px', width: '100%' }}>
        {label && <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: theme.textMuted, marginBottom: '8px', marginLeft: '4px' }}>{label}</label>}
        <div style={{ position: 'relative' }}>
            <input
                style={{
                    width: '100%',
                    padding: icon ? '14px 16px 14px 48px' : '14px 16px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${theme.glassBorder}`,
                    color: theme.text,
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s',
                }}
                onFocus={e => {
                    e.currentTarget.style.borderColor = theme.primary;
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                }}
                onBlur={e => {
                    e.currentTarget.style.borderColor = theme.glassBorder;
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                }}
                {...props}
            />
            {icon && (
                <div style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: theme.textMuted,
                    zIndex: 2,
                    pointerEvents: 'none'
                }}>
                    {icon}
                </div>
            )}
        </div>
    </div>
);
