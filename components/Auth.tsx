import React, { useState } from 'react';
import { Page } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  setPage: (page: Page) => void;
  initialMessage?: string;
  onAuthSuccess?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ setPage, initialMessage, onAuthSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'RESET'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(initialMessage || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'RESET') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg('If an account exists, a password reset link has been sent to your email.');
      } else if (mode === 'LOGIN') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Trigger success callback to return to previous page
        if (onAuthSuccess) onAuthSuccess();
      } else if (mode === 'SIGNUP') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });
        if (error) throw error;
        setSuccessMsg('Registration successful! Check your email for a confirmation link.');
        // For Signup, we usually wait for email confirm, but if auto-confirm is on in Supabase, 
        // we could call onAuthSuccess() here too. 
        // Typically Supabase requires email verification by default, so we stay to show the message.
      }
    } catch (err: any) {
      // Handle known auth errors as warnings to keep console clean
      if (err.message === 'Invalid login credentials') {
        console.warn('Auth: Invalid credentials provided.');
        setError('Identity verification failed. Please check your email and password, or create a new alias (Sign Up).');
      } else {
        console.error('Auth request failed', err);
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign-In failed', err);
      setError(err.message || 'Google Sign-In failed.');
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'LOGIN': return 'Secret Handshake';
      case 'SIGNUP': return 'Join The Fold';
      case 'RESET': return 'Recover Identity';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'LOGIN': return 'Provide your credentials.';
      case 'SIGNUP': return 'Establish your alias.';
      case 'RESET': return 'Lost your keys? We can help.';
    }
  };

  return (
    <div className="max-w-sm mx-auto py-12 px-4">
      <div className="mb-8">
        <button onClick={() => setPage(Page.HOME)} className="font-sans-condensed uppercase text-xs font-bold hover:underline">
          &larr; Back to Front Page
        </button>
      </div>
      <div className="bg-white p-8 border-2 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="font-headline text-3xl font-bold mb-2 text-center">
          {getTitle()}
        </h2>
        <p className="font-secret text-center text-sm mb-6 text-gray-500">
          {getSubtitle()}
        </p>

        {error && (
          <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm font-secret" role="alert">
            {error}
          </p>
        )}

        {successMsg && (
          <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm font-secret" role="alert">
            {successMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SIGNUP' && (
            <div>
              <label className="block font-sans-condensed font-bold uppercase text-xs mb-1">Alias / Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-b-2 border-black p-2 font-secret focus:outline-none focus:bg-yellow-50"
                placeholder="e.g. The Insider"
                required
              />
            </div>
          )}

          <div>
            <label className="block font-sans-condensed font-bold uppercase text-xs mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b-2 border-black p-2 font-secret focus:outline-none focus:bg-yellow-50"
              required
            />
          </div>

          {mode !== 'RESET' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-sans-condensed font-bold uppercase text-xs">Password</label>
                {mode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => { setMode('RESET'); setError(''); setSuccessMsg(''); }}
                    className="text-[10px] font-bold font-sans-condensed uppercase text-gray-500 hover:text-red-800 underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b-2 border-black p-2 font-secret focus:outline-none focus:bg-yellow-50"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 font-sans-condensed font-bold uppercase tracking-widest hover:bg-red-800 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : (mode === 'LOGIN' ? 'Enter' : (mode === 'SIGNUP' ? 'Sign Up' : 'Send Reset Link'))}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500 font-sans-condensed font-bold">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-black py-3 font-sans-condensed font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
            />
          </svg>
          Google
        </button>

        <div className="mt-6 text-center space-y-2">
          {mode === 'LOGIN' && (
            <button onClick={() => { setMode('SIGNUP'); setError(''); setSuccessMsg(''); }} className="text-xs font-secret underline hover:text-red-800">
              Need to create a new identity?
            </button>
          )}
          {mode === 'SIGNUP' && (
            <button onClick={() => { setMode('LOGIN'); setError(''); setSuccessMsg(''); }} className="text-xs font-secret underline hover:text-red-800">
              Already have an alias? Login.
            </button>
          )}
          {mode === 'RESET' && (
            <button onClick={() => { setMode('LOGIN'); setError(''); setSuccessMsg(''); }} className="text-xs font-secret underline hover:text-red-800">
              Remembered it? Back to Login.
            </button>
          )}
        </div>
      </div>
    </div>
  );
};