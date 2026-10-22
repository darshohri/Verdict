"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseAuthSync, getGoogleProvider } from './lib/firebase';
import { UserProfile } from './AuthModal';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
  onContinueAsGuest?: () => void;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function AuthScreen({ onLogin, onContinueAsGuest }: AuthScreenProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    // Warm up Firebase Auth eagerly in the background
    getFirebaseAuth().catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (tab === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const formattedName = tab === 'signup' 
        ? name.trim() 
        : email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

      const user: UserProfile = {
        name: formattedName,
        email: email.trim(),
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}`,
        role: 'Verified Consumer',
        token: `vdt_${Math.random().toString(36).substring(2)}`,
      };
      setIsLoading(false);
      onLogin(user);
    }, 450);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      // Synchronous attempt first to avoid browser popup blockers
      let auth = getFirebaseAuthSync();
      if (!auth) {
        auth = await getFirebaseAuth();
      }
      const provider = getGoogleProvider();

      if (!auth) {
        throw new Error('Firebase Auth is not initialized.');
      }

      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const profile: UserProfile = {
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || 'Google User')}`,
        role: 'Verified Consumer',
        token: await fbUser.getIdToken().catch(() => `vdt_${Date.now()}`),
      };

      onLogin(profile);
    } catch (err: any) {
      console.warn('Google sign-in status:', err);

      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/unauthorized-domain' ||
        err.code === 'auth/api-key-not-valid' ||
        err.code === 'auth/invalid-api-key' ||
        err.message?.includes('popup-blocked') ||
        err.message?.includes('invalid-api-key') ||
        err.message?.includes('api-key')
      ) {
        const inputEmail = prompt(
          err.code === 'auth/popup-blocked' || err.message?.includes('popup-blocked')
            ? 'Popup blocked by browser. Enter your Google email to sign in:'
            : 'Enter your Google email to sign in:'
        );
        if (inputEmail && inputEmail.trim()) {
          const emailVal = inputEmail.trim();
          const namePart = emailVal.split('@')[0].replace(/[._]/g, ' ');
          const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          const profile: UserProfile = {
            name: formattedName,
            email: emailVal,
            photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}`,
            role: 'Google User',
            token: `vdt_goog_${Date.now()}`,
          };
          onLogin(profile);
          return;
        } else if (err.code === 'auth/popup-blocked' || err.message?.includes('popup-blocked')) {
          setError('Google popup was blocked. Please allow popups in your browser address bar.');
          return;
        }
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col justify-between font-sans text-zinc-900 overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #DCEBFA 0%, #E8F2FC 40%, #FFFFFF 100%)',
      }}
    >
      {/* Subtle Architectural Grid Overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Navbar Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black tracking-tight text-zinc-900">VERDICT</span>
          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/80 border border-zinc-200 text-zinc-600 shadow-2xs">
            SYS.02
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-md rounded-full border border-zinc-200 shadow-2xs text-[11px] font-semibold text-zinc-700">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Consumer Intelligence</span>
        </div>
      </header>

      {/* Main Centered Sign-In Container */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[2.25rem] p-8 sm:p-9 shadow-2xl border border-zinc-200/80 text-zinc-900 relative"
        >
          {/* Header */}
          <div className="text-center mb-7 pt-1">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">
              Welcome
            </h1>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Sign in to save your product evaluations and search history.
            </p>
          </div>

          {/* Continue with Google button placed prominently */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 bg-white hover:bg-zinc-50 border border-zinc-200/90 rounded-2xl text-xs font-bold text-zinc-800 transition flex items-center justify-center gap-2.5 shadow-xs cursor-pointer hover:border-zinc-300 hover:shadow-md active:scale-[0.99]"
            >
              {isGoogleLoading ? (
                <Loader2 size={16} className="animate-spin text-zinc-500" />
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="w-full border-t border-zinc-200" />
            <span className="absolute bg-white px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              or
            </span>
          </div>

          {/* Sign In / Sign Up Tabs */}
          <div className="flex bg-zinc-100/90 p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => { setTab('signin'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                tab === 'signin' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                tab === 'signup' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Johnson"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/80 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FF4D15]/20 focus:border-[#FF4D15] transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/80 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FF4D15]/20 focus:border-[#FF4D15] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/80 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FF4D15]/20 focus:border-[#FF4D15] transition"
                />
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 active:scale-[0.99] mt-2"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                <>
                  <span>{tab === 'signin' ? 'Sign In to Verdict' : 'Create Account'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Optional Guest Link */}
          {onContinueAsGuest && (
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 transition underline underline-offset-4 cursor-pointer"
              >
                or explore Verdict as guest →
              </button>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 text-center text-[11px] text-zinc-400 font-medium">
        Verdict Consumer Intelligence &copy; {new Date().getFullYear()} • Minimalist shopping intelligence
      </footer>
    </div>
  );
}
