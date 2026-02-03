import React from 'react';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-[#f1efe9] z-[9999] flex flex-col items-center justify-center p-4">
            <div className="max-w-md text-center">
                {/* Mechanical Stamping Animation */}
                <div className="relative mb-8">
                    <h1 className="font-masthead text-7xl md:text-9xl relative z-10 animate-[ink-reveal_1s_ease-in-out_forwards]">
                        Gujab
                    </h1>
                    {/* The Stamp Mechanism Shadow */}
                    <div className="absolute top-0 left-0 w-full h-full bg-black/10 blur-sm transform scale-110 z-0 animate-[stamp-slam_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]"></div>
                </div>

                <style>{`
            @keyframes stamp-slam {
                0% { opacity: 0; transform: scale(2); }
                70% { opacity: 1; transform: scale(0.9); }
                100% { opacity: 0; transform: scale(1.1); }
            }
            @keyframes ink-reveal {
                0% { opacity: 0; filter: blur(10px); color: #444; }
                50% { opacity: 0.5; }
                100% { opacity: 1; filter: blur(0px); color: #1a1a1a; }
            }
            @keyframes typewriter {
                from { width: 0; }
                to { width: 100%; }
            }
            @keyframes blink {
                50% { border-color: transparent; }
            }
        `}</style>

                <div className="border-t-2 border-b-2 border-black py-2 inline-block">
                    <p className="font-sans-condensed uppercase tracking-[0.3em] text-sm font-bold">
                        Early Edition
                    </p>
                </div>

                <div className="mt-8 font-secret text-sm text-gray-600 flex justify-center">
                    <span className="inline-block overflow-hidden whitespace-nowrap border-r-2 border-black animate-[typewriter_2s_steps(40,end),blink_0.75s_step-end_infinite]" style={{ maxWidth: '24ch' }}>
                        Warming up the presses...
                    </span>
                </div>
            </div>
        </div>
    );
};