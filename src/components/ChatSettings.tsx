import React, { useState, useEffect } from 'react';
import { spotifyService } from '../services/spotify';
import { malService } from '../services/myanimelist';

interface ChatSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatSettings({ isOpen, onClose }: ChatSettingsProps) {
    const [spotifyConnected, setSpotifyConnected] = useState(false);
    const [malConnected, setMalConnected] = useState(false);
    const [connecting, setConnecting] = useState<'spotify' | 'mal' | null>(null);

    useEffect(() => {
        // Check authentication status on mount
        setSpotifyConnected(spotifyService.isAuthenticated());
        setMalConnected(malService.isAuthenticated());
    }, [isOpen]);

    const handleSpotifyConnect = async () => {
        setConnecting('spotify');
        try {
            const authUrl = await spotifyService.getAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Failed to start Spotify auth:', error);
            setConnecting(null);
        }
    };

    const handleMalConnect = async () => {
        setConnecting('mal');
        try {
            const authUrl = await malService.getAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Failed to start MAL auth:', error);
            setConnecting(null);
        }
    };

    const handleSpotifyDisconnect = () => {
        spotifyService.logout();
        setSpotifyConnected(false);
    };

    const handleMalDisconnect = () => {
        malService.logout();
        setMalConnected(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">API Connections</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Spotify Connection */}
                    <div className="border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">🎵</span>
                                <div>
                                    <h3 className="text-white font-semibold">Spotify</h3>
                                    <p className="text-gray-400 text-sm">
                                        {spotifyConnected 
                                            ? 'Connected - I can see what you\'re listening to!'
                                            : 'Connect to share your music taste'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                        {spotifyConnected ? (
                            <button
                                onClick={handleSpotifyDisconnect}
                                className="w-full mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                                Disconnect
                            </button>
                        ) : (
                            <button
                                onClick={handleSpotifyConnect}
                                disabled={connecting === 'spotify'}
                                className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {connecting === 'spotify' ? 'Connecting...' : 'Connect Spotify'}
                            </button>
                        )}
                    </div>

                    {/* MyAnimeList Connection */}
                    <div className="border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">📺</span>
                                <div>
                                    <h3 className="text-white font-semibold">MyAnimeList</h3>
                                    <p className="text-gray-400 text-sm">
                                        {malConnected 
                                            ? 'Connected - I can see your anime list!'
                                            : 'Connect to share your anime preferences'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                        {malConnected ? (
                            <button
                                onClick={handleMalDisconnect}
                                className="w-full mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                                Disconnect
                            </button>
                        ) : (
                            <button
                                onClick={handleMalConnect}
                                disabled={connecting === 'mal'}
                                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {connecting === 'mal' ? 'Connecting...' : 'Connect MyAnimeList'}
                            </button>
                        )}
                    </div>

                    {/* Reddit Info */}
                    <div className="border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🏴‍☠️</span>
                            <div>
                                <h3 className="text-white font-semibold">Reddit (r/OnePiece)</h3>
                                <p className="text-gray-400 text-sm">
                                    No connection needed - I can fetch the latest theories anytime!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                    <p className="text-gray-300 text-sm">
                        <strong>Privacy Note:</strong> Your data is only used during this session. 
                        Tokens are stored locally and never sent to any server except the official APIs.
                    </p>
                </div>
            </div>
        </div>
    );
}