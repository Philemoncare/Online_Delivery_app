import React from 'react';
import { motion } from 'framer-motion';

export const theme = {
    primary: '#FF8A00', // Brighter orange like in WorldPlate
    secondary: '#000000',
    bg: '#000000',
    text: '#FFFFFF',
    textMuted: '#A0A0A0',
    glass: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    success: '#10B981',
    danger: '#EF4444',
    accent: '#FF4D00'
};

export const Button = ({ label, onClick, variant = 'primary', style, disabled, icon, type = 'button' }) => (
    <motion.button
        whileHover={{ y: -2, boxShadow: variant === 'primary' ? `0 15px 35px ${theme.primary}50` : '0 10px 20px rgba(0,0,0,0.3)' }}
        whileTap={{ scale: 0.98, y: 0 }}
        onClick={onClick}
        disabled={disabled}
        type={type}
        style={{
            padding: '16px 28px',
            borderRadius: '16px',
            border: variant === 'secondary' ? `1px solid ${theme.glassBorder}` : 'none',
            backgroundColor: variant === 'primary' ? theme.primary : 'rgba(255,255,255,0.06)',
            color: variant === 'primary' ? '#000' : '#FFF',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'background 0.3s, border 0.3s',
            opacity: disabled ? 0.5 : 1,
            boxShadow: variant === 'primary' ? `0 10px 30px ${theme.primary}30` : 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            ...style
        }}
    >
        {icon && <span style={{ fontSize: '18px' }}>{icon}</span>}
        {label}
    </motion.button>
);

export const Input = ({ label, type = 'text', value, onChange, placeholder, icon, required, error, style }) => (
    <div style={{ marginBottom: '24px', width: '100%', ...style }}>
        {label && (
            <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: error ? theme.danger : theme.textMuted,
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}>
                {label}
                {required && <span style={{ color: theme.primary, marginLeft: '4px' }}>*</span>}
            </label>
        )}
        <div style={{ position: 'relative' }}>
            {icon && (
                <span style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: 0.6,
                    color: error ? theme.danger : '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    transition: '0.3s'
                }}>
                    {icon}
                </span>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                style={{
                    width: '100%',
                    padding: icon ? '18px 20px 18px 56px' : '18px 24px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${error ? theme.danger : theme.glassBorder}`,
                    color: theme.text,
                    fontSize: '15px',
                    fontWeight: '500',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onFocus={e => {
                    e.target.style.borderColor = error ? theme.danger : theme.primary;
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.target.style.boxShadow = `0 0 0 4px ${error ? theme.danger : theme.primary}15`;
                }}
                onBlur={e => {
                    e.target.style.borderColor = error ? theme.danger : theme.glassBorder;
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.02)';
                    e.target.style.boxShadow = 'none';
                }}
            />
        </div>
        {error && (
            <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ color: theme.danger, fontSize: '12px', marginTop: '8px', fontWeight: '600' }}
            >
                {error}
            </motion.p>
        )}
    </div>
);

export const GlassCard = ({ children, style, onClick, noHover }) => (
    <motion.div
        onClick={onClick}
        whileHover={noHover ? {} : { y: -5, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' }}
        style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(15px)',
            borderRadius: '32px',
            border: `1px solid ${theme.glassBorder}`,
            padding: '30px',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: onClick ? 'pointer' : 'default',
            position: 'relative',
            overflow: 'hidden',
            ...style
        }}
    >
        {children}
    </motion.div>
);
