"use client";

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PriceData {
  date: string;
  price: number;
}

interface PriceChartProps {
  url: string;
  price?: string | null;
}

export default function PriceChart({ url, price }: PriceChartProps) {
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/index?action=price-history&url=${encodeURIComponent(url)}&current_price=${encodeURIComponent(price || '')}`);
        const result = await response.json();
        if (result.error) {
          setError(result.error);
        } else if (result.history) {
          setData(result.history);
        }
      } catch (err) {
        setError('Failed to load price history.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [url, price]);

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-zinc-200 shadow-sm">
        <Loader2 className="animate-spin text-zinc-400 mb-2" size={24} />
        <p className="text-sm text-zinc-500">Loading historical data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 mb-8 bg-red-50 text-red-600 rounded-2xl border border-red-200">
        <p className="font-bold">Price Chart Error:</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return null; 
  }

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));
  
  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 text-white px-4 py-2 rounded-xl shadow-xl border border-zinc-800 text-sm">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-[#FF4D15] font-semibold">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payload[0].value).replace('INR', '₹')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] p-8 md:p-10 border border-zinc-200 shadow-sm relative group mb-16"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        </div>
        <h3 className="font-bold tracking-widest uppercase text-sm text-zinc-900">Price History (6 Months)</h3>
      </div>
      
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 50, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF4D15" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#FF4D15" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#A1A1AA', fontSize: 12 }}
              dy={10}
              padding={{ left: 20, right: 40 }}
            />
            <YAxis 
              domain={[minPrice * 0.9, maxPrice * 1.1]} 
              hide={true} 
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: '#E4E4E7', strokeWidth: 2, strokeDasharray: '5 5' }}
              isAnimationActive={false}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#FF4D15" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={1500}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#FF4D15' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
