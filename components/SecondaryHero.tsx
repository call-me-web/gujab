import React, { useState } from 'react';
import { Article, User } from '../types';

interface SecondaryHeroProps {
  article: Article;
  onLike: (id: string) => void;
  currentUser: User | null;
  viewerId: string;
}

export const SecondaryHero: React.FC<SecondaryHeroProps> = ({ article, onLike, currentUser, viewerId }) => {
  const [downloading, setDownloading] = useState(false);
  const isLiked = Array.isArray(article.liked_by) ? article.liked_by.includes(viewerId) : false;
  const likeCount = Array.isArray(article.liked_by) ? article.liked_by.length : 0;
  const isInternalImage = article.image && article.image.includes('supabase');

  const REDACTED_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20width%3D%22600%22%20height%3D%22400%22%20fill%3D%22%23e5e2d9%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%22580%22%20height%3D%22380%22%20fill%3D%22none%22%20stroke%3D%22%231a1a1a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M0%200L600%20400M600%200L0%20400%22%20stroke%3D%22%231a1a1a%22%20stroke-width%3D%221%22%20opacity%3D%220.1%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22monospace%22%20font-size%3D%2224%22%20fill%3D%22%231a1a1a%22%20font-weight%3D%22bold%22%3EIMAGE%20REDACTED%3C%2Ftext%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2260%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22monospace%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%3E(Evidence%20Missing)%3C%2Ftext%3E%3C%2Fsvg%3E";

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloading(true);
    const element = document.getElementById(`secondary-card-${article.id}`);
    if (element) {
      // Dynamic import
      const { toJpeg } = await import('html-to-image');

      // OPTIMIZED CONFIG
      const config = {
        quality: 0.6,
        backgroundColor: '#f1efe9',
        cacheBust: true,
        pixelRatio: 1.0,
        skipAutoScale: true
      };

      try {
        const dataUrl = await toJpeg(element, config);
        downloadImage(dataUrl);
      } catch (error) {
        console.warn('Standard print failed. Retrying Text-Only...', error);
        try {
          const { toJpeg } = await import('html-to-image');
          const dataUrl = await toJpeg(element, {
            ...config,
            filter: (node) => node.nodeName !== 'IMG'
          });
          downloadImage(dataUrl);
          alert('External image restricted. Downloading "Text-Only" Edition.');
        } catch (retryError) {
          console.error('Download failed', retryError);
          alert('The ink ran dry. System Error.');
        }
      }
    }
    setDownloading(false);
  };

  const downloadImage = (dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `Gujab-Post-${article.id.substring(0, 6)}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <article id={`secondary-card-${article.id}`} className="h-full flex flex-col bg-[#f1efe9] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4">
      {/* Publisher Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
        <h2 className="font-masthead text-2xl leading-none">Gujab</h2>
        <div className="flex flex-col items-end">
          <span className="font-sans-condensed text-[9px] font-bold uppercase tracking-widest text-red-800">Trending Wire</span>
          <span className="font-secret text-[9px] text-gray-400">{article.date}</span>
        </div>
      </div>

      <div className="mb-2">
        <span className="font-sans-condensed text-[10px] uppercase font-bold text-white bg-black px-2 py-0.5">
          {article.category}
        </span>
      </div>

      {article.image && (
        <div className="border-2 border-black mb-4">
          <img
            crossOrigin={isInternalImage ? "anonymous" : undefined}
            src={article.image}
            alt={article.headline}
            onError={(e) => { (e.target as HTMLImageElement).src = REDACTED_IMAGE; }}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <h3 className="font-headline font-bold text-3xl mb-3 leading-tight text-balance">
        {article.headline}
      </h3>
      <p className="font-secret text-xs text-gray-600 mb-4">
        Source: {article.author}
      </p>

      <div className="mt-auto">
        <div className="flex justify-between items-center pt-3 border-t-2 border-black mb-1">
          <div className="flex flex-col">
            <span className="font-sans-condensed text-[9px] font-bold uppercase tracking-widest text-gray-500">Read more at</span>
            <span className="font-sans-condensed text-xs font-bold uppercase">gujab.news</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={() => onLike(article.id)}
              className={`h-8 px-2 flex items-center gap-1 border-2 border-black transition-colors active:scale-95 ${isLiked
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-black hover:text-white'
                }`}
            >
              <svg
                key={`sec-like-${isLiked}`}
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${isLiked ? 'animate-like-bounce' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span className="font-bold text-xs">{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};