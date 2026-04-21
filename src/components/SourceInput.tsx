import { useState } from 'react';
import { GenerationOptions, NarrativeIntent, cn } from '../lib/types';
import { Search, FileText, Link as LinkIcon, Zap, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface SourceInputProps {
  onSubmit: (options: GenerationOptions) => void;
  isLoading: boolean;
}

export default function SourceInput({ onSubmit, isLoading }: SourceInputProps) {
  const [input, setInput] = useState('');
  const [intent, setIntent] = useState<NarrativeIntent>('explain');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSubmit({
      sourceInput: input.trim(),
      intent
    });
  };

  const intents: { val: NarrativeIntent, label: string, desc: string }[] = [
    { val: 'explain', label: 'Explain', desc: 'Break down the content into a neutral summary of claims.' },
    { val: 'case', label: 'Power Case', desc: 'Synthesize the claims into a structured persuasive argument.' },
    { val: 'challenge', label: 'Challenge', desc: 'Identify contradictions or weaknesses in the claims.' },
    { val: 'compare', label: 'Compare', desc: 'Identify competing perspectives within the source.' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Big Input Area */}
        <div className="relative group">
          <div className="absolute inset-0 bg-accent/5 rounded-3xl blur-2xl group-focus-within:bg-accent/10 transition-all" />
          <div className="relative bg-white border-2 border-border-theme focus-within:border-accent rounded-3xl shadow-xl shadow-ink/5 p-2 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a URL or drop content here to deconstruct..."
              className="w-full h-48 p-6 bg-transparent resize-none border-none focus:ring-0 text-xl font-serif leading-relaxed placeholder:text-ink/20"
              disabled={isLoading}
            />
            
            <div className="flex items-center justify-between p-4 bg-bg/50 rounded-2xl border-t border-border-theme/50">
              <div className="flex items-center gap-4 text-ink-muted">
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
                  <LinkIcon size={14} className="text-accent" /> URL
                </div>
                <div className="w-px h-4 bg-border-theme" />
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
                  <FileText size={14} className="text-accent" /> Text Block
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all",
                  input.trim() && !isLoading 
                    ? "bg-ink text-white hover:bg-accent hover:scale-[1.02] shadow-lg shadow-ink/10" 
                    : "bg-bg text-ink/20 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap size={18} />
                    Extract Claims
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Intent Selectors */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-bold text-ink/40 uppercase tracking-[0.2em]">
            Primary Intent <Search size={14} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {intents.map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setIntent(item.val)}
                className={cn(
                  "p-5 rounded-2xl border-2 text-left transition-all group relative overflow-hidden",
                  intent === item.val 
                    ? "border-accent bg-accent/5 ring-4 ring-accent/5" 
                    : "border-border-theme bg-white hover:border-ink/20"
                )}
              >
                {intent === item.val && (
                  <motion.div 
                    layoutId="intent-active"
                    className="absolute top-3 right-3 text-accent"
                  >
                    <ChevronRight size={18} />
                  </motion.div>
                )}
                <div className={cn(
                  "font-bold text-sm mb-1 transition-colors",
                  intent === item.val ? "text-accent" : "text-ink"
                )}>
                  {item.label}
                </div>
                <div className="text-[11px] text-ink-muted leading-tight opacity-70">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Speed Promise */}
      <div className="flex flex-col items-center gap-4 py-8 border-t border-border-theme/40 opacity-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
            <Zap size={14} /> Extraction: ~12s
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-border-theme" />
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
            <FileText size={14} /> Classification: Live
          </div>
        </div>
      </div>
    </div>
  );
}
