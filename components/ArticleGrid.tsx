import React, { useState, useEffect } from 'react';
import { Article, User } from '../types';
import { CompactShareCard } from './CompactShareCard';

interface ArticleGridProps {
  articles: Article[];
  onLike: (id: string) => void;
  currentUser: User | null;
  viewerId: string;
  onViewArticle: (id: string) => void;
  onViewProfile?: (userId: string) => void;
}

export const ArticleGrid: React.FC<ArticleGridProps> = ({ articles, onLike, currentUser, viewerId, onViewArticle, onViewProfile }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // State to track which article is currently being prepared for "Print" (render hidden card)
  const [printableArticle, setPrintableArticle] = useState<Article | null>(null);

  const REDACTED_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20width%3D%22600%22%20height%3D%22400%22%20fill%3D%22%23e5e2d9%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%22580%22%20height%3D%22380%22%20fill%3D%22none%22%20stroke%3D%22%231a1a1a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M0%200L600%20400M600%200L0%20400%22%20stroke%3D%22%231a1a1a%22%20stroke-width%3D%221%22%20opacity%3D%220.1%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22monospace%22%20font-size%3D%2224%22%20fill%3D%22%231a1a1a%22%20font-weight%3D%22bold%22%3EIMAGE%20REDACTED%3C%2Ftext%3E%3C%2Fsvg%3E";

  const handleDownloadClick = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    setDownloadingId(article.id);
    setPrintableArticle(article);
  };

  useEffect(() => {
    if (printableArticle) {
      const capture = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        const element = document.getElementById('grid-compact-print');
        if (element) {
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
            downloadImage(dataUrl, printableArticle.id);
          } catch (error) {
            try {
              const { toJpeg } = await import('html-to-image');
              const dataUrl = await toJpeg(element, { ...config, filter: (node) => node.nodeName !== 'IMG' });
              downloadImage(dataUrl, printableArticle.id);
              alert('External image restricted. Downloading "Text-Only" Edition.');
            } catch (retryError: any) {
              alert(`The ink ran dry. System Error: ${retryError.message || 'Unknown'}`);
            }
          }
        }
        setDownloadingId(null);
        setPrintableArticle(null);
      };
      capture();
    }
  }, [printableArticle]);

  const downloadImage = (dataUrl: string, id: string) => {
    const link = document.createElement('a');
    link.download = `Gujab-Card-${id.substring(0, 8)}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <>
      {printableArticle && (
        <CompactShareCard article={printableArticle} elementId="grid-compact-print" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article, index) => {
          const isLiked = Array.isArray(article.liked_by) ? article.liked_by.includes(viewerId) : false;
          const likeCount = Array.isArray(article.liked_by) ? article.liked_by.length : 0;
          const isArt = article.category === 'Creative Art';
          const isInternalImage = article.image && article.image.includes('supabase');
          const animDelay = `${Math.min(index * 150, 1000)}ms`;

          // Display only the first 3 tags as viral hashtags
          const hashtags = article.tags ? article.tags.slice(0, 3) : [];

          return (
            <article
              key={article.id}
              id={`article-card-${article.id}`}
              style={{ animationDelay: animDelay }}
              className="flex flex-col bg-[#f1efe9] border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] lg:hover:-translate-y-2 lg:hover:-rotate-1 transition-all duration-300 relative animate-news-pop group origin-top active:scale-[0.99] lg:active:scale-100"
            >
              <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-3">
                <h2 className="font-masthead text-3xl leading-none pt-1">Gujab</h2>
                <div className="flex flex-col items-end">
                  <span className="font-sans-condensed text-[10px] font-bold uppercase tracking-widest text-gray-500">Official News</span>
                  <span className="font-secret text-[10px] text-gray-400">{article.date}</span>
                </div>
              </div>

              {article.image && (
                <div
                  onClick={() => onViewArticle(article.id)}
                  className="w-full mb-3 cursor-pointer overflow-hidden border-2 border-black relative group/image"
                >
                  <span className={`absolute top-0 left-0 px-2 py-1 font-sans-condensed text-[10px] font-bold uppercase tracking-widest text-white z-10 border-r-2 border-b-2 border-black ${isArt ? 'bg-purple-900' : 'bg-red-800'}`}>
                    {article.category}
                  </span>

                  <img
                    crossOrigin={isInternalImage ? "anonymous" : undefined}
                    src={article.image}
                    alt={article.headline}
                    onError={(e) => { (e.target as HTMLImageElement).src = REDACTED_IMAGE; }}
                    className={`w-full object-cover transition-transform duration-700 lg:group-hover/image:scale-110 animate-photo-develop ${isArt ? 'aspect-[3/4]' : 'aspect-video'}`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              )}

              {!article.image && (
                <div className="mb-2">
                  <span className={`inline-block px-2 py-0.5 border border-black font-sans-condensed text-[10px] font-bold uppercase tracking-widest mb-2 ${isArt ? 'text-purple-900' : 'text-red-800'}`}>
                    {article.category}
                  </span>
                </div>
              )}

              <h3
                onClick={() => onViewArticle(article.id)}
                className="font-headline font-bold text-2xl mb-2 leading-[1.1] text-gray-900 cursor-pointer hover:text-red-800 transition-colors">
                {article.headline}
              </h3>

              <div className="font-body text-sm leading-relaxed text-gray-800 mb-4 border-l-2 border-gray-300 pl-3">
                <p className="line-clamp-3">{article.subhead || article.content}</p>
                {hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {hashtags.map((tag, i) => (
                      <span key={i} className="text-[10px] font-sans-condensed font-bold uppercase text-blue-800 bg-blue-100 px-1">
                        #{tag.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-3 border-t-2 border-black flex justify-between items-center gap-2">
                <div className="flex flex-col shrink-0">
                  <span className="font-secret text-[9px] text-gray-500">By
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewProfile && onViewProfile(article.user_id); }}
                      className="font-bold ml-1 hover:underline hover:text-red-800"
                    >
                      {article.author}
                    </button>
                  </span>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDownloadClick(e, article)}
                    disabled={downloadingId === article.id}
                    className="w-7 h-7 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] active:scale-90 transform"
                  >
                    {downloadingId === article.id ? (
                      <span className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full block"></span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => onLike(article.id)}
                    className={`h-7 px-2 flex items-center gap-1.5 border-2 border-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] active:scale-90 transform ${isLiked
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-black hover:text-white'
                      }`}
                  >
                    <svg
                      key={`like-icon-${isLiked}`}
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-3.5 w-3.5 flex-shrink-0 ${isLiked ? 'animate-like-bounce' : ''}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span className="font-sans-condensed font-bold text-xs pt-0.5 min-w-[12px] text-center">{likeCount}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
};