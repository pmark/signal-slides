import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Source, Deck } from '../lib/types';
import { sourceService } from '../lib/sourceService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  UserCircle2, 
  ArrowUpRight, 
  Zap, 
  FileText, 
  Trash2, 
  X,
  ChevronDown, 
  ChevronUp,
  Filter
} from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function History() {
  const { user, signIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [history, setHistory] = useState<Source[]>([]);
  const [allDecks, setAllDecks] = useState<{ [id: string]: Deck }>({});
  
  const activeTab = (searchParams.get('tab') as 'extractions' | 'decks') || 'extractions';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const [deckFilter, setDeckFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [collapsedSources, setCollapsedSources] = useState<Set<string>>(new Set());
  const [confirmingSourceId, setConfirmingSourceId] = useState<string | null>(null);
  const [confirmingDeckId, setConfirmingDeckId] = useState<string | null>(null);

  useEffect(() => {
    setConfirmingSourceId(null);
    setConfirmingDeckId(null);
  }, [activeTab]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = sourceService.subscribeToUserSources(user.uid, (sources) => {
      setHistory(sources);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (history.length === 0) return;
    const unsubscribes = history.map(s => 
      sourceService.subscribeToDecks(s.id, (decks) => {
        setAllDecks(prev => {
          const next = { ...prev };
          // Clean out old decks for this source to ensure no duplicates if ids change (though unlikely)
          Object.keys(next).forEach(id => {
            if (next[id].sourceId === s.id) delete next[id];
          });
          decks.forEach(d => next[d.id] = d);
          return next;
        });
      })
    );
    return () => unsubscribes.forEach(u => u());
  }, [history]);

  const toggleSourceCollapse = (sourceId: string) => {
    setCollapsedSources(prev => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
  };

  const handleDeleteSource = async (e: React.MouseEvent, sourceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirmingSourceId !== sourceId) {
      setConfirmingSourceId(sourceId);
      setConfirmingDeckId(null);
      return;
    }

    try {
      await sourceService.deleteSource(sourceId);
      setAllDecks(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id].sourceId === sourceId) delete next[id];
        });
        return next;
      });
      setConfirmingSourceId(null);
    } catch (err) {
      alert("Failed to delete source. You may not have permission.");
      console.error(err);
    }
  };

  const handleDeleteDeck = async (e: React.MouseEvent, sourceId: string, deckId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirmingDeckId !== deckId) {
      setConfirmingDeckId(deckId);
      setConfirmingSourceId(null);
      return;
    }

    try {
      await sourceService.deleteDeck(sourceId, deckId);
      setAllDecks(prev => {
        const next = { ...prev };
        delete next[deckId];
        return next;
      });
      setConfirmingDeckId(null);
    } catch (err) {
      alert("Failed to delete presentation. You may not have permission.");
      console.error(err);
    }
  };

  const cancelConfirmation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmingSourceId(null);
    setConfirmingDeckId(null);
  };

  const groupedDecks = useMemo(() => {
    const decks = Object.values(allDecks).filter(d => {
      if (deckFilter === 'all') return true;
      return d.status === deckFilter;
    });
    
    const groups: { [sourceId: string]: Deck[] } = {};
    decks.forEach(d => {
      if (!groups[d.sourceId]) groups[d.sourceId] = [];
      groups[d.sourceId].push(d);
    });
    
    // Sort each group by date
    Object.keys(groups).forEach(sid => {
      groups[sid].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    
    return groups;
  }, [allDecks, deckFilter]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center text-ink-muted">
          <UserCircle2 size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Sign in to view your library</h3>
          <p className="text-ink-muted max-w-xs text-[12px] font-medium leading-relaxed">
            Your saved sources and presentations are stored securely.
          </p>
        </div>
        <button 
          onClick={() => signIn()}
          className="bg-ink text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-accent transition-all"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center text-ink-muted">
          <Zap size={24} />
        </div>
        <h3 className="text-xl font-bold">No sources saved yet</h3>
        <p className="text-ink-muted max-w-xs text-[11px] font-medium leading-relaxed italic">
          Start by deconstructing your first piece of content.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-2xl font-serif font-bold text-ink">My Library</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-theme px-4 gap-4">
        <div className="flex gap-8">
          <button 
            onClick={() => setActiveTab('extractions')}
            className={`pb-4 text-[12px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'extractions' ? 'text-accent border-b-2 border-accent' : 'text-ink/40 border-b-2 border-transparent hover:text-ink/80'}`}
          >
            Sources ({history.length})
          </button>
          <button 
            onClick={() => setActiveTab('decks')}
            className={`pb-4 text-[12px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'decks' ? 'text-accent border-b-2 border-accent' : 'text-ink/40 border-b-2 border-transparent hover:text-ink/80'}`}
          >
            Presentations ({Object.keys(allDecks).length})
          </button>
        </div>

        {activeTab === 'decks' && (
          <div className="flex items-center gap-2 pb-4 md:pb-0">
            <Filter size={14} className="text-ink/20" />
            <select 
              value={deckFilter} 
              onChange={(e) => setDeckFilter(e.target.value as any)}
              className="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest text-ink/60 focus:ring-0 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {activeTab === 'extractions' ? (
          <div className="grid gap-4 px-4">
            {history.map((s) => (
              <div key={s.id} className="relative group overflow-hidden bg-white border border-border-theme rounded-3xl slide-shadow transition-all hover:border-accent">
                <Link
                  to={`/workspace/${s.id}`}
                  className="block p-5 md:p-8 text-left pr-16 md:pr-24"
                >
                  <div className="flex gap-4 md:gap-6 items-start">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/5 rounded-2xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-lg md:text-xl font-serif font-bold leading-tight group-hover:text-accent transition-colors break-words">
                        {s.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-[11px] font-bold text-ink-muted mt-2">
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock size={12} />
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                        {s.url && (
                          <>
                            <span className="hidden md:inline">•</span>
                            <span className="truncate opacity-40 max-w-[150px] md:max-w-none">{s.url}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2 md:pr-4 z-20">
                  <AnimatePresence mode="wait">
                    {confirmingSourceId === s.id ? (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-2 bg-white/95 backdrop-blur-sm pl-4 pr-2 py-2 rounded-l-full border-l border-y border-red-100 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] h-full"
                      >
                        <button 
                          onClick={cancelConfirmation}
                          className="p-2 text-ink/40 hover:text-ink transition-colors"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSource(e, s.id)}
                          className="bg-red-500 text-white p-2.5 md:p-3 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-md active:scale-95 border border-red-600"
                          title="Confirm Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.button 
                        key="delete-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => handleDeleteSource(e, s.id)}
                        className="p-2.5 md:p-3 text-ink/10 hover:text-red-500 bg-white/80 backdrop-blur-sm rounded-full border border-transparent hover:border-red-100 hover:bg-red-50 transition-all mr-2 md:mr-4"
                        title="Delete Source"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 px-4">
            {history.map((source) => {
              const decks = groupedDecks[source.id];
              if (!decks || decks.length === 0) return null;
              const isCollapsed = collapsedSources.has(source.id);

              return (
                <div key={source.id} className="space-y-3">
                  <button 
                    onClick={() => toggleSourceCollapse(source.id)}
                    className="flex items-center justify-between w-full p-4 bg-bg/50 rounded-2xl border border-border-theme/40 hover:bg-bg transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-accent rounded-full" />
                      <h3 className="text-[12px] font-bold text-ink/40 uppercase tracking-widest text-left truncate max-w-lg">
                        {source.title}
                      </h3>
                      <span className="text-[10px] font-bold text-accent px-2 py-0.5 bg-accent/5 rounded border border-accent/10 uppercase">
                        {decks.length} {decks.length === 1 ? 'Presentation' : 'Presentations'}
                      </span>
                    </div>
                    {isCollapsed ? <ChevronDown size={16} className="text-ink/20" /> : <ChevronUp size={16} className="text-ink/20" />}
                  </button>

                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-3 pl-4 border-l border-border-theme/40 ml-4"
                      >
                        {decks.map((d) => (
                          <div key={d.id} className="relative group overflow-hidden bg-white border border-border-theme rounded-2xl slide-shadow transition-all hover:border-accent">
                            <Link
                              to={d.status === 'draft' ? `/workspace/${d.sourceId}/${d.id}` : `/deck/${d.sourceId}/${d.id}`}
                              className="block p-4 md:p-6 text-left pr-14 md:pr-20"
                            >
                              <div className="flex gap-4 md:gap-6 items-start">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 font-serif font-bold italic text-sm md:text-base ${d.status === 'draft' ? 'bg-bg text-ink-muted group-hover:bg-ink group-hover:text-white' : 'bg-ink text-white group-hover:bg-accent'}`}>
                                  s
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <h4 className="text-base md:text-lg font-serif font-bold leading-tight group-hover:text-accent transition-colors flex flex-wrap items-center gap-2 break-words">
                                    {d.title}
                                    {d.status === 'draft' && (
                                      <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-sm bg-ink/5 text-ink/40 uppercase tracking-widest border border-border-theme font-sans shrink-0">Draft</span>
                                    )}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-[11px] font-bold text-ink-muted">
                                    <span className={`flex items-center gap-1 rounded uppercase shrink-0 ${d.status === 'draft' ? 'text-ink/40' : 'text-accent'}`}>
                                      {d.slides.length} slides
                                    </span>
                                    <span className="hidden md:inline">•</span>
                                    <span className="flex items-center gap-1 shrink-0">
                                      <Clock size={10} />
                                      {new Date(d.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-1 md:pr-2 z-20">
                              <AnimatePresence mode="wait">
                                {confirmingDeckId === d.id ? (
                                  <motion.div 
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 5 }}
                                    className="flex items-center gap-2 bg-white/95 backdrop-blur-sm pl-4 pr-1.5 py-1.5 rounded-l-2xl border-l border-y border-red-100 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.05)] h-full"
                                  >
                                    <button 
                                      onClick={cancelConfirmation}
                                      className="p-1.5 text-ink/30 hover:text-ink transition-colors"
                                      title="Cancel"
                                    >
                                      <X size={14} />
                                    </button>
                                    <button 
                                      onClick={(e) => handleDeleteDeck(e, d.sourceId, d.id)}
                                      className="bg-red-500 text-white p-2 md:p-2.5 rounded-lg flex items-center justify-center hover:bg-red-600 transition-all shadow-md active:scale-95 border border-red-600"
                                      title="Confirm"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </motion.div>
                                ) : (
                                  <motion.button 
                                    key="delete-deck-btn"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={(e) => handleDeleteDeck(e, d.sourceId, d.id)}
                                    className="p-2 md:p-2.5 text-ink/5 hover:text-red-500 bg-white/80 backdrop-blur-sm rounded-xl border border-transparent hover:border-red-100 hover:bg-red-50 transition-all mr-1 md:mr-2"
                                    title="Delete Presentation"
                                  >
                                    <Trash2 size={16} />
                                  </motion.button>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            
            {Object.keys(groupedDecks).length === 0 && (
              <div className="py-20 text-center text-ink-muted italic text-[13px]">
                No presentations found matching this filter.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
