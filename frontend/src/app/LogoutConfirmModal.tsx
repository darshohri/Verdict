"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm">
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
          initial={{ scale: 0.95, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 8 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border border-zinc-200/80 text-zinc-900 z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
            aria-label="Cancel"
          >
            <X size={14} />
          </button>

          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
            <LogOut size={20} />
          </div>

          {/* Heading */}
          <h3 className="text-lg font-bold text-zinc-900 tracking-tight mb-1.5">
            Log out of Verdict?
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed mb-6">
            Are you sure you want to sign out{userName ? `, ${userName}` : ''}? Your search and evaluation history will remain saved for your next session.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:shadow-md active:scale-[0.98]"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
