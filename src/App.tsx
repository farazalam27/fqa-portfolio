import { useState } from 'react';
import type { JSX } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { MobileMenu } from './components/MobileMenu';
import { Home } from './components/sections/Home';
import { About } from './components/sections/About';
import { Projects } from './components/sections/Projects';
import { Contact } from "./components/sections/Contact";
import ChatWidget from './components/ChatWidget';
import OAuthCallback from './components/OAuthCallback';
import "./index.css";

function App(): JSX.Element {
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    
    // Check if this is an OAuth callback
    const pathname = window.location.pathname;
    const isSpotifyCallback = pathname === '/spotify-callback';
    const isMALCallback = pathname === '/mal-callback';
    
    // Handle OAuth callbacks
    if (isSpotifyCallback) {
        return <OAuthCallback service="spotify" />;
    }
    
    if (isMALCallback) {
        return <OAuthCallback service="mal" />;
    }
    
    return (
        <>
            {!isLoaded && <LoadingScreen onComplete={() => setIsLoaded(true)}/>}{" "}
            <div className={`min-h-screen transition-opacity duration-700 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
            } bg-black text-gray-100`}
            >
                <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>
                <MobileMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>
                <Home />
                <About />
                <Projects />
                <Contact />
                <ChatWidget />
            </div>
        </>
    );
}

export default App;