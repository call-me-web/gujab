import React, { useState, useEffect } from 'react';
import { Page, Article, Album, User } from '../types';
import { supabase } from '../services/supabaseClient';
import { ArticleGrid } from './ArticleGrid';

interface BookViewProps {
  bookId: string;
  setPage: (page: Page) => void;
  onLike: (id: string) => void;
  onViewArticle: (id: string) => void;
  currentUser: User | null;
  viewerId: string;
}

export const BookView: React.FC<BookViewProps> = ({ bookId, setPage, onLike, onViewArticle, currentUser, viewerId }) => {
  const [book, setBook] = useState<Album | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        // Fetch Album
        const { data: albumData } = await supabase.from('albums').select('*').eq('id', bookId).single();
        if (albumData) {
            setBook(albumData as Album);
            // Fetch Articles in Album
            const { data: articlesData } = await supabase.from('articles')
                .select('*')
                .eq('album_id', bookId)
                .order('created_at', { ascending: false });
            if (articlesData) setArticles(articlesData as Article[]);
        }
        setLoading(false);
    };
    fetchData();
  }, [bookId]);

  const handleLocalLike = (id: string) => {
    // 1. Call parent to execute DB toggle and global state update
    onLike(id);
    
    // 2. Optimistically update local state so the UI reflects the change immediately
    setArticles(prevArticles => prevArticles.map(article => {
        if (article.id !== id) return article;
        
        const likes = article.liked_by || [];
        const isLiked = likes.includes(viewerId);
        
        // Toggle viewerId in the liked_by array
        const newLikes = isLiked 
            ? likes.filter(uid => uid !== viewerId) 
            : [...likes, viewerId];
            
        return { ...article, liked_by: newLikes };
    }));
  };

  if (loading) {
      return <div className="py-32 text-center font-secret animate-pulse">Retrieving portfolio from the archives...</div>;
  }

  if (!book) {
      return (
          <div className="py-32 text-center">
              <h2 className="font-headline font-bold text-4xl mb-4">404: Book Not Found</h2>
              <button onClick={() => setPage(Page.HOME)} className="font-sans-condensed uppercase font-bold underline">Return Home</button>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
            <button onClick={() => setPage(Page.HOME)} className="font-sans-condensed uppercase text-xs font-bold hover:underline">
                &larr; Back to Front Page
            </button>
        </div>

        {/* BOOK HEADER HERO */}
        <div className="bg-[#1a1a1a] text-[#f1efe9] p-8 md:p-12 mb-12 border-4 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,0.3)] relative overflow-hidden">
             {/* Background Cover Blur */}
             {book.cover_image && (
                 <div 
                    className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center mix-blend-overlay"
                    style={{ backgroundImage: `url(${book.cover_image})` }}
                 ></div>
             )}
             
             <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-end">
                 {/* Cover Image */}
                 {book.cover_image && (
                     <div className="shrink-0 w-48 h-64 border-4 border-[#f1efe9] shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-black rotate-[-2deg]">
                         <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                     </div>
                 )}
                 
                 <div className="flex-grow text-center md:text-left">
                     <span className="bg-red-800 text-white px-3 py-1 font-sans-condensed font-bold uppercase text-xs tracking-widest inline-block mb-3">
                         Portfolio Collection
                     </span>
                     <h1 className="font-headline font-bold text-6xl md:text-8xl leading-none mb-4">{book.title}</h1>
                     <p className="font-secret text-lg opacity-80 max-w-2xl">{book.description || "A curated collection of stories from the Gujab wire."}</p>
                 </div>

                 <div className="shrink-0 text-center md:text-right border-t md:border-t-0 md:border-l border-gray-600 pt-4 md:pl-6 md:pt-0">
                     <span className="block font-sans-condensed font-bold uppercase text-4xl">{articles.length}</span>
                     <span className="block font-secret text-xs uppercase tracking-widest opacity-60">Stories</span>
                 </div>
             </div>
        </div>

        {/* ARTICLES GRID */}
        {articles.length > 0 ? (
            <div>
                 <div className="flex items-center gap-4 mb-8">
                     <h3 className="font-headline font-bold text-3xl uppercase italic">Table of Contents</h3>
                     <div className="h-[2px] bg-black flex-grow"></div>
                 </div>
                 <ArticleGrid 
                    articles={articles} 
                    onLike={handleLocalLike} 
                    currentUser={currentUser} 
                    onViewArticle={onViewArticle} 
                    viewerId={viewerId} 
                 />
            </div>
        ) : (
            <div className="py-20 text-center border-4 border-dashed border-gray-300">
                <p className="font-secret text-xl text-gray-400">"This book has no pages yet."</p>
            </div>
        )}
    </div>
  );
};