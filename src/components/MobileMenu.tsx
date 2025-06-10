import React, { useRef, useEffect } from "react";
import type { JSX } from 'react';

interface MobileMenuProps {
    menuOpen: boolean;
    setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MobileMenu = ({ menuOpen, setMenuOpen }: MobileMenuProps): JSX.Element => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (menuRef.current && menuOpen) {
                const target = event.target as HTMLElement;
                // Close menu if clicked outside the buttons (on the backdrop)
                if (target === menuRef.current) {
                    setMenuOpen(false);
                }
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [menuOpen, setMenuOpen]);

    const handleNavClick = (sectionId: string) => {
        setMenuOpen(false);
        setTimeout(() => {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    return (
        <div 
            ref={menuRef}
            className={`fixed top-0 left-0 w-full bg-[rgba(10,10,10,0.8)] z-40 flex flex-col items-center justify-center
                         transition-all duration-300 ease-in-out
                         ${
                            menuOpen 
                                ? 'h-screen opacity-100 pointer-events-auto' 
                                : 'h-0 opacity-0 pointer-events-none'
                          }
                        `}
        >
            <button
                onClick={() => setMenuOpen(false)}
                className="absolute top-6 right-6 text-white text-3xl focus:outline-none cursor-pointer touch-manipulation"
                aria-label="Close Menu"
            >
                &times;
            </button>

            <button
                onClick={() => handleNavClick('home')}
                className={`text-2xl font-semibold text-white my-4 transform transition-transform duration-300
                            focus:outline-none cursor-pointer touch-manipulation
                            ${menuOpen 
                                ? 'opacity-100 translate-y-0' 
                                : 'opacity-0 translate-y-5'
                            }
                    `}
            >
                Home
            </button>
            <button
                onClick={() => handleNavClick('about')}
                className={`text-2xl font-semibold text-white my-4 transform transition-transform duration-300
                            focus:outline-none cursor-pointer touch-manipulation
                            ${menuOpen
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-5'
                            }
                    `}
            >
                About
            </button>
            <button
                onClick={() => handleNavClick('projects')}
                className={`text-2xl font-semibold text-white my-4 transform transition-transform duration-300
                            focus:outline-none cursor-pointer touch-manipulation
                            ${menuOpen
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-5'
                }
                    `}
            >
                Projects
            </button>
            <button
                onClick={() => handleNavClick('contact')}
                className={`text-2xl font-semibold text-white my-4 transform transition-transform duration-300
                            focus:outline-none cursor-pointer touch-manipulation
                            ${menuOpen
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-5'
                }
                    `}
            >
                Contact
            </button>
        </div>
    );
};