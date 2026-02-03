import React, { useState, useEffect } from 'react';
import { Page, Article, SearchResult } from '../types';
import { searchWeb } from '../services/geminiService';
import { ArticleGrid } from './ArticleGrid';
import { marked } from 'marked';

interface SearchArchiveProps {
  articles: Article[];
  setPage: (page: Page) => void;
  onLike: (id: string) => void;
  onViewArticle: (id: string) => void;
  currentUser: any;
  viewerId: string;
}

export const SearchArchive: React.FC<SearchArchiveProps> = ({ articles, setPage, onLike, onViewArticle, currentUser, viewerId }) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'INTERNAL' | 'GLOBAL'>('INTERNAL');
  const [results, setResults] = useState<Article[]>([]);
  const [webResult, setWebResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (searchMode === 'INTERNAL') {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const filtered = articles.filter(a =>
        a.headline.toLowerCase().includes(query.toLowerCase()) ||
        a.content.toLowerCase().includes(query.toLowerCase()) ||
        a.category.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    }
  }, [query, articles, searchMode]);

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setWebResult(null);
    const result = await searchWeb(query);

    // STRICT FILTER: If the Oracle returns SEARCH_NULL or lacks specific fragments, show nothing.
    if (!result.text || result.text.includes('SEARCH_NULL')) {
      setWebResult(null);
    } else {
      setWebResult(result);
    }
    setSearching(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="mb-8">
        <button onClick={() => setPage(Page.HOME)} className="font-sans-condensed uppercase text-xs font-bold hover:underline">
          &larr; Exit Terminal
        </button>
      </div>

      <div className="text-center mb-12 border-b-4 border-black pb-8">
        <h2 className="font-headline font-bold text-6xl mb-4">Evidence Locker</h2>
        <p className="font-secret text-xl italic text-gray-600">
          "Extracting memes, art, and rumors from the global wire."
        </p>
      </div>

      <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-12">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchMode === 'INTERNAL' ? "Search the Gujab archives..." : "Locate specific memes or artifacts..."}
              className="w-full bg-gray-100 border-2 border-black p-4 font-secret text-lg focus:outline-none focus:bg-yellow-50"
              onKeyDown={(e) => e.key === 'Enter' && searchMode === 'GLOBAL' && handleGlobalSearch(e as any)}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setWebResult(null); setResults([]); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black font-bold"
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex border-2 border-black">
            <button
              onClick={() => { setSearchMode('INTERNAL'); setWebResult(null); }}
              className={`px-6 py-2 font-sans-condensed font-bold uppercase text-sm transition-colors ${searchMode === 'INTERNAL' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
            >
              Vault
            </button>
            <button
              onClick={() => setSearchMode('GLOBAL')}
              className={`px-6 py-2 font-sans-condensed font-bold uppercase text-sm border-l-2 border-black transition-colors ${searchMode === 'GLOBAL' ? 'bg-red-800 text-white' : 'bg-white hover:bg-gray-100'}`}
            >
              Artifacts
            </button>
          </div>

          {searchMode === 'GLOBAL' && (
            <button
              onClick={handleGlobalSearch}
              disabled={searching || !query.trim()}
              className="bg-black text-white px-8 py-4 font-sans-condensed font-bold uppercase hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              {searching ? 'Filtering...' : 'Scan Wire'}
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[10px] font-sans-condensed uppercase font-bold text-gray-500 tracking-widest">
            {searchMode === 'INTERNAL' ? 'Searching local microfilm...' : 'Scanning for non-factual fun artifacts only'}
          </p>
          {searchMode === 'GLOBAL' && (
            <span className="animate-pulse flex items-center gap-1 text-[10px] font-sans-condensed text-green-700 font-bold uppercase">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              Filtering the Digital Static
            </span>
          )}
        </div>
      </div>

      {searchMode === 'INTERNAL' && (
        <div className="space-y-8">
          {query.trim() && results.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-400">
              <p className="font-secret text-2xl text-gray-400">"No matching records in the Vault."</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="border-b-2 border-black pb-2 mb-8">
                <h3 className="font-sans-condensed font-bold text-xl uppercase tracking-tighter">Local Matches ({results.length})</h3>
              </div>
              <ArticleGrid articles={results} onLike={onLike} currentUser={currentUser} onViewArticle={onViewArticle} viewerId={viewerId} />
            </>
          ) : (
            <div className="text-center py-20">
              <p className="font-secret text-lg text-gray-500 italic">"Input keywords to browse the Vault..."</p>
            </div>
          )}
        </div>
      )}

      {searchMode === 'GLOBAL' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {searching ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin h-12 w-12 border-4 border-black border-t-red-800 rounded-full mb-6"></div>
              <p className="font-secret text-xl animate-pulse italic">Auditing the Global Wire for artifacts...</p>
            </div>
          ) : webResult ? (
            <div className="space-y-12">
              <div className="bg-[#fcfbf9] border-4 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">

                {/* Artifact Banner */}
                <div className="bg-red-800 text-white p-3 flex justify-between items-center border-b-2 border-black">
                  <span className="font-sans-condensed font-black text-xs uppercase tracking-[0.4em]">Artifact Discovered</span>
                  <span className="font-secret text-[9px] opacity-70">Case ID: {Math.floor(Math.random() * 100000)}</span>
                </div>

                <div className="p-10">
                  {/* TEXT CLIPPINGS (QUOTES) */}
                  {webResult.text && !webResult.text.includes('SEARCH_NULL') && (
                    <div className="mb-16">
                      <div className="flex items-center gap-3 mb-8 border-b-2 border-black pb-2">
                        <span className="bg-black text-white px-2 py-0.5 font-sans-condensed text-[10px] font-bold uppercase">Evidence Log</span>
                        <h3 className="font-headline font-bold text-2xl uppercase italic tracking-tighter">Raw Fragments</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-8">
                        {webResult.text.split('---').map((clipping, idx) => (
                          <div key={idx} className="bg-white border-2 border-black p-8 font-body text-xl leading-relaxed relative shadow-inner">
                            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                              <h4 className="font-masthead text-8xl">G</h4>
                            </div>
                            <div className="prose-lg oracle-content" dangerouslySetInnerHTML={{ __html: marked.parse(clipping) }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VISUAL SLIDES (GOOGLE DATA) */}
                  {webResult.sources.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-8 border-b-2 border-black pb-2">
                        <span className="bg-black text-white px-2 py-0.5 font-sans-condensed text-[10px] font-bold uppercase">Evidence Slides</span>
                        <h3 className="font-headline font-bold text-2xl uppercase italic tracking-tighter">Visual Sources</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {webResult.sources.map((source, i) => source.web && (
                          <a
                            key={i}
                            href={source.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative bg-white border-2 border-black p-6 transition-all hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:scale-95 flex flex-col h-full"
                          >
                            <div className="aspect-[4/5] bg-gray-50 border-2 border-black mb-6 flex items-center justify-center overflow-hidden relative group-hover:bg-white transition-colors">
                              <div className="absolute inset-0 bg-paper/10 mix-blend-multiply opacity-50"></div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 group-hover:text-black group-hover:scale-110 transition-all duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 text-[8px] font-bold uppercase font-sans-condensed tracking-widest">
                                SLIDE #{i + 1}
                              </div>
                            </div>
                            <h4 className="font-headline font-bold text-sm uppercase mb-2 leading-tight group-hover:underline line-clamp-2">
                              {source.web.title || 'Untitled Image Source'}
                            </h4>
                            <p className="font-secret text-[9px] text-gray-400 mt-auto pt-2 border-t border-gray-100">
                              {new URL(source.web.uri).hostname}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Auditor Footnote */}
                <div className="bg-black text-[#fcfbf9] p-4 text-center">
                  <p className="font-sans-condensed text-[10px] uppercase tracking-[0.4em] font-bold">
                    Audit Complete // Only Artifacts Logged
                  </p>
                </div>
              </div>

              <div className="text-center py-6 opacity-40">
                <p className="font-secret text-xs">"The wire continues to hum in the background..."</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-32 border-4 border-dashed border-gray-300 flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full flex items-center justify-center text-3xl opacity-20">?</div>
              <p className="font-secret text-xl text-gray-400 italic">"No artifacts (memes/gujabs) found for this query."</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};