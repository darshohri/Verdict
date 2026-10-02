"use client";

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Search, Menu, Loader2, CheckCircle2, AlertCircle, TrendingDown, TrendingUp, Minus, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);
  
  const loadingMessages = [
    { title: "Extracting Intelligence...", desc: "Crawling reviews, comparing historical prices, and running sentiment analysis." },
    { title: "Analyzing Sentiments...", desc: "Reading through verified purchaser feedback to identify hidden flaws." },
    { title: "Evaluating Price Trends...", desc: "Checking historical price drops and identifying fake discounts." },
    { title: "Synthesizing Verdict...", desc: "Compiling the final decision with our proprietary models." }
  ];

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
    switch (verdict) {
      case 'BUY': return 'bg-green-500 text-white';
      case 'WAIT': return 'bg-yellow-500 text-black';
      case 'AVOID': return 'bg-red-500 text-white';
      default: return 'bg-zinc-800 text-white';
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
      className="relative w-full min-h-screen flex flex-col font-sans text-zinc-900 overflow-hidden"
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
        className={`w-full flex flex-col items-center transition-all duration-1000 ease-in-out ${isExpanded ? 'h-[120px] md:h-[160px] shrink-0' : 'flex-1 justify-center -mt-12'}`}
      >
        <main 
          className="w-full relative z-10 transition-transform duration-1000 ease-in-out"
          style={{ 
            display: 'grid', 
            placeItems: 'center',
            transform: isExpanded ? 'scale(0.25) translateY(0%)' : 'scale(1) translateY(0)',
            transformOrigin: 'top center'
          }}
        >
          <h1 
            className="z-10 font-black tracking-tighter whitespace-nowrap pointer-events-none select-none transition-all duration-1000"
            style={{ 
              gridArea: '1 / 1', 
              fontSize: 'clamp(64px, 14vw, 360px)', 
              color: '#FF4D15', 
              lineHeight: 1,
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            VERDIC<span style={{ marginLeft: '0.04em' }}>T</span>
          </h1>
          
          {/* The Physical Object (Middle Layer) */}
          <motion.img 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            src="/headphones-cutout.png" 
            alt="Product Visual" 
            className="z-20 object-contain pointer-events-none drop-shadow-2xl transition-transform duration-700 hover:scale-105"
            style={{ 
              gridArea: '1 / 1', 
              width: 'clamp(300px, 45vw, 600px)'
            }}
          />

          <h1 
            className="z-30 font-black tracking-tighter whitespace-nowrap pointer-events-none select-none transition-all duration-1000"
            style={{ 
              gridArea: '1 / 1', 
              fontSize: 'clamp(64px, 14vw, 360px)', 
              color: '#FF4D15', 
              lineHeight: 1,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              clipPath: 'polygon(0 0, 39% 0, 39% 100%, 0 100%)'
            }}
          >
            VERDIC<span style={{ marginLeft: '0.04em' }}>T</span>
          </h1>
        </main>
      </motion.div>

      {/* Bottom Search Dock */}
      <motion.div layout className={`relative z-30 w-full max-w-3xl mx-auto px-4 md:px-6 flex flex-col items-center transition-all duration-1000 ease-in-out ${isExpanded ? 'pb-8 pt-4 md:pt-8 md:pb-12' : 'pb-12 -mt-4 md:-mt-8'}`}>
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
      <div className={`w-full max-w-5xl mx-auto px-6 transition-all duration-1000 ease-in-out flex-1 flex flex-col ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none h-0 overflow-hidden'}`}>
        
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
              className="w-full pb-20"
            >
              {/* Product Header */}
              <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center gap-12 mb-16 bg-white/40 backdrop-blur-3xl p-8 md:p-14 rounded-[3rem] border border-white/80 shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
                <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 bg-white rounded-[2.5rem] p-8 shadow-sm flex items-center justify-center mix-blend-multiply transition-transform hover:scale-105 duration-500">
                  <img src={result.product_image || "/headphones-cutout.png"} alt="Product" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 text-center md:text-left flex flex-col justify-center">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-800 mb-6 leading-tight max-w-3xl">
                    {result.product_name || "Unknown Product"}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-widest shadow-sm ${getVerdictColor(result.verdict)}`}>
                      VERDICT: {result.verdict}
                    </div>
                    <div className="text-sm font-semibold text-zinc-600 bg-white/80 px-5 py-2.5 rounded-full shadow-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-500" />
                      {result.confidence_score}% CONFIDENCE
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Header / Verdict Summary */}
              <motion.div variants={itemVariants} className="mb-20 px-6">
                <h2 className="text-xl md:text-2xl font-medium tracking-tight text-zinc-600 leading-relaxed max-w-4xl mx-auto md:mx-0">
                  {result.executive_summary}
                </h2>
              </motion.div>

              {/* Grid Layout for details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-20">
                {/* Pros */}
                <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 md:p-12 border border-white/60 shadow-sm transition-all hover:shadow-xl hover:shadow-green-500/10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircle2 size={20} />
                    </div>
                    <h3 className="font-bold tracking-widest uppercase text-sm text-zinc-800">The Good</h3>
                  </div>
                  <ul className="space-y-6">
                    {result.pros_recap.map((pro: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-4 text-[15px] leading-relaxed text-zinc-600">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Cons */}
                <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 md:p-12 border border-white/60 shadow-sm transition-all hover:shadow-xl hover:shadow-red-500/10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <Minus size={20} />
                    </div>
                    <h3 className="font-bold tracking-widest uppercase text-sm text-zinc-800">The Bad</h3>
                  </div>
                  <ul className="space-y-6">
                    {result.cons_recap.map((con: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-4 text-[15px] leading-relaxed text-zinc-600">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Price Trend & Auth */}
                <div className="flex flex-col gap-8 md:gap-10">
                  <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 md:p-12 border border-white/60 shadow-sm transition-all hover:shadow-xl">
                    <div className="flex items-center gap-4 mb-8 text-zinc-400">
                      <TrendingDown size={20} />
                      <h3 className="font-bold tracking-widest uppercase text-sm text-zinc-800">Price Trend</h3>
                    </div>
                    <p className="text-[15px] leading-relaxed text-zinc-600">
                      {result.price_trend_summary}
                    </p>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 md:p-12 border border-white/60 shadow-sm flex-1 transition-all hover:shadow-xl">
                    <div className="flex items-center gap-4 mb-8 text-zinc-400">
                      <AlertCircle size={20} />
                      <h3 className="font-bold tracking-widest uppercase text-sm text-zinc-800">Review Authenticity</h3>
                    </div>
                    <p className="text-[15px] leading-relaxed text-zinc-600">
                      {result.review_authenticity_summary}
                    </p>
                  </motion.div>
                </div>
              </div>
              
              {/* Supporting Evidence */}
              <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 md:p-12 border border-white/60 shadow-sm mb-12">
                 <h3 className="font-bold tracking-widest uppercase text-sm mb-8 text-zinc-800">Deep Dive</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                   {result.supporting_evidence.map((evidence: string, idx: number) => (
                      <p key={idx} className="text-[15px] text-zinc-600 leading-relaxed">
                        {evidence}
                      </p>
                   ))}
                 </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
