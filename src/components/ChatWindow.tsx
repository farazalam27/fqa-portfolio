import React, { useState } from 'react';
import type { JSX } from 'react';

interface ChatWindowProps {
    onClose: () => void;
    className: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ApiResponse {
    response: string;
}

export default function ChatWindow({ onClose, className }: ChatWindowProps): JSX.Element {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hey! I'm Faraz's assistant. Ask me anything about him." }
    ]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const sendMessage = async (): Promise<void> => {
        if (!input.trim()) return;
        const newMessages: Message[] = [...messages, { role: 'user' as const, content: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'mistral',
                    prompt: `You are Faraz's AI rep. Be casual, helpful, and confident. The user says: "${input}"`,
                    stream: false
                })
            });

            const data: ApiResponse = await res.json();
            setMessages([...newMessages, { role: 'assistant' as const, content: data.response }]);
        } catch (err) {
            console.error("Error fetching response:", err);
            setMessages([...newMessages, {
                role: 'assistant' as const,
                content: '⚠️ My AI brain is offline right now. Try again later when Faraz turns me back on!'
            }]);
        }
        setLoading(false);
    };

    return (
        <div className={className}>
            <div className="chat-header">
                <span>Faraz's Assistant</span>
                <button onClick={onClose}>✕</button>
            </div>
            <div className="chat-body">
                {messages.map((m, i) => (
                    <div key={i} className={'message ' + m.role}>{m.content}</div>
                ))}
                {loading && <div className="message assistant">...</div>}
            </div>
            <div className="chat-input">
                <input
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}