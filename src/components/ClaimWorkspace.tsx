import { useState, useMemo, useEffect } from 'react';
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
  Loader2,
  Pencil
} from 'lucide-react';
import { Reorder } from 'motion/react';

interface ClaimWorkspaceProps {
  source: Source;
  claims: Claim[];
  initialDeck?: Partial<Deck>;
  onSave: (deck: Partial<Deck>, navigateAfterSave?: boolean) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function NarrationEditor({ narration, onChange }: { narration: string, onChange: (val: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="p-6 space-y-3 relative group/narration">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest flex items-center gap-2">
          <FileText size={12} /> Slide Notes
        </label>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-ink/20 hover:text-accent transition-colors opacity-0 group-hover/narration:opacity-100 p-1"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
      
      {isEditing ? (
        <textarea 
          autoFocus
          value={narration}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          placeholder="Add your analysis here..."
          className="w-full bg-bg/50 border border-border-theme focus:border-accent focus:ring-1 focus:ring-accent/30 rounded-xl p-3 text-sm leading-relaxed min-h-[80px] resize-none outline-none transition-all"
        />
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="text-sm leading-relaxed text-ink/80 min-h-[40px] cursor-text rounded-xl hover:bg-bg/40 p-2 -mx-2 transition-colors border border-transparent whitespace-pre-wrap"
        >
          {narration || <span className="text-ink/30 italic">Add your analysis here...</span>}
        </div>
      )}
    </div>
  );
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
  const [activeTab, setActiveTab] = useState<'claims' | 'deck'>('claims');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (draggingId) {
      document.body.classList.add('select-none');
    } else {
      document.body.classList.remove('select-none');
    }
    return () => document.body.classList.remove('select-none');
  }, [draggingId]);

  const addSlide = (claim: Claim) => {
    const newSlide: DeckSlide = {
      claimId: claim.id,
      narration: `This claim suggests that ${claim.statement.toLowerCase().replace(/\.$/, '')}.`,
      order: selectedSlides.length
    };
    setSelectedSlides([...selectedSlides, newSlide]);
    // Optional: Switch to deck tab immediately on mobile, but might be jarring
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

  const handleSave = (isDraft: boolean) => {
    onSave({
      title: deckTitle,
      slides: selectedSlides,
      sourceId: source.id,
      intent: initialDeck?.intent || 'explain',
      status: isDraft ? 'draft' : 'published'
    }, !isDraft); // navigate only if publishing
  };

  return (
    <div className="fixed inset-0 bg-bg z-[70] flex flex-col">
      {/* Workspace Header */}
      <header className="min-h-[4rem] py-2 bg-white border-b border-border-theme flex flex-wrap items-center justify-between px-4 md:px-6 shrink-0 gap-4">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-[200px]">
          <div className="w-8 h-8 shrink-0 bg-ink rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <div className="h-4 w-px bg-border-theme hidden md:block" />
          <h2 className="text-sm font-bold line-clamp-2 break-words leading-tight">{source.title}</h2>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button 
            onClick={onCancel}
            className="p-2 text-ink/40 hover:text-ink transition-colors"
          >
            <X size={20} />
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={selectedSlides.length === 0 || isLoading}
            className="flex items-center gap-2 bg-white border-2 border-border-theme text-ink px-4 py-2 md:px-6 md:py-2 rounded-xl font-bold text-sm hover:border-ink/20 hover:bg-bg transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span className="hidden sm:inline">Save Draft</span>
            <span className="sm:hidden">Save</span>
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={selectedSlides.length === 0 || isLoading}
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 md:px-6 md:py-2 rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">Publish Deck</span>
            <span className="sm:hidden">Publish</span>
          </button>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="md:hidden flex bg-white border-b border-border-theme shrink-0">
        <button 
          onClick={() => setActiveTab('claims')} 
          className={cn("flex-1 py-3 text-[12px] font-bold uppercase tracking-widest transition-colors", activeTab === 'claims' ? "text-accent border-b-2 border-accent" : "text-ink/40 border-b-2 border-transparent")}
        >
          Claims ({claims.length})
        </button>
        <button 
          onClick={() => setActiveTab('deck')} 
          className={cn("flex-1 py-3 text-[12px] font-bold uppercase tracking-widest transition-colors tracking-widest transition-colors", activeTab === 'deck' ? "text-accent border-b-2 border-accent" : "text-ink/40 border-b-2 border-transparent")}
        >
          Deck ({selectedSlides.length})
        </button>
      </div>

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden h-full">
        {/* Left: Claim Inventory */}
        <div className={cn(
          "w-full h-full md:w-1/3 border-r border-border-theme flex flex-col bg-panel/50 md:shrink-0",
          activeTab === 'claims' ? 'flex' : 'hidden md:flex'
        )}>
          <div className="p-4 md:p-6 border-b border-border-theme space-y-1 shrink-0 hidden md:block">
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
              <ShieldCheck size={14} className="text-accent" /> Key Claims ({claims.length})
            </h3>
            <p className="text-[11px] text-ink/30 italic">Select claims to add them to your narrative structure.</p>
          </div>
          
          <div className="flex-grow overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-3 md:space-y-4">
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
        <div className={cn(
          "flex-grow flex flex-col bg-white overflow-hidden w-full",
          activeTab === 'deck' ? 'flex' : 'hidden md:flex'
        )}>
          <div className="p-4 md:p-6 border-b border-border-theme bg-bg/20 shrink-0">
            <textarea 
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              className="text-lg md:text-2xl font-serif font-bold bg-transparent border-none focus:ring-0 w-full p-0 placeholder:text-ink/10 resize-none overflow-hidden leading-tight"
              placeholder="Give your narrative a title..."
              rows={2}
            />
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar p-4 md:p-12 relative w-full">
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
                      onDragStart={() => setDraggingId(slide.claimId)}
                      onDragEnd={() => setDraggingId(null)}
                      className={cn("group relative", draggingId === slide.claimId ? "z-50" : "")}
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
                        <NarrationEditor 
                          narration={slide.narration || ''} 
                          onChange={(val) => updateNarration(index, val)} 
                        />
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
