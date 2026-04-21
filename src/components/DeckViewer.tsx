import { useState } from 'react';
import { Source, Claim, Deck, cn } from '../lib/types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Share2, 
  RotateCcw, 
  User, 
  Clock,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeckViewerProps {
  source: Source;
  deck: Deck;
  claims: Claim[];
  onRemix: () => void;
}

export default function DeckViewer({ source, deck, claims, onRemix }: DeckViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const totalSlides = deck.slides.length;
  const currentSlide = deck.slides[activeIndex];
  const currentClaim = claims.find(c => c.id === currentSlide?.claimId);

  const next = () => setActiveIndex((i) => Math.min(i + 1, totalSlides - 1));
  const prev = () => setActiveIndex((i) => Math.max(i - 1, 0));

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12">
      {/* Header */}
      <div className="space-y-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest rounded-full border border-accent/20">
            {deck.intent} Narrative
          </span>
          {deck.parentDeckId && (
            <span className="px-3 py-1 bg-bg text-ink/40 text-[10px] font-bold uppercase tracking-widest rounded-full border border-border-theme">
              <RotateCcw size={10} className="inline mr-1" /> Remix
            </span>
          )}
        </div>
        <h1 className="text-5xl font-serif font-bold text-ink leading-tight">{deck.title}</h1>
        <div className="flex items-center justify-center gap-6 text-[12px] font-bold text-ink/40">
          <div className="flex items-center gap-2">
            <User size={14} className="text-accent" />
            {deck.creatorName || 'Anonymous'}
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-border-theme" />
          <div className="flex items-center gap-2">
            <Clock size={14} />
            {new Date(deck.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Main Stage */}
      <div className="relative group">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20 pointer-events-none">
          <button 
            onClick={prev}
            disabled={activeIndex === 0}
            className="w-12 h-12 bg-white border border-border-theme rounded-full flex items-center justify-center shadow-xl pointer-events-auto hover:bg-bg transition-all disabled:opacity-0 disabled:-translate-x-4"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={next}
            disabled={activeIndex === totalSlides - 1}
            className="w-12 h-12 bg-ink text-white rounded-full flex items-center justify-center shadow-xl pointer-events-auto hover:bg-accent transition-all disabled:opacity-0 disabled:translate-x-4"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="bg-white border-2 border-border-theme rounded-[40px] overflow-hidden slide-shadow min-h-[500px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="flex-grow flex flex-col"
            >
              {/* Claim Card */}
              <div className="p-12 md:p-20 bg-bg/20 flex flex-col items-center justify-center text-center space-y-8 flex-grow">
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[.2em]",
                  currentClaim?.classification === 'verifiable' ? "bg-green-100 text-green-700" :
                  currentClaim?.classification === 'opinion' ? "bg-blue-100 text-blue-700" :
                  currentClaim?.classification === 'speculation' ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"
                )}>
                  {currentClaim?.classification}
                </div>
                <p className="text-3xl md:text-5xl font-serif font-bold text-ink leading-tight max-w-3xl italic">
                  “{currentClaim?.statement}”
                </p>
                <div className="h-1 w-24 bg-accent/20 rounded-full" />
              </div>

              {/* Narration Context */}
              <div className="p-12 bg-white border-t border-border-theme/40 text-center space-y-6">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em]">
                  <ShieldCheck size={14} className="text-accent" /> Synthesis Analysis
                </div>
                <p className="text-xl text-ink-muted leading-relaxed max-w-2xl mx-auto font-medium">
                  {currentSlide?.narration}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {deck.slides.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 transition-all rounded-full",
                i === activeIndex ? "w-8 bg-accent" : "w-1.5 bg-border-theme"
              )}
            />
          ))}
        </div>
      </div>

      {/* Actions & Source Footnote */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-border-theme">
        <div className="flex items-center gap-4">
          <button 
            onClick={onRemix}
            className="flex items-center gap-2 bg-ink text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-accent transition-all hover:scale-[1.02]"
          >
            <RotateCcw size={18} />
            Remix this Narrative
          </button>
          <button className="flex items-center gap-2 bg-bg text-ink px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-border-theme transition-all">
            <Share2 size={18} />
            Share
          </button>
        </div>

        <div className="flex items-center gap-4 text-ink-muted bg-bg/50 px-6 py-3 rounded-2xl border border-border-theme/50">
           <Zap size={14} className="text-accent" />
           <span className="text-[11px] font-bold uppercase tracking-widest italic">Source: {source.title}</span>
           <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}
