import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  ChevronDown, 
  ChevronUp,
  Filter
} from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function History() {
  const { user, signIn } = useAuth();
  const [history, setHistory] = useState<Source[]>([]);
  const [allDecks, setAllDecks] = useState<{ [id: string]: Deck }>({});
  const [activeTab, setActiveTab] = useState<'extractions' | 'decks'>('extractions');
  const [deckFilter, setDeckFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [collapsedSources, setCollapsedSources] = useState<Set<string>>(new Set());

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
    if (confirm("Delete this source and all associated decks?")) {
      await sourceService.deleteSource(sourceId);
    }
  };

  const handleDeleteDeck = async (e: React.MouseEvent, sourceId: string, deckId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this presentation?")) {
      await sourceService.deleteDeck(sourceId, deckId);
      setAllDecks(prev => {
        const next = { ...prev };
        delete next[deckId];
        return next;
      });
    }
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
              <div key={s.id} className="relative group">
                <Link
                  to={`/workspace/${s.id}`}
                  className="block p-8 bg-white border border-border-theme rounded-3xl hover:border-accent hover:shadow-xl transition-all text-left slide-shadow pr-20"
                >
                  <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 bg-accent/5 rounded-2xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-serif font-bold leading-tight group-hover:text-accent transition-colors">
                        {s.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-ink-muted mt-2">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                        {s.url && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px] opacity-40">{s.url}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                <button 
                  onClick={(e) => handleDeleteSource(e, s.id)}
                  className="absolute right-8 top-1/2 -translate-y-1/2 p-3 text-ink/10 hover:text-red-500 transition-colors bg-white rounded-full border border-transparent hover:border-red-100 hover:bg-red-50"
                  title="Delete Source"
                >
                  <Trash2 size={18} />
                </button>
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
                          <div key={d.id} className="relative group">
                            <Link
                              to={d.status === 'draft' ? `/workspace/${d.sourceId}/${d.id}` : `/deck/${d.sourceId}/${d.id}`}
                              className="block p-6 bg-white border border-border-theme rounded-2xl hover:border-accent hover:shadow-lg transition-all text-left slide-shadow pr-20"
                            >
                              <div className="flex gap-6 items-start">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 font-serif font-bold italic ${d.status === 'draft' ? 'bg-bg text-ink-muted group-hover:bg-ink group-hover:text-white' : 'bg-ink text-white group-hover:bg-accent'}`}>
                                  s
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-lg font-serif font-bold leading-tight group-hover:text-accent transition-colors flex items-center gap-2">
                                    {d.title}
                                    {d.status === 'draft' && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-ink/5 text-ink/40 uppercase tracking-widest border border-border-theme font-sans">Draft</span>
                                    )}
                                  </h4>
                                  <div className="flex items-center gap-3 text-[11px] font-bold text-ink-muted">
                                    <span className={`flex items-center gap-1 rounded uppercase ${d.status === 'draft' ? 'text-ink/40' : 'text-accent'}`}>
                                      {d.slides.length} slides
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Clock size={10} />
                                      {new Date(d.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                            <button 
                              onClick={(e) => handleDeleteDeck(e, d.sourceId, d.id)}
                              className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 text-ink/5 hover:text-red-500 transition-colors bg-white rounded-xl border border-transparent hover:border-red-100 hover:bg-red-50"
                              title="Delete Presentation"
                            >
                              <Trash2 size={16} />
                            </button>
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
