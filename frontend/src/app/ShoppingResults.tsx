import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Star, MessageCircle, ShieldCheck, Tag, Trophy, ArrowRight } from 'lucide-react';

export default function ShoppingResults({ data }: { data: any }) {
  if (!data || !data.results || data.results.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-6 relative z-10 pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-white rounded-3xl border border-zinc-200 shadow-sm"
      >
        <h2 className="text-2xl font-bold text-zinc-800 mb-2">Shopping Intelligence Verdict</h2>
        <p className="text-zinc-500">
          We analyzed {data.marketplaces.amazon.resultCount + data.marketplaces.flipkart.resultCount} products across Amazon and Flipkart for "{data.query}". Here are the top ranked options:
        </p>
      </motion.div>

      <div className="flex flex-col gap-8">
        {data.results.map((group: any, idx: number) => {
          const isBestOverall = group.badges.includes("Best Overall");
          
          return (
            <motion.div 
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative overflow-hidden bg-white p-6 md:p-8 rounded-[2rem] border ${
                isBestOverall ? 'border-[#FF4D15] shadow-lg shadow-[#FF4D15]/10' : 'border-zinc-200 shadow-sm'
              }`}
            >
              {isBestOverall && (
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FF4D15]" />
              )}
              
              <div className="flex flex-col md:flex-row gap-8">
                {/* Image */}
                <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 bg-zinc-50 rounded-2xl p-4 flex items-center justify-center">
                  {group.image ? (
                    <img src={`https://wsrv.nl/?url=${encodeURIComponent(group.image)}`} alt={group.title} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 rounded-xl animate-pulse" />
                  )}
                </div>
                
                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {group.badges.map((badge: string) => (
                        <span key={badge} className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                          badge === 'Best Overall' ? 'bg-[#FF4D15]/10 text-[#FF4D15]' :
                          badge === 'Cheapest' ? 'bg-green-100 text-green-700' :
                          badge === 'Most Trusted' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {badge === 'Best Overall' && <Trophy size={14} />}
                          {badge === 'Cheapest' && <Tag size={14} />}
                          {badge === 'Most Trusted' && <ShieldCheck size={14} />}
                          {badge}
                        </span>
                      ))}
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 leading-tight mb-2">
                      {group.title}
                    </h3>
                    
                    <p className="text-sm text-zinc-600 mb-4 line-clamp-2">
                      {group.rank_reason || (group.features && group.features.length > 0 ? group.features[0] : "A solid choice based on current market data.")}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Best Price</span>
                      <span className="text-2xl font-black text-zinc-900">
                        {group.best_price ? `₹${group.best_price.toLocaleString('en-IN')}` : 'N/A'}
                      </span>
                    </div>
                    
                    {group.aggregate_rating && (
                      <div className="flex flex-col border-l border-zinc-200 pl-6">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Rating</span>
                        <div className="flex items-center gap-1.5 text-zinc-900 font-bold">
                          <Star size={16} className="text-amber-400 fill-amber-400" />
                          {group.aggregate_rating} <span className="text-sm text-zinc-400 font-normal">({group.total_reviews})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Where to buy */}
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-3 justify-center md:border-l md:border-zinc-100 md:pl-8">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Available At</span>
                  
                  {group.products.map((p: any) => (
                    <a 
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between p-3 rounded-xl border border-zinc-200 hover:border-[#FF4D15] hover:bg-[#FF4D15]/5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {p.store === 'amazon' ? (
                          <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" 
                            alt={p.store} 
                            className="h-4 mt-1"
                          />
                        ) : (
                          <div className="flex items-center">
                            <span className="text-[#2874F0] font-black italic tracking-tighter text-lg leading-none">Flipkart</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">₹{p.price?.toLocaleString('en-IN')}</span>
                        <ExternalLink size={14} className="text-zinc-400 group-hover:text-[#FF4D15]" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
