import React, { useState } from 'react';
import { Article } from '../types';

interface SocialShareCardProps {
    article: Article;
    elementId: string;
    isTopStory?: boolean;
}

export const SocialShareCard: React.FC<SocialShareCardProps> = ({ article, elementId, isTopStory = false }) => {
    const REDACTED_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20width%3D%22600%22%20height%3D%22400%22%20fill%3D%22%23e5e2d9%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22monospace%22%20font-size%3D%2224%22%20fill%3D%22%231a1a1a%22%20font-weight%3D%22bold%22%3EIMAGE%20REDACTED%3C%2Ftext%3E%3C%2Fsvg%3E";
    const isInternalImage = article.image && article.image.includes('supabase');
    const isArt = article.category === 'Creative Art';
    const textureSvg = "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E";

    // Calculate layout strategy
    const wordCount = article.content.split(/\s+/).length;

    // LOGIC UPDATED: Increase font sizes to fill space better

    let cols = 1;
    let fontSizeClass = 'text-[38px] leading-relaxed'; // Default large

    if (wordCount >= 600) {
        cols = 3;
        fontSizeClass = 'text-[22px] leading-snug'; // Was 18px
    } else if (wordCount >= 300) {
        cols = 3;
        fontSizeClass = 'text-[24px] leading-snug'; // Was 20px
    } else if (wordCount >= 100) {
        cols = 2;
        fontSizeClass = 'text-[28px] leading-relaxed'; // Was 24px
    } else {
        // < 100 words
        cols = 1;
        fontSizeClass = 'text-[42px] leading-[1.6]'; // Was 36px
    }

    return (
        <div
            id={elementId}
            // FIXED: Use fixed/opacity method to prevent white page downloads while hiding form user
            className="fixed top-0 left-0 z-[-50] opacity-0 bg-[#f1efe9] text-[#1a1a1a] p-12 border-[20px] border-black flex flex-col box-border pointer-events-none"
            style={{
                width: '1080px',
                height: '1350px', // Standard 4:5 Portrait Ratio
            }}
        >
            {/* Texture Overlay (Optimized: Data URI) */}
            <div
                className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply"
                style={{ backgroundImage: `url("${textureSvg}")` }}
            ></div>

            {/* Top Story Stamp */}
            {isTopStory && (
                <div className="absolute top-12 right-12 border-[6px] border-red-800 px-6 py-2 -rotate-12 bg-white/90 z-20 shadow-[8px_8px_0px_0px_rgba(153,27,27,0.4)]">
                    <span className="font-sans-condensed font-black uppercase text-4xl tracking-widest text-red-800">
                        Top Story
                    </span>
                </div>
            )}

            {/* --- HEADER --- */}
            <div className="border-b-[6px] border-black pb-6 mb-6 shrink-0 relative z-10">
                <div className="flex justify-between items-end mb-4">
                    <h1 className="font-masthead text-[140px] leading-[0.8] tracking-tighter">Gujab</h1>
                    <div className="text-right">
                        <div className={`inline-block px-4 py-1 text-white font-sans-condensed text-2xl font-bold uppercase tracking-widest mb-2 ${isArt ? 'bg-purple-900' : 'bg-red-800'}`}>
                            {article.category}
                        </div>
                        <p className="font-secret text-2xl text-gray-600">{article.date}</p>
                    </div>
                </div>
                <div className="w-full h-[4px] bg-black mb-1"></div>
                <div className="w-full h-[1px] bg-black"></div>
            </div>

            {/* --- CONTENT AREA (Fills Remaining Height) --- */}
            <div className="flex-grow overflow-hidden relative flex flex-col z-10">

                {/* Headlines Block */}
                <div className="mb-6 shrink-0">
                    <h2 className="font-headline font-bold text-[70px] leading-[0.9] mb-4 text-balance tracking-tight">
                        {article.headline}
                    </h2>
                    {article.subhead && (
                        <h3 className="font-headline font-medium text-4xl mb-4 text-gray-700 leading-tight">
                            {article.subhead}
                        </h3>
                    )}
                    <div className="flex items-center gap-6 font-sans-condensed text-2xl text-gray-600 border-y-2 border-gray-400 py-3">
                        <span className="font-bold text-black uppercase">{isArt ? 'Artist' : 'By'} {article.author}</span>
                        <span>•</span>
                        <span className="font-secret">Gujab Verified Dispatch</span>
                    </div>
                </div>

                {/* Image Block (Conditional) */}
                {article.image && (
                    <div className="mb-8 shrink-0 relative">
                        <div className="border-[6px] border-black bg-gray-200">
                            <img
                                crossOrigin={isInternalImage ? "anonymous" : undefined}
                                src={article.image}
                                alt={article.headline}
                                onError={(e) => { (e.target as HTMLImageElement).src = REDACTED_IMAGE; }}
                                className="w-full h-auto max-h-[500px] object-cover block grayscale-0 mix-blend-multiply"
                            />
                        </div>
                        {/* Caption sits below image outside the border container */}
                        <div className="mt-2 text-right">
                            <p className="font-secret text-xl text-gray-800 italic pr-2 border-b-2 border-gray-400 inline-block pb-1">
                                Fig 1.0: {isArt ? 'Artistic Interpretation' : 'Evidence Attached'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Text Columns - Flex Grow to fill space */}
                <div
                    className={`font-body text-justify flex-grow h-full hyphens-auto ${fontSizeClass}`}
                    style={{
                        columnCount: cols,
                        columnGap: '50px',
                        columnRule: '2px solid #ccc',
                        height: '100%', // Force height to fill container
                        alignContent: 'start',
                        columnFill: 'balance'
                    }}
                >
                    {article.content.split('\n').map((para, i) => (
                        <p key={i} className="mb-6 indent-8 break-inside-avoid relative">
                            {i === 0 && (
                                <span className="float-left text-[110px] h-[85px] leading-[0.8] font-masthead mr-4 mt-2 text-black flex items-center justify-center overflow-visible">
                                    {para.charAt(0)}
                                </span>
                            )}
                            {i === 0 ? para.substring(1) : para}
                        </p>
                    ))}
                    {/* End Mark */}
                    <div className="flex justify-center mt-4 break-inside-avoid">
                        <span className="font-bold text-2xl tracking-[1em] text-black">###</span>
                    </div>
                </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="mt-4 pt-6 border-t-[6px] border-black text-center shrink-0 z-10 bg-[#f1efe9]">
                <p className="font-sans-condensed font-bold uppercase text-3xl tracking-[0.2em] mb-2">
                    Read the full story at <span className="underline decoration-red-800">news.gujab9.workers.dev</span>
                </p>
                <p className="font-secret text-xl text-gray-500">
                    © {new Date().getFullYear()} Gujab Corp. Warning: Contents may be fabricated.
                </p>
            </div>
        </div>
    );
};