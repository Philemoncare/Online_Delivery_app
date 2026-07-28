import React, { useState } from 'react';
import { theme, Card, Button, Input } from './UI';
import { aiApi } from '../api';

const AIChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'ai', text: 'Hello Commander. I am the fDA Neural Link. How can I assist with platform operations today?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const res = await aiApi.chat(userMsg);
            setMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Connection to Neural Link interrupted. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return (
        <button
            onClick={() => setIsOpen(true)}
            style={{
                position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px',
                borderRadius: '24px', backgroundColor: theme.primary, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                boxShadow: `0 10px 30px ${theme.primary}60`, zIndex: 1000, animation: 'pulse 2s infinite'
            }}
        >
            🤖
        </button>
    );

    return (
        <div style={{
            position: 'fixed', bottom: '30px', right: '30px', width: '400px', height: '600px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '32px',
            border: `1px solid ${theme.glassBorder}`, display: 'flex', flexDirection: 'column',
            zIndex: 1000, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden'
        }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${theme.glassBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `linear-gradient(to right, ${theme.primary}20, transparent)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: theme.success, boxShadow: `0 0 10px ${theme.success}` }} />
                    <span style={{ fontWeight: '900', letterSpacing: '1px', fontSize: '14px' }}>NEURAL LINK ACTIVE</span>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((m, i) => (
                    <div key={i} style={{
                        alignSelf: m.role === 'ai' ? 'flex-start' : 'flex-end',
                        maxWidth: '85%', padding: '14px 18px', borderRadius: '20px',
                        backgroundColor: m.role === 'ai' ? 'rgba(255,255,255,0.05)' : theme.primary,
                        color: m.role === 'ai' ? theme.text : '#000',
                        fontSize: '14px', fontWeight: '600', lineHeight: '1.5',
                        borderBottomLeftRadius: m.role === 'ai' ? '4px' : '20px',
                        borderBottomRightRadius: m.role === 'user' ? '4px' : '20px'
                    }}>
                        {m.text}
                    </div>
                ))}
                {loading && <div style={{ alignSelf: 'flex-start', color: theme.textMuted, fontSize: '12px', fontStyle: 'italic' }}>Neural Link processing...</div>}
            </div>

            <form onSubmit={handleSend} style={{ padding: '24px', borderTop: `1px solid ${theme.glassBorder}` }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Inquire with the AI..."
                        style={{
                            flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.glassBorder}`,
                            borderRadius: '16px', padding: '12px 18px', color: theme.text, outline: 'none'
                        }}
                    />
                    <button type="submit" style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: theme.primary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        📡
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIChat;
