import React, { useState } from 'react';
import { Article, User } from '../types';
import { SocialShareCard } from './SocialShareCard';

interface HeroArticleProps {
  articles: Article[];
  onLike: (id: string) => void;
  currentUser: User | null;
  viewerId: string;
  onViewArticle: (id: string) => void;
  onViewProfile?: (userId: string) => void;
}

export const HeroArticle: React.FC<HeroArticleProps> = ({ articles, onLike, currentUser, viewerId, onViewArticle, onViewProfile }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const REDACTED_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20width%3D%22600%22%20height%3D%22400%22%20fill%3D%22%23e5e2d9%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%22580%22%20height%3D%22380%22%20fill%3D%22none%22%20stroke%3D%22%231a1a1a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M0%200L600%20400M600%200L0%20400%22%20stroke%3D%22%231a1a1a%22%20stroke-width%3D%221%22%20opacity%3D%220.1%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22monospace%22%20font-size%3D%2224%22%20fill%3D%22%231a1a1a%22%20font-weight%3D%22bold%22%3EIMAGE%20REDACTED%3C%2Ftext%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2260%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22monospace%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%3E(Evidence%20Missing)%3C%2Ftext%3E%3C%2Fsvg%3E";

  const handleDownload = async (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    setDownloadingId(articleId);
    
    // Slight delay to ensure element is fully painted/ready if it was hidden
    await new Promise(resolve => setTimeout(resolve, 50));

    // Target the hidden social card instead of the visible card
    const element = document.getElementById(`social-print-${articleId}`);
    
    if (element) {
        // Dynamic import to save bundle size
        const { toJpeg } = await import('html-to-image');

        // OPTIMIZED CONFIG
        const config = { 
            quality: 0.6, // Speed optimization
            backgroundColor: '#f1efe9',
            cacheBust: true,
            pixelRatio: 1.0, 
            skipAutoScale: true, // Speed optimization
            style: { opacity: '1', transform: 'scale(1)' } // Override hidden styles
        };

        try {
            const dataUrl = await toJpeg(element, config);
            downloadImage(dataUrl, articleId);
        } catch (error) {
            console.warn('Standard print failed. Retrying Text-Only...', error);
            try {
                const dataUrl = await toJpeg(element, {
                    ...config,
                    filter: (node) => node.nodeName !== 'IMG'
                });
                downloadImage(dataUrl, articleId);
                alert('External image restricted. Downloading "Text-Only" Edition.');
            } catch (retryError) {
                console.error('Download failed', retryError);
                alert('The ink ran dry. System Error.');
            }
        }
    }
    setDownloadingId(null);
  };

  const downloadImage = (dataUrl: string, id: string) => {
    const link = document.createElement('a');
    link.download = `Gujab-Story-${id.substring(0,8)}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const getHeroBadge = (article: Article) => {
      const now = Date.now();
      const created = article.created_at ? Date.parse(article.created_at) : (article.date ? Date.parse(article.date) : now);
      const hoursOld = (now - created) / 3600000;

      if (hoursOld < 24) return { text: "Daily Viral", color: "bg-red-800" };
      if (hoursOld < 168) return { text: "Weekly Champion", color: "bg-black" }; // 7 days
      return { text: "Monthly Legend", color: "bg-blue-900" };
  };

  if (articles.length === 0) return null;

  const mainArticle = articles[0];
  const sideArticles = articles.slice(1, 4); 
  
  const isLiked = (article: Article) => Array.isArray(article.liked_by) ? article.liked_by.includes(viewerId) : false;
  const getLikeCount = (article: Article) => Array.isArray(article.liked_by) ? article.liked_by.length : 0;
  
  const isMainArt = mainArticle.category === 'Creative Art';
  const isMainInternal = mainArticle.image && mainArticle.image.includes('supabase');
  
  const heroBadge = getHeroBadge(mainArticle);

  return (
    <section className="mb-12 border-b-4 border-black pb-8">
      {/* Hidden Social Card for Main Article - With Top Story Badge */}
      <SocialShareCard 
        article={mainArticle} 
        elementId={`social-print-${mainArticle.id}`} 
        isTopStory={true} 
      />
      
      {/* Hidden Social Cards for Sidebar Articles */}
      {sideArticles.map(a => (
          <SocialShareCard key={a.id} article={a} elementId={`social-print-${a.id}`} />
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === MAIN HERO COLUMN === */}
        <div className="lg:col-span-8 lg:border-r-2 lg:border-black lg:pr-8">
          
          <div id={`hero-card-${mainArticle.id}`} className="bg-[#f1efe9] p-5 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] lg:hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-shadow duration-500 group"> 
            
            {/* Publisher Header */}
            <div className="flex justify-between items-end border-b-2 border-black pb-3 mb-4">
                 <h1 className="font-masthead text-4xl leading-none">Gujab</h1>
                 <div className="text-right">
                    <div className="flex flex-col items-end gap-1">
                        <span className={`block px-2 py-0.5 text-white font-sans-condensed text-xs font-bold uppercase tracking-widest ${heroBadge.color}`}>
                            {heroBadge.text}
                        </span>
                        {isMainArt && (
                             <span className="block px-2 py-0.5 bg-purple-900 text-white font-sans-condensed text-[9px] font-bold uppercase tracking-widest">
                                Gallery Spotlight
                             </span>
                        )}
                    </div>
                    <span className="font-secret text-[10px] text-gray-500 block mt-1">{mainArticle.date}</span>
                 </div>
            </div>

            <h2 
                onClick={() => onViewArticle(mainArticle.id)}
                className="font-headline font-bold text-4xl md:text-5xl leading-[0.95] mb-4 hover:opacity-80 transition-opacity cursor-pointer text-balance animate-ink-reveal origin-left">
                {mainArticle.headline}
            </h2>

            <div className="flex items-center gap-4 font-sans-condensed text-sm text-gray-600 mb-6 border-y border-gray-300 py-2">
                <span className="font-bold text-black uppercase">
                    {isMainArt ? 'Artist' : 'By'} 
                    <button onClick={() => onViewProfile && onViewProfile(mainArticle.user_id)} className="ml-1 hover:text-red-800 hover:underline">{mainArticle.author}</button>
                </span>
                <span className="text-gray-400">|</span>
                <span className="font-sans-condensed uppercase text-xs tracking-wider font-bold text-gray-500">{mainArticle.category}</span>
            </div>

            {mainArticle.image && (
                <figure className="mb-6 group cursor-pointer" onClick={() => onViewArticle(mainArticle.id)}>
                <div className={`overflow-hidden border-2 border-black relative`}>
                    <img 
                    crossOrigin={isMainInternal ? "anonymous" : undefined}
                    src={mainArticle.image} 
                    alt={mainArticle.headline}
                    onError={(e) => { (e.target as HTMLImageElement).src = REDACTED_IMAGE; }}
                    className="w-full max-h-[500px] object-cover transition-all duration-700 transform lg:group-hover:scale-105 animate-photo-develop"
                    style={{ animationDelay: '200ms' }}
                    // PERFORMANCE OPTIMIZATION: Critical image loaded eagerly
                    loading="eager"
                    fetchPriority="high"
                    />
                </div>
                <figcaption className="text-xs font-secret text-gray-500 mt-2 text-right italic border-b border-gray-200 pb-1">
                    {isMainArt ? `Featured Piece by ${mainArticle.author}` : "Fig 1.1: Evidence submitted anonymously."}
                </figcaption>
                </figure>
            )}

            <div className="flex flex-col">
                <h3 className="font-headline font-medium text-xl md:text-2xl mb-4 leading-tight text-gray-700 text-balance animate-fade-in-up opacity-0" style={{ animationDelay: '400ms' }}>
                {mainArticle.subhead}
                </h3>
                <div className="font-body text-lg text-justify leading-relaxed mb-6 first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-[-8px] first-letter:font-masthead">
                {mainArticle.content.substring(0, 350)}...
                </div>
            </div>

            {/* Footer Branding */}
            <div className="mt-4 border-t-2 border-black pt-3 flex justify-between items-center">
                 <div className="font-sans-condensed text-xs font-bold uppercase tracking-widest">
                    Read the full report at <span className="underline decoration-2 decoration-red-800">gujab.news</span>
                 </div>
                 <span className="font-secret text-xs text-gray-400">© 2025 Gujab</span>
            </div>
          </div>
            
          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4 px-1">
              <button 
                onClick={() => onViewArticle(mainArticle.id)}
                className="text-sm font-bold font-sans-condensed uppercase border-b-2 border-black pb-0.5 hover:bg-black hover:text-white transition-all active:translate-y-0.5">
                Continue Reading →
              </button>
              <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleDownload(e, mainArticle.id)}
                    disabled={downloadingId === mainArticle.id}
                    className="flex items-center gap-2 font-sans-condensed font-bold text-xs border-2 border-black px-3 h-8 bg-white hover:bg-black hover:text-white disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
                  >
                     {downloadingId === mainArticle.id ? (
                         <span className="animate-spin h-3.5 w-3.5 border-2 border-gray-500 border-t-black rounded-full block"></span>
                     ) : (
                         <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Save Story</span>
                         </>
                     )}
                  </button>
                  <button 
                    onClick={() => onLike(mainArticle.id)} 
                    className={`flex items-center gap-2 font-sans-condensed font-bold text-xs border-2 border-black px-3 h-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95 ${
                      isLiked(mainArticle)
                      ? 'bg-red-800 text-white' 
                      : 'bg-white text-black hover:bg-red-800 hover:text-white'
                    }`}
                  >
                    <svg 
                      key={`main-like-${isLiked(mainArticle)}`}
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 ${isLiked(mainArticle) ? 'animate-like-bounce' : ''}`} 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span>{getLikeCount(mainArticle)}</span>
                  </button>
              </div>
            </div>
        </div>

        {/* === SIDEBAR COLUMN === */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="border-y-4 border-double border-black py-2 text-center mb-2 animate-ink-reveal">
              <h3 className="font-sans-condensed font-bold uppercase text-lg tracking-widest">Trending Now</h3>
           </div>

           {sideArticles.map((article, index) => {
             const isSideArt = article.category === 'Creative Art';
             const isSideInternal = article.image && article.image.includes('supabase');
             const delay = `${(index + 2) * 150}ms`;

             return (
             <div 
               key={article.id} 
               id={`sidebar-card-${article.id}`} 
               style={{ animationDelay: delay }}
               className="flex flex-col border-2 border-black bg-[#f1efe9] p-4 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] lg:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all duration-300 lg:hover:-translate-y-1 animate-fade-in-up opacity-0 group active:scale-[0.99] lg:active:scale-100"
             >
               
               {/* Publisher Header Small */}
               <div className="flex justify-between items-center border-b border-black pb-1 mb-2">
                    <span className="font-masthead text-xl">Gujab</span>
                    <span className="font-sans-condensed text-[9px] uppercase font-bold text-gray-500">{article.date}</span>
               </div>
               
               {/* Index Number */}
               <span className="font-secret text-4xl font-bold text-gray-200 absolute top-8 right-2 -z-0 select-none opacity-50">
                 0{index + 2}
               </span>

               {article.image && (
                 <img 
                    crossOrigin={isSideInternal ? "anonymous" : undefined}
                    onClick={() => onViewArticle(article.id)}
                    src={article.image} 
                    alt={article.headline}
                    onError={(e) => { (e.target as HTMLImageElement).src = REDACTED_IMAGE; }}
                    className={`w-full object-cover mb-3 border border-black cursor-pointer transition-all animate-photo-develop z-10 ${isSideArt ? 'aspect-[3/4]' : 'h-32'}`}
                    // PERFORMANCE: Sidebar images lazy loaded
                    loading="lazy"
                 />
               )}
               
               <span className={`self-start font-sans-condensed text-[9px] font-bold uppercase text-white px-1 py-0.5 mb-1 z-10 ${isSideArt ? 'bg-purple-900' : 'bg-black'}`}>
                   {article.category}
               </span>

               <h4 
                 onClick={() => onViewArticle(article.id)}
                 className="font-headline font-bold text-xl leading-tight mb-2 hover:underline cursor-pointer z-10 text-gray-900">
                 {article.headline}
               </h4>
               
               <div className="flex justify-between items-end mt-2 z-10 pt-2 border-t border-gray-300 gap-2">
                 <div className="flex flex-col shrink-0">
                    <span className="font-sans-condensed text-[9px] uppercase font-bold text-gray-400">gujab.news</span>
                 </div>
                 <div className="flex gap-2 shrink-0">
                    <button 
                        onClick={(e) => handleDownload(e, article.id)}
                        disabled={downloadingId === article.id}
                        className="w-7 h-7 flex items-center justify-center border border-black bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:scale-90"
                        >
                        {downloadingId === article.id ? '...' : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        )}
                    </button>
                    <button 
                        onClick={() => onLike(article.id)} 
                        className={`h-7 px-2 flex items-center gap-1 border border-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:scale-90 ${
                            isLiked(article)
                            ? 'bg-black text-white' 
                            : 'bg-white text-black hover:bg-black hover:text-white'
                        }`}
                        >
                        <svg 
                           key={`sidebar-like-${isLiked(article)}`}
                           xmlns="http://www.w3.org/2000/svg" 
                           className={`h-3.5 w-3.5 flex-shrink-0 ${isLiked(article) ? 'animate-like-bounce' : ''}`} 
                           viewBox="0 0 20 20" 
                           fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-bold min-w-[12px] text-center">{getLikeCount(article)}</span>
                    </button>
                 </div>
               </div>
             </div>
           );
          })}
           
           <div className="mt-auto bg-gray-200 p-4 border border-black text-center animate-fade-in-up opacity-0" style={{ animationDelay: '1000ms' }}>
              <p className="font-secret text-xs mb-2">Advertisement</p>
              <p className="font-headline font-bold text-lg leading-none animate-pulse">THE ORACLE KNOWS ALL.</p>
           </div>
        </div>
      </div>
    </section>
  );
};