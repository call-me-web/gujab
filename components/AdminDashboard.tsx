import React, { useEffect, useState } from 'react';
import { Page, Tip, DashboardStats, Article } from '../types';
import { supabase } from '../services/supabaseClient';

interface AdminDashboardProps {
    setPage: (page: Page) => void;
    onNoticeUpdate: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setPage, onNoticeUpdate }) => {
    const [tips, setTips] = useState<Tip[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showSqlHelp, setShowSqlHelp] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Announcement State
    const [announcementText, setAnnouncementText] = useState('');
    const [publishing, setPublishing] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState(false);

    // Site Config State
    const [nsaveUrl, setNsaveUrl] = useState('');
    const [savingConfig, setSavingConfig] = useState(false);

    // Drafting / One-Click Publish State
    const [activeTip, setActiveTip] = useState<Tip | null>(null);
    const [draft, setDraft] = useState({
        headline: '',
        subhead: '',
        content: '',
        category: 'Gossip',
        image: '',
        tags: ''
    });
    const [isDrafting, setIsDrafting] = useState(false);
    const [publishingArticle, setPublishingArticle] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const { data: tipsData, error: tipsError } = await supabase.from('tips').select('*').order('created_at', { ascending: false });
            setTips(tipsData || []);

            const { data: articlesData } = await supabase.from('articles').select('liked_by');
            const { count: noticeCount } = await supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('is_active', true);

            const totalArticles = articlesData?.length || 0;
            let totalLikes = 0;
            articlesData?.forEach(a => { if (Array.isArray(a.liked_by)) totalLikes += a.liked_by.length; });
            const avgLikes = totalArticles > 0 ? (totalLikes / totalArticles).toFixed(1) : "0.0";

            setStats({ totalArticles, totalLikes, totalTips: tipsData?.length || 0, activeNotices: noticeCount || 0, avgLikesPerStory: avgLikes });

            if (tipsError) {
                console.warn("Tips fetch failed (likely DB issue)", tipsError);
                if (tipsError.code === '42P01') setShowSqlHelp(true);
            }

            // Fetch Config
            const { data: configData } = await supabase.from('site_config').select('*');
            const nsave = configData?.find(c => c.key === 'nsave_link')?.value || '';
            setNsaveUrl(nsave);

        } catch (err: any) {
            console.error("Dashboard Error", err);
            setError(`System Malfunction: ${err.message}`);
        } finally { setLoading(false); }
    };

    const handlePublishNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcementText.trim()) return;
        setPublishing(true);
        try {
            await supabase.from('announcements').update({ is_active: false }).eq('is_active', true);
            const { error } = await supabase.from('announcements').insert([{ message: announcementText, is_active: true }]);
            if (error) throw error;
            setAnnouncementText('');
            setPublishSuccess(true);
            onNoticeUpdate();
            fetchData();
            setTimeout(() => setPublishSuccess(false), 3000);
        } catch (err: any) { alert(`Transmission Failed: ${err.message}`); } finally { setPublishing(false); }
    };

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            const { error } = await supabase.from('site_config').upsert([{ key: 'nsave_link', value: nsaveUrl }], { onConflict: 'key' });
            if (error) throw error;
            alert("Configuration Saved.");
        } catch (err: any) { alert(`Save Failed: ${err.message}`); } finally { setSavingConfig(false); }
    };

    const executeDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            const { error } = await supabase.from('tips').delete().eq('id', confirmDeleteId);
            if (error) throw error;
            setTips(t => t.filter(x => x.id !== confirmDeleteId));
            setConfirmDeleteId(null);
        } catch (e: any) { alert(e.message); }
    };

    const openDraftingBoard = (tip: Tip) => {
        // Extract content, removing private info
        const privateMarker = "--- [Private Sender Info] ---";
        let cleanContent = tip.tip;
        if (tip.tip.includes(privateMarker)) {
            cleanContent = tip.tip.split(privateMarker)[0].trim();
        }

        setActiveTip(tip);
        setDraft({
            headline: tip.subject || '',
            subhead: '',
            content: cleanContent,
            category: 'Gossip',
            image: tip.image_url || '',
            tags: ''
        });
        setIsDrafting(true);
    };

    const handleDraftPublish = async () => {
        setPublishingArticle(true);
        try {
            const newArticle = {
                headline: draft.headline,
                subhead: draft.subhead,
                author: 'The Editor', // Admin publishes as Editor
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                content: draft.content,
                image: draft.image || undefined,
                category: draft.category as any,
                tags: draft.tags.split(',').map(t => t.trim()).filter(t => t),
                user_id: (await supabase.auth.getUser()).data.user?.id
            };

            const { error } = await supabase.from('articles').insert([newArticle]);
            if (error) throw error;

            // Auto-delete tip after successful publishing
            if (activeTip) {
                const { error: deleteError } = await supabase.from('tips').delete().eq('id', activeTip.id);
                if (deleteError) {
                    console.error("Failed to delete tip after publish:", deleteError);
                } else {
                    // Update UI state
                    setTips(prev => prev.filter(t => t.id !== activeTip.id));
                }
            }

            alert("Story Published Successfully. Tip removed from Wire.");
            setIsDrafting(false);
            setActiveTip(null);
        } catch (err: any) {
            alert(`Publishing Error: ${err.message}`);
        } finally {
            setPublishingArticle(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => alert("Master Launch SQL Copied!"));
    };

    const masterLaunchSql = `-- GUJAB MASTER SQL v5.2 (Fix: Removed RAISE NOTICE)
-- RUN THIS IN SUPABASE SQL EDITOR

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.toggle_like(uuid, text);
DROP FUNCTION IF EXISTS public.submit_tip(text, text, text);

DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.albums CASCADE;
DROP TABLE IF EXISTS public.tips CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Albums" ON public.albums FOR SELECT USING (true);
CREATE POLICY "Auth Insert Albums" ON public.albums FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners Update Albums" ON public.albums FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  headline TEXT NOT NULL,
  subhead TEXT,
  content TEXT NOT NULL,
  author TEXT,
  category TEXT DEFAULT 'Gossip',
  tags TEXT[] DEFAULT '{}',
  liked_by TEXT[] DEFAULT '{}',
  image TEXT,
  date TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  album_id UUID REFERENCES public.albums(id)
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Auth Insert Articles" ON public.articles FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Updated Tips Table with Image Support
CREATE TABLE public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  alias TEXT,
  subject TEXT,
  tip TEXT NOT NULL,
  image_url TEXT
);
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert tips" ON public.tips FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read tips" ON public.tips FOR SELECT USING (auth.jwt()->>'email' = 'gujab9@gmail.com');
CREATE POLICY "Admins delete tips" ON public.tips FOR DELETE USING (auth.jwt()->>'email' = 'gujab9@gmail.com');

CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Auth Update Announcements" ON public.announcements FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE public.site_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Config" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Auth Update Config" ON public.site_config FOR ALL USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.toggle_like(article_id UUID, user_id_input TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_likes TEXT[];
BEGIN
    SELECT liked_by INTO current_likes FROM public.articles WHERE id = article_id;
    IF current_likes IS NULL THEN current_likes := '{}'; END IF;
    IF user_id_input = ANY(current_likes) THEN
        current_likes := array_remove(current_likes, user_id_input);
    ELSE
        current_likes := array_append(current_likes, user_id_input);
    END IF;
    UPDATE public.articles SET liked_by = current_likes WHERE id = article_id;
    RETURN current_likes;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

INSERT INTO storage.buckets (id, name, public) VALUES ('article-images', 'article-images', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'article-images' );
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'article-images' );
-- Allow public uploads for tips
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'article-images' );
`;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 relative min-h-screen bg-[#e5e2d9]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-black pb-4 mb-8 gap-4">
                <div>
                    <button onClick={() => setPage(Page.HOME)} className="font-sans-condensed uppercase text-xs font-bold hover:underline mb-2">&larr; Return to Front Page</button>
                    <h2 className="font-headline font-bold text-5xl md:text-6xl">Editor's Desk</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowSqlHelp(!showSqlHelp)} className={`font-sans-condensed uppercase text-xs font-bold border-2 border-black px-3 py-1 transition-colors ${showSqlHelp ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'}`}>
                        {showSqlHelp ? 'Hide System Diagnostics' : 'System Diagnostics'}
                    </button>
                    <button onClick={fetchData} className="font-sans-condensed uppercase text-xs font-bold border-2 border-black px-3 py-1 bg-white hover:bg-gray-200">
                        Refresh Wire
                    </button>
                </div>
            </div>

            {showSqlHelp && (
                <div className="bg-gray-900 text-green-400 p-6 mb-8 border-4 border-black font-mono text-xs overflow-x-auto shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-center mb-4 border-b border-green-900 pb-2">
                        <span className="font-bold uppercase">DB REPAIR KIT</span>
                        <button onClick={() => copyToClipboard(masterLaunchSql)} className="bg-green-900 text-white px-2 py-1 hover:bg-green-700 transition-colors">Copy SQL</button>
                    </div>
                    <pre className="whitespace-pre-wrap select-all">{masterLaunchSql}</pre>
                </div>
            )}

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Col: Stats & Broadcast */}
                <div className="lg:col-span-4 space-y-8">
                    {stats && (
                        <div className="bg-[#1a1a1a] text-[#f1efe9] p-6 border-2 border-gray-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                            <h3 className="font-sans-condensed font-bold uppercase text-xs tracking-[0.2em] mb-4 text-gray-400 border-b border-gray-700 pb-2">Publication Metrics</h3>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div><p className="text-3xl font-secret font-bold">{stats.totalArticles}</p><p className="text-[10px] uppercase text-gray-500">Stories Printed</p></div>
                                <div><p className="text-3xl font-secret font-bold text-yellow-500">{stats.totalLikes}</p><p className="text-[10px] uppercase text-gray-500">Total Likes</p></div>
                                <div><p className="text-3xl font-secret font-bold text-red-500">{stats.totalTips}</p><p className="text-[10px] uppercase text-gray-500">Wire Taps</p></div>
                                <div><p className="text-3xl font-secret font-bold">{stats.avgLikesPerStory}</p><p className="text-[10px] uppercase text-gray-500">Avg Engagement</p></div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-3 mb-4 border-b-2 border-black pb-2">
                            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
                            <h3 className="font-headline font-bold text-xl uppercase italic">Public Address</h3>
                        </div>
                        <form onSubmit={handlePublishNotice}>
                            <textarea
                                value={announcementText}
                                onChange={(e) => setAnnouncementText(e.target.value)}
                                placeholder="Type urgent public notice..."
                                className="w-full h-24 border-2 border-gray-300 p-3 font-secret text-sm focus:outline-none focus:border-red-800 focus:bg-yellow-50 transition-colors mb-2 resize-none"
                            />
                            <button
                                type="submit"
                                disabled={publishing || !announcementText.trim()}
                                className="w-full bg-black text-white px-4 py-2 font-sans-condensed font-bold uppercase tracking-widest hover:bg-red-800 transition-colors disabled:opacity-50"
                            >
                                {publishing ? 'Broadcasting...' : 'Broadcast Signal'}
                            </button>
                            {publishSuccess && <p className="mt-2 text-[10px] text-green-700 font-bold uppercase">Signal Sent.</p>}
                        </form>
                    </div>

                    {/* Site Settings */}
                    <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-3 mb-4 border-b-2 border-black pb-2">
                            <h3 className="font-headline font-bold text-xl uppercase italic">Site Configuration</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-sans-condensed font-bold text-[10px] uppercase mb-1">nsave Donation Link</label>
                                <input
                                    type="text"
                                    value={nsaveUrl}
                                    onChange={(e) => setNsaveUrl(e.target.value)}
                                    className="w-full border-2 border-gray-300 p-2 font-mono text-xs focus:outline-none focus:border-black"
                                    placeholder="https://nsave.com/your-username"
                                />
                            </div>
                            <button
                                onClick={handleSaveConfig}
                                disabled={savingConfig}
                                className="w-full bg-[#0052cc] text-white px-4 py-2 font-sans-condensed font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
                            >
                                {savingConfig ? 'Saving...' : 'Update Settings'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Col: Tip Management */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-headline font-bold text-3xl uppercase italic border-b-4 border-black inline-block pr-8">Incoming Wire ({tips.length})</h3>
                        <div className="text-xs font-secret text-gray-500 hidden md:block">
                            SECURE LINE • ENCRYPTED
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 font-secret animate-pulse">Scanning frequencies...</div>
                    ) : tips.length === 0 ? (
                        <div className="text-center py-20 border-4 border-dashed border-gray-400 text-gray-400">
                            <p className="font-secret text-xl">"The wire is silent."</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {tips.map((rawTip) => {
                                const privateMarker = "--- [Private Sender Info] ---";
                                const hasPrivateInfo = rawTip.tip.includes(privateMarker);
                                const displayTip = hasPrivateInfo ? rawTip.tip.split(privateMarker)[0].trim() : rawTip.tip;
                                const privateData = hasPrivateInfo ? rawTip.tip.split(privateMarker)[1].trim() : null;

                                return (
                                    <div key={rawTip.id} className="bg-[#fcfbf9] border-2 border-black p-0 flex flex-col h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.2)] transition-shadow">
                                        {/* Header */}
                                        <div className="bg-black text-white px-4 py-2 flex justify-between items-center">
                                            <span className="font-sans-condensed font-bold text-[10px] uppercase tracking-widest text-gray-300">
                                                {new Date(rawTip.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="font-sans-condensed font-bold text-[10px] uppercase tracking-widest text-red-500">
                                                {rawTip.alias}
                                            </span>
                                        </div>

                                        {/* Private Info "Thumbnail" Block */}
                                        {privateData && (
                                            <div className="bg-red-100 border-b-2 border-black p-2 text-[10px] font-sans-condensed font-bold text-red-900 uppercase">
                                                <span className="block border-b border-red-200 mb-1 pb-1">Confidential Source:</span>
                                                <pre className="font-mono whitespace-pre-wrap">{privateData}</pre>
                                            </div>
                                        )}

                                        {/* Image Preview if exists */}
                                        {rawTip.image_url && (
                                            <div className="w-full h-40 bg-gray-200 border-b-2 border-black overflow-hidden relative group">
                                                <img src={rawTip.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                                <div className="absolute top-2 right-2 bg-red-800 text-white px-2 py-0.5 text-[9px] font-bold uppercase font-sans-condensed">Artifact Attached</div>
                                            </div>
                                        )}

                                        <div className="p-4 flex-grow">
                                            <h4 className="font-headline font-bold text-lg leading-tight mb-2">{rawTip.subject || 'No Subject'}</h4>
                                            <p className="font-secret text-xs leading-relaxed text-gray-700 line-clamp-4 mb-4 whitespace-pre-wrap">
                                                {displayTip}
                                            </p>
                                        </div>

                                        <div className="p-4 pt-0 mt-auto flex gap-2">
                                            <button
                                                onClick={() => openDraftingBoard(rawTip)}
                                                className="flex-1 bg-black text-white py-2 font-sans-condensed font-bold uppercase text-xs hover:bg-red-800 transition-colors"
                                            >
                                                Draft Story
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(rawTip.id)}
                                                className="px-4 border-2 border-black font-sans-condensed font-bold uppercase text-xs hover:bg-gray-200 transition-colors"
                                                title="Burn Tip"
                                            >
                                                Burn
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* DRAFTING BOARD MODAL */}
            {isDrafting && (
                <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#f1efe9] w-full max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-black shadow-2xl relative">
                        <div className="sticky top-0 bg-black text-white px-6 py-4 flex justify-between items-center z-10">
                            <h3 className="font-headline font-bold text-2xl italic">Drafting Board</h3>
                            <button onClick={() => setIsDrafting(false)} className="text-white hover:text-red-500 font-bold text-xl">&times;</button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block font-sans-condensed font-bold text-xs uppercase mb-1">Headline</label>
                                    <input
                                        value={draft.headline}
                                        onChange={e => setDraft({ ...draft, headline: e.target.value })}
                                        className="w-full border-2 border-black p-2 font-headline font-bold text-xl bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block font-sans-condensed font-bold text-xs uppercase mb-1">Category</label>
                                    <select
                                        value={draft.category}
                                        onChange={e => setDraft({ ...draft, category: e.target.value })}
                                        className="w-full border-2 border-black p-2 font-sans-condensed bg-white"
                                    >
                                        <option>Gossip</option>
                                        <option>Tech</option>
                                        <option>Celebrity</option>
                                        <option>Politics</option>
                                        <option>Finance</option>
                                        <option>Creative Art</option>
                                        <option>World</option>
                                        <option>Lifestyle</option>
                                        <option>Science</option>
                                        <option>Sports</option>
                                        <option>Satire</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-sans-condensed font-bold text-xs uppercase mb-1">Subhead / Gist</label>
                                <input
                                    value={draft.subhead}
                                    onChange={e => setDraft({ ...draft, subhead: e.target.value })}
                                    className="w-full border-2 border-black p-2 font-body italic bg-white"
                                    placeholder="Optional brief summary..."
                                />
                            </div>

                            <div>
                                <label className="block font-sans-condensed font-bold text-xs uppercase mb-1">Content Body</label>
                                <textarea
                                    value={draft.content}
                                    onChange={e => setDraft({ ...draft, content: e.target.value })}
                                    className="w-full h-48 border-2 border-black p-4 font-body text-lg bg-white"
                                />
                            </div>

                            {draft.image && (
                                <div className="border-2 border-dashed border-black p-4 bg-gray-100">
                                    <label className="block font-sans-condensed font-bold text-xs uppercase mb-2">Evidence Attached</label>
                                    <img src={draft.image} className="h-32 object-contain bg-white border border-gray-300" />
                                </div>
                            )}

                            <div className="pt-6 border-t-2 border-black flex gap-4 justify-end">
                                <button
                                    onClick={() => setIsDrafting(false)}
                                    className="px-6 py-3 font-sans-condensed font-bold uppercase text-xs border-2 border-black hover:bg-gray-200"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleDraftPublish}
                                    disabled={publishingArticle}
                                    className="px-8 py-3 font-sans-condensed font-bold uppercase text-xs bg-red-800 text-white border-2 border-red-900 hover:bg-black transition-colors"
                                >
                                    {publishingArticle ? 'Printing...' : 'Publish to Wire'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {confirmDeleteId && (
                <div className="fixed inset-0 bg-black/60 z-[9999] flex justify-center items-center p-4 backdrop-blur-sm">
                    <div className="bg-[#f1efe9] max-w-md w-full p-8 border-4 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95">
                        <h3 className="font-masthead text-4xl mb-2 text-red-900">Burn Permanent</h3>
                        <p className="font-secret text-sm mb-6 italic">"This secret will be incinerated from the database archives."</p>
                        <div className="flex gap-4">
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 bg-white border-2 border-black py-3 font-sans-condensed font-bold uppercase hover:bg-gray-100 transition-colors">Cancel</button>
                            <button onClick={executeDelete} className="flex-1 bg-red-800 text-white border-2 border-red-900 py-3 font-sans-condensed font-bold uppercase hover:bg-black transition-colors">Burn Tip</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};