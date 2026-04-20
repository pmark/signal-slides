import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Topic } from '../lib/types';
import { topicService } from '../lib/topicService';
import { motion } from 'motion/react';
import { Clock, ChevronRight, Hash, UserCircle2, ArrowUpRight } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function History() {
  const { user, signIn } = useAuth();
  const [history, setHistory] = useState<Topic[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to user topics in real-time
    const unsubscribe = topicService.subscribeToUserTopics(user.uid, setHistory);
    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center text-ink-muted">
          <UserCircle2 size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Sign in to view analysis history</h3>
          <p className="text-ink-muted max-w-xs text-[12px] font-medium">
            Your structured research history is stored securely in the cloud.
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
          <Hash size={24} />
        </div>
        <h3 className="text-xl font-bold">No active topics</h3>
        <p className="text-ink-muted max-w-xs text-[11px] font-medium leading-relaxed italic">
          Start your first analysis to see your research topics here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-2xl font-serif font-bold">Research History</h2>
        <span className="text-[11px] font-bold text-ink-muted border border-border-theme px-3 py-1 rounded">
          {history.length} Topics
        </span>
      </div>

      <div className="grid gap-6">
        {history.map((t) => (
          <Link
            key={t.id}
            to={`/topic/${t.id}`}
            className="group block"
          >
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="group flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-white border border-border-theme rounded-2xl hover:border-accent hover:shadow-xl transition-all text-left slide-shadow"
            >
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-accent/5 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
                  <Hash size={20} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-serif font-bold leading-tight group-hover:text-accent transition-colors">
                    {t.title}
                  </h4>
                  <p className="text-[13px] text-ink-muted font-medium line-clamp-1 opacity-80">{t.description}</p>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-ink-muted mt-2">
                    <span className="text-accent uppercase tracking-widest">{t.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex items-center gap-2 text-accent font-bold text-[11px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Open Analysis <ArrowUpRight size={14} />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
