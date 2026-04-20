import { useState } from 'react';
import { GenerationOptions, AnalysisType, cn } from '../lib/types';
import { Sparkles, ArrowRight, Loader2, ShieldCheck, Scale, Split, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import TextareaAutosize from 'react-textarea-autosize';

interface SetupFormProps {
  onSubmit: (options: GenerationOptions) => void;
  isLoading: boolean;
  initialTopic?: string;
}

const ANALYSIS_TYPES: { type: AnalysisType; label: string; description: string; icon: any }[] = [
  { 
    type: 'balanced', 
    label: 'Balanced Overview', 
    description: 'General synthesis of the core claims and context.', 
    icon: Scale 
  },
  { 
    type: 'comparison', 
    label: 'Perspective Comparison', 
    description: 'Directly contrast competing data or viewpoints.', 
    icon: Split 
  },
  { 
    type: 'verification', 
    label: 'Claim Verification', 
    description: 'Deep-dive into the truth status of controversial assertions.', 
    icon: ShieldCheck 
  },
  { 
    type: 'impact', 
    label: 'Impact Analysis', 
    description: 'Focus on consequences and real-world implications.', 
    icon: Zap 
  },
  { 
    type: 'challenge', 
    label: 'Narrative Challenge', 
    description: 'Steel-man challenges to the prevailing consensus.', 
    icon: AlertTriangle 
  },
];

export default function SetupForm({ onSubmit, isLoading, initialTopic = '' }: SetupFormProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [analysisType, setAnalysisType] = useState<AnalysisType>('balanced');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onSubmit({ topic, analysisType });
  };

  return (
    <motion.form 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl bg-white p-12 rounded-2xl border border-border-theme space-y-12 slide-shadow"
    >
      <div className="space-y-4">
        <label className="text-[12px] font-bold text-ink uppercase tracking-widest block">Topic or Source Material</label>
        <TextareaAutosize
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic or paste article text to deconstruct..."
          className="w-full bg-bg border border-border-theme rounded-xl p-6 text-[15px] font-medium outline-none transition-all focus:border-accent resize-none placeholder:opacity-30 custom-scrollbar slide-shadow"
          minRows={3}
          maxRows={12}
          required
        />
      </div>

      <div className="space-y-6">
        <label className="text-[12px] font-bold text-ink uppercase tracking-widest block">Analysis Framework</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ANALYSIS_TYPES.map(framework => {
            const Icon = framework.icon;
            const isSelected = analysisType === framework.type;
            return (
              <button
                key={framework.type}
                type="button"
                onClick={() => setAnalysisType(framework.type)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all relative group",
                  isSelected 
                    ? "bg-accent/5 border-accent shadow-lg shadow-accent/5" 
                    : "bg-bg border-transparent hover:border-ink/10 opacity-60 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors",
                  isSelected ? "bg-accent text-white" : "bg-white text-ink-muted"
                )}>
                  <Icon size={20} />
                </div>
                <div className="text-[14px] font-bold text-ink leading-tight mb-1">{framework.label}</div>
                <div className="text-[11px] font-medium text-ink-muted leading-relaxed opacity-80">{framework.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        disabled={isLoading || !topic.trim()}
        className="w-full bg-ink text-white py-5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:shadow-xl hover:shadow-accent/20"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>Structuring Truth...</span>
          </>
        ) : (
          <>
            <Sparkles size={20} />
            <span>Process Intelligence</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <div className="flex items-start gap-4 p-6 bg-bg rounded-xl border border-border-theme/50 italic opacity-40 text-[11px] font-medium leading-relaxed">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <div>
          SignalSlides uses advanced forensic AI to decompose content. All claims should be verified against the provided source citations. This is a truth-seeking platform, not an authoritative encyclopedia.
        </div>
      </div>
    </motion.form>
  );
}
