import { useState, useEffect } from 'react';
import { GenerationOptions, NarrativeIntent, cn } from '../lib/types';
import { Search, Zap, ChevronRight, Loader2, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SUGGESTIONS = [
  "Paste a news article to analyze its claims",
  "Drop an earnings report to extract key insights",
  "Paste a debate transcript to compare perspectives",
  "Paste a Wikipedia article to synthesize",
  "Paste a research paper abstract to break down",
  "Enter any URL to extract and process"
];

interface SourceInputProps {
  onSubmit: (options: GenerationOptions) => void;
  isLoading: boolean;
}

export default function SourceInput({ onSubmit, isLoading }: SourceInputProps) {
  const [input, setInput] = useState('');
  const [intent, setIntent] = useState<NarrativeIntent>('explain');
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIdx((prev) => (prev + 1) % SUGGESTIONS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

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
          <div className="relative bg-white border-2 border-border-theme focus-within:border-accent rounded-3xl shadow-xl shadow-ink/5 p-2 transition-all flex flex-col">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a URL or drop content here to deconstruct..."
              className="w-full h-48 p-6 bg-transparent resize-none border-none focus:ring-0 text-xl font-serif leading-relaxed placeholder:text-ink/20 focus:outline-none"
              disabled={isLoading}
            />
            
            <div className="flex items-center justify-between p-4 bg-bg/50 rounded-2xl border-t border-border-theme/50 min-h-[72px]">
              <div className="flex items-center gap-2 text-ink-muted text-sm px-2 overflow-hidden flex-1 relative h-6">
                <Lightbulb size={16} className="text-accent shrink-0" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={suggestionIdx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute left-8 right-0 truncate text-[13px] font-medium"
                  >
                    Try: {SUGGESTIONS[suggestionIdx]}
                  </motion.div>
                </AnimatePresence>
              </div>
              
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all shrink-0 ml-4",
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
    </div>
  );
}
