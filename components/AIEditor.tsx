import React, { useState } from 'react';
import { generateEditorColumn } from '../services/geminiService';

export const AIEditor: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    const result = await generateEditorColumn(query);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="border-2 border-black p-3 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="font-sans-condensed font-bold text-lg uppercase border-b-2 border-black mb-3 pb-1 text-center tracking-widest">
        Whisper to the Oracle
      </h3>
      
      {!response && !loading && (
        <div>
          <p className="font-secret text-center text-xs mb-3 italic text-gray-600">
            "Seek a fragment of truth..."
          </p>
          <form onSubmit={handleAsk} className="flex flex-col gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask your question..."
              className="border border-black p-1.5 font-secret text-xs focus:outline-none focus:ring-1 focus:ring-black bg-gray-50 text-center"
            />
            <button 
              type="submit"
              className="bg-black text-white font-sans-condensed uppercase font-bold text-xs py-2 px-3 hover:bg-gray-800 transition-colors"
            >
              Consult
            </button>
          </form>
        </div>
      )}

      {loading && (
        <div className="py-6 text-center font-secret animate-pulse">
          <span className="text-lg">Consulting the ether...</span>
        </div>
      )}

      {response && (
        <div className="animate-in fade-in">
          <div className="mb-2 font-bold font-sans-condensed text-xs uppercase tracking-wider text-gray-500 text-center">
            The Oracle has spoken:
          </div>
          <p className="font-secret text-center leading-relaxed text-sm italic p-3 bg-gray-100 border-t border-b border-gray-300">
            "{response}"
          </p>
          <div className="mt-3 text-center">
             <button 
              onClick={() => { setResponse(null); setQuery(''); }}
              className="text-xs underline font-sans-condensed uppercase"
            >
              Ask Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};