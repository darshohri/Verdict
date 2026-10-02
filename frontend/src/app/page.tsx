"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Search, Menu, Loader2, CheckCircle2, AlertCircle, TrendingDown, TrendingUp, Minus, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence, Variants, useMotionValue, useSpring, useTransform } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import ScrollCurve from './ScrollCurve';
import Lenis from 'lenis';

let audioCtx: AudioContext | null = null;

const playDeepReverb = () => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const ctx = audioCtx;
  
  const masterGain = ctx.createGain();
  masterGain.gain.value = 1.0;
  masterGain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.0);

  const subOsc = ctx.createOscillator();
  subOsc.type = 'triangle';
  subOsc.frequency.setValueAtTime(100, ctx.currentTime);
  subOsc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.0);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.0);

  osc.connect(gain);
  subOsc.connect(gain);
  gain.connect(filter);
  filter.connect(masterGain);

  osc.start();
  subOsc.start();
  osc.stop(ctx.currentTime + 2.0);
  subOsc.stop(ctx.currentTime + 2.0);
};

export default function Home() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);
  
  const [clickCount, setClickCount] = useState(0);

  const lastClickTime = React.useRef(0);
  const handleHeadphoneClick = () => {
    if (isExpanded) return;
    
    const now = Date.now();
    if (now - lastClickTime.current < 1000) return;
    lastClickTime.current = now;
    
    playDeepReverb();
    setClickCount(prev => prev + 1);
  };

  const loadingMessages = [
    { title: "Extracting Intelligence...", desc: "Crawling reviews, comparing historical prices, and running sentiment analysis." },
    { title: "Analyzing Sentiments...", desc: "Reading through verified purchaser feedback to identify hidden flaws." },
    { title: "Evaluating Price Trends...", desc: "Checking historical price drops and identifying fake discounts." },
    { title: "Synthesizing Verdict...", desc: "Compiling the final decision with our proprietary models." }
  ];

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });

  const headphoneX = useTransform(smoothX, [-1, 1], [-30, 30]);
  const headphoneY = useTransform(smoothY, [-1, 1], [-30, 30]);
  const headphoneRotateX = useTransform(smoothY, [-1, 1], [10, -10]);
  const headphoneRotateY = useTransform(smoothX, [-1, 1], [-10, 10]);

  const textX = useTransform(smoothX, [-1, 1], [-15, 15]);
  const textY = useTransform(smoothY, [-1, 1], [-15, 15]);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(normalizedX);
      mouseY.set(normalizedY);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setLoadingStep(0);
      // Amazon is faster (~8s), Flipkart via Apify takes longer (~16s)
      const isAmazon = url.toLowerCase().includes('amazon');
      const intervalTime = isAmazon ? 2000 : 4000;
      
      interval = setInterval(() => {
        setLoadingStep(prev => {
          if (prev < loadingMessages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, intervalTime);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, url]);

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    const trimmedUrl = url.trim().toLowerCase();
    const cleanedUrl = trimmedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    
    if (cleanedUrl === 'amazon.com' || cleanedUrl === 'amazon.in' || cleanedUrl === 'flipkart.com') {
      setError("Please paste a link to a specific product (e.g. amazon.com/dp/B08X...), not the store's homepage.");
      return;
    }
    
    const isAmazonFullDomain = cleanedUrl.startsWith('amazon.com/') || cleanedUrl.startsWith('amazon.in/');
    const isFlipkartFullDomain = cleanedUrl.startsWith('flipkart.com/');
    
    if (isAmazonFullDomain && !cleanedUrl.includes('/dp/') && !cleanedUrl.includes('/gp/') && !cleanedUrl.includes('/product/')) {
      setError("Oops! We couldn't find a valid product at this URL. Please make sure you entered a real, existing product link.");
      return;
    }
    
    if (isFlipkartFullDomain && !cleanedUrl.includes('/p/') && !cleanedUrl.includes('pid=')) {
      setError("Oops! We couldn't find a valid product at this URL. Please make sure you entered a real, existing product link.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    const startTime = Date.now();
    const isAmazon = url.toLowerCase().includes('amazon');
    const minLoadingTime = isAmazon ? 8000 : 16000;

    try {
      const response = await fetch('/api/index?action=evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ search_query: url }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze product. Please try again.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await new Promise(r => setTimeout(r, minLoadingTime - elapsedTime));
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatMessage('');
    setIsChatting(true);
    
    try {
      const response = await fetch('/api/index?action=chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg,
          context: result ? JSON.stringify(result) : ""
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict?.toUpperCase()) {
      case 'BUY': return 'bg-[#00E573] text-black shadow-[0_0_30px_rgba(0,229,115,0.5)] ring-4 ring-offset-2 ring-[#00E573]/30';
      case 'WAIT': return 'bg-[#FFB800] text-black shadow-[0_0_30px_rgba(255,184,0,0.5)] ring-4 ring-offset-2 ring-[#FFB800]/30';
      case 'PASS':
      case 'AVOID': return 'bg-[#FF3366] text-white shadow-[0_0_30px_rgba(255,51,102,0.5)] ring-4 ring-offset-2 ring-[#FF3366]/30';
      default: return 'bg-zinc-800 text-white shadow-lg';
    }
  };

  const isExpanded = isAnalyzing || result || error;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const resetToHome = () => {
    setUrl('');
    setIsAnalyzing(false);
    setResult(null);
    setError(null);
    setChatHistory([]);
    setIsChatOpen(false);
  };

  return (
    <div 
      className={`relative w-full flex flex-col font-sans text-zinc-900 overflow-x-hidden ${isExpanded ? 'min-h-screen' : 'h-screen overflow-hidden'}`}
      style={{ background: 'linear-gradient(to bottom, #C4E0FA 0%, #DCEBFA 40%, #FFFFFF 100%)' }}
    >
      {/* Subtle Architectural Grid Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Top Nav */}
      <nav className="w-full p-8 flex justify-between items-center z-40 relative shrink-0">
        <AnimatePresence>
          {isExpanded ? (
            <motion.button 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={resetToHome}
              className="w-12 h-12 border-2 border-[#FF4D15] rounded-full flex items-center justify-center text-[#FF4D15] hover:bg-[#FF4D15] hover:text-white hover:scale-105 transition-all shadow-lg shadow-[#FF4D15]/20"
            >
              <ArrowLeft size={26} strokeWidth={2.5} />
            </motion.button>
          ) : (
            <div />
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section - Shrinks and moves up to make space for results */}
      <motion.div 
        layout
        initial={false}
        animate={{ 
          height: isExpanded ? (typeof window !== 'undefined' && window.innerWidth >= 768 ? 160 : 120) : 'calc(100vh - 200px)' 
        }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col items-center justify-center shrink-0"
      >
        <motion.main 
          className="w-full relative z-10 select-none"
          style={{ 
            display: 'grid', 
            placeItems: 'center',
            transformOrigin: 'center'
          }}
          animate={{
            scale: isExpanded ? 0.25 : 1,
            y: 0
          }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.h1 
            className="z-10 font-black tracking-tighter whitespace-nowrap pointer-events-none select-none"
            style={{ 
              gridArea: '1 / 1', 
              fontSize: 'clamp(64px, 22vw, 360px)', 
              color: '#FF4D15', 
              lineHeight: 1,
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            VERDIC<span style={{ marginLeft: '0.04em' }}>T</span>
          </motion.h1>

          <AnimatePresence>
            {clickCount > 0 && (
              <motion.div
                key={clickCount}
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 3.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute z-10 rounded-full pointer-events-none mix-blend-multiply"
                style={{ 
                  width: 'clamp(300px, 45vw, 600px)',
                  height: 'clamp(300px, 45vw, 600px)',
                  gridArea: '1 / 1',
                  background: 'radial-gradient(circle, rgba(255,77,21,0.6) 0%, rgba(255,77,21,0) 70%)',
                }}
              />
            )}
          </AnimatePresence>
          
          {/* The Physical Object (Middle Layer) */}
          <motion.img 
            draggable={false}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            whileTap={isExpanded ? {} : { scale: 0.95 }}
            onClick={handleHeadphoneClick}
            src="/headphones-cutout.png" 
            alt="Product Visual" 
            className={`z-20 object-contain drop-shadow-2xl select-none ${isExpanded ? 'pointer-events-none' : 'cursor-pointer'}`}
            style={{ 
              gridArea: '1 / 1', 
              width: 'clamp(300px, 45vw, 600px)',
              x: headphoneX,
              y: headphoneY,
              rotateX: headphoneRotateX,
              rotateY: headphoneRotateY,
              perspective: 1000
            }}
          />

        </motion.main>
      </motion.div>

      {/* Bottom Search Dock */}
      <motion.div 
        layout 
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-30 w-full max-w-3xl mx-auto px-4 md:px-6 flex flex-col items-center ${isExpanded ? 'pb-8 pt-4 md:pt-8 md:pb-12' : 'pb-8'}`}
      >
        <div className={`w-full bg-white rounded-[2rem] p-2 md:p-3 border flex items-center gap-2 md:gap-3 relative transition-all duration-500 ${isExpanded ? 'shadow-lg border-zinc-200' : 'shadow-2xl border-zinc-200 hover:shadow-3xl'}`}>
          <div className="pl-3 md:pl-4 text-zinc-400 shrink-0"><Search size={22} className="w-5 h-5 md:w-6 md:h-6" /></div>
          <input 
            type="text" 
            placeholder="Paste Amazon or Flipkart URL..." 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-zinc-800 placeholder:text-zinc-400 font-medium py-3 text-xs sm:text-sm md:text-base"
          />
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-black hover:bg-[#FF4D15] text-white px-5 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold uppercase text-[10px] md:text-[11px] tracking-widest transition-colors flex items-center justify-center gap-1 md:gap-2 group shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isAnalyzing ? (
              <>Analyze</>
            ) : (
              <>Analyze <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform w-3 h-3 md:w-4 md:h-4" /></>
            )}
          </button>
        </div>
      </motion.div>
      
      {/* Dynamic Results Dashboard */}
      <div ref={resultsRef} className={`relative w-full transition-all duration-1000 ease-in-out flex-1 flex flex-col ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none h-0 overflow-hidden'}`}>
        {/* Scroll-driven decorative curve — full width behind everything */}
        {result && !isAnalyzing && !error && <ScrollCurve containerRef={resultsRef} />}

        <div className="w-full max-w-5xl mx-auto px-6 relative z-10">
        
        <AnimatePresence mode="wait">
          {/* Error State */}
          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-start gap-4 mb-8"
            >
              <AlertCircle className="shrink-0 mt-1" />
              <div>
                <h3 className="font-bold mb-1">Analysis Failed</h3>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isAnalyzing && !error && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full flex flex-col items-center justify-center pt-8 pb-24 text-zinc-400 gap-6"
            >
              <AnimatePresence mode="wait">
                <motion.div 
                  key={loadingStep} 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 mb-2">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                  <h3 className="text-zinc-800 font-bold tracking-tight text-2xl">{loadingMessages[loadingStep].title}</h3>
                  <p className="text-base text-zinc-500 max-w-sm">{loadingMessages[loadingStep].desc}</p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {/* Success Results State */}
          {result && !isAnalyzing && !error && (
            <motion.div 
              key="result"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="w-full pb-24"
            >
              {/* Product Header */}
              <motion.div variants={itemVariants} className="relative overflow-hidden mb-16 bg-white p-8 md:p-12 rounded-[2.5rem] border border-zinc-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                  <div className="relative w-48 h-48 md:w-72 md:h-72 shrink-0 group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-100 to-zinc-50 rounded-[2rem] transform transition-transform duration-700 group-hover:scale-105 group-hover:rotate-3" />
                    <div className="absolute inset-0 flex items-center justify-center p-6 transform transition-transform duration-700 group-hover:scale-110">
                      <img src={result.product_image || "/headphones-cutout.png"} alt="Product" className="w-full h-full object-contain mix-blend-multiply filter drop-shadow-xl" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left flex flex-col justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 text-xs font-bold tracking-widest mb-6 w-fit mx-auto md:mx-0">
                      <Sparkles size={12} className="text-[#FF4D15]" />
                      VERDICT ANALYSIS COMPLETE
                    </div>
                    <h3 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-700 mb-8 leading-[1.1] max-w-3xl">
                      {result.product_name || "Unknown Product"}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <div className={`px-10 py-4 rounded-full text-lg md:text-xl font-black tracking-[0.15em] transition-transform hover:-translate-y-1 ${getVerdictColor(result.verdict)}`}>
                        VERDICT: {result.verdict}
                      </div>
                      <div className="text-sm font-semibold text-zinc-700 bg-white border border-zinc-200 px-6 py-3 rounded-full shadow-sm flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-[#FF4D15]" />
                        {result.confidence_score}% CONFIDENCE
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Header / Verdict Summary */}
              <motion.div variants={itemVariants} className="mb-20 px-4 md:px-8 relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF4D15] rounded-full hidden md:block" />
                <h2 className="text-xl md:text-3xl font-medium tracking-tight text-zinc-800 leading-relaxed max-w-4xl">
                  {result.executive_summary}
                </h2>
              </motion.div>

              {/* Grid Layout for details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
                {/* Pros */}
                <motion.div variants={itemVariants} whileHover={{ y: -8 }} className="bg-white rounded-[2rem] p-8 md:p-10 border border-zinc-200 shadow-sm transition-all hover:shadow-2xl hover:shadow-green-500/10 hover:border-green-200 group">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={24} strokeWidth={2.5} />
                    </div>
                    <h3 className="font-bold tracking-widest uppercase text-sm text-zinc-900">The Good</h3>
                  </div>
                  <ul className="space-y-5">
                    {result.pros_recap.map((pro: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-4 text-base leading-relaxed text-zinc-600">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2.5 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                        <span className="flex-1">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Cons */}
                <motion.div variants={itemVariants} whileHover={{ y: -8 }} className="bg-white rounded-[2rem] p-8 md:p-10 border border-zinc-200 shadow-sm transition-all hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-200 group">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                      <Minus size={24} strokeWidth={2.5} />
                    </div>
                    <h3 className="font-bold tracking-widest uppercase text-sm text-zinc-900">The Bad</h3>
                  </div>
                  <ul className="space-y-5">
                    {result.cons_recap.map((con: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-4 text-base leading-relaxed text-zinc-600">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-2.5 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
                        <span className="flex-1">{con}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Price Trend & Auth */}
                <div className="flex flex-col gap-6 md:gap-8">
                  <motion.div variants={itemVariants} whileHover={{ y: -4, x: 4 }} className="bg-white rounded-[2rem] p-8 md:p-10 border border-zinc-200 shadow-sm transition-all hover:shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4D15]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                    <div className="flex items-center gap-4 mb-6 text-zinc-400 relative z-10">
                      <TrendingDown size={22} className="text-[#FF4D15] group-hover:scale-110 transition-transform" />
                      <h3 className="font-bold tracking-widest uppercase text-sm text-zinc-900">Price Trend</h3>
                    </div>
                    <p className="text-base leading-relaxed text-zinc-600 relative z-10">
                      {result.price_trend_summary}
                    </p>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} whileHover={{ y: -4, x: 4 }} className="bg-white rounded-[2rem] p-8 md:p-10 border border-zinc-200 shadow-sm flex-1 transition-all hover:shadow-xl group">
                    <div className="flex items-center gap-4 mb-6 text-zinc-400">
                      <AlertCircle size={22} className="text-blue-500 group-hover:scale-110 transition-transform" />
                      <h3 className="font-bold tracking-widest uppercase text-sm text-zinc-900">Authenticity</h3>
                    </div>
                    <p className="text-base leading-relaxed text-zinc-600">
                      {result.review_authenticity_summary}
                    </p>
                  </motion.div>
                </div>
              </div>
              
              {/* Supporting Evidence */}
              <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-zinc-200 shadow-sm">
                 <div className="flex items-center gap-3 mb-10">
                   <div className="w-2 h-8 bg-[#FF4D15] rounded-full" />
                   <h3 className="font-black tracking-widest uppercase text-lg text-zinc-900">Deep Dive</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                   {result.supporting_evidence.map((evidence: string, idx: number) => {
                      const cleanEvidence = evidence.replace(/^[\s\W]*(bullet point|point|bullet|-)[\s\W]*/gi, '');
                      return (
                        <div key={idx} className="flex items-start gap-5 group">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 group-hover:bg-[#FF4D15] mt-1.5 shrink-0 transition-colors duration-300 shadow-sm" />
                          <p className="text-[15px] text-zinc-600 leading-relaxed font-medium">
                            {cleanEvidence}
                          </p>
                        </div>
                      );
                   })}
                 </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>{/* close inner max-w wrapper */}
      </div>

      {/* Floating AI Chat */}
      {result && !isAnalyzing && !error && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {/* Chat Window */}
          <div 
            className={`transition-all duration-300 origin-bottom-right mb-4 ${
              isChatOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-75 opacity-0 pointer-events-none'
            } w-[450px] bg-white/90 backdrop-blur-md border border-white/60 shadow-2xl rounded-3xl overflow-hidden flex flex-col`}
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between bg-gradient-to-r from-[#DCEBFA] to-white border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4D15] to-[#FF8A00] flex items-center justify-center text-white shadow-md">
                  <Sparkles size={18} />
                </div>
                <h3 className="font-bold tracking-tight text-zinc-900 text-base">Verdict AI Assistant</h3>
              </div>
            </div>
            
            {/* Messages */}
            <div className="h-[450px] p-5 overflow-y-auto flex flex-col gap-4 bg-white/50">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <MessageSquare size={36} className="mb-4 text-[#FF4D15]" />
                  <p className="text-sm text-zinc-600 px-4">Ask anything about {result.product_name || "this product"}</p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 text-[15px] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#FF4D15] text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white border border-zinc-100 text-zinc-800 rounded-2xl rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-li:my-1 prose-ul:list-disc prose-ul:ml-4 prose-ol:list-decimal prose-ol:ml-4 prose-strong:font-bold prose-strong:text-black">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))
              )}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="p-3 bg-white border border-zinc-100 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-3 bg-white border-t border-zinc-100">
              <div className="flex items-center gap-2 bg-zinc-50 rounded-xl p-1.5 border border-zinc-200 focus-within:border-[#FF4D15]/50 transition-colors">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  placeholder="Ask a question..."
                  className="flex-1 bg-transparent border-none outline-none text-xs px-2 text-zinc-900 placeholder:text-zinc-400"
                />
                <button 
                  onClick={handleChat}
                  disabled={!chatMessage.trim() || isChatting}
                  className="w-8 h-8 rounded-lg bg-black hover:bg-[#FF4D15] text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={14} className={chatMessage.trim() && !isChatting ? "ml-0.5" : ""} />
                </button>
              </div>
            </div>
          </div>

          {/* FAB Button */}
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-105 ${
              isChatOpen ? 'bg-[#FF4D15] hover:bg-[#FF6A3D] rotate-90' : 'bg-[#FF4D15] hover:bg-[#FF6A3D]'
            }`}
          >
            {isChatOpen ? <X size={24} /> : <Sparkles size={24} />}
          </button>
        </div>
      )}

    </div>
  );
}
