import React, { useEffect, useState } from 'react';
import { spotifyService } from '../services/spotify';
import { malService } from '../services/myanimelist';

type ServiceType = 'spotify' | 'mal';

interface OAuthCallbackProps {
    service: ServiceType;
}

export default function OAuthCallback({ service }: OAuthCallbackProps) {
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Processing authentication...');

    useEffect(() => {
        const handleCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');

            if (error) {
                setStatus('error');
                setMessage(`Authentication failed: ${error}`);
                return;
            }

            if (!code || !state) {
                setStatus('error');
                setMessage('Missing authentication parameters');
                return;
            }

            try {
                let success = false;
                
                switch (service) {
                    case 'spotify':
                        success = await spotifyService.handleCallback(code, state);
                        break;
                    case 'mal':
                        success = await malService.handleCallback(code, state);
                        break;
                }

                if (success) {
                    setStatus('success');
                    setMessage(`Successfully connected to ${service === 'spotify' ? 'Spotify' : 'MyAnimeList'}!`);
                    
                    // Redirect back to main page after a short delay
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                } else {
                    setStatus('error');
                    setMessage('Authentication failed. Please try again.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred during authentication');
                console.error('OAuth callback error:', error);
            }
        };

        handleCallback();
    }, [service]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl">
                <div className="mb-4">
                    {status === 'processing' && (
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto"></div>
                    )}
                    {status === 'success' && (
                        <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {status === 'error' && (
                        <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </div>
                <p className="text-white text-lg">{message}</p>
                {status === 'error' && (
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="mt-4 px-4 py-2 bg-teal-400 text-gray-900 rounded hover:bg-teal-300 transition"
                    >
                        Return to Home
                    </button>
                )}
            </div>
        </div>
    );
}