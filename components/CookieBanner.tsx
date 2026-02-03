import React, { useState, useEffect } from 'react';

interface CookieBannerProps {
  message: string;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ message }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    // Check the specific content of the last dismissed message
    const lastDismissed = sessionStorage.getItem('gujab_last_dismissed_notice');

    // Only show if there is a message AND it is different from the one previously dismissed
    if (message !== lastDismissed) {
      // Subtle delay for appearance
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message]);

  const handleDismiss = () => {
    setVisible(false);
    // Store this specific message as dismissed for the session
    sessionStorage.setItem('gujab_last_dismissed_notice', message);
  };

  if (!visible || !message) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto animate-in slide-in-from-bottom duration-700 fade-in">
        <div className="bg-[#1a1a1a] text-[#f1efe9] border-t-4 border-red-800 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">

          {/* Decorative Grain Overlay */}
          {/* Fix: Moved complex background SVG string into a style attribute to avoid JSX quote nesting conflicts which caused parsing errors. */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
          ></div>

          {/* Decorative 'Tape' Label */}
          <div className="absolute -top-2 left-8 bg-red-800 text-white px-6 py-1 font-sans-condensed font-bold uppercase text-[10px] tracking-[0.3em] transform -rotate-2 shadow-md z-10">
            Mandatory Dispatch
          </div>

          <div className="flex flex-col md:flex-row items-center p-6 pt-10 gap-6 relative z-10">
            {/* Icon */}
            <div className="hidden md:flex items-center justify-center w-12 h-12 bg-white/10 rounded-full text-2xl">
              📢
            </div>

            <div className="flex-1 text-center md:text-left">
              <h4 className="font-sans-condensed font-bold uppercase text-xs text-red-500 tracking-widest mb-1">Editor's Public Notice</h4>
              <p className="font-secret text-sm md:text-base leading-relaxed text-gray-300">
                {message}
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="group relative whitespace-nowrap bg-white text-black px-8 py-3 font-sans-condensed font-bold uppercase hover:bg-red-800 hover:text-white transition-all text-xs tracking-[0.2em] border-2 border-black active:translate-y-1"
            >
              Acknowledge
            </button>
          </div>

          {/* Bottom decorative border */}
          <div className="h-1.5 bg-gradient-to-r from-red-800 via-red-900 to-red-800 w-full"></div>
        </div>
      </div>
    </div>
  );
};
