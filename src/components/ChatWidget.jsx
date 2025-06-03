import { useState } from 'react';
import ChatWindow from './ChatWindow';

export default function ChatWidget() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <ChatWindow className={open ? 'chat-window show' : 'chat-window'} onClose={() => setOpen(false)} />
            <button className="chat-bubble" onClick={() => setOpen(prev => !prev)}>
                💬
            </button>
        </>
    );
}