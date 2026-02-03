import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import { Masthead } from './components/Masthead';
import { Ticker } from './components/Ticker';
import { HeroArticle } from './components/HeroArticle';
import { ArticleGrid } from './components/ArticleGrid';
import { ArticleDetail } from './components/ArticleDetail';
import { CookieBanner } from './components/CookieBanner';
import { LoadingScreen } from './components/LoadingScreen';
import { OfflineScreen } from './components/OfflineScreen';
import { Page, Article, User, PublicationEdition } from './types';
import { supabase } from './services/supabaseClient';
import { organizeFrontPage, sortVault, getRandomEdition, trackInterest } from './utils/algorithms';

// Lazy Load Non-Critical Components
const ContactSection = React.lazy(() => import('./components/ContactSection').then(module => ({ default: module.ContactSection })));
const AIEditor = React.lazy(() => import('./components/AIEditor').then(module => ({ default: module.AIEditor })));
const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const Auth = React.lazy(() => import('./components/Auth').then(module => ({ default: module.Auth })));
const SearchArchive = React.lazy(() => import('./components/SearchArchive').then(module => ({ default: module.SearchArchive })));
const AboutPage = React.lazy(() => import('./components/AboutPage').then(module => ({ default: module.AboutPage })));
const PolicyPage = React.lazy(() => import('./components/PolicyPage').then(module => ({ default: module.PolicyPage })));
const BookView = React.lazy(() => import('./components/BookView').then(module => ({ default: module.BookView })));
const ProfilePage = React.lazy(() => import('./components/ProfilePage').then(module => ({ default: module.ProfilePage })));
const DonationPage = React.lazy(() => import('./components/DonationPage').then(module => ({ default: module.DonationPage })));
const InstallPrompt = React.lazy(() => import('./components/InstallPrompt').then(module => ({ default: module.InstallPrompt })));

const BATCH_SIZE = 12;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [publicNotice, setPublicNotice] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbError, setDbError] = useState(false); // New state for critical DB failures

  const [currentEdition] = useState<PublicationEdition>(() => getRandomEdition());
  const [layout, setLayout] = useState<{ heroIds: string[], trendingIds: string[], gridIds: string[] }>({
    heroIds: [], trendingIds: [], gridIds: []
  });

  const prevArticleCount = useRef(0);
  const prevEdition = useRef<PublicationEdition | null>(null);
  const [vaultSortMode, setVaultSortMode] = useState<'NOTORIETY' | 'CHRONOLOGICAL'>('NOTORIETY');
  const [vaultLayoutIds, setVaultLayoutIds] = useState<string[]>([]);
  const [viewerId, setViewerId] = useState<string>('');

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastArticleElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && isOnline && !dbError) {
        fetchArticles(articles.length);
      }
    }, { rootMargin: '200% 0px' });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, articles.length, isOnline, dbError]);

  useEffect(() => {
    const isCountChanged = articles.length !== prevArticleCount.current;
    const isEditionChanged = currentEdition !== prevEdition.current;
    if (isCountChanged || isEditionChanged || (prevArticleCount.current === 0 && articles.length > 0)) {
      const organized = organizeFrontPage(articles, currentEdition);
      setLayout({ heroIds: organized.hero.map(a => a.id), trendingIds: organized.trending.map(a => a.id), gridIds: organized.grid.map(a => a.id) });
      prevArticleCount.current = articles.length;
      prevEdition.current = currentEdition;
    }
  }, [articles, currentEdition]);

  useEffect(() => {
    if (articles.length > 0) {
      const sorted = sortVault(articles, vaultSortMode);
      setVaultLayoutIds(sorted.map(a => a.id));
    }
  }, [articles.length, vaultSortMode]);

  const heroArticle = useMemo(() => layout.heroIds.map(id => articles.find(a => a.id === id)).filter(Boolean) as Article[], [layout.heroIds, articles]);
  const topStories = useMemo(() => layout.trendingIds.map(id => articles.find(a => a.id === id)).filter(Boolean) as Article[], [layout.trendingIds, articles]);
  const gridArticles = useMemo(() => layout.gridIds.map(id => articles.find(a => a.id === id)).filter(Boolean) as Article[], [layout.gridIds, articles]);
  const sortedVaultArticles = useMemo(() => vaultLayoutIds.length > 0 ? vaultLayoutIds.map(id => articles.find(a => a.id === id)).filter(Boolean) as Article[] : sortVault(articles, vaultSortMode), [vaultLayoutIds, articles, vaultSortMode]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // SECURITY: Reset specific view states when user changes to prevent data bleeding
    setSelectedProfileId(null);
    setSelectedArticleId(null);
    setSelectedBookId(null);

    if (currentUser) {
      setViewerId(currentUser.id);
    } else {
      let anonId = localStorage.getItem('gujab_reader_id');
      if (!anonId) {
        anonId = `anon_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('gujab_reader_id', anonId);
      }
      setViewerId(anonId);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOnline) {
      const init = async () => {
        await fetchArticles(0);
        fetchNotice();
        const params = new URLSearchParams(window.location.search);
        const deepLinkId = params.get('article');
        const deepBookId = params.get('book');

        if (deepLinkId) {
          const { data } = await supabase.from('articles').select('*').eq('id', deepLinkId).single();
          if (data) {
            setArticles(prev => prev.find(a => a.id === data.id) ? prev : [data as Article, ...prev]);
            setSelectedArticleId(deepLinkId);
            setCurrentPage(Page.ARTICLE_DETAIL);
          }
        } else if (deepBookId) {
          setSelectedBookId(deepBookId);
          setCurrentPage(Page.BOOK_VIEW);
        }
      };
      init();
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => subscription?.unsubscribe();
  }, [isOnline]);

  const fetchNotice = async () => {
    try {
      const { data } = await supabase.from('announcements')
        .select('message, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setPublicNotice(data.message);
      else setPublicNotice('');
    } catch (err) { console.error("Notice Fetch Failed", err); }
  };

  const fetchArticles = async (start = 0) => {
    if (start === 0) {
      setLoading(true); setHasMore(true); setDbError(false);
      try {
        const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false }).range(0, BATCH_SIZE - 1);
        if (error) throw error;
        if (data) setArticles(data as Article[]);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        // Detect critical DB missing table error
        if (err?.code === '42P01' || err?.code === 'PGRST205' || err?.message?.includes('find the table') || err?.message?.includes('relation "public.articles" does not exist')) {
          setDbError(true);
        } else if (err?.message?.includes('fetch')) {
          setIsOnline(false);
        }
      }
      setLoading(false);
    } else {
      setLoadingMore(true);
      try {
        const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false }).range(start, start + BATCH_SIZE - 1);
        if (error) throw error;
        if (data) {
          if (data.length < BATCH_SIZE) setHasMore(false);
          setArticles(prev => {
            const ids = new Set(prev.map(a => a.id));
            return [...prev, ...(data as Article[]).filter(a => !ids.has(a.id))];
          });
        }
      } catch (err) { }
      setLoadingMore(false);
    }
  };

  const handleLike = async (id: string) => {
    const art = articles.find(a => a.id === id); if (!art) return;
    trackInterest(art.category);
    const likes = Array.isArray(art.liked_by) ? art.liked_by : [];
    const optimistic = likes.includes(viewerId) ? likes.filter(i => i !== viewerId) : [...likes, viewerId];
    setArticles(prev => prev.map(a => a.id === id ? { ...a, liked_by: optimistic } : a));
    try { await supabase.rpc('toggle_like', { article_id: id, user_id_input: viewerId }); } catch (err) {
      setArticles(prev => prev.map(a => a.id === id ? art : a));
    }
  };

  const handleViewArticle = (id: string) => {
    const art = articles.find(a => a.id === id); if (art) trackInterest(art.category);
    try { window.history.pushState({}, '', `${window.location.pathname}?article=${id}`); } catch (e) { }
    setSelectedArticleId(id);
    setCurrentPage(Page.ARTICLE_DETAIL);
  };

  const handleViewProfile = (userId: string) => {
    setSelectedProfileId(userId);
    setCurrentPage(Page.PROFILE);
  };

  const handleViewMyProfile = () => {
    setSelectedProfileId(null); // Clear specific ID so ProfilePage uses currentUser.id
    setCurrentPage(Page.PROFILE);
  };

  const handleViewBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setCurrentPage(Page.BOOK_VIEW);
    try { window.history.pushState({}, '', `${window.location.pathname}?book=${bookId}`); } catch (e) {
      // Swallow history errors in blob environments
    }
  };

  const handlePublish = async (d: Omit<Article, 'id' | 'liked_by' | 'user_id' | 'created_at'>) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('articles')
        .insert([{ ...d, user_id: currentUser.id }])
        .select();

      if (error) throw error;

      if (data) {
        setArticles(p => [data[0] as Article, ...p]);
        setCurrentPage(Page.HOME);
      }
    } catch (err: any) {
      console.error("Publish Error:", err);
      if (err?.code === '42P01' || err?.code === 'PGRST205') {
        setDbError(true); // Switch to repair screen
      }
      alert("PUBLISHING ERROR: The press jammed. " + (err.message || "Unknown Error") + ". Check your connection.");
    }
  };

  const renderContent = () => {
    // Priority 1: DB Error (Needs Setup)
    if (dbError) return <OfflineScreen isDbError={true} onRetry={() => { setDbError(false); fetchArticles(0); }} />;
    // Priority 2: Offline
    if (!isOnline) return <OfflineScreen onRetry={() => { setIsOnline(true); fetchArticles(0); }} />;

    if (loading && currentPage === Page.HOME) return <LoadingScreen />;

    const ComponentLoader = <div className="flex justify-center items-center py-20 animate-fade-in-up"><div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full"></div><span className="ml-4 font-sans-condensed font-bold uppercase tracking-widest text-sm">Accessing Wire...</span></div>;

    let content;
    switch (currentPage) {
      case Page.ARTICLE_DETAIL:
        const article = articles.find(a => a.id === selectedArticleId);
        content = !article ? <div className="py-20 text-center underline"><button onClick={() => setCurrentPage(Page.HOME)}>Back Home</button></div> : <ArticleDetail article={article} onBack={() => { setCurrentPage(Page.HOME); try { window.history.pushState({}, '', window.location.pathname); } catch (e) { } }} onLike={handleLike} currentUser={currentUser} viewerId={viewerId} onViewProfile={handleViewProfile} onViewBook={handleViewBook} />;
        break;
      case Page.BOOK_VIEW:
        content = <Suspense fallback={ComponentLoader}><BookView bookId={selectedBookId!} setPage={setCurrentPage} onLike={handleLike} onViewArticle={handleViewArticle} currentUser={currentUser} viewerId={viewerId} /></Suspense>;
        break;
      case Page.PROFILE:
        content = <Suspense fallback={ComponentLoader}><ProfilePage userId={selectedProfileId || currentUser?.id || ''} currentUser={currentUser} setPage={setCurrentPage} onLike={handleLike} onViewArticle={handleViewArticle} viewerId={viewerId} onViewProfile={handleViewProfile} onViewBook={handleViewBook} /></Suspense>;
        break;
      case Page.SEARCH:
        content = <Suspense fallback={ComponentLoader}><SearchArchive articles={articles} setPage={setCurrentPage} onLike={handleLike} onViewArticle={handleViewArticle} currentUser={currentUser} viewerId={viewerId} /></Suspense>;
        break;
      case Page.AUTH:
        content = <Suspense fallback={ComponentLoader}><Auth setPage={setCurrentPage} onAuthSuccess={() => setCurrentPage(Page.HOME)} /></Suspense>;
        break;
      case Page.DASHBOARD:
        content = <Suspense fallback={ComponentLoader}>{!currentUser ? <Auth setPage={setCurrentPage} onAuthSuccess={() => setCurrentPage(Page.DASHBOARD)} /> : <Dashboard onPublish={handlePublish} setPage={setCurrentPage} currentUser={currentUser} />}</Suspense>;
        break;
      case Page.ADMIN_DASHBOARD:
        content = <Suspense fallback={ComponentLoader}><AdminDashboard setPage={setCurrentPage} onNoticeUpdate={fetchNotice} /></Suspense>;
        break;
      case Page.CONTACT:
        content = <Suspense fallback={ComponentLoader}><ContactSection setPage={setCurrentPage} currentUser={currentUser} /></Suspense>;
        break;
      case Page.DONATE:
        content = <Suspense fallback={ComponentLoader}><DonationPage setPage={setCurrentPage} /></Suspense>;
        break;
      case Page.ABOUT:
        content = <Suspense fallback={ComponentLoader}><AboutPage setPage={setCurrentPage} /></Suspense>;
        break;
      case Page.POLICY:
        content = <Suspense fallback={ComponentLoader}><PolicyPage setPage={setCurrentPage} /></Suspense>;
        break;
      case Page.ARCHIVE:
        content = (
          <div className="max-w-6xl mx-auto px-4 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-black pb-4 mb-8"><h2 className="font-headline font-bold text-4xl">The Vault</h2><div className="flex gap-2"><button onClick={() => setVaultSortMode('NOTORIETY')} className={`px-4 py-1 text-xs border border-black ${vaultSortMode === 'NOTORIETY' ? 'bg-black text-white' : ''}`}>Viral</button><button onClick={() => setVaultSortMode('CHRONOLOGICAL')} className={`px-4 py-1 text-xs border border-black ${vaultSortMode === 'CHRONOLOGICAL' ? 'bg-black text-white' : ''}`}>Newest</button></div></div>
            <ArticleGrid articles={sortedVaultArticles} onLike={handleLike} currentUser={currentUser} onViewArticle={handleViewArticle} viewerId={viewerId} onViewProfile={handleViewProfile} />
            <div ref={lastArticleElementRef} className="h-20 w-full flex justify-center items-center">{loadingMore && <span className="animate-pulse">Fetching...</span>}</div>
          </div>
        );
        break;
      case Page.HOME:
      default:
        content = (
          <main className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
            <div className="mb-6 flex justify-between items-center bg-black text-white px-2 py-1"><div className="flex-1"><Ticker articles={articles} /></div></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-9">
                {heroArticle.length > 0 ? <HeroArticle articles={[...heroArticle, ...topStories]} onLike={handleLike} currentUser={currentUser} viewerId={viewerId} onViewArticle={handleViewArticle} onViewProfile={handleViewProfile} /> : <p className="text-center mt-10">Silence...</p>}
                <section className="mt-8 pt-8 border-t-2 border-black">
                  <ArticleGrid articles={gridArticles} onLike={handleLike} currentUser={currentUser} viewerId={viewerId} onViewArticle={handleViewArticle} onViewProfile={handleViewProfile} />

                  {/* EXPLORE VAULT BUTTON */}
                  {articles.length >= 10 && (
                    <div className="mt-16 flex justify-center">
                      <button
                        onClick={() => setCurrentPage(Page.ARCHIVE)}
                        className="group relative bg-black text-white px-10 py-5 border-4 border-black font-sans-condensed font-bold uppercase text-2xl tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all active:scale-95"
                      >
                        Explore The Vault
                        <div className="absolute -top-3 -right-3 bg-red-800 text-white text-[10px] px-2 py-1 rotate-12 border-2 border-black group-hover:rotate-0 transition-transform">
                          ARCHIVED
                        </div>
                      </button>
                    </div>
                  )}
                </section>
              </div>
              <aside className="lg:col-span-3 space-y-6 lg:border-l lg:border-black lg:pl-8">
                <Suspense fallback={<div className="h-40 animate-pulse"></div>}><AIEditor /></Suspense>
                <div className="border-4 border-black p-4 text-center">
                  {/* UPDATED: Renamed to Support the Press */}
                  <button onClick={() => setCurrentPage(Page.DONATE)} className="font-secret text-sm underline hover:text-red-800 transition-colors">"Support the Press"</button>
                </div>
              </aside>
            </div>
          </main>
        );
        break;
    }
    return <div key={currentPage} className="animate-in fade-in duration-500">{content}</div>;
  };

  return (
    <div className="min-h-screen text-[#1a1a1a] overflow-x-hidden w-full">
      <CookieBanner message={publicNotice} />
      <Suspense fallback={null}><InstallPrompt /></Suspense>
      <Masthead
        currentPage={currentPage}
        setPage={setCurrentPage}
        isScrolled={isScrolled}
        currentUser={currentUser}
        onLogout={async () => { await supabase.auth.signOut(); setCurrentUser(null); setCurrentPage(Page.HOME); }}
        onLoginClick={() => setCurrentPage(Page.AUTH)}
        onViewMyProfile={handleViewMyProfile}
      />
      {renderContent()}

      <footer className="border-t-4 border-black mt-16 py-12 bg-[#e5e2d9]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-masthead text-6xl mb-6">Gujab</h2>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 font-sans-condensed font-bold uppercase text-xs tracking-widest mb-8">
            <button onClick={() => setCurrentPage(Page.ABOUT)} className="hover:underline hover:text-red-800">Our Story</button>
            <button onClick={() => setCurrentPage(Page.POLICY)} className="hover:underline hover:text-red-800">Editorial Policy</button>
            <button onClick={() => setCurrentPage(Page.CONTACT)} className="hover:underline hover:text-red-800">Dispatch Desk</button>
            <button onClick={() => setCurrentPage(Page.SEARCH)} className="hover:underline hover:text-red-800">Archive Search</button>
            <button onClick={() => setCurrentPage(Page.DONATE)} className="hover:underline hover:text-red-800 font-bold">Donate</button>
          </div>
          <p className="font-secret text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Gujab Corp. Est. 2025. Printed in the Ether.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;