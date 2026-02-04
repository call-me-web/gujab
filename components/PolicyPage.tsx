import React from 'react';
import { Page } from '../types';

interface PolicyPageProps {
  setPage: (page: Page) => void;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ setPage }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="mb-8">
        <button onClick={() => setPage(Page.HOME)} className="font-sans-condensed uppercase text-xs font-bold hover:underline">
          &larr; Return to Front Page
        </button>
      </div>

      <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] relative">
        
        {/* Header */}
        <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-start">
            <div>
                <h1 className="font-headline font-bold text-4xl uppercase tracking-tighter">Editorial Policy</h1>
                <p className="font-sans-condensed font-bold uppercase text-xs tracking-widest text-gray-500 mt-1">
                    Standard Operating Procedures & Legal Disclaimers
                </p>
            </div>
            <div className="hidden md:block">
                <div className="w-16 h-16 border-4 border-black rounded-full flex items-center justify-center">
                    <span className="font-serif font-bold text-2xl">§</span>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="font-body text-lg space-y-8">
            
            <section>
                <h2 className="font-sans-condensed font-black uppercase text-xl mb-3 flex items-center gap-2">
                    <span className="bg-black text-white w-6 h-6 flex items-center justify-center text-sm rounded-sm">1</span>
                    Satire & Entertainment
                </h2>
                <p className="text-gray-800 leading-relaxed">
                    <strong>Gujab</strong> is a satirical publication and digital art project. Unless explicitly cited from a verified external source (via the 'Global Wire'), the content found herein should be considered <strong>for entertainment purposes only</strong>. Names, characters, businesses, places, events, locales, and incidents are either the products of the author's imagination or used in a fictitious manner. Any resemblance to actual persons, living or dead, or actual events is purely coincidental (and hilarious).
                </p>
            </section>

            <section>
                <h2 className="font-sans-condensed font-black uppercase text-xl mb-3 flex items-center gap-2">
                    <span className="bg-black text-white w-6 h-6 flex items-center justify-center text-sm rounded-sm">2</span>
                    User Submissions (The Dispatch Desk)
                </h2>
                <p className="text-gray-800 leading-relaxed">
                    By submitting a "Tip" or "Gujab" to our Dispatch Desk, you grant Gujab Corp a non-exclusive, royalty-free, perpetual license to publish, edit, redact, or completely ignore your submission. We prioritize anonymity but reserve the right to banish sources who submit hate speech, doxxing attempts, or malicious misinformation intended to cause real-world harm.
                </p>
            </section>

            <section>
                <h2 className="font-sans-condensed font-black uppercase text-xl mb-3 flex items-center gap-2">
                    <span className="bg-black text-white w-6 h-6 flex items-center justify-center text-sm rounded-sm">3</span>
                    Data & Privacy
                </h2>
                <p className="text-gray-800 leading-relaxed">
                    We utilize local storage to remember your "Interests" strictly to improve the algorithmic sorting of the Front Page. We do not sell your personal data to third-party brokers, mostly because we wouldn't know how to price it. Our Oracle (AI) processes queries anonymously.
                </p>
            </section>
            
            <section>
                <h2 className="font-sans-condensed font-black uppercase text-xl mb-3 flex items-center gap-2">
                    <span className="bg-black text-white w-6 h-6 flex items-center justify-center text-sm rounded-sm">4</span>
                    The "Oracle" (AI)
                </h2>
                <p className="text-gray-800 leading-relaxed">
                    Parts of this publication are generated or augmented by Artificial Intelligence. While our editors (human) strive to curate the output, the Oracle occasionally hallucinates. If the AI claims the moon is made of cheese, please consult an astronomer before planning your lunar picnic.
                </p>
            </section>

        </div>

        {/* Footer */}
        <div className="mt-12 bg-gray-100 p-4 border-2 border-black flex items-center justify-between">
            <span className="font-secret text-xs text-gray-500">LAST UPDATED: 2025</span>
            <span className="font-sans-condensed font-bold text-xs uppercase tracking-widest text-red-800">Compliance Mandatory</span>
        </div>
      </div>
    </div>
  );
};