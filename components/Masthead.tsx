import React, { useState } from 'react';
import { Page, User } from '../types';

interface MastheadProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  isScrolled: boolean;
  currentUser: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onViewMyProfile?: () => void; // Optional for backward compatibility, but used for fix
}

export const Masthead: React.FC<MastheadProps> = ({ currentPage, setPage, isScrolled, currentUser, onLogout, onLoginClick, onViewMyProfile }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = currentUser?.email === 'gujab9@gmail.com';

  const handleProfileClick = () => {
    setMobileMenuOpen(false);
    if (onViewMyProfile) onViewMyProfile();
    else setPage(Page.PROFILE);
  };

  const navigate = (page: Page) => {
    setPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isScrolled ? 'py-2 shadow-lg border-b-2 border-black' : 'py-4 border-b-4 border-black'}`}
      style={{ backgroundColor: '#f1efe9' }}
    >
      <div className={`max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between`}>
        <div
          onClick={() => navigate(Page.HOME)}
          className="cursor-pointer select-none group"
        >
          <h1 className={`font-masthead font-black tracking-tighter leading-none transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] origin-left ${isScrolled ? 'text-3xl md:text-5xl scale-95' : 'text-8xl md:text-9xl text-center w-full group-hover:scale-[1.02]'}`}>
            Gujab
          </h1>
        </div>

        {/* DESKTOP TOP NAV */}
        <nav className={`transition-all duration-500 ease-out hidden md:flex items-center gap-4 ${isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none absolute right-4'}`}>
          <ul className="flex items-center gap-x-2 md:gap-x-6 font-sans-condensed font-bold text-xs md:text-base uppercase tracking-wider">
            <li>
              <button onClick={() => navigate(Page.SEARCH)} className="p-1 hover:text-red-800 transition-colors" title="Search Archives">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </li>
            <li>
              <button onClick={() => navigate(Page.HOME)} className="hover:text-red-800 transition-colors hidden md:inline">Home</button>
            </li>
            {currentUser ? (
              <>
                {isAdmin && (
                  <li>
                    <button onClick={() => navigate(Page.ADMIN_DASHBOARD)} className="text-red-800 hover:text-black font-black transition-colors">
                      Editor
                    </button>
                  </li>
                )}
                <li>
                  <button onClick={handleProfileClick} className="hover:text-red-800 transition-colors">
                    Dossier
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate(Page.DASHBOARD)} className="bg-red-800 text-white px-3 py-1 hover:bg-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    + Post
                  </button>
                </li>
                <li>
                  <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="text-xs text-gray-500 hover:text-black">Logout</button>
                </li>
              </>
            ) : (
              <li>
                <button onClick={() => { onLoginClick(); setMobileMenuOpen(false); }} className="bg-black text-white px-3 py-1 hover:bg-gray-800 transition-all">
                  Login
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden border-2 border-black px-2 py-1 font-sans-condensed font-bold uppercase text-xs hover:bg-black hover:text-white transition-colors"
        >
          {mobileMenuOpen ? 'Close X' : 'Menu ='}
        </button>
      </div>

      {/* SECONDARY NAV (DESKTOP) */}
      <nav className={`transition-all duration-700 ease-in-out mt-4 overflow-hidden hidden md:block ${isScrolled ? 'opacity-0 h-0 scale-y-0 origin-top' : 'opacity-100 h-auto scale-y-100'}`}>
        <ul className="flex justify-center items-center flex-wrap gap-x-4 md:gap-x-8 gap-y-2 font-sans-condensed font-bold text-sm md:text-base uppercase tracking-wider border-y-2 border-black py-2">
          <li>
            <button onClick={() => navigate(Page.HOME)} className={`hover:text-red-800 ${currentPage === Page.HOME ? 'text-red-800 underline' : ''}`}>Front Page</button>
          </li>
          <li>
            <button onClick={() => navigate(Page.SEARCH)} className={`flex items-center gap-1 hover:text-red-800 ${currentPage === Page.SEARCH ? 'text-red-800 underline' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Search
            </button>
          </li>
          <li>
            <button onClick={() => navigate(Page.ARCHIVE)} className={`hover:text-red-800 ${currentPage === Page.ARCHIVE ? 'text-red-800 underline' : ''}`}>The Vault</button>
          </li>
          <li>
            <button onClick={() => navigate(Page.CONTACT)} className={`hover:text-red-800 ${currentPage === Page.CONTACT ? 'text-red-800 underline' : ''}`}>Submit Intel</button>
          </li>
          {currentUser && (
            <>
              <li>
                <button onClick={handleProfileClick} className={`hover:text-red-800 ${currentPage === Page.PROFILE ? 'text-red-800 underline' : ''}`}>My Dossier</button>
              </li>
              <li>
                <button onClick={() => navigate(Page.DASHBOARD)} className="bg-red-800 text-white px-3 py-0.5 hover:bg-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm">
                  + Post Gujab
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* MOBILE DROPDOWN MENU */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-b-2 border-black bg-[#fcfbf9] ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <ul className="flex flex-col font-sans-condensed font-bold text-lg uppercase tracking-wider p-4 space-y-4 text-center">
          <li>
            <button onClick={() => navigate(Page.HOME)} className={`${currentPage === Page.HOME ? 'text-red-800 underline' : ''}`}>Front Page</button>
          </li>
          <li>
            <button onClick={() => navigate(Page.SEARCH)} className={`${currentPage === Page.SEARCH ? 'text-red-800 underline' : ''}`}>Search</button>
          </li>
          <li>
            <button onClick={() => navigate(Page.ARCHIVE)} className={`${currentPage === Page.ARCHIVE ? 'text-red-800 underline' : ''}`}>The Vault</button>
          </li>
          <li>
            <button onClick={() => navigate(Page.CONTACT)} className={`${currentPage === Page.CONTACT ? 'text-red-800 underline' : ''}`}>Submit Intel</button>
          </li>
          <li className="border-t border-gray-300 pt-4 mt-2">
            {currentUser ? (
              <div className="flex flex-col gap-3">
                <button onClick={handleProfileClick} className={`${currentPage === Page.PROFILE ? 'text-red-800 underline' : ''}`}>My Dossier</button>
                {isAdmin && (
                  <button onClick={() => navigate(Page.ADMIN_DASHBOARD)} className="text-red-800">Admin Editor</button>
                )}
                <button onClick={() => navigate(Page.DASHBOARD)} className="bg-red-800 text-white px-6 py-2 mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all w-fit">
                  + Post New Gujab
                </button>
                <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="text-sm text-gray-500 mt-2">Logout</button>
              </div>
            ) : (
              <button onClick={() => { onLoginClick(); setMobileMenuOpen(false); }} className="bg-black text-white px-6 py-2 mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:bg-gray-800 w-fit">
                Login / Join
              </button>
            )}
          </li>
        </ul>
      </div>
    </header>
  );
};