import React from 'react';
import { Page } from '../types';

interface AboutPageProps {
  setPage: (page: Page) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ setPage }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="mb-8">
        <button onClick={() => setPage(Page.HOME)} className="font-sans-condensed uppercase text-xs font-bold hover:underline">
          &larr; Return to Front Page
        </button>
      </div>

      <div className="border-[6px] border-double border-black p-8 md:p-12 bg-[#fcfbf9] relative shadow-[20px_20px_0px_0px_rgba(0,0,0,0.1)]">

        {/* Decorative Stamps */}
        <div className="absolute top-8 right-8 border-4 border-red-800 text-red-800 px-4 py-2 font-sans-condensed font-black text-2xl uppercase -rotate-12 opacity-80 pointer-events-none">
          Est. 2025
        </div>

        <div className="text-center mb-12">
          <h1 className="font-masthead text-6xl md:text-8xl mb-2">Gujab</h1>
          <div className="border-t-2 border-b-2 border-black py-2 inline-block px-8">
            <span className="font-sans-condensed font-bold uppercase tracking-[0.4em] text-sm">The Official Unofficial Record</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto font-body text-xl leading-relaxed text-justify space-y-6">
          <p className="first-letter:text-6xl first-letter:font-masthead first-letter:float-left first-letter:mr-3 first-letter:mt-[-10px]">
            In an age of algorithmic sterility, <strong>Gujab</strong> serves as the ink-stained chaotic neutral of the internet. We are not a news organization in the traditional sense; we are digital archivists of the "vibe."
          </p>
          <p>
            Founded in a metaphorical basement by anonymous typists, Gujab exists to capture the whispers, the rumors, the memes, and the satire that float through the ether before they are scrubbed by the sanitation departments of the major platforms.
          </p>

          <div className="bg-black text-[#f1efe9] p-6 my-8 transform -rotate-1 shadow-lg border-2 border-gray-600">
            <h3 className="font-sans-condensed font-bold uppercase text-lg mb-2 text-red-500">Our Mission</h3>
            <p className="font-secret text-sm italic">
              "To print the unprintable. To archive the ephemeral. To ensure that even the wildest rumor has a home in the permanent record."
            </p>
          </div>

          <p>
            We believe that truth is often stranger than fiction, but fiction is usually better formatted. Our AI-assisted "Oracle" engine scours the web not for facts, but for <em className="font-bold">artifacts</em>—the cultural debris that defines our time.
          </p>

          <div className="border-l-4 border-black pl-6 italic text-gray-700 mt-8">
            <p>
              "Gujab is where the internet goes to get developed into film."
              <br />
              <span className="font-sans-condensed font-bold text-xs uppercase not-italic text-black">— The Chief Editor (Redacted)</span>
            </p>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t-2 border-dashed border-gray-400 text-center">
          <p className="font-secret text-xs text-gray-500 mb-4">
            OPERATING FROM AN UNDISCLOSED SERVER LOCATION
          </p>
          <img
            src="/signature.svg"
            className="h-16 mx-auto opacity-40 mix-blend-multiply filter contrast-150"
            alt="Signature"
          />
        </div>
      </div>
    </div>
  );
};