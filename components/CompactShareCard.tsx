import React from 'react';
import { Article } from '../types';

interface CompactShareCardProps {
  article: Article;
  elementId: string;
}

export const CompactShareCard: React.FC<CompactShareCardProps> = ({ article, elementId }) => {
  const REDACTED_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20width%3D%22600%22%20height%3D%22400%22%20fill%3D%22%23e5e2d9%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22monospace%22%20font-size%3D%2224%22%20fill%3D%22%231a1a1a%22%20font-weight%3D%22bold%22%3EIMAGE%20REDACTED%3C%2Ftext%3E%3C%2Fsvg%3E";
  const isInternalImage = article.image && article.image.includes('supabase');
  const isArt = article.category === 'Creative Art';
  const textureSvg = "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E";
  
  const likeCount = Array.isArray(article.liked_by) ? article.liked_by.length : 0;

  // Adjust text clamp based on image presence to fill the card
  const lineClampClass = article.image ? 'line-clamp-[12]' : 'line-clamp-[24]';

  return (
    <div 
      id={elementId}
      className="fixed top-0 left-0 z-[-50] opacity-0 bg-[#f1efe9] border-[16px] border-black p-10 flex flex-col box-border pointer-events-none"
      style={{ 
        width: '1080px', 
        height: '1350px',
      }} 
    >
        {/* Texture Overlay (Optimized) */}
        <div 
            className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply"
            style={{ backgroundImage: `url("${textureSvg}")` }}
        ></div>

        {/* Header */}
        <div className="flex justify-between items-end border-b-[6px] border-black pb-4 mb-8 shrink-0 relative z-10">
            <h1 className="font-masthead text-[110px] leading-[0.8] mt-2 tracking-tighter">Gujab</h1>
            <div className="text-right flex flex-col items-end">
                <span className="font-sans-condensed text-2xl font-bold uppercase tracking-widest text-gray-500">Official News</span>
                <span className="font-secret text-3xl text-gray-400 mt-1">{article.date}</span>
            </div>
        </div>

        {/* Image Area */}
        {article.image ? (
            <div className="w-full h-[650px] border-[6px] border-black mb-8 relative shrink-0 bg-gray-200 z-10">
                <span className={`absolute top-0 left-0 px-6 py-3 font-sans-condensed text-3xl font-bold uppercase tracking-widest text-white z-10 border-r-[6px] border-b-[6px] border-black ${isArt ? 'bg-purple-900' : 'bg-red-800'}`}>
                    {article.category}
                </span>

                <img 
                    crossOrigin={isInternalImage ? "anonymous" : undefined}
                    src={article.image} 
                    alt={article.headline}
                    onError={(e) => { (e.target as HTMLImageElement).src = REDACTED_IMAGE; }}
                    className="w-full h-full object-cover grayscale-0 mix-blend-multiply"
                />
            </div>
        ) : (
             <div className="mb-8 shrink-0 z-10">
                <span className={`inline-block px-6 py-2 border-[6px] border-black font-sans-condensed text-3xl font-bold uppercase tracking-widest ${isArt ? 'text-purple-900' : 'text-red-800'}`}>
                    {article.category}
                </span>
            </div>
        )}

        {/* Headlines & Content */}
        <div className="flex-grow flex flex-col z-10">
            <h2 className="font-headline font-bold text-[80px] leading-[1.0] mb-6 text-balance text-gray-900 tracking-tight">
                {article.headline}
            </h2>
            
            <div className="border-l-[8px] border-gray-300 pl-8 flex-grow">
                {/* UPDATED: Increased line clamp limit */}
                <p className={`font-body text-4xl text-gray-800 leading-relaxed ${lineClampClass}`}>
                    {article.subhead || article.content}
                </p>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-[6px] border-black flex justify-between items-center shrink-0 z-10">
             <div className="flex flex-col">
                 <span className="font-secret text-2xl text-gray-500">Read the full story at</span>
                 <span className="font-sans-condensed font-bold uppercase text-4xl tracking-widest">gujab.news</span>
             </div>
             
             <div className="flex items-center gap-4 border-[6px] border-black px-8 py-3 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                 </svg>
                 <span className="font-sans-condensed font-bold text-4xl pt-1 min-w-[30px] text-center">{likeCount}</span>
             </div>
        </div>
    </div>
  );
};