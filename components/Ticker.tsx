import React from 'react';
import { Article } from '../types';

interface TickerProps {
  articles: Article[];
}

export const Ticker: React.FC<TickerProps> = ({ articles }) => {
  const tickerHeadlines = articles.slice(0, 5).map(a => a.headline).join(' +++ ');

  return (
    <div className="bg-black text-white py-1 overflow-hidden whitespace-nowrap">
      <div className="inline-block animate-[marquee_80s_linear_infinite] font-mono text-sm uppercase tracking-widest">
        <span className="mx-4">+++ {tickerHeadlines} +++</span>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};