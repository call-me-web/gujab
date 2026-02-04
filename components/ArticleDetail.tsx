import React, { useState, useEffect } from 'react';
import { Article, User, Album } from '../types';
import { SocialShareCard } from './SocialShareCard';
import { supabase } from '../services/supabaseClient';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
  onLike: (id: string) => void;
  currentUser: User | null;
  viewerId: string;
  onViewProfile?: (userId: string) => void;
  onViewBook?: (bookId: string) => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack, onLike, currentUser, viewerId, onViewProfile, onViewBook }) => {
  const [downloading, setDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [book, setBook] = useState<Album | null>(null);

  const isLiked = Array.isArray(article.liked_by) ? article.liked_by.includes(viewerId) : false;
  const likeCount = Array.isArray(article.liked_by) ? article.liked_by.length : 0;
  const isArt = article.category === 'Creative Art';
  const isInternalImage = article.image && article.image.includes('supabase');

  useEffect(() => {
    if (article.album_id) {
      const fetchAlbum = async () => {
        const { data } = await supabase.from('albums').select('*').eq('id', article.album_id).single();
        if (data) setBook(data as Album);
      };
      fetchAlbum();
    }
  }, [article.album_id]);

  const goToBook = () => {
    if (book && onViewBook) {
      onViewBook(book.id);
    }
  };

  const wordCount = article.content.split(/\s+/).length;
  let colClass = '';

  if (wordCount >= 100) {
    colClass = 'md:columns-2 text-lg md:text-xl leading-relaxed gap-8 md:gap-12';
  } else {
    colClass = 'columns-1 text-2xl leading-loose max-w-3xl mx-auto';
  }

  const REDACTED_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20width%3D%22600%22%20height%3D%22400%22%20fill%3D%22%23e5e2d9%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22monospace%22%20font-size%3D%2224%22%20fill%3D%22%231a1a1a%22%20font-weight%3D%22bold%22%3EIMAGE%20REDACTED%3C%2Ftext%3E%3C%2Fsvg%3E";

  const handleDownload = async () => {
    setDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    const element = document.getElementById(`social-print-detail-${article.id}`);

    if (element) {
      if (article.image) {
        await new Promise((resolve) => {
          const img = new Image();
          img.src = article.image!;
          img.crossOrigin = isInternalImage ? "anonymous" : null;
          if (img.complete) resolve(true);
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
      }
      const { toJpeg } = await import('html-to-image');
      const config = {
        quality: 0.6,
        backgroundColor: '#f1efe9',
        cacheBust: true,
        pixelRatio: 1.0,
        skipAutoScale: true,
        style: { opacity: '1', transform: 'scale(1)' }
      };
      try {
        const dataUrl = await toJpeg(element, config);
        downloadImage(dataUrl);
      } catch (error) {
        try {
          const dataUrl = await toJpeg(element, { ...config, filter: (node) => node.nodeName !== 'IMG' });
          downloadImage(dataUrl);
          alert('External image restricted. Downloading "Text-Only" Edition.');
        } catch (retryError) {
          alert('The ink ran dry. System Error (Check Console).');
        }
      }
    }
    setDownloading(false);
  };

  const downloadImage = (dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `Gujab-Full-${article.headline.substring(0, 10).replace(/[^a-z0-9]/gi, '_')}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const handleShare = (platform: string) => {
    const deepLink = `${window.location.origin}${window.location.pathname}?article=${article.id}`;
    const shareText = `Read this Gujab: "${article.headline}"`;
    const urlEncoded = encodeURIComponent(deepLink);
    const textEncoded = encodeURIComponent(shareText);
    let link = '';
    switch (platform) {
      case 'facebook': link = `https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`; break;
      case 'twitter': link = `https://twitter.com/intent/tweet?text=${textEncoded}&url=${urlEncoded}`; break;
      case 'linkedin': link = `https://www.linkedin.com/sharing/share-offsite/?url=${urlEncoded}`; break;
      case 'copy': navigator.clipboard.writeText(deepLink).then(() => alert(`Link copied: ${deepLink}`)); break;
    }
    if (link) window.open(link, '_blank', 'noopener,noreferrer');
    if (platform === 'copy') setShowShareModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in relative pb-12">
      <SocialShareCard article={article} elementId={`social-print-detail-${article.id}`} />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#f1efe9] max-w-sm w-full border-4 border-black p-8 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] relative rotate-1">
            <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
              <button
                onClick={() => setShowShareModal(false)}
                className="text-2xl font-bold leading-none hover:text-red-800 transition-colors"
              >
                &times;
              </button>
            </div>

            <h3 className="font-headline font-bold text-3xl uppercase mb-1 text-center">Distribute Wire</h3>
            <p className="font-secret text-xs text-gray-500 text-center mb-6 border-b-2 border-black pb-2">"Spread the rumor. Deny everything."</p>

            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => handleShare('copy')} className="flex items-center justify-center gap-3 bg-white border-2 border-black py-4 font-sans-condensed font-bold uppercase hover:bg-black hover:text-white transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <span className="text-lg">📋</span>
                <span>Copy Link</span>
              </button>
              <button onClick={() => handleShare('twitter')} className="flex items-center justify-center gap-3 bg-black text-white border-2 border-black py-4 font-sans-condensed font-bold uppercase hover:bg-gray-800 transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <span className="text-lg">✖</span>
                <span>Twitter / X</span>
              </button>
              <button onClick={() => handleShare('facebook')} className="flex items-center justify-center gap-3 bg-[#3b5998] text-white border-2 border-black py-4 font-sans-condensed font-bold uppercase hover:opacity-90 transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <span className="text-lg">f</span>
                <span>Facebook</span>
              </button>
              <button onClick={() => handleShare('linkedin')} className="flex items-center justify-center gap-3 bg-[#0077b5] text-white border-2 border-black py-4 font-sans-condensed font-bold uppercase hover:opacity-90 transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <span className="text-lg">in</span>
                <span>LinkedIn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex justify-between items-center">
        <button onClick={onBack} className="font-sans-condensed uppercase text-xs font-bold hover:underline">&larr; Back to Front Page</button>
        <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-2 bg-black text-white px-4 py-2 font-sans-condensed font-bold uppercase hover:bg-red-800 transition-colors disabled:opacity-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95">
          {downloading ? 'Printing...' : 'Save as Card'}
        </button>
      </div>

      {book && (
        <div
          onClick={goToBook}
          className="mb-6 bg-black text-white p-4 border-2 border-white outline outline-2 outline-black cursor-pointer hover:bg-red-900 transition-colors flex justify-between items-center group"
        >
          <div className="flex flex-col">
            <span className="font-sans-condensed font-bold uppercase text-[10px] tracking-widest text-gray-400">Featured in Portfolio</span>
            <span className="font-headline font-bold text-xl group-hover:underline decoration-white underline-offset-4">{book.title}</span>
          </div>
          <span className="font-sans-condensed font-bold uppercase text-xs border border-white px-2 py-1">View Book &rarr;</span>
        </div>
      )}

      <article id="article-detail-content" className="p-8 bg-[#f1efe9] border-[3px] border-black relative shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)]">
        <div className={`border-b-2 mb-6 pb-4 flex justify-between items-end ${isArt ? 'border-purple-900' : 'border-black'}`}>
          <div className="flex flex-col">
            <h1 className="font-masthead text-5xl leading-none mb-1 animate-ink-reveal">Gujab</h1>
            <span className="font-sans-condensed text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500">The Official Unofficial News</span>
          </div>
          <div className="text-right">
            <span className={`block px-3 py-1 text-white font-sans-condensed text-xs font-bold uppercase tracking-widest mb-1 ${isArt ? 'bg-purple-900' : 'bg-black'}`}>
              {article.category}
            </span>
            <span className="font-secret text-xs text-gray-500">{article.date}</span>
          </div>
        </div>

        <h1 className="font-headline font-bold text-4xl md:text-6xl leading-tight mb-4 text-balance animate-ink-reveal">
          {article.headline}
        </h1>

        <h2 className="font-headline font-medium text-xl mb-6 text-gray-800 text-balance leading-snug animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {article.subhead}
        </h2>

        <div className="flex items-center gap-4 font-sans-condensed text-sm text-gray-600 mb-8 border-y-2 border-gray-300 py-3">
          <span className="font-bold text-black uppercase">
            {isArt ? 'Artist' : 'Source'}:
            <button onClick={() => onViewProfile && onViewProfile(article.user_id)} className="ml-1 hover:text-red-800 hover:underline">{article.author}</button>
          </span>
          <span className="text-gray-400">|</span>
          <span className="font-secret text-xs">{article.date}</span>
        </div>

        {article.image && (
          <figure className="mb-8 group text-center">
            <div className={`inline-block overflow-hidden ${isArt ? 'border-[16px] border-white shadow-[0_20px_40px_rgba(0,0,0,0.15)] bg-white max-w-full' : 'border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] w-full'}`}>
              <img
                crossOrigin={isInternalImage ? "anonymous" : undefined}
                src={article.image}
                alt={article.headline}
                onError={(e) => { (e.target as HTMLImageElement).src = REDACTED_IMAGE; }}
                className={`animate-photo-develop ${isArt ? 'max-h-[80vh] w-auto mx-auto object-contain' : 'w-full h-auto'}`}
              />
            </div>
          </figure>
        )}

        <div className={`font-body text-justify [column-rule:1px_solid_#d1d5db] hyphens-auto ${colClass}`} style={{ columnFill: 'balance' }}>
          {article.content.split('\n').map((paragraph, idx) => (
            <p key={idx} className={`mb-4 animate-text-reveal ${idx === 0 ? 'first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-4 first-letter:mt-[-5px] first-letter:font-masthead' : ''}`}>
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags && article.tags.map((tag, i) => (
            <span key={i} className="font-sans-condensed font-bold uppercase text-[10px] bg-gray-200 text-gray-600 px-2 py-1">#{tag}</span>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mt-12 pt-6 border-t-4 border-double border-black gap-4">
          <div className="flex flex-col">
            <span className="font-sans-condensed font-bold uppercase text-xs tracking-widest">Read more at <span className="underline decoration-2 decoration-red-800">news.gujab9.workers.dev</span></span>
            <span className="font-secret text-[10px] text-gray-500 mt-1">© {new Date().getFullYear()} Gujab Corp.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="group flex items-center gap-2 font-sans-condensed font-bold text-xs uppercase border-2 border-black px-4 py-2 bg-white text-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none h-10 whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>

            <button
              onClick={() => onLike(article.id)}
              className={`group flex items-center gap-2 font-sans-condensed font-bold text-xs uppercase border-2 border-black px-4 py-2 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none h-10 whitespace-nowrap ${isLiked ? 'bg-red-800 text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${isLiked ? 'animate-like-bounce fill-current' : 'group-hover:animate-pulse'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};