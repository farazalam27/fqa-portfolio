import { useState } from 'react';

export default function ChatWindow({ onClose, className }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hey! I'm Faraz's assistant. Ask me anything about him." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const newMessages = [...messages, { role: 'user', content: input }];
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

            const data = await res.json();
            setMessages([...newMessages, { role: 'assistant', content: data.response }]);
        } catch (err) {
            console.error("Error fetching response:", err);
            setMessages([...newMessages, {
                role: 'assistant',
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
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}