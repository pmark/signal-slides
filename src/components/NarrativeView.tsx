import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  NarrativeDeck, 
  NarrativeSlide, 
  AtomicClaim, 
  Topic,
  cn 
} from '../lib/types';
import { 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldQuestion, 
  Share2, 
  MessageCircle,
  Zap,
  RotateCcw,
  ArrowUpRight,
  User,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NarrativeViewProps {
  narrative: NarrativeDeck;
  topic: Topic;
  claims: AtomicClaim[];
  onAction?: (type: 'remix' | 'challenge' | 'improve') => void;
}

const StatusIcon = ({ status }: { status?: string }) => {
  switch (status) {
    case 'verified': return <ShieldCheck size={14} className="text-green-600" />;
    case 'disputed': return <ShieldAlert size={14} className="text-red-600" />;
    case 'unverified': return <ShieldQuestion size={14} className="text-amber-600" />;
    default: return null;
  }
};

export default function NarrativeView({ narrative, claims, onAction }: NarrativeViewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentSlide = narrative.slides[currentSlideIndex];

  const nextSlide = () => {
    if (currentSlideIndex < narrative.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const getSlideClaims = (slide: NarrativeSlide) => {
    return (slide.claimIds || []).map(cid => claims.find(c => c.id === cid)).filter(Boolean) as AtomicClaim[];
  };

  // Transparency indicator calc
  const allSlideClaims = narrative.slides.flatMap(s => getSlideClaims(s));
  const counts = {
    verified: allSlideClaims.filter(c => c.status === 'verified').length,
    disputed: allSlideClaims.filter(c => c.status === 'disputed').length,
    opinion: allSlideClaims.filter(c => c.type === 'opinion').length,
    total: allSlideClaims.length
  };

  const percentVerified = Math.round((counts.verified / counts.total) * 100) || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8">
      {/* Narrative Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border-theme pb-8 px-4">
        <div className="space-y-4 max-w-2xl">
           <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-accent text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                Narrative {narrative.intent}
             </div>
             <div className="flex items-center gap-2 text-[11px] font-bold text-ink/40">
                <Clock size={12} /> {formatDistanceToNow(new Date(narrative.createdAt))} ago
             </div>
           </div>
           <h1 className="text-4xl font-serif font-bold tracking-tight text-ink">{narrative.title}</h1>
           <p className="text-lg text-ink-muted leading-relaxed italic border-l-4 border-accent/20 pl-6">
             “{narrative.thesis}”
           </p>
           
           <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-bg border border-border-theme flex items-center justify-center overflow-hidden">
                    {narrative.creatorPhoto ? <img src={narrative.creatorPhoto} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-ink/20" />}
                 </div>
                 <span className="text-[12px] font-bold">{narrative.creatorName}</span>
              </div>
              <div className="w-[1px] h-4 bg-border-theme" />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500" />
                   <span className="text-[11px] font-bold text-ink/60">{percentVerified}% Verified Basis</span>
                </div>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <button onClick={() => onAction?.('remix')} className="flex items-center gap-2 bg-white border border-border-theme px-5 py-2.5 rounded-xl text-[12px] font-bold hover:border-accent hover:text-accent transition-all">
             <RotateCcw size={16} /> Remix
           </button>
           <button onClick={() => onAction?.('challenge')} className="flex items-center gap-2 bg-white border border-border-theme px-5 py-2.5 rounded-xl text-[12px] font-bold hover:border-accent hover:text-accent transition-all">
             <Zap size={16} /> Challenge
           </button>
           <button className="p-2.5 bg-ink text-white rounded-xl hover:bg-accent transition-all">
             <Share2 size={18} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start px-4">
        {/* Slide Viewport */}
        <div className="lg:col-span-8 space-y-8">
           <div className="relative aspect-square md:aspect-video w-full bg-white border border-border-theme slide-shadow rounded-3xl overflow-hidden flex flex-col group">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentSlideIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-grow flex flex-col p-10 md:p-16"
                >
                   <div className="flex items-center justify-between mb-8">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">{currentSlide.type} panel</span>
                      <span className="text-[11px] font-bold text-ink/20">{currentSlideIndex + 1} / {narrative.slides.length}</span>
                   </div>

                   <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-ink leading-tight mb-8">
                      {currentSlide.title}
                   </h2>

                   <div className="flex-grow space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                      {currentSlide.narration && (
                        <div className="p-8 bg-accent/5 rounded-2xl border border-accent/10">
                           <p className="text-xl md:text-2xl font-serif font-medium leading-relaxed text-ink italic">
                             “{currentSlide.narration}”
                           </p>
                           <div className="mt-4 text-[10px] font-bold text-accent uppercase tracking-widest opacity-60">Narrative Framing</div>
                        </div>
                      )}

                      <div className="space-y-4">
                         <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-2">Grounding Claims</div>
                         {getSlideClaims(currentSlide).map(claim => (
                           <motion.div 
                             key={claim.id}
                             whileHover={{ x: 4 }}
                             className="flex gap-4 p-5 bg-bg border border-border-theme/30 rounded-2xl transition-all hover:border-accent cursor-pointer group/claim"
                           >
                             <div className="mt-1 shrink-0">
                               <StatusIcon status={claim.status} />
                             </div>
                             <div className="flex-grow">
                                <p className="text-[16px] font-bold leading-snug">{claim.statement}</p>
                                <div className="flex items-center gap-3 mt-3">
                                   <span className={cn(
                                      "text-[9px] font-bold uppercase tracking-wider",
                                      claim.status === 'verified' ? "text-green-600" : 
                                      claim.status === 'disputed' ? "text-red-600" : "text-amber-600"
                                   )}>
                                      {claim.status} claim
                                   </span>
                                   <div className="w-1 h-1 rounded-full bg-ink/10" />
                                   <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest">{claim.type}</span>
                                </div>
                             </div>
                             <ArrowUpRight size={16} className="text-ink/5 group-hover/claim:text-accent transition-colors shrink-0" />
                           </motion.div>
                         ))}
                      </div>
                   </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls */}
              <div className="absolute inset-x-8 bottom-8 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                  onClick={prevSlide} 
                  disabled={currentSlideIndex === 0}
                  className="w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center hover:bg-accent disabled:opacity-0 transition-all shadow-xl"
                 >
                   <ChevronLeft size={24} />
                 </button>
                 <button 
                  onClick={nextSlide} 
                  disabled={currentSlideIndex === narrative.slides.length - 1}
                  className="w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center hover:bg-accent disabled:opacity-0 transition-all shadow-xl"
                 >
                   <ChevronRight size={24} />
                 </button>
              </div>
           </div>

           {/* Mobile Swipe Indicators */}
           <div className="flex justify-center gap-2">
             {narrative.slides.map((_, i) => (
               <button 
                 key={i} 
                 onClick={() => setCurrentSlideIndex(i)}
                 className={cn(
                   "w-2 h-2 rounded-full transition-all",
                   i === currentSlideIndex ? "bg-accent w-6" : "bg-ink/10 hover:bg-ink/20"
                 )}
               />
             ))}
           </div>
        </div>

        {/* Sidebar Context */}
        <div className="lg:col-span-4 space-y-10">
           <div className="p-8 bg-white border border-border-theme rounded-3xl slide-shadow space-y-6">
              <h3 className="text-xl font-serif font-bold">Transparency Metrics</h3>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest mb-2">
                       <span>Verification Score</span>
                       <span className="text-green-600">{percentVerified}%</span>
                    </div>
                    <div className="h-2 w-full bg-bg rounded-full overflow-hidden">
                       <div className="h-full bg-green-500 transition-all" style={{ width: `${percentVerified}%` }} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-bg rounded-2xl">
                       <div className="text-xl font-bold">{counts.disputed}</div>
                       <div className="text-[9px] font-bold text-ink/40 uppercase tracking-widest">Contested Claims</div>
                    </div>
                    <div className="p-4 bg-bg rounded-2xl">
                       <div className="text-xl font-bold">{counts.opinion}</div>
                       <div className="text-[9px] font-bold text-ink/40 uppercase tracking-widest">Interpretations</div>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-bg flex flex-col gap-4">
                 <button className="flex items-center justify-center gap-2 py-4 bg-bg rounded-2xl text-[12px] font-bold text-ink/60 hover:text-ink transition-all">
                    <MessageCircle size={18} /> {narrative.interactionCount || 0} Comments
                 </button>
                 <p className="text-[11px] text-ink/40 text-center px-4">
                   This narrative deck uses structured claims vetted by the SignalSlides community. 
                   <span className="text-accent font-bold cursor-pointer hover:underline"> Learn more.</span>
                 </p>
              </div>
           </div>

           <div className="p-8 bg-ink rounded-3xl text-white space-y-4">
              <h3 className="text-lg font-bold">Improve the Narrative</h3>
              <p className="text-sm opacity-70 leading-relaxed">
                Think this perspective is missing key data? Remix it with better claims or challenge the logic with a counter-deck.
              </p>
              <button 
                onClick={() => onAction?.('improve')}
                className="w-full py-3 bg-accent text-white rounded-xl font-bold text-[12px] hover:bg-white hover:text-ink transition-all"
              >
                 Contribute Improvements
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
