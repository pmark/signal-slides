import { useState, useMemo } from 'react';
import { Source, Claim, Deck, DeckSlide, cn } from '../lib/types';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  FileText, 
  LayoutGrid, 
  Zap,
  Loader2
} from 'lucide-react';
import { Reorder } from 'motion/react';

interface ClaimWorkspaceProps {
  source: Source;
  claims: Claim[];
  initialDeck?: Partial<Deck>;
  onSave: (deck: Partial<Deck>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ClaimWorkspace({ 
  source, 
  claims, 
  initialDeck, 
  onSave, 
  onCancel,
  isLoading 
}: ClaimWorkspaceProps) {
  const [deckTitle, setDeckTitle] = useState(initialDeck?.title || `Narrative: ${source.title}`);
  const [selectedSlides, setSelectedSlides] = useState<DeckSlide[]>(initialDeck?.slides || []);

  const addSlide = (claim: Claim) => {
    const newSlide: DeckSlide = {
      claimId: claim.id,
      narration: `This claim suggests that ${claim.statement.toLowerCase().replace(/\.$/, '')}.`,
      order: selectedSlides.length
    };
    setSelectedSlides([...selectedSlides, newSlide]);
  };

  const removeSlide = (index: number) => {
    const newSlides = [...selectedSlides];
    newSlides.splice(index, 1);
    setSelectedSlides(newSlides.map((s, i) => ({ ...s, order: i })));
  };

  const updateNarration = (index: number, val: string) => {
    const newSlides = [...selectedSlides];
    newSlides[index].narration = val;
    setSelectedSlides(newSlides);
  };

  const currentClaimsInDeck = useMemo(() => 
    new Set(selectedSlides.map(s => s.claimId)), 
  [selectedSlides]);

  const handleSave = () => {
    onSave({
      title: deckTitle,
      slides: selectedSlides,
      sourceId: source.id,
      intent: initialDeck?.intent || 'explain'
    });
  };

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col">
      {/* Workspace Header */}
      <header className="h-16 bg-white border-b border-border-theme flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <div className="h-4 w-px bg-border-theme" />
          <h2 className="text-sm font-bold truncate max-w-[300px]">{source.title}</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-2 text-ink/40 hover:text-ink transition-colors"
          >
            <X size={20} />
          </button>
          <button
            onClick={handleSave}
            disabled={selectedSlides.length === 0 || isLoading}
            className="flex items-center gap-2 bg-accent text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            Publish Deck
          </button>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
        {/* Left: Claim Inventory */}
        <div className="w-1/3 border-r border-border-theme flex flex-col bg-panel/50">
          <div className="p-6 border-b border-border-theme space-y-1">
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
              <ShieldCheck size={14} className="text-accent" /> Atomic Claims ({claims.length})
            </h3>
            <p className="text-[11px] text-ink/30 italic">Select claims to add them to your narrative structure.</p>
          </div>
          
          <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4">
            {claims.map((claim) => (
              <button
                key={claim.id}
                onClick={() => addSlide(claim)}
                disabled={currentClaimsInDeck.has(claim.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 text-left transition-all group relative",
                  currentClaimsInDeck.has(claim.id)
                    ? "bg-bg border-transparent opacity-40 grayscale pointer-events-none"
                    : "bg-white border-border-theme hover:border-accent hover:shadow-lg hover:shadow-ink/5"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider",
                    claim.classification === 'verifiable' ? "bg-green-100 text-green-700" :
                    claim.classification === 'opinion' ? "bg-blue-100 text-blue-700" :
                    claim.classification === 'speculation' ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"
                  )}>
                    {claim.classification}
                  </span>
                  <Plus size={14} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-bold text-ink leading-snug">{claim.statement}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Deck Builder */}
        <div className="flex-grow flex flex-col bg-white">
          <div className="p-6 border-b border-border-theme bg-bg/20">
            <input 
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              className="text-2xl font-serif font-bold bg-transparent border-none focus:ring-0 w-full p-0 placeholder:text-ink/10"
              placeholder="Give your narrative a title..."
            />
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar p-12">
            {selectedSlides.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-bg flex items-center justify-center rounded-2xl text-ink/10">
                  <LayoutGrid size={32} />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-ink">Your Narrative is Empty</p>
                  <p className="text-sm text-ink-muted">Click on the claims to the left to start building your structural argument.</p>
                </div>
              </div>
            ) : (
              <Reorder.Group 
                axis="y" 
                values={selectedSlides} 
                onReorder={setSelectedSlides}
                className="space-y-6 max-w-3xl mx-auto pb-20"
              >
                {selectedSlides.map((slide, index) => {
                  const claim = claims.find(c => c.id === slide.claimId);
                  return (
                    <Reorder.Item 
                      key={slide.claimId} 
                      value={slide}
                      className="group relative"
                    >
                      <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-[10px] font-bold text-ink/20 mb-2">{index + 1}</div>
                        <div className="w-1 h-8 bg-border-theme rounded-full" />
                      </div>
                      
                      <div className="bg-white border-2 border-border-theme/60 rounded-3xl overflow-hidden shadow-sm hover:border-accent/40 transition-all">
                        {/* Slide Top: The Claim */}
                        <div className="p-6 bg-bg/30 border-b border-border-theme/40 flex items-start gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                            <Zap size={18} className="text-accent" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-[9px] font-bold text-ink/40 uppercase tracking-[0.2em]">{claim?.classification}</div>
                            <p className="text-[15px] font-bold text-ink leading-tight">{claim?.statement}</p>
                          </div>
                          <button 
                            onClick={() => removeSlide(index)}
                            className="ml-auto text-ink/10 hover:text-red-500 transition-colors p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        {/* Slide Bottom: Narration */}
                        <div className="p-6 space-y-3">
                          <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={12} /> Narrative Synthesis
                          </label>
                          <textarea 
                            value={slide.narration}
                            onChange={(e) => updateNarration(index, e.target.value)}
                            placeholder="Add your analysis here..."
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm leading-relaxed min-h-[80px] resize-none"
                          />
                        </div>
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
