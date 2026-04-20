import { motion } from 'motion/react';
import { AnalysisSlide, cn } from '../lib/types';
import { ShieldCheck, ShieldAlert, ShieldQuestion, Info, ArrowUpRight } from 'lucide-react';

interface SlideProps {
  slide: AnalysisSlide;
  index: number;
  total: number;
  id?: string;
  onJumpToClaim?: (claimId: string) => void;
}

const StatusIcon = ({ status }: { status?: string }) => {
  switch (status) {
    case 'verified': return <ShieldCheck size={14} className="text-green-600" />;
    case 'disputed': return <ShieldAlert size={14} className="text-red-600" />;
    case 'unverified': return <ShieldQuestion size={14} className="text-amber-600" />;
    default: return <div className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />;
  }
};

export default function Slide({ slide, index, total, id, onJumpToClaim }: SlideProps) {
  return (
    <div 
      id={id}
      className={cn(
        "aspect-square w-full max-w-[480px] bg-white p-10 flex flex-col relative overflow-hidden border border-black/5",
        "font-sans text-ink slide-shadow rounded-2xl"
      )}
    >
      {/* Editorial Type Label */}
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <div className="px-3 py-1 bg-ink text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
          {slide.type || 'Insight'}
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 mb-6">
        <h2 className="text-[28px] font-serif font-bold leading-[1.1] tracking-tight text-ink">
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="text-[13px] font-medium text-ink-muted mt-2 leading-relaxed">
            {slide.subtitle}
          </p>
        )}
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex-grow pr-1 overflow-hidden">
        <div className="space-y-4">
          {slide.content.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-4 rounded-xl border transition-all relative group",
                item.claimId ? "bg-bg border-border-theme/50 cursor-pointer hover:border-accent" : "border-transparent"
              )}
              onClick={() => item.claimId && onJumpToClaim?.(item.claimId)}
            >
              <div className="flex gap-4 items-start">
                <div className="mt-1 shrink-0">
                  <StatusIcon status={item.statusHint} />
                </div>
                <div className="space-y-1">
                  <p className="text-[15px] leading-snug text-ink/90 font-medium">
                    {item.text}
                  </p>
                  {item.statusHint && (
                    <div className={cn(
                      "text-[9px] font-bold uppercase tracking-widest",
                      item.statusHint === 'verified' ? "text-green-600" : 
                      item.statusHint === 'disputed' ? "text-red-600" : "text-amber-600"
                    )}>
                      {item.statusHint} Claim
                    </div>
                  )}
                </div>
                {item.claimId && (
                  <ArrowUpRight size={14} className="absolute top-4 right-4 text-ink/10 group-hover:text-accent transition-colors" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="relative z-10 mt-4 pt-4 border-t border-border-theme flex justify-between items-center text-[10px] font-bold text-ink-muted">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full" />
          <span className="opacity-40 uppercase tracking-[0.2em]">SignalSlides Forensic Analysis</span>
        </div>
        <span className="opacity-20">{index + 1} / {total}</span>
      </div>
    </div>
  );
}
