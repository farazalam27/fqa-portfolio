import { RevealOnScroll } from "../RevealOnScroll";
import type { JSX } from 'react';

export const About = (): JSX.Element => {
    const frontendSkills: string[] = ["React", "TypeScript", "JavaScript", "Tailwind CSS", "Next.js"];
    const backendSkills: string[] = ["Spring Boot", "Java", "Python", "Golang", "Kotlin", "SQL", "AWS", "PostgreSQL", "MongoDB",
                                    "Docker", "Postman", "Maven", "Gradle"];

    return (
        <section id="about" className="min-h-screen flex items-center justify-center py-20"
        >
            <RevealOnScroll>
            <div className="max-w-3xl mx-auto px-4">
                <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent text-center">
                    About Me
                </h2>

                <div className="rounded-xl p-8 border-white/10 border hover:-translate-y-1 transition-all">
                    <p className="text-gray-300 mb-6">
                        Here are some of the technologies I regularly work with as well as my education and work experience.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-xl p-6 hover:-translate-y-1 transition-all">
                            <h3 className="text-xl font-bold mb-4">Frontend</h3>
                            <div className="flex flex-wrap gap-2">
                                {frontendSkills.map((tech, key) => (
                                    <span
                                        key={key}
                                        className="bg-blue-500/10 text-blue-500 py-1 px-3 rounded-full text-sm hover:bg-blue-500/20
                                                    hover:shadow-[0_2px_8px_rgba(59, 130, 246, 0.2)] transition"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl p-6 hover:-translate-y-1 transition-all">
                            <h3 className="text-xl font-bold mb-4">Backend</h3>
                            <div className="flex flex-wrap gap-2">
                                {backendSkills.map((tech, key) => (
                                    <span
                                        key={key}
                                        className="bg-blue-500/10 text-blue-500 py-1 px-3 rounded-full text-sm hover:bg-blue-500/20
                                                    hover:shadow-[0_2px_8px_rgba(59, 130, 246, 0.2)] transition"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 mt-8">
                    <div className="p-6 rounded-xl border-white/10 border hover:-translate-y-1 transition-all">
                        <h3 className="text-xl font-bold mb-4"> 📚 Education </h3>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>
                                <strong> B.S. in Computer Engineering </strong> - Virginia Tech 2020
                            </li>
                            <li>
                                Relevant Coursework: Data Structures, Algorithms, Operating Systems, Databases
                            </li>
                        </ul>
                    </div>
                    <div className="p-6 rounded-xl border-white/10 border hover:-translate-y-1 transition-all">
                        <h3 className="text-xl font-bold mb-4"> 💼 Work Experience </h3>
                        <div className="space-y-4 text-gray-300">
                            <div>
                                <h4 className="font-semibold">
                                    Software Engineer at CapTech (2020 - 2023)
                                </h4>
                                <ul className={ "list-disc list-inside space-y-2" } >
                                    <li>
                                        Delivered high-impact solutions for Fortune 500 clients across energy, finance,
                                        sports, and hospitality sectors
                                    </li>
                                    <li>
                                        Modernized Java microservices and APIs for a major gas transmission company
                                    </li>
                                    <li>
                                        Developed performance-optimized Go services for a leading banking card provider
                                    </li>
                                    <li>
                                        Enhanced PGA Tour's Shotlander application with Kotlin optimizations
                                    </li>
                                    <li>
                                        Implemented secure facial recognition features using AWS services and TensorFlow
                                        for a hospitality giant
                                    </li>
                                    <li>
                                        Leveraged diverse technologies including Spring Boot, MongoDB, PostgreSQL, and
                                        AWS to create reliable, scalable solutions
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </RevealOnScroll>
        </section>
    );
};