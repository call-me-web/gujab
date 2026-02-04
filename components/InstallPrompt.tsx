import React, { useState, useEffect } from 'react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Delay slightly for effect
      setTimeout(() => setIsVisible(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom duration-700 pointer-events-none flex justify-end">
      <div className="bg-[#fcfbf9] text-black border-4 border-black p-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-xs w-full relative pointer-events-auto transform rotate-1">
        
        {/* "Urgent" Stamp */}
        <div className="absolute -top-3 -left-3 bg-red-800 text-white px-3 py-1 font-sans-condensed font-bold uppercase text-[10px] tracking-widest border-2 border-black rotate-[-10deg] shadow-sm z-20">
            Press Pass
        </div>

        {/* Close Button */}
        <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center font-bold text-gray-400 hover:text-red-800 hover:bg-gray-100 rounded-full transition-colors z-20"
            aria-label="Close"
        >
            &times;
        </button>

        <div className="flex">
            <div className="bg-black text-white p-3 flex items-center justify-center shrink-0 w-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-20 rotate-45 transform scale-150"></div>
                <span className="font-masthead text-3xl relative z-10">G</span>
            </div>
            
            <div className="p-4 flex-grow">
                <h4 className="font-headline font-bold text-lg uppercase leading-none mb-1">Get The App</h4>
                <p className="font-secret text-[10px] text-gray-600 mb-3 leading-tight">
                    Install Gujab for instant wire access.
                </p>
                <div className="flex gap-2">
                    <button 
                        onClick={handleInstallClick}
                        className="flex-1 bg-red-800 text-white py-1.5 px-3 font-sans-condensed font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-colors border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
                    >
                        Install
                    </button>
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="px-2 py-1.5 font-sans-condensed font-bold uppercase text-[10px] text-gray-500 hover:text-black hover:underline"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};