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
                <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                    I'm a backend developer who builds scalable systems that Fortune 500 companies rely on. Over the past 4 years,
                    I've architected microservices in Java and Go and designed cloud solutions on AWS that handle millions of requests.
                    I specialize in turning complex business challenges into robust, maintainable code that performs under pressure.
                </p>
                <div className="flex justify-center space-x-4">
                    <button
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded font-medium transition relative
                        overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(59, 130, 246, 0.3)] hover:from-blue-500 hover:to-cyan-500 cursor-pointer
                        focus:outline-none touch-manipulation"
                        onClick={() => {
                            document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        View Projects
                    </button>

                    <button
                        className="border border-transparent bg-gradient-to-r from-blue-600/70 to-cyan-600/70 p-[1px] rounded hover:-translate-y-0.5 transition-all duration-200
                         hover:shadow-[0_0_15px_rgba(59, 130, 246, 0.2)] hover:from-blue-500/70 hover:to-cyan-500/70 cursor-pointer focus:outline-none touch-manipulation"
                        onClick={() => {
                            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        <span className="flex w-full bg-[#0a0a0a] text-gray-300 rounded py-3 px-6 font-medium hover:text-white transition-colors">
                            Contact Me
                        </span>
                    </button>
                </div>
            </div>
            </RevealOnScroll>
        </section>
    );
}
