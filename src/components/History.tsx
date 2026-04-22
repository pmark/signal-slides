import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Source, Deck } from '../lib/types';
import { sourceService } from '../lib/sourceService';
import { motion } from 'motion/react';
import { Clock, UserCircle2, ArrowUpRight, Zap, FileText } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function History() {
  const { user, signIn } = useAuth();
  const [history, setHistory] = useState<Source[]>([]);
  const [allDecks, setAllDecks] = useState<{ [id: string]: Deck }>({});
  const [activeTab, setActiveTab] = useState<'extractions' | 'decks'>('extractions');

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
          decks.forEach(d => next[d.id] = d);
          return next;
        });
      })
    );
    return () => unsubscribes.forEach(u => u());
  }, [history]);

  const decksList = Object.values(allDecks).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const publishedDecks = decksList.filter(d => d.status === 'published');

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
        <h2 className="text-2xl font-serif font-bold">My Library</h2>
      </div>

      <div className="flex border-b border-border-theme px-4 gap-8">
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
          Presentations ({decksList.length})
        </button>
      </div>

      <div className="grid gap-6">
        {activeTab === 'extractions' ? history.map((s) => (
          <Link
            key={s.id}
            to={`/workspace/${s.id}`}
            className="group block"
          >
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="group flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-white border border-border-theme rounded-3xl hover:border-accent hover:shadow-xl transition-all text-left slide-shadow"
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
              <div className="mt-6 md:mt-0 flex items-center gap-2 text-accent font-bold text-[11px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Enter Workspace <ArrowUpRight size={14} />
              </div>
            </motion.div>
          </Link>
        )) : decksList.length === 0 ? (
          <div className="py-20 text-center text-ink-muted italic text-[13px]">
            You have not created any decks yet.
          </div>
        ) : decksList.map((d) => (
          <Link
            key={d.id}
            to={d.status === 'draft' ? `/workspace/${d.sourceId}/${d.id}` : `/deck/${d.sourceId}/${d.id}`}
            className="group block"
          >
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="group flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-white border border-border-theme rounded-3xl hover:border-accent hover:shadow-xl transition-all text-left slide-shadow"
            >
              <div className="flex gap-6 items-start">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shrink-0 font-serif font-bold italic ${d.status === 'draft' ? 'bg-bg text-ink-muted group-hover:bg-ink group-hover:text-white' : 'bg-ink text-white group-hover:bg-accent'}`}>
                  s
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-serif font-bold leading-tight group-hover:text-accent transition-colors flex items-center gap-2">
                    {d.title}
                    {d.status === 'draft' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-ink/5 text-ink/40 uppercase tracking-widest border border-border-theme font-sans">Draft</span>
                    )}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-ink-muted mt-2">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded uppercase ${d.status === 'draft' ? 'bg-bg text-ink/40' : 'bg-accent/10 text-accent'}`}>
                      {d.slides.length} slides
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex items-center gap-2 text-accent font-bold text-[11px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                {d.status === 'draft' ? 'Edit Draft' : 'View Deck'} <ArrowUpRight size={14} />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
