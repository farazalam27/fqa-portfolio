import { RevealOnScroll } from "../RevealOnScroll";
import type { JSX } from 'react';

export const About = (): JSX.Element => {
    const languages: string[] = ["JavaScript", "TypeScript", "Java", "Go", "Kotlin", "Swift", "Python", "SQL"];
    const frameworks: string[] = ["React", "Next.js", "Node.js", "Express.js", "Spring Boot", "Tailwind CSS", "Bootstrap"];
    const databases: string[] = ["PostgreSQL", "MongoDB", "SQLite", "DynamoDB", "RDS"];
    const tools: string[] = ["AWS", "Lambda", "S3", "EC2", "Docker", "Kubernetes", "Jenkins", "Serverless", "Git", "Maven", "Gradle", "Postman", "JIRA"];
    const certifications: string[] = ["AWS Solutions Architect Associate", "AWS Developer Associate"];

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
                            <h3 className="text-xl font-bold mb-4">Languages</h3>
                            <div className="flex flex-wrap gap-2">
                                {languages.map((tech, key) => (
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
                            <h3 className="text-xl font-bold mb-4">Frameworks</h3>
                            <div className="flex flex-wrap gap-2">
                                {frameworks.map((tech, key) => (
                                    <span
                                        key={key}
                                        className="bg-green-500/10 text-green-500 py-1 px-3 rounded-full text-sm hover:bg-green-500/20
                                                    hover:shadow-[0_2px_8px_rgba(34, 197, 94, 0.2)] transition"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl p-6 hover:-translate-y-1 transition-all">
                            <h3 className="text-xl font-bold mb-4">Databases</h3>
                            <div className="flex flex-wrap gap-2">
                                {databases.map((tech, key) => (
                                    <span
                                        key={key}
                                        className="bg-purple-500/10 text-purple-500 py-1 px-3 rounded-full text-sm hover:bg-purple-500/20
                                                    hover:shadow-[0_2px_8px_rgba(168, 85, 247, 0.2)] transition"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl p-6 hover:-translate-y-1 transition-all">
                            <h3 className="text-xl font-bold mb-4">Tools & Cloud</h3>
                            <div className="flex flex-wrap gap-2">
                                {tools.map((tech, key) => (
                                    <span
                                        key={key}
                                        className="bg-orange-500/10 text-orange-500 py-1 px-3 rounded-full text-sm hover:bg-orange-500/20
                                                    hover:shadow-[0_2px_8px_rgba(249, 115, 22, 0.2)] transition"
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
                        <h3 className="text-xl font-bold mb-4">🎓 Education</h3>
                        <div className="text-gray-300">
                            <div className="mb-2">
                                <strong className="text-white">Bachelor of Science in Computer Engineering</strong>
                            </div>
                            <div className="text-sm text-gray-400 mb-1">Virginia Tech • Blacksburg, VA • May 2020</div>
                            <div className="text-sm text-blue-400">Dean's List</div>
                        </div>
                    </div>
                    
                    <div className="p-6 rounded-xl border-white/10 border hover:-translate-y-1 transition-all">
                        <h3 className="text-xl font-bold mb-4">🏆 Certifications</h3>
                        <div className="flex flex-wrap gap-2">
                            {certifications.map((cert, key) => (
                                <span
                                    key={key}
                                    className="bg-yellow-500/10 text-yellow-500 py-2 px-4 rounded-lg text-sm hover:bg-yellow-500/20
                                                hover:shadow-[0_2px_8px_rgba(234, 179, 8, 0.2)] transition"
                                >
                                    {cert}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 rounded-xl border-white/10 border hover:-translate-y-1 transition-all">
                        <h3 className="text-xl font-bold mb-4">💼 Work Experience</h3>
                        <div className="space-y-6 text-gray-300">
                            <div>
                                <h4 className="font-semibold text-white text-lg">Full Stack Developer</h4>
                                <div className="text-blue-400 mb-2">CapTech • Reston, VA • September 2020 - December 2023</div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h5 className="font-medium text-gray-200 mb-2">Fortune 500 Hospitality and Tourism Company</h5>
                                        <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                            <li>Built high-performance iOS application with facial recognition authentication using TensorFlow ML models</li>
                                            <li>Integrated AWS Lambda for real-time data handling and AWS SNS for remote notifications</li>
                                            <li>Implemented AWS KMS encryption to secure customer data in DynamoDB with fine-grained access control</li>
                                            <li>Applied JUnit 5 and Mockito for test-driven development (TDD) with automated test execution</li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h5 className="font-medium text-gray-200 mb-2">Fortune 500 Banking Card Company</h5>
                                        <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                            <li>Developed high-performance Go microservices for secured card platform, integrating with existing Java APIs</li>
                                            <li>Built Go handlers reducing latency by up to 20% through optimized API interactions</li>
                                            <li>Leveraged Goqu for PostgreSQL database queries and seamless data retrieval</li>
                                            <li>Implemented Jenkins and Maven pipelines for automated builds, testing, and deployments</li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h5 className="font-medium text-gray-200 mb-2">PGA Tour</h5>
                                        <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                            <li>Developed and optimized Kotlin-based API endpoints for PGA Tour Shotlander application</li>
                                            <li>Refactored Java endpoints to Kotlin, improving code safety and reliability</li>
                                            <li>Monitored PostgreSQL database modifications using pgAdmin for seamless backend integration</li>
                                            <li>Used Postman and Cucumber for rigorous API testing with Gradle for build automation</li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h5 className="font-medium text-gray-200 mb-2">Fortune 500 Gas Transmission & Storage Company</h5>
                                        <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                            <li>Upgraded and migrated backend Java APIs to support transition to new platform</li>
                                            <li>Refactored and modernized Java-based microservices using Spring Boot</li>
                                            <li>Implemented MongoDB for efficient data storage, retrieval, and management</li>
                                            <li>Applied JUnit 5 and Mockito for test-driven development (TDD) with automated test execution</li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h5 className="font-medium text-gray-200 mb-2">Fortune 100 Hospitality and Tourism Company</h5>
                                        <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                            <li>Redesigned GRC workflows in ServiceNow to streamline audit and risk tracking processes</li>
                                            <li>Developed client-side and server-side JavaScript scripts to automate assessments</li>
                                            <li>Enhanced PDF generation functionality using ServiceNow's scripting APIs</li>
                                            <li>Implemented automated email notifications for compliance updates and milestone alerts</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </RevealOnScroll>
        </section>
    );
};