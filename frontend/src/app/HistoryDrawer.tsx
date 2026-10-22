"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, History, Trash2, ArrowUpRight, CheckCircle2, Clock, 
  AlertTriangle, Sparkles, Download, ExternalLink, ShoppingBag 
} from 'lucide-react';
import { UserProfile } from './AuthModal';

export interface HistoryItem {
  id: string;
  query: string;
  type: 'evaluation' | 'search';
  store?: 'amazon' | 'flipkart' | 'general';
  verdict?: 'BUY' | 'WAIT' | 'AVOID' | 'PASS';
  confidenceScore?: number;
  productName?: string;
  price?: string | number;
  timestamp: string;
  data: any;
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
  onDelete,
  user,
  onOpenAuth,
}: HistoryDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'verdict' | 'search'>('all');

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'verdict') return item.type === 'evaluation';
    if (filter === 'search') return item.type === 'search';
    return true;
  });

  const getVerdictBadge = (verdict?: string) => {
    switch (verdict?.toUpperCase()) {
      case 'BUY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} /> BUY
          </span>
        );
      case 'WAIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={11} /> WAIT
          </span>
        );
      case 'AVOID':
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={11} /> AVOID
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600">
            <Sparkles size={11} /> RESULT
          </span>
        );
    }
  };

  const handleExportReport = () => {
    if (!history.length) return;
    const report = [
      `# VERDICT EVALUATION REPORT`,
      `Generated on: ${new Date().toLocaleString()}`,
      `User: ${user ? `${user.name} (${user.email})` : 'Guest User'}`,
      `Total Evaluations: ${history.length}`,
      `----------------------------------------`,
      '',
      ...history.map((item, idx) => {
        return [
          `## ${idx + 1}. ${item.productName || item.query}`,
          `- Type: ${item.type.toUpperCase()}`,
          `- Store: ${item.store || 'N/A'}`,
          `- Verdict: ${item.verdict || 'N/A'} (Score: ${item.confidenceScore ?? 'N/A'}%)`,
          item.price ? `- Price: ${item.price}` : '',
          `- Evaluated at: ${item.timestamp}`,
          '',
        ].filter(Boolean).join('\n');
      }),
    ].join('\n');

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Verdict_Evaluation_Report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        />

        {/* Slide-over Drawer Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-screen max-w-md bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-zinc-200/80 flex flex-col text-zinc-900"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200/60 text-zinc-600 flex items-center justify-center">
                  <History size={15} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
                    Saved Verdicts & History
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-normal">
                    {history.length} {history.length === 1 ? 'record' : 'records'} cached in session
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg hover:bg-zinc-200/60 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* User status banner if guest */}
            {!user && (
              <div className="mx-6 mt-3 px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                <div className="text-xs text-zinc-600">
                  <span className="font-medium text-zinc-900 block text-[11px]">Guest Session</span>
                  <span className="text-[11px] text-zinc-400">Sign in to save evaluations to your account.</span>
                </div>
                <button
                  onClick={() => { onClose(); onOpenAuth(); }}
                  className="px-3 py-1 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-lg transition shadow-xs cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Filter Pills & Actions */}
            <div className="px-6 py-2.5 border-b border-zinc-100 flex items-center justify-between gap-2">
              <div className="flex gap-1 bg-zinc-100/80 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md text-xs transition cursor-pointer ${
                    filter === 'all'
                      ? 'bg-white shadow-xs text-zinc-900 font-medium'
                      : 'text-zinc-500 hover:text-zinc-800 font-normal'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('verdict')}
                  className={`px-3 py-1 rounded-md text-xs transition cursor-pointer ${
                    filter === 'verdict'
                      ? 'bg-white shadow-xs text-zinc-900 font-medium'
                      : 'text-zinc-500 hover:text-zinc-800 font-normal'
                  }`}
                >
                  Verdicts
                </button>
                <button
                  onClick={() => setFilter('search')}
                  className={`px-3 py-1 rounded-md text-xs transition cursor-pointer ${
                    filter === 'search'
                      ? 'bg-white shadow-xs text-zinc-900 font-medium'
                      : 'text-zinc-500 hover:text-zinc-800 font-normal'
                  }`}
                >
                  Searches
                </button>
              </div>

              {history.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleExportReport}
                    title="Export Markdown Report"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={onClear}
                    title="Clear All History"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
              {filteredHistory.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-400">
                  <ShoppingBag size={36} className="stroke-1 mb-2 text-zinc-300" />
                  <p className="text-xs font-medium text-zinc-600">No evaluations saved yet</p>
                  <p className="text-[11px] text-zinc-400 max-w-xs mt-1">
                    Paste an Amazon or Flipkart link to generate a synthesis and save it here.
                  </p>
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative p-3.5 rounded-xl bg-zinc-50/70 hover:bg-orange-50/30 border border-zinc-200/70 hover:border-orange-300/50 transition shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 cursor-pointer" onClick={() => onSelect(item)}>
                        <div className="flex items-center gap-2 mb-1.5">
                          {getVerdictBadge(item.verdict)}
                          {item.store && (
                            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                              {item.store}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400 ml-auto font-normal">
                            {item.timestamp}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-zinc-800 line-clamp-2 group-hover:text-[#FF4D15] transition leading-snug">
                          {item.productName || item.query}
                        </h4>
                        {item.price && (
                          <div className="text-[11px] font-normal text-zinc-500 mt-1">
                            Price: <span className="font-medium text-zinc-800">{item.price}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => onSelect(item)}
                          className="p-1.5 rounded-lg text-zinc-400 group-hover:text-[#FF4D15] hover:bg-orange-100/50 transition cursor-pointer"
                          title="Open Verdict"
                        >
                          <ArrowUpRight size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 rounded-lg text-zinc-300 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/80 text-[11px] text-zinc-400 flex items-center justify-between">
              <span>Saved locally in browser</span>
              <span>Verdict Intelligence</span>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
