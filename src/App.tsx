import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, useNavigate, useLocation, Link, NavLink, useParams, Navigate } from 'react-router-dom';
import SetupForm from './components/SetupForm';
import SlideDeck from './components/SlideDeck';
import History from './components/History';
import About from './components/About';
import NarrativeCreator from './components/NarrativeCreator';
import NarrativeView from './components/NarrativeView';
import ClaimPage from './components/ClaimPage';
import { GenerationOptions, Topic, AtomicClaim, Analysis, cn, NarrativeDeck, NarrativeIntent } from './lib/types';
import { generateClaimAnalysis } from './lib/gemini';
import { topicService } from './lib/topicService';
import { db } from './lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Plus, BookOpen, LayoutGrid, TrendingUp, Clock, ChevronRight, Hash, ShieldCheck, Share2, Zap, User } from 'lucide-react';
import { useAuth } from './components/AuthProvider';
import pkg from '../package.json';

// --- Page Components ---

function HomePage({ 
  topics, 
  stats 
}: { 
  topics: Topic[], 
  stats: { topics: number, claims: number }
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-16 py-8"
    >
      {/* Hero / Create Trigger */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-12 bg-white p-12 rounded-2xl border border-border-theme slide-shadow overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-bl-full -mr-32 -mt-32 pointer-events-none" />
        <div className="space-y-6 max-w-xl relative z-10">
          <h2 className="text-4xl font-serif font-bold tracking-tight text-ink leading-tight">
            Verified Research. Structured Analysis.
          </h2>
          <p className="text-lg text-ink-muted leading-relaxed">
            SignalSlides transforms complex reports into clear, evidence-based claim sets. Analyze the facts, review the evidence, and explore balanced perspectives.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link 
              to="/create"
              className="flex items-center gap-2 bg-ink text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-ink/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} />
              New Topic Analysis
            </Link>
          </div>
        </div>
        
        <div className="hidden lg:block w-px h-48 bg-border-theme mx-12 shrink-0" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 w-full xl:w-auto">
          {[
            { label: 'Atomic Claims', val: stats.claims?.toLocaleString() || '12.4k' },
            { label: 'Active Topics', val: stats.topics?.toLocaleString() || '842' }
          ].map((stat, i) => (
            <div key={i} className="bg-bg p-8 rounded-xl border border-border-theme/50 text-center flex flex-col justify-center min-w-[200px] shadow-sm">
              <div className="text-3xl font-serif font-bold text-accent italic leading-none">{stat.val}</div>
              <div className="text-[11px] font-bold text-ink/40 mt-2 uppercase tracking-tighter whitespace-nowrap">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Discovery Feed */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-border-theme pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-xl font-serif font-bold">Active Analysis Topics</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((t) => (
            <Link 
              key={t.id} 
              to={`/topic/${t.id}`}
              className="flex flex-col p-6 bg-white border border-border-theme rounded-2xl hover:border-accent group transition-all slide-shadow h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-bg rounded-full text-[10px] font-bold text-ink-muted uppercase tracking-wider">{t.category}</span>
                <span className="text-[10px] text-ink/20 font-bold">{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 className="text-[18px] font-serif font-bold text-ink leading-tight group-hover:text-accent transition-colors mb-2">{t.title}</h4>
              <p className="text-[13px] text-ink-muted line-clamp-2 mb-6 flex-grow">{t.description}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-bg">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-6 h-6 rounded-full bg-accent/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-accent">U</div>
                   ))}
                </div>
                <div className="flex items-center gap-2 text-accent text-[11px] font-bold">
                  View Topic <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function CreatePage({ 
  onGenerate, 
  isLoading, 
  error, 
  initialTopic 
}: { 
  onGenerate: (o: GenerationOptions) => void, 
  isLoading: boolean, 
  error: string | null,
  initialTopic: string
}) {
  const { user, signIn } = useAuth();
  
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-8">
        <h2 className="text-3xl font-serif font-bold tracking-tight text-ink">Sign in to Start Analysis</h2>
        <button 
          onClick={() => signIn()}
          className="bg-ink text-white px-10 py-4 rounded-full font-bold text-sm hover:bg-accent transition-all"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto space-y-12 py-8"
    >
      <div className="space-y-4 text-center">
        <h2 className="text-4xl font-serif font-bold tracking-tight text-ink">New Analysis Package</h2>
        <p className="text-lg text-ink-muted max-w-xl mx-auto leading-relaxed">
          Input a topic, URL, or article text. We'll deconstruct it into atomic claims and generate a structured research view.
        </p>
      </div>
      
      <SetupForm 
        onSubmit={onGenerate} 
        isLoading={isLoading} 
        initialTopic={initialTopic}
      />
      
      {error && (
        <div className="flex items-center gap-4 text-red-600 bg-white border border-red-100 p-6 rounded-xl">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </motion.div>
  );
}

function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [claims, setClaims] = useState<AtomicClaim[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [narratives, setNarratives] = useState<NarrativeDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, signIn } = useAuth();

  useEffect(() => {
    if (topicId) {
      setLoading(true);
      topicService.getTopicById(topicId).then(setTopic);
      const unsubClaims = topicService.subscribeToClaims(topicId, setClaims);
      const unsubAnalyses = topicService.subscribeToAnalyses(topicId, setAnalyses);
      const unsubNarratives = topicService.subscribeToNarratives(topicId, setNarratives);
      setLoading(false);
      return () => {
        unsubClaims();
        unsubAnalyses();
        unsubNarratives();
      };
    }
  }, [topicId]);

  if (loading || !topic) return <div className="py-40 text-center">Loading Topic...</div>;

  const handleGuardedAction = (action: () => void) => {
    if (!user) {
      signIn();
      return;
    }
    action();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16 py-8">
      <Helmet>
        <title>{topic.title} | Claims Analysis</title>
      </Helmet>

      {/* Topic Header */}
      <div className="bg-white p-12 rounded-3xl border border-border-theme slide-shadow relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2 text-accent text-sm font-bold uppercase tracking-widest">
            <Hash size={16} /> {topic.category}
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-serif font-bold tracking-tight text-ink">{topic.title}</h1>
            <p className="text-xl text-ink-muted max-w-3xl leading-relaxed">{topic.description}</p>
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
             <button 
              onClick={() => handleGuardedAction(() => navigate(`/topic/${topicId}/narrative/intent`))}
              className="flex items-center gap-2 bg-accent text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
             >
               <Zap size={18} /> Build Your Narrative
             </button>
             <button 
              onClick={() => handleGuardedAction(() => {})} // Placeholder for contribute claim
              className="flex items-center gap-2 bg-ink text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-ink/90 transition-all"
             >
               <Plus size={18} /> Contribute Claim
             </button>
             <button className="flex items-center gap-2 bg-white border border-border-theme px-8 py-3.5 rounded-2xl font-bold text-sm hover:border-accent transition-all">
               <Share2 size={18} /> Share Topic
             </button>
          </div>
        </div>
      </div>

      {/* Top Narratives Section */}
      {narratives.length > 0 && (
        <div className="space-y-8">
           <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <h3 className="text-2xl font-serif font-bold flex items-center gap-3">
                <LayoutGrid size={24} className="text-accent" /> Featured Interpretations
              </h3>
              <button 
                onClick={() => navigate(`/topic/${topicId}/narrative/intent`)}
                className="text-[12px] font-bold text-accent hover:underline flex items-center gap-1"
              >
                Create New Narrative <ChevronRight size={14} />
              </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {narratives.slice(0, 3).map(n => (
                <Link 
                  key={n.id} 
                  to={`/topic/${topicId}/narrative/${n.id}`}
                  className="p-8 bg-white border border-border-theme rounded-3xl slide-shadow group hover:border-accent transition-all flex flex-col justify-between h-full"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <span className="px-2 py-0.5 bg-bg text-[9px] font-bold uppercase tracking-widest text-ink/40 rounded">
                          {n.intent}
                       </span>
                       <div className="text-[10px] font-bold text-ink/20">{n.slides.length} Slides</div>
                    </div>
                    <h4 className="text-xl font-bold text-ink group-hover:text-accent transition-colors leading-tight">{n.title}</h4>
                    <p className="text-sm text-ink-muted line-clamp-2 italic opacity-60">“{n.thesis}”</p>
                  </div>
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-bg">
                     <div className="flex items-center gap-2">
                        <User size={14} className="text-accent" />
                        <span className="text-[11px] font-bold">{n.creatorName || 'Anonymous'}</span>
                     </div>
                     <ChevronRight size={18} className="text-ink/10 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Claims Directory */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
             <h3 className="text-2xl font-serif font-bold flex items-center gap-3">
               <ShieldCheck size={24} className="text-accent" /> Atomic Claims ({claims.length})
             </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claims.map(claim => (
              <Link 
                key={claim.id} 
                to={`/topic/${topicId}/claim/${claim.id}`}
                className="p-6 bg-white border border-border-theme rounded-2xl slide-shadow group hover:border-accent transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                      claim.status === 'verified' ? "bg-green-100 text-green-700" : 
                      claim.status === 'disputed' ? "bg-red-100 text-red-700" : "bg-bg text-ink/40"
                    )}>
                      {claim.status}
                    </span>
                    <span className="text-[10px] font-bold text-ink/20 uppercase tracking-widest">{claim.type}</span>
                  </div>
                  <p className="text-[15px] font-bold text-ink group-hover:text-accent transition-colors leading-snug">{claim.statement}</p>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-bg">
                   <div className="text-[11px] font-bold text-ink/40">Confidence: {(claim.confidence * 100).toFixed(0)}%</div>
                   <div className="text-[11px] font-bold text-ink/40">{claim.interactionCount || 0} Interactions</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Available Analyses */}
        <div className="lg:col-span-4 space-y-8">
           <div className="flex items-center justify-between border-b border-border-theme pb-4">
             <h3 className="text-2xl font-serif font-bold">Analyses</h3>
           </div>
           <div className="space-y-4">
             {analyses.map(analysis => (
               <Link 
                 key={analysis.id} 
                 to={`/topic/${topicId}/analysis/${analysis.id}`}
                 className="block p-6 bg-panel border-2 border-border-theme rounded-2xl hover:border-accent transition-all relative overflow-hidden group"
               >
                 <div className="relative z-10 space-y-2">
                   <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">{analysis.type} View</div>
                   <h4 className="text-[18px] font-bold text-ink group-hover:text-accent transition-colors">{analysis.title}</h4>
                   <div className="flex items-center gap-2 text-ink-muted text-[11px] font-medium pt-2">
                     <BookOpen size={14} /> {analysis.slides.length} Visualization Panels
                   </div>
                 </div>
                 <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-ink/20 group-hover:text-accent group-hover:translate-x-1 transition-all" size={24} />
               </Link>
             ))}
           </div>
           
           <div className="p-10 bg-bg rounded-3xl border-2 border-dashed border-border-theme flex flex-col items-center text-center space-y-4">
              <TrendingUp size={32} className="text-ink/10" />
              <div className="space-y-1">
                 <p className="text-[14px] font-bold">New Perspective?</p>
                 <p className="text-[12px] text-ink/40">Generate a machine-vetted analysis view for this topic.</p>
              </div>
              <Link to="/create" state={{ topic: topic.title, topicId: topic.id }} className="bg-white border border-border-theme px-6 py-2.5 rounded-xl text-[12px] font-bold text-accent hover:border-accent transition-all">
                Run AI Analysis
              </Link>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function NarrativePage() {
  const { topicId, narrativeId } = useParams<{ topicId: string, narrativeId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [narrative, setNarrative] = useState<NarrativeDeck | null>(null);
  const [claims, setClaims] = useState<AtomicClaim[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (topicId && narrativeId) {
      topicService.getTopicById(topicId).then(setTopic);
      topicService.subscribeToClaims(topicId, setClaims);
      topicService.getNarrativeById(topicId, narrativeId).then(setNarrative);
    }
  }, [topicId, narrativeId]);

  if (!narrative || !topic) return <div className="py-40 text-center animate-pulse text-xl">Entering Narrative Flow...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
       <div className="mb-8">
          <Link to={`/topic/${topicId}`} className="text-[12px] font-bold text-ink/40 hover:text-ink flex items-center gap-2">
            <ChevronRight size={14} className="rotate-180" /> Back to Topic Directory
          </Link>
       </div>
       <NarrativeView 
         narrative={narrative} 
         topic={topic} 
         claims={claims} 
         onAction={(action) => {
           if (action === 'remix') navigate(`/topic/${topicId}`, { state: { remix: narrative.id } });
         }}
       />
    </motion.div>
  );
}

function NarrativeBuildPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [claims, setClaims] = useState<AtomicClaim[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialIntent = location.state?.intent as NarrativeIntent || null;

  useEffect(() => {
    if (topicId) {
      topicService.getTopicById(topicId).then(setTopic);
      topicService.subscribeToClaims(topicId, setClaims);
    }
  }, [topicId]);

  const handleSaveNarrative = async (narrative: Partial<NarrativeDeck>) => {
    if (!topicId || !user) return;
    const id = await topicService.createNarrative(topicId, narrative, user.uid);
    navigate(`/topic/${topicId}/narrative/${id}`);
  };

  if (!topic) return <div className="py-20 text-center">Loading Blueprint...</div>;

  return (
    <NarrativeCreator 
      topic={topic}
      claims={claims}
      onSave={handleSaveNarrative}
      onCancel={() => navigate(`/topic/${topicId}`)}
      initialIntent={initialIntent}
      initialStep={initialIntent ? 2 : 1}
    />
  );
}

function NarrativeIntentPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [claims, setClaims] = useState<AtomicClaim[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (topicId) {
      topicService.getTopicById(topicId).then(setTopic);
      topicService.subscribeToClaims(topicId, setClaims);
    }
  }, [topicId]);

  if (!topic) return <div className="py-20 text-center">Loading Intent...</div>;

  return (
    <NarrativeCreator 
      topic={topic}
      claims={claims}
      onSave={async () => {}} // Not used here
      onCancel={() => navigate(`/topic/${topicId}`)}
      onlyIntent={true}
      onIntentSelect={(intent) => {
        navigate(`/topic/${topicId}/narrative/build`, { state: { intent } });
      }}
    />
  );
}

function AnalysisPage() {
  const { topicId, analysisId } = useParams<{ topicId: string, analysisId: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    if (topicId && analysisId) {
      const unsubAnalysis = onSnapshot(doc(db, 'topics', topicId, 'analyses', analysisId), (snap) => {
        if (snap.exists()) setAnalysis(snap.data() as Analysis);
      });
      
      return () => {
        unsubAnalysis();
      };
    }
  }, [topicId, analysisId]);

  if (!analysis) return <div className="py-40 text-center animate-pulse">Loading Analysis View...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8">
       <Helmet>
         <title>{analysis.title} | Analysis Framework</title>
       </Helmet>

       <div className="flex items-center justify-between mb-8">
          <Link to={`/topic/${topicId}`} className="text-[12px] font-bold text-ink/40 hover:text-ink flex items-center gap-2">
            <ChevronRight size={14} className="rotate-180" /> Back to Topic claims
          </Link>
          <div className="text-[11px] font-bold text-accent uppercase tracking-widest bg-accent/5 px-3 py-1 rounded-full border border-accent/10">
            {analysis.type} Framework
          </div>
       </div>
       <SlideDeck 
         analysis={analysis} 
         onSelectClaim={(claimId) => navigate(`/topic/${topicId}/claim/${claimId}`)}
         onRegenerate={() => navigate('/create')} 
       />
    </motion.div>
  );
}

// --- Main App ---

export default function App() {
  const { user, signIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [globalStats, setGlobalStats] = useState({ topics: 0, claims: 0 });

  useEffect(() => {
    topicService.getRecentTopics().then(setTopics);
    // Simple mock stats for now
    setGlobalStats({ topics: 1242, claims: 14720 });
  }, []);

  const handleGenerate = async (options: GenerationOptions) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateClaimAnalysis(options);
      
      const existingTopicId = (location.state as { topicId?: string })?.topicId;

      if (existingTopicId) {
        const analysisId = await topicService.createAnalysis(existingTopicId, result.analysis, user.uid);
        navigate(`/topic/${existingTopicId}/analysis/${analysisId}`);
      } else {
        const topicId = await topicService.createTopicPackage({
          topic: result.topic,
          claims: result.claims,
          sources: result.sources,
          analysis: result.analysis,
          userId: user.uid
        });
        navigate(`/topic/${topicId}`);
      }
    } catch (err) {
      console.error(err);
      setError('Analysis failed. The system could not deconstruct this topic into verifiable claims.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'SignalSlides | Claims-Based Analysis';
    if (path === '/create') return 'Analyze Topic | SignalSlides';
    if (path.includes('/narrative/')) return 'View Narrative | SignalSlides';
    if (path.startsWith('/topic/')) return 'View Topic | SignalSlides';
    return 'SignalSlides';
  };

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-accent/10 selection:text-accent flex flex-col">
      <Helmet>
        <title>{getPageTitle()}</title>
        <meta name="description" content="SignalSlides transforms complex topics into atomic claims. Explore verified truths and disputable perspectives through structured information architecture." />
      </Helmet>

      {/* Header */}
      <header className="h-20 bg-panel border-b border-border-theme flex items-center justify-between px-6 md:px-12 sticky top-0 z-[60]">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-all shadow-lg shadow-ink/10">S</div>
            <h1 className="text-xl font-extrabold tracking-tighter uppercase leading-none hidden sm:block">SignalSlides</h1>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-8">
            {[
              { to: '/create', label: 'Start Analysis', icon: Plus },
              { to: '/history', label: 'History', icon: Clock },
              { to: '/about', label: 'Methodology', icon: ShieldCheck }
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "text-[12px] font-bold flex items-center gap-2 transition-all p-2 rounded-md",
                  isActive ? "text-accent bg-accent/5" : "text-ink/40 hover:text-ink"
                )}
              >
               <item.icon size={14} />
               {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-8">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[12px] font-bold leading-tight">{user.displayName}</span>
                <button 
                  onClick={() => logout()}
                  className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                >
                  Sign Out
                </button>
              </div>
              <div className="w-10 h-10 rounded-full border border-border-theme overflow-hidden bg-bg">
                {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />}
              </div>
            </div>
          ) : (
            <button 
              onClick={() => signIn()}
              className="bg-ink text-white px-5 py-2 rounded-full text-[12px] font-bold hover:bg-accent transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 pt-6 pb-20">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route index element={<HomePage topics={topics} stats={globalStats} />} />
            <Route path="/create" element={<CreatePage onGenerate={handleGenerate} isLoading={isLoading} error={error} initialTopic={location.state?.topic || ''} />} />
            <Route path="/history" element={<History />} />
            <Route path="/about" element={<About />} />
            <Route path="/topic/:topicId" element={<TopicPage />} />
            <Route path="/topic/:topicId/analysis/:analysisId" element={<AnalysisPage />} />
            <Route path="/topic/:topicId/claim/:claimId" element={<ClaimPage />} />
            <Route path="/topic/:topicId/narrative/intent" element={<NarrativeIntentPage />} />
            <Route path="/topic/:topicId/narrative/build" element={<NarrativeBuildPage />} />
            <Route path="/topic/:topicId/narrative/:narrativeId" element={<NarrativePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-theme py-16 bg-white shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 text-[12px]">
          <span className="font-bold text-ink/40">SignalSlides Analysis System</span>
          <nav className="flex gap-12 font-semibold text-ink/40">
             <Link to="/" className="hover:text-accent font-bold">Discovery</Link>
             <Link to="/about" className="hover:text-accent font-bold">Methodology</Link>
             <Link to="/create" className="hover:text-accent font-bold">Analyze</Link>
          </nav>
          <span className="text-ink/20 font-medium">Core Intelligence v{pkg.version}</span>
        </div>
      </footer>
    </div>
  );
}

