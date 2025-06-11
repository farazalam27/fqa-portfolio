import React, { useState, useRef, FormEvent, ChangeEvent } from "react";
import type { JSX } from 'react';
import { RevealOnScroll } from "../RevealOnScroll";
import emailjs from "emailjs-com";

interface FormData {
    name: string;
    email: string;
    message: string;
}

export const Contact = (): JSX.Element => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        message: ''
    });

    const [loading, setLoading] = useState<boolean>(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        setLoading(true);

        if (formRef.current) {
            emailjs
                .sendForm(
                    import.meta.env.VITE_SERVICE_ID,
                    import.meta.env.VITE_TEMPLATE_ID,
                    formRef.current,
                    import.meta.env.VITE_PUBLIC_KEY
                )
                .then(() => {
                    alert('Message Sent!');
                    setFormData({ name: '', email: '', message: '' });
                })
                .catch(() => {
                    alert('Oops! Something went wrong. Please try again.');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    };

    return (
        <section id="contact" className="min-h-screen w-full flex items-center justify-center py-20 px-4">
            <RevealOnScroll className="w-full max-w-screen-sm">
                <div>
                    <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent text-center">
                        Get In Touch
                    </h2>
                    <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
                        <div className="relative">
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                value={formData.name}
                                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white transition focus:outline-none focus:border-blue-500 focus:bg-blue-500/5"
                                placeholder="Name"
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                value={formData.email}
                                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white transition focus:outline-none focus:border-blue-500 focus:bg-blue-500/5"
                                placeholder="Email Address"
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <textarea
                                id="message"
                                name="message"
                                required
                                value={formData.message}
                                rows={5}
                                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white transition focus:outline-none focus:border-blue-500 focus:bg-blue-500/5"
                                placeholder="Message"
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-6 rounded font-medium transition relative overflow-hidden 
                                        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:from-blue-500 hover:to-cyan-500 cursor-pointer'}`}
                        >
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>
            </RevealOnScroll>
        </section>
    );
};