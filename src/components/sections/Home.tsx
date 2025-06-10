import React from "react";
import type { JSX } from 'react';
import { RevealOnScroll } from "../RevealOnScroll";

export const Home = (): JSX.Element => {
    return (
        <section
            id="home"
            className="min-h-screen flex items-center justify-center relative"
        >
            <RevealOnScroll>
            <div className="text-center z-10 px-4">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r  from-blue-500 to-cyan-400 bg-clip-text text-transparent leading-right">
                    Hi, I'm Faraz
                </h1>
                <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
                    I'm a Full Stack Developer with a strong focus on backend development.
                    My preferred tech stack includes Java, Spring Boot, AWS, and PostgreSQL,
                    and I enjoy building scalable, reliable systems that power modern web applications.
                </p>
                <div className="flex justify-center space-x-4">
                    <button
                        className="bg-blue-500 text-white py-3 px-6 rounded font-medium transition relative
                        overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(59, 130, 246, 0.4)] cursor-pointer
                        focus:outline-none touch-manipulation"
                        onClick={() => {
                            document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        View Projects
                    </button>

                    <button
                        className="border border-blue-500/50 text-blue-500 py-3 px-6 rounded font-medium transition-all duration-200
                         hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(59, 130, 246, 0.2)] hover:bg-blue-500/10 cursor-pointer
                         focus:outline-none touch-manipulation"
                        onClick={() => {
                            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        Contact Me
                    </button>
                </div>
            </div>
            </RevealOnScroll>
        </section>
    );
}
