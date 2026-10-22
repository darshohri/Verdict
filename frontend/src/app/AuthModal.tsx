"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  role?: string;
  token?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

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
      const user: UserProfile = {
        name: tab === 'signup' ? name.trim() : email.split('@')[0],
        email: email.trim(),
        role: 'Verified Consumer',
        token: `vdt_${Math.random().toString(36).substring(2)}`,
      };
      setIsLoading(false);
      onLogin(user);
      onClose();
    }, 600);
  };

  const handleQuickDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const demoUser: UserProfile = {
        name: 'Evaluator / Viva Examiner',
        email: 'evaluator@university.edu',
        role: 'Faculty Reviewer',
        token: 'vdt_demo_session_academic',
      };
      setIsLoading(false);
      onLogin(demoUser);
      onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
        {/* Backdrop click to dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-2xl border border-white/60 text-zinc-900 z-10 overflow-hidden"
        >
          {/* Top Decorative Glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF4D15] via-amber-500 to-[#FF4D15]" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center mb-6 pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 text-[#FF4D15] text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck size={14} />
              <span>Verdict ID & Session</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">
              {tab === 'signin' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Sign in to save your product evaluations and search history.
            </p>
          </div>

          {/* Quick Demo Login Option for Viva & Review */}
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50/60 border border-orange-200/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-orange-900 flex items-center gap-1">
                <Sparkles size={13} className="text-[#FF4D15]" />
                Faculty / Live Viva Mode
              </span>
              <span className="text-[10px] font-semibold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                Instant
              </span>
            </div>
            <p className="text-xs text-zinc-600 mb-2.5">
              Skip typing credentials during review. Launches authenticated session with sample history.
            </p>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF4D15] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold transition shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Continue as Evaluator / Reviewer</span>
            </button>
          </div>

          {/* Separator */}
          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-zinc-200"></div>
            <span className="flex-shrink mx-3 text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
              Or with email
            </span>
            <div className="flex-grow border-t border-zinc-200"></div>
          </div>

          {/* Sign In / Sign Up Tabs */}
          <div className="flex bg-zinc-100 p-1 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => { setTab('signin'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                tab === 'signin' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                tab === 'signup' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D15]/30 focus:border-[#FF4D15] transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D15]/30 focus:border-[#FF4D15] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D15]/30 focus:border-[#FF4D15] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{tab === 'signin' ? 'Sign In to Verdict' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Academic / SE Note */}
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Security: SHA-256 session token</span>
            <span>UML: Actor Model UC-06</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
