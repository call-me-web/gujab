import React from 'react';

interface OfflineScreenProps {
  onRetry: () => void;
  isDbError?: boolean;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({ onRetry, isDbError }) => {
  return (
    <div className="fixed inset-0 bg-[#e5e2d9] z-[9999] flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-xl w-full text-center border-4 border-double border-black p-8 bg-[#f1efe9] shadow-[15px_15px_0px_0px_rgba(26,26,26,1)] relative transform rotate-1">

        {/* Stamp */}
        <div className="absolute top-4 right-4 border-4 border-red-800 text-red-800 px-2 py-1 font-sans-condensed font-black text-xl uppercase -rotate-12 opacity-60">
          {isDbError ? 'SYSTEM FAILURE' : 'CONNECTION LOST'}
        </div>

        <h1 className="font-headline text-5xl font-bold mb-4 mt-4">
          {isDbError ? 'Database Missing' : 'Stop The Press!'}
        </h1>
        <div className="border-b-2 border-black w-2/3 mx-auto mb-6"></div>

        <p className="font-body text-lg mb-6 leading-relaxed">
          {isDbError
            ? "The archives appear to be empty or corrupted. The 'articles' table could not be found."
            : "We seem to have lost contact with the wire. The telegraph lines are down or the carrier pigeon has gone astray."
          }
        </p>

        <div className="bg-white p-4 border border-gray-400 font-secret text-sm mb-8 text-left shadow-inner">
          <p className="border-b border-gray-200 pb-2 mb-2"><strong>TECHNICAL DISPATCH:</strong></p>
          <p>STATUS: <span className="text-red-800 font-bold">{isDbError ? 'CRITICAL / SCHEMA MISSING' : 'OFFLINE / NO DATA'}</span></p>
          <p>ADVICE: {isDbError ? 'Please contact the Editor-in-Chief (Administrator).' : 'Check your network connection.'}</p>
        </div>

        <button
          onClick={onRetry}
          className="w-full bg-black text-white px-8 py-4 font-sans-condensed font-bold uppercase tracking-widest hover:bg-red-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 mb-4"
        >
          {isDbError ? 'Retry Connection' : 'Reconnect To Wire'}
        </button>
      </div>
    </div>
  );
};