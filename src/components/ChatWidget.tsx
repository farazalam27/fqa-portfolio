import { useState } from 'react';
import type { JSX } from 'react';
import ChatWindow from './ChatWindow';

export default function ChatWidget(): JSX.Element {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <>
            <div className={`chat-widget ${open ? 'open' : ''}`}>
                <div className="chat-window-wrapper">
                    <ChatWindow className="chat-window" onClose={() => setOpen(false)} />
                </div>
                <button 
                    className="chat-bubble" 
                    onClick={() => setOpen(true)}
                >
                    💬
                </button>
            </div>
        </>
    );
}