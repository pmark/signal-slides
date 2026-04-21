import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Topic, 
  AtomicClaim, 
  NarrativeDeck, 
  NarrativeSlide, 
  NarrativeIntent, 
  NarrativeSlideType,
  ClaimStatus,
  cn 
} from '../lib/types';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Brain, 
  Target, 
  Zap, 
  Search,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { useAuth } from './AuthProvider';

interface Props {
  topic: Topic;
  claims: AtomicClaim[];
  onSave: (narrative: Partial<NarrativeDeck>) => Promise<void>;
  onCancel: () => void;
  initialIntent?: NarrativeIntent | null;
  initialStep?: number;
  onlyIntent?: boolean;
  onIntentSelect?: (intent: NarrativeIntent) => void;
}

const INTENTS: { id: NarrativeIntent; label: string; icon: React.ElementType; description: string; color: string }[] = [
  { 
    id: 'explain', 
    label: 'Explain what’s happening', 
    icon: Info, 
    description: 'Provide an objective summary of complex events.',
    color: '#3B82F6' // Blue
  },
  { 
    id: 'case', 
    label: 'Make a case', 
    icon: Target, 
    description: 'Build a persuasive argument using supported facts.',
    color: '#F97316' // Orange
  },
  { 
    id: 'challenge', 
    label: 'Challenge a narrative', 
    icon: Zap, 
    description: 'Expose inconsistencies in popular interpretations.',
    color: '#EF4444' // Red
  },
  { 
    id: 'explore', 
    label: 'Explore implications', 
    icon: Brain, 
    description: 'Deep dive into long-term effects and "so what".',
    color: '#8B5CF6' // Purple
  }
];

const SLIDE_TYPES: { id: NarrativeSlideType; label: string }[] = [
  { id: 'context', label: 'Context' },
  { id: 'fact', label: 'Key Facts' },
  { id: 'interpretation', label: 'Interpretation' },
  { id: 'implication', label: 'Implications' },
  { id: 'conclusion', label: 'Takeaway' }
];

export default function NarrativeCreator({ claims, onSave, onCancel, initialIntent = null, initialStep = 1, onlyIntent = false, onIntentSelect }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(initialStep);
  const [intent, setIntent] = useState<NarrativeIntent | null>(initialIntent);
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [slides, setSlides] = useState<Partial<NarrativeSlide>[]>([]);
  const [title, setTitle] = useState('');
  const [thesis, setThesis] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Step 2: Select Claims logic
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'all'>('all');

  const filteredClaims = claims.filter(c => {
    const matchesSearch = c.statement.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleClaim = (id: string) => {
    setSelectedClaimIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  // Transitions
  const nextStep = () => {
    if (step === 1 && onlyIntent && intent) {
      onIntentSelect?.(intent);
      return;
    }
    if (step === 1 && !intent) return;
    if (step === 2 && selectedClaimIds.length === 0) return;
    
    if (step === 2) {
      if (slides.length === 0) {
        setSlides([
          { id: crypto.randomUUID(), type: 'context', title: 'The Context', claimIds: [], narration: '' },
          { id: crypto.randomUUID(), type: 'fact', title: 'Established Reality', claimIds: [], narration: '' },
          { id: crypto.randomUUID(), type: 'interpretation', title: 'Analysis', claimIds: [], narration: '' },
          { id: crypto.randomUUID(), type: 'conclusion', title: 'Final Thought', claimIds: [], narration: '' }
        ]);
      }
    }
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handlePublish = async () => {
    if (!title || !intent || !user) return;
    setIsSaving(true);
    try {
      await onSave({
        title,
        thesis,
        intent,
        slides: slides as NarrativeSlide[],
        creatorName: user.displayName || 'Anonymous',
        creatorPhoto: user.photoURL || undefined
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSlide = (slideId: string, updates: Partial<NarrativeSlide>) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, ...updates } : s));
  };

  const addSlide = () => {
    setSlides(prev => [...prev, { id: crypto.randomUUID(), type: 'context', title: 'New Slide', claimIds: [], narration: '' }]);
  };

  const removeSlide = (id: string) => {
    setSlides(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className={cn(
      "min-h-screen bg-bg flex flex-col pt-2 md:pt-0",
      onlyIntent && "bg-white"
    )}>
      {/* Header - Fixed to top for flow */}
      <header className={cn(
        "sticky top-0 z-[60] h-16 border-b border-border-theme flex items-center justify-between px-4 md:px-8 shrink-0 backdrop-blur-md",
        onlyIntent ? "bg-white border-transparent" : "bg-panel"
      )}>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 text-ink/40 hover:text-ink transition-colors">
            <ChevronLeft size={20} />
          </button>
          {!onlyIntent && (
            <>
              <div className="h-4 w-[1px] bg-border-theme hidden xs:block" />
              <h2 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-ink/60 line-clamp-1">
                Build Narrative <span className="hidden xs:inline">Deck</span> <span className="text-ink ml-1">{step}/5</span>
              </h2>
            </>
          )}
        </div>
        {!onlyIntent && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <div 
                key={s} 
                className={cn(
                  "h-1 w-4 md:w-8 rounded-full transition-all",
                  s <= step ? "bg-accent" : "bg-bg"
                )}
              />
            ))}
          </div>
        )}
      </header>

      {/* Content Area */}
      <main className={cn(
        "flex-grow transition-all",
        onlyIntent ? "p-0" : "p-4 md:p-12 pb-32"
      )}>
        <div className={cn(
          "mx-auto w-full",
          onlyIntent ? "max-w-none px-6 md:px-20 py-20" : "max-w-4xl"
        )}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className={cn(
                  "space-y-12",
                  onlyIntent && "max-w-7xl mx-auto"
                )}
              >
                <div className="space-y-6">
                   <div className="text-[10px] uppercase tracking-[0.3em] font-black text-accent mb-4">Step 01 / Strategy</div>
                   <h1 className="text-4xl xs:text-5xl md:text-8xl font-serif font-black tracking-tight text-ink leading-[0.85] uppercase max-w-4xl">
                     What is your <br /> <span className="text-accent underline decoration-[6px] md:decoration-[8px] underline-offset-8">objective?</span>
                   </h1>
                   <p className="text-lg md:text-3xl text-ink-muted leading-relaxed max-w-3xl opacity-60">
                     A narrative is a selective interpretation of claims. Choose your goal to define the structural logic of your deck.
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-10">
                  {INTENTS.map(i => (
                    <button
                      key={i.id}
                      onClick={() => setIntent(i.id)}
                      className={cn(
                        "p-8 md:p-12 rounded-[32px] md:rounded-[40px] border-2 text-left transition-all group relative overflow-hidden flex flex-col justify-between min-h-[280px] md:min-h-[320px]",
                        intent === i.id ? "border-accent bg-white shadow-2xl shadow-accent/20" : "border-border-theme bg-panel hover:border-accent/40"
                      )}
                    >
                      <div className="relative z-10">
                        <div className={cn(
                          "w-16 h-16 rounded-3xl flex items-center justify-center mb-8 transition-all transform group-hover:scale-110",
                          intent === i.id ? "bg-accent text-white" : "bg-white text-ink/20 group-hover:text-accent"
                        )}>
                          <i.icon size={32} />
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-3xl md:text-5xl font-black text-ink leading-tight uppercase tracking-tighter">{i.label}</h3>
                          <p className="text-lg md:text-xl text-ink-muted leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">{i.description}</p>
                        </div>
                      </div>

                      {/* Visual Flourish */}
                      <div 
                        className={cn(
                          "absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-10 transition-all duration-500",
                          intent === i.id ? "opacity-30 scale-150" : "group-hover:opacity-20"
                        )}
                        style={{ backgroundColor: i.color }}
                      />

                      {intent === i.id && (
                        <div className="absolute top-8 right-8 text-accent animate-in fade-in zoom-in duration-300">
                          <Check size={32} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                   <h1 className="text-4xl font-serif font-bold tracking-tight">Select your evidence.</h1>
                   <p className="text-lg text-ink-muted">Choose the structured claims that will ground your perspective.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search claims..." 
                      className="w-full pl-12 pr-4 py-3 bg-white border border-border-theme rounded-xl font-medium focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 scrollbar-none">
                    {['all', 'verified', 'disputed', 'unverified'].map(s => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s as ClaimStatus | 'all')}
                        className={cn(
                          "px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                          statusFilter === s ? "bg-ink text-white border-ink" : "bg-white border-border-theme text-ink/40"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {filteredClaims.map(claim => (
                    <button
                      key={claim.id}
                      onClick={() => toggleClaim(claim.id)}
                      className={cn(
                        "p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4",
                        selectedClaimIds.includes(claim.id) ? "border-accent bg-white shadow-lg" : "border-border-theme bg-panel hover:border-accent/20"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center mt-1 transition-all",
                        selectedClaimIds.includes(claim.id) ? "bg-accent text-white" : "bg-bg text-transparent"
                      )}>
                        <Check size={14} />
                      </div>
                      <div className="flex-grow space-y-2">
                        <div className="flex gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                            claim.status === 'verified' ? "bg-green-100 text-green-700" : 
                            claim.status === 'disputed' ? "bg-red-100 text-red-700" : "bg-bg text-ink/40"
                          )}>
                            {claim.status}
                          </span>
                          <span className="text-[8px] font-bold text-ink/20 uppercase tracking-widest">{claim.type}</span>
                        </div>
                        <p className="text-[15px] font-bold text-ink leading-snug">{claim.statement}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                   <h1 className="text-4xl font-serif font-bold tracking-tight">Structure your story.</h1>
                   <p className="text-lg text-ink-muted">Arrange your selected claims into a logical flow.</p>
                </div>

                <div className="space-y-6">
                  {slides.map((s, idx) => (
                    <div key={s.id} className="p-6 md:p-8 bg-white border border-border-theme rounded-3xl slide-shadow space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[12px] font-bold">
                             {idx + 1}
                           </div>
                           <select 
                            className="bg-bg border-none text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-lg outline-none max-w-[120px]"
                            value={s.type}
                            onChange={(e) => updateSlide(s.id!, { type: e.target.value as NarrativeSlideType })}
                           >
                             {SLIDE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                           </select>
                        </div>
                        <button onClick={() => removeSlide(s.id!)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <input 
                          type="text" 
                          placeholder="Slide Title..."
                          className="w-full text-2xl font-serif font-bold tracking-tight border-none outline-none placeholder:text-ink/10"
                          value={s.title}
                          onChange={(e) => updateSlide(s.id!, { title: e.target.value })}
                        />
                        
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Selected Claims for this slide</label>
                           <div className="flex flex-wrap gap-2">
                             {selectedClaimIds.map(cid => {
                               const claim = claims.find(c => c.id === cid);
                               const isAssigned = s.claimIds?.includes(cid);
                               return (
                                 <button
                                  key={cid}
                                  onClick={() => {
                                    const newIds = isAssigned ? s.claimIds?.filter(i => i !== cid) : [...(s.claimIds || []), cid];
                                    updateSlide(s.id!, { claimIds: newIds });
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border max-w-xs truncate",
                                    isAssigned ? "bg-accent border-accent text-white" : "bg-panel border-border-theme text-ink/40 hover:border-accent/40"
                                  )}
                                 >
                                   {claim?.statement}
                                 </button>
                               );
                             })}
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={addSlide}
                    className="w-full py-8 border-2 border-dashed border-border-theme rounded-2xl flex flex-col items-center justify-center gap-2 text-ink/20 hover:text-accent hover:border-accent group transition-all"
                  >
                    <Plus size={32} />
                    <span className="text-sm font-bold uppercase tracking-widest">Add Narrative Slide</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                   <h1 className="text-4xl font-serif font-bold tracking-tight">Add your framing.</h1>
                   <p className="text-lg text-ink-muted">Provide concise perspective for each slide. Keep it under 2 sentences.</p>
                </div>

                <div className="space-y-12">
                   {slides.map((s) => (
                     <div key={s.id} className="space-y-6">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{s.type}</span>
                           <h3 className="text-xl font-bold">{s.title}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                           <div className="space-y-3">
                              <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Active Claims</label>
                              <div className="space-y-2">
                                {s.claimIds?.map(cid => {
                                  const claim = claims.find(c => c.id === cid);
                                  return (
                                    <div key={cid} className="p-4 bg-white border border-border-theme rounded-xl text-[13px] font-bold leading-snug">
                                      {claim?.statement}
                                    </div>
                                  );
                                })}
                                {(!s.claimIds || s.claimIds.length === 0) && (
                                  <div className="p-4 bg-panel border-2 border-dashed border-border-theme rounded-xl text-[12px] font-bold text-ink/20 text-center italic">
                                    No claims selected for this slide
                                  </div>
                                )}
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Your Perspective</label>
                              <textarea 
                                placeholder="Add your framing..."
                                className="w-full min-h-[140px] md:min-h-[120px] p-6 bg-white border border-border-theme rounded-2xl font-serif text-lg leading-relaxed outline-none focus:border-accent transition-all resize-none"
                                value={s.narration}
                                onChange={(e) => updateSlide(s.id!, { narration: e.target.value })}
                              />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                   <h1 className="text-4xl font-serif font-bold tracking-tight">Review and Publish.</h1>
                   <p className="text-lg text-ink-muted">Set a compelling title and thesis for your narrative.</p>
                </div>                 <div className="bg-white p-6 md:p-12 rounded-3xl border border-border-theme slide-shadow space-y-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-bold text-accent uppercase tracking-widest">Deck Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. The Quiet Crisis in Urban Transit"
                        className="w-full text-2xl md:text-4xl font-serif font-bold tracking-tight border-b-2 border-bg focus:border-accent outline-none pb-4 transition-all"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Core Thesis (Intent)</label>
                      <textarea 
                        placeholder="What is the central point of this narrative?"
                        className="w-full p-6 bg-bg rounded-2xl font-medium text-ink leading-relaxed outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none min-h-[120px]"
                        value={thesis}
                        onChange={(e) => setThesis(e.target.value)}
                      />
                   </div>

                   <div className="grid grid-cols-3 gap-2 md:gap-6 pt-10 border-t border-bg text-center md:text-left">
                      <div className="space-y-1">
                         <div className="text-[24px] font-serif font-bold text-ink">{slides.length}</div>
                         <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Slides</div>
                      </div>
                      <div className="space-y-1">
                         <div className="text-[24px] font-serif font-bold text-ink">{selectedClaimIds.length}</div>
                         <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Claims Cited</div>
                      </div>
                      <div className="space-y-1">
                         <div className="text-[24px] font-serif font-bold text-ink capitalize">{intent}</div>
                         <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Analysis Intent</div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className={cn(
        "fixed bottom-0 inset-x-0 border-t border-border-theme flex items-center justify-between px-4 md:px-8 shrink-0 backdrop-blur-md z-[60] transition-all duration-500",
        onlyIntent ? "h-32 bg-white border-transparent" : "h-20 bg-panel/95"
      )}>
        <button 
          onClick={step === 1 ? onCancel : prevStep}
          className="flex items-center gap-2 text-[10px] md:text-[12px] font-bold text-ink/40 hover:text-ink transition-all px-4 py-3 uppercase tracking-widest"
        >
          <ChevronLeft size={16} /> 
          <span className="hidden xs:inline">{step === 1 ? 'Cancel Process' : 'Previous Step'}</span>
          <span className="xs:hidden">{step === 1 ? 'Cancel' : 'Back'}</span>
        </button>
        
        {step < 5 ? (
          <button 
            onClick={nextStep}
            disabled={(step === 1 && !intent) || (step === 2 && selectedClaimIds.length === 0)}
            className={cn(
              "flex items-center gap-4 text-white px-10 py-5 rounded-full text-[12px] md:text-[14px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl disabled:opacity-20",
              onlyIntent ? "bg-accent shadow-accent/40 scale-110" : "bg-black hover:bg-accent shadow-black/20"
            )}
          >
            {onlyIntent ? (
              <>Start Drafting <ChevronRight size={20} strokeWidth={3} /></>
            ) : (
              <>Continue <span className="hidden sm:inline">to {step === 1 ? 'Claims' : step === 2 ? 'Structure' : step === 3 ? 'Framing' : 'Review'}</span> <ChevronRight size={16} /></>
            )}
          </button>
        ) : (
          <button 
            onClick={handlePublish}
            disabled={!title || isSaving}
            className="flex items-center gap-4 bg-accent text-white px-10 py-5 rounded-full text-[12px] md:text-[14px] font-black uppercase tracking-[0.2em] hover:bg-accent-dark disabled:opacity-20 transition-all shadow-2xl shadow-accent/40"
          >
            {isSaving ? 'Finalizing...' : 'Publish Deck'} <Check size={16} strokeWidth={3} />
          </button>
        )}
      </footer>
    </div>
  );
}
