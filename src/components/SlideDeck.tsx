import { useState } from 'react';
import { Analysis, cn } from '../lib/types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Share2, RefreshCw, Hash, Split, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import Slide from './Slide';

interface SlideDeckProps {
  analysis: Analysis;
  onRegenerate: () => void;
}

const FRAMEWORK_ICONS = {
  balanced: Hash,
  comparison: Split,
  verification: ShieldCheck,
  impact: Zap,
  challenge: AlertTriangle
};

export default function SlideDeck({ analysis, onRegenerate }: SlideDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % analysis.slides.length);
    setHasSwiped(true);
  };
  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + analysis.slides.length) % analysis.slides.length);
    setHasSwiped(true);
  };

  const Icon = FRAMEWORK_ICONS[analysis.type as keyof typeof FRAMEWORK_ICONS] || Hash;

  return (
    <div className="w-full flex flex-col items-center gap-12 max-w-5xl mx-auto py-4">
      {/* Analysis Header */}
      <div className="text-center space-y-4 max-w-xl mx-auto">
        <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-4">
          <Icon size={24} />
        </div>
        <h2 className="text-3xl font-serif font-bold tracking-tight text-ink">{analysis.title}</h2>
        <p className="text-[12px] font-bold text-ink/40 uppercase tracking-[0.3em]">Analysis Narrative System</p>
      </div>

      {/* Progress */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {analysis.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                setHasSwiped(true);
              }}
              className={`h-1.5 transition-all duration-500 rounded-full ${
                currentIndex === i ? 'w-12 bg-accent' : 'w-4 bg-black/10'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-12 w-full justify-center px-4">
        {/* Navigation Left */}
        <button 
          onClick={prevSlide}
          className="p-5 rounded-full bg-white slide-shadow hover:scale-110 active:scale-95 transition-all hidden md:flex"
        >
          <ChevronLeft size={32} />
        </button>

        {/* Viewer */}
        <div className="relative group w-full max-w-[480px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                const swipeThreshold = 30; // More sensitive for mobile
                if (info.offset.x > swipeThreshold) prevSlide();
                else if (info.offset.x < -swipeThreshold) nextSlide();
              }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="relative z-10 cursor-grab active:cursor-grabbing touch-pan-y"
            >
              <Slide 
                slide={analysis.slides[currentIndex]} 
                index={currentIndex} 
                total={analysis.slides.length}
              />
            </motion.div>
          </AnimatePresence>
          
          {/* Peeks & Hint */}
          <div className="absolute inset-y-8 -left-4 w-2 bg-accent/20 rounded-r-2xl -z-10 blur-[1px] animate-pulse" />
          <div className="absolute inset-y-8 -right-4 w-2 bg-accent/20 rounded-l-2xl -z-10 blur-[1px] animate-pulse" />
          
          {!hasSwiped && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-widest pointer-events-none md:hidden"
            >
              <ChevronLeft size={10} className="animate-bounce" />
              Swipe to Explore
              <ChevronRight size={10} className="animate-bounce" />
            </motion.div>
          )}
        </div>

        {/* Navigation Right */}
        <button 
          onClick={nextSlide}
          className="p-5 rounded-full bg-white slide-shadow hover:scale-110 active:scale-95 transition-all hidden md:flex"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: analysis.title,
                url: window.location.href,
              });
            }
          }}
          className="flex items-center gap-2 bg-white border border-border-theme px-8 py-3.5 rounded-xl font-bold text-sm hover:border-accent transition-all slide-shadow"
        >
          <Share2 size={18} className="text-accent" />
          <span>Share Analysis</span>
        </button>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 bg-ink text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-accent hover:shadow-xl hover:shadow-accent/20 transition-all active:scale-[0.98]"
        >
          <RefreshCw size={18} />
          <span>New Analysis View</span>
        </button>
      </div>

      <div className="max-w-xl text-center space-y-4">
         <div className="bg-bg p-6 rounded-2xl border border-border-theme/50 italic opacity-40 text-[11px] font-medium leading-relaxed">
           This analysis operates as a structured transformation of shared claims. User interactions contribute to the collective truth-coefficient of this topic.
         </div>
      </div>
    </div>
  );
}
