import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { supabase } from '../services/supabaseClient';

interface DonationPageProps {
    setPage: (page: Page) => void;
}

export const DonationPage: React.FC<DonationPageProps> = ({ setPage }) => {
    const [method, setMethod] = useState<'BKASH' | 'NSAVE'>('BKASH');
    const [copied, setCopied] = useState(false);
    const [nsaveLink, setNsaveLink] = useState("https://nsave.com"); // Fallback

    const BKASH_NUMBER = "01817952012"; // Placeholder

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await supabase.from('site_config').select('value').eq('key', 'nsave_link').maybeSingle();
                if (data?.value) setNsaveLink(data.value);
            } catch (err) { console.error("Config fetch failed", err); }
        };
        fetchConfig();
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(BKASH_NUMBER);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-700">
            <div className="mb-8">
                <button onClick={() => setPage(Page.HOME)} className="font-sans-condensed uppercase text-xs font-bold hover:underline">
                    &larr; Return to Front Page
                </button>
            </div>

            <div className="bg-[#fcfbf9] border-[6px] border-double border-black p-8 md:p-12 relative shadow-[20px_20px_0px_0px_rgba(0,0,0,0.15)]">
                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-200 to-transparent pointer-events-none"></div>
                <div className="absolute top-6 right-6 border-4 border-primary px-4 py-2 rotate-12 bg-paper z-10">
                    <span className="font-sans-condensed font-black text-2xl uppercase tracking-widest text-primary">Support</span>
                </div>

                <div className="text-center mb-10 border-b-4 border-primary pb-8">
                    <h1 className="font-masthead text-6xl md:text-7xl mb-4 text-primary">Fuel The Press</h1>
                    <p className="font-secret text-xl italic text-gray-600 max-w-2xl mx-auto">
                        "Invest in the truth (or reasonably entertaining fiction). Keep the ink wet and the coffee hot."
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Sidebar / Method Selector */}
                    <div className="md:col-span-4 space-y-4">
                        <button
                            onClick={() => setMethod('BKASH')}
                            className={`w-full p-6 border-4 border-primary text-left transition-all relative overflow-hidden group ${method === 'BKASH' ? 'bg-[#e2136e] text-white' : 'bg-paper text-primary hover:bg-secondary'}`}
                        >
                            <div className="relative z-10">
                                <span className="block font-sans-condensed font-bold text-xs uppercase tracking-[0.2em] mb-1">Local Wire</span>
                                <span className="block font-headline font-bold text-3xl">bKash</span>
                            </div>
                            {method === 'BKASH' && <div className="absolute -right-4 -bottom-4 text-9xl opacity-20 font-masthead rotate-[-20deg]">B</div>}
                        </button>

                        <button
                            onClick={() => setMethod('NSAVE')}
                            className={`w-full p-6 border-4 border-primary text-left transition-all relative overflow-hidden group ${method === 'NSAVE' ? 'bg-[#c70d00] text-white' : 'bg-paper text-primary hover:bg-secondary'}`}
                        >
                            <div className="relative z-10">
                                <span className="block font-sans-condensed font-bold text-xs uppercase tracking-[0.2em] mb-1">International</span>
                                <span className="block font-headline font-bold text-3xl">nsave</span>
                            </div>
                            {method === 'NSAVE' && <div className="absolute -right-4 -bottom-4 text-9xl opacity-20 font-masthead rotate-[-20deg]">N</div>}
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="md:col-span-8">
                        <div className="h-full border-2 border-dashed border-primary/30 p-8 flex flex-col items-center justify-center text-center bg-paper relative">

                            {method === 'BKASH' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500 w-full max-w-sm">
                                    <div className="mb-6">
                                        <img
                                            src="/bkash-logo-png_seeklogo-471379.png"
                                            className="h-20 mx-auto mb-4"
                                            alt="bKash"
                                        />
                                        <h3 className="font-headline font-bold text-2xl uppercase">Personal Send Money</h3>
                                    </div>

                                    <div className="bg-secondary p-6 border-2 border-primary mb-6 relative group cursor-pointer" onClick={handleCopy}>
                                        <p className="font-sans-condensed text-[10px] uppercase font-bold text-muted mb-1">Official Number</p>
                                        <p className="font-mono text-2x font-bold tracking-wider text-primary">{BKASH_NUMBER}</p>

                                        <div className={`absolute inset-0 bg-[#e2136e]/90 flex items-center justify-center transition-opacity ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <span className="text-paper font-sans-condensed font-bold uppercase">{copied ? 'Copied!' : 'Click to Copy'}</span>
                                        </div>
                                    </div>

                                    <div className="font-secret text-sm text-gray-600 text-left space-y-2">
                                        <p><strong>1.</strong> Dial *247# or open App.</p>
                                        <p><strong>2.</strong> Select "Send Money".</p>
                                        <p><strong>3.</strong> Enter Reference: "GUJAB"</p>
                                    </div>
                                </div>
                            )}

                            {method === 'NSAVE' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500 w-full max-w-sm">
                                    <div className="mb-6">
                                        <div className="w-20 h-20  flex items-center justify-center mx-auto text-4xl mb-4 font-black">
                                            <img className='w-full h-full rounded-lg' src="/nsave.webp" alt="nsave" />
                                        </div>
                                        <h4 className="font-headline font-bold text-xl uppercase">Comming soon...</h4>
                                        <h3 className="font-headline font-bold text-2xl uppercase">Global Transfer</h3>
                                    </div>

                                    <p className="font-body text-lg mb-8 leading-relaxed">
                                        Support the press via secure international transfer using nsave.
                                    </p>

                                    <a
                                        href={nsaveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-[#c70d00] text-white border-4 border-primary py-4 font-sans-condensed font-black text-xl uppercase tracking-widest hover:bg-primary hover:text-paper transition-colors shadow-heavy active:translate-y-1 active:shadow-none"
                                    >
                                        Send Support &rarr;
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t-2 border-primary flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
                    <div className="font-secret text-xs text-muted">
                        <p>TRANSACTION ID IS NOT REQUIRED.</p>
                        <p>SUPPORT IS VOLUNTARY AND NON-REFUNDABLE.</p>
                    </div>
                    <img
                        src="/signature.svg"
                        className="h-10 opacity-30 mix-blend-multiply"
                        alt="Signature"
                    />
                </div>
            </div>
        </div>
    );
};