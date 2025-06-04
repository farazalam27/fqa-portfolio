import {RevealOnScroll} from "../RevealOnScroll.jsx";

export const Projects = () => {
    return (
        <section id="projects" className="min-h-screen flex items-center justify-center py-20"
        >
            <RevealOnScroll>
            <div className="max-w-5xl mx-auto px-4">
                <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent text-center"
                >
                    Featured Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl border border-white/10 hover:-translate-y-1 hover:border-blue-500/30
                                    hover:shadow-[0_2px_8px_rgba(59, 130, 246, 0.1)] transition-all"
                    >
                        <h3 className="text-xl font-bold mb-2">AltCaps</h3>
                        <p className="text-gray-400 mb-4">
                            AltCaps is a minimalist iMessage extension that instantly converts any text into
                            alternating-caps for playful trolling. With a sleek dark interface, one-tap “Paste” and
                            “Transform & Add” buttons, it seamlessly injects stylized text into your chats—no extra apps
                            required.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {["Swift", "iOS", "Xcode"].map((tech, key) => (
                                <span
                                    key={key}
                                    className="bg-blue-500/10 text-blue-500 py-1 px-3 rounded-full text-sm hover:bg-blue-500/20
                                                    hover:shadow-[0_2px_8px_rgba(59, 130, 246, 0.1)] transition"
                                >
                                        {tech}
                                </span>
                            ))}
                        </div>

                        <div className="flex justify-between items-center">
                            <a
                                href="https://apps.apple.com/us/app/altcaps/id6745569694?uo=2"
                                target="_blank"
                                className="text-blue-400 hover:text-blue-300 transition-colors my-4 cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.open("https://apps.apple.com/us/app/altcaps/id6745569694?uo=2", "_blank");
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    window.open("https://apps.apple.com/us/app/altcaps/id6745569694?uo=2", "_blank");
                                }}
                            >
                                    View Extension
                            </a>
                        </div>
                    </div>

                    <div className="p-6 rounded-xl border border-white/10 hover:-translate-y-1 hover:border-blue-500/30
                                    hover:shadow-[0_2px_8px_rgba(59, 130, 246, 0.1)] transition-all"
                    >
                        <h3 className="text-xl font-bold mb-2">Project 2</h3>
                        <p className="text-gray-400 mb-4">
                            More coming soon!
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {["Java", "Spring Boot", "AWS", "Docker"].map((tech, key) => (
                                <span
                                    key={key}
                                    className="bg-blue-500/10 text-blue-500 py-1 px-3 rounded-full text-sm hover:bg-blue-500/20
                                                    hover:shadow-[0_2px_8px_rgba(59, 130, 246, 0.1)] transition"
                                >
                                        {tech}
                                </span>
                            ))}
                        </div>

                        <div className="flex justify-between items-center">
                            <a
                                href="#"
                                className="text-blue-400 hover:text-blue-300 transition-colors my-4 cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // This is a placeholder link, so we'll just prevent the default action
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    // This is a placeholder link, so we'll just prevent the default action
                                }}
                            >
                                View Project
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            </RevealOnScroll>
        </section>
    )
}
