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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={11} /> BUY
          </span>
        );
      case 'WAIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock size={11} /> WAIT
          </span>
        );
      case 'AVOID':
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle size={11} /> AVOID
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600">
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
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF4D15] flex items-center justify-center font-bold">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-zinc-900">
                    Saved Verdicts & History
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {history.length} {history.length === 1 ? 'record' : 'records'} cached in session
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-200/60 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* User status banner if guest */}
            {!user && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-between">
                <div className="text-xs text-zinc-700">
                  <span className="font-bold text-orange-950 block">Browsing as Guest</span>
                  Sign in to keep evaluations permanently.
                </div>
                <button
                  onClick={() => { onClose(); onOpenAuth(); }}
                  className="px-3 py-1.5 bg-[#FF4D15] hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Filter Pills & Actions */}
            <div className="px-6 py-3 border-b border-zinc-100 flex items-center justify-between gap-2">
              <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filter === 'all' ? 'bg-white shadow-xs text-zinc-900' : 'text-zinc-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('verdict')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filter === 'verdict' ? 'bg-white shadow-xs text-zinc-900' : 'text-zinc-500'
                  }`}
                >
                  Verdicts
                </button>
                <button
                  onClick={() => setFilter('search')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filter === 'search' ? 'bg-white shadow-xs text-zinc-900' : 'text-zinc-500'
                  }`}
                >
                  Searches
                </button>
              </div>

              {history.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleExportReport}
                    title="Export Markdown Report"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={onClear}
                    title="Clear All History"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-400">
                  <ShoppingBag size={40} className="stroke-1 mb-2 text-zinc-300" />
                  <p className="text-sm font-semibold text-zinc-600">No evaluations saved yet</p>
                  <p className="text-xs text-zinc-400 max-w-xs mt-1">
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
                    className="group relative p-4 rounded-2xl bg-zinc-50 hover:bg-orange-50/40 border border-zinc-200/80 hover:border-orange-300/60 transition shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 cursor-pointer" onClick={() => onSelect(item)}>
                        <div className="flex items-center gap-2 mb-1.5">
                          {getVerdictBadge(item.verdict)}
                          {item.store && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              {item.store}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400 ml-auto">
                            {item.timestamp}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-800 line-clamp-2 group-hover:text-[#FF4D15] transition">
                          {item.productName || item.query}
                        </h4>
                        {item.price && (
                          <div className="text-xs font-semibold text-zinc-600 mt-1">
                            Price at evaluation: <span className="font-bold text-zinc-900">{item.price}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => onSelect(item)}
                          className="p-1.5 rounded-lg text-zinc-400 group-hover:text-[#FF4D15] hover:bg-orange-100/50 transition"
                          title="Open Verdict"
                        >
                          <ArrowUpRight size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 rounded-lg text-zinc-300 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer with Academic Note */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/80 text-[11px] text-zinc-400 flex items-center justify-between">
              <span>Data Store: D1 Cache & State</span>
              <span>Viva Tip: Fast instant demo reload</span>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
