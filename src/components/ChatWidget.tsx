import { useState } from 'react';
import type { JSX } from 'react';
import ChatWindow from './ChatWindow';

export default function ChatWidget(): JSX.Element {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <>
            {open && <ChatWindow className="chat-window show" onClose={() => setOpen(false)} />}
            <button className="chat-bubble" onClick={() => setOpen(prev => !prev)}>
                💬
            </button>
        </>
    );
}