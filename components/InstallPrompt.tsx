import React, { useState, useEffect } from 'react';
import { BeforeInstallPromptEvent } from '../types';

export const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            // Prevent browser's default mini-infobar
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            // Show the customized UI
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, so clearing it
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-fade-in-up">
            <div className="bg-black text-white p-4 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] border-2 border-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-sm">
                        <img src="/icon-192.png" alt="App Icon" className="w-10 h-10 object-cover" />
                    </div>
                    <div>
                        <h3 className="font-headline font-bold text-lg leading-tight">Install Gujab</h3>
                        <p className="font-body text-sm text-gray-300">Get the full app experience.</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleDismiss}
                        className="flex-1 sm:flex-none px-3 py-2 font-sans-condensed text-xs uppercase tracking-widest hover:text-red-500 transition-colors"
                    >
                        Not Now
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="flex-1 sm:flex-none bg-white text-black px-4 py-2 font-sans-condensed font-bold uppercase text-xs tracking-widest border border-white hover:bg-gray-200 transition-colors"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
};
