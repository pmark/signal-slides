import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, useNavigate, useLocation, Link, NavLink, useParams, Navigate } from 'react-router-dom';
import SourceInput from './components/SourceInput';
import ClaimWorkspace from './components/ClaimWorkspace';
import DeckViewer from './components/DeckViewer';
import History from './components/History';
import About from './components/About';
import { 
  Source, 
  Claim, 
  Deck, 
  GenerationOptions, 
  cn 
} from './lib/types';
import { extractClaimsAndNarrative } from './lib/gemini';
import { sourceService } from './lib/sourceService';
import { useAuth } from './components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Clock, 
  ShieldCheck, 
  Zap, 
  LayoutGrid, 
  Sparkles,
  X
} from 'lucide-react';
import pkg from '../package.json';

// --- Page Components ---

function LandingPage({ onSubmit, isLoading }: { onSubmit: (o: GenerationOptions) => void, isLoading: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-12 space-y-20"
    >
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-6xl font-serif font-bold text-ink tracking-tight leading-tight">
          Deconstruct any content into <span className="text-accent italic font-normal">atomic claims.</span>
        </h1>
        <p className="text-xl text-ink-muted leading-relaxed font-medium opacity-70">
          SignalSlides is a structural thinking tool. Paste a URL or article to extract classified assertions and build clear, shareable narrative decks in seconds.
        </p>
      </div>

      <SourceInput onSubmit={onSubmit} isLoading={isLoading} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-border-theme">
        {[
          { icon: ShieldCheck, label: 'Inspectable Claims', desc: 'Every statement is atomic and classified: fact, opinion, or speculation.' },
          { icon: LayoutGrid, label: 'Structural Thinking', desc: 'Reconstruct claims into ordered arguments that are easy to digest.' },
          { icon: Zap, label: 'Instant Synthesis', desc: 'Go from complex content to shareable narrative in under 60 seconds.' }
        ].map((item, i) => (
          <div key={i} className="space-y-4">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
              <item.icon size={24} />
            </div>
            <h3 className="font-bold text-lg">{item.label}</h3>
            <p className="text-sm text-ink-muted leading-relaxed opacity-70">{item.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function WorkspacePage() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const [source, setSource] = useState<Source | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialDeck = (location.state as { initialDeck?: Partial<Deck> })?.initialDeck;

  useEffect(() => {
    if (sourceId) {
      setLoading(true);
      sourceService.getSourceById(sourceId).then(setSource);
      const unsub = sourceService.subscribeToClaims(sourceId, setClaims);
      setLoading(false);
      return unsub;
    }
  }, [sourceId]);

  const handleSaveDeck = async (deck: Partial<Deck>) => {
    if (!sourceId || !user) return;
    const deckId = await sourceService.createDeck(sourceId, {
      ...deck,
      creatorName: user.displayName || 'Anonymous',
      creatorPhoto: user.photoURL || ''
    }, user.uid);
    navigate(`/deck/${sourceId}/${deckId}`);
  };

  if (!source || loading) return <div className="py-40 text-center animate-pulse">Initializing Workspace...</div>;

  return (
    <ClaimWorkspace 
      source={source}
      claims={claims}
      initialDeck={initialDeck}
      onSave={handleSaveDeck}
      onCancel={() => navigate('/')}
    />
  );
}

function ViewerPage() {
  const params = useParams<{ sourceId: string, deckId: string }>();
  const [source, setSource] = useState<Source | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (params.sourceId && params.deckId) {
      sourceService.getSourceById(params.sourceId).then(setSource);
      sourceService.getDeckById(params.sourceId, params.deckId).then(setDeck);
      const unsub = sourceService.subscribeToClaims(params.sourceId, setClaims);
      return unsub;
    }
  }, [params.sourceId, params.deckId]);

  if (!source || !deck || claims.length === 0) return <div className="py-40 text-center">Loading Narrative...</div>;

  return (
    <DeckViewer 
      source={source}
      deck={deck}
      claims={claims}
      onRemix={() => navigate(`/workspace/${params.sourceId}`, { state: { initialDeck: deck } })}
    />
  );
}

// --- Main App ---

export default function App() {
  const { user, signIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (options: GenerationOptions) => {
    if (!user) {
      signIn();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // 1. AI Extract
      const result = await extractClaimsAndNarrative(options);
      
      // 2. Save Package
      const { sourceId, deckId } = await sourceService.createExtractionPackage({
        source: result.source,
        claims: result.claims,
        initialDeck: result.initialDeck,
        userId: user.uid
      });

      // 3. Navigate to workspace to review
      navigate(`/workspace/${sourceId}`, { state: { initialDeck: result.initialDeck } });
    } catch (err) {
      console.error(err);
      setError('Extraction failed. AI could not deconstruct this content into atomic claims.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-accent/10 selection:text-accent flex flex-col">
      <Helmet>
        <title>SignalSlides | Claim-Based Argument Builder</title>
        <meta name="description" content="Break down complex content into atomic claims and build structured narrative decks." />
      </Helmet>

      {/* Header */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border-theme flex items-center justify-between px-6 md:px-12 sticky top-0 z-[60]">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-ink rounded-xl flex items-center justify-center text-white font-serif font-black text-xl group-hover:scale-105 transition-all shadow-xl shadow-ink/10 italic">s</div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none hidden sm:block">SignalSlides</h1>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-8">
            <NavLink
              to="/"
              className={({ isActive }) => cn(
                "text-[12px] font-bold flex items-center gap-2 transition-all p-2 rounded-md",
                isActive ? "text-accent" : "text-ink/40 hover:text-ink"
              )}
            >
              <Plus size={14} /> Creator
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => cn(
                "text-[12px] font-bold flex items-center gap-2 transition-all p-2 rounded-md",
                isActive ? "text-accent" : "text-ink/40 hover:text-ink"
              )}
            >
              <Clock size={14} /> My Decks
            </NavLink>
          </nav>
        </div>
        
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => logout()}>
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[12px] font-bold leading-tight group-hover:text-red-500 transition-colors">{user.displayName}</span>
                <span className="text-[10px] font-bold text-ink/20 uppercase tracking-widest">Sign Out</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-border-theme overflow-hidden bg-white shadow-sm p-0.5">
                {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-full" />}
              </div>
            </div>
          ) : (
            <button 
              onClick={() => signIn()}
              className="bg-ink text-white px-6 py-2.5 rounded-full text-[12px] font-bold hover:bg-accent transition-all shadow-lg shadow-ink/10"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 pt-6 pb-20 relative z-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route index element={<LandingPage onSubmit={handleGenerate} isLoading={isLoading} />} />
            <Route path="/workspace/:sourceId" element={<WorkspacePage />} />
            <Route path="/deck/:sourceId/:deckId" element={<ViewerPage />} />
            <Route path="/history" element={<History />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-border-theme py-12 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 bg- ink/5 rounded-lg flex items-center justify-center text-ink/20 font-bold">s</div>
             <span className="text-[11px] font-bold text-ink/20 uppercase tracking-[0.2em]">SignalSlides Structural Intelligence v{pkg.version}</span>
          </div>
          <nav className="flex gap-8 text-[11px] font-bold text-ink/40 uppercase tracking-widest">
            <Link to="/about" className="hover:text-accent">Methodology</Link>
            <Link to="/history" className="hover:text-accent">User History</Link>
          </nav>
        </div>
      </footer>

      {/* Global AI Status Toast */}
      {isLoading && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5">
           <div className="bg-ink text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
              <Sparkles size={20} className="text-accent animate-pulse" />
              <div className="flex flex-col">
                <span className="text-sm font-bold">Extracting Claims...</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest">Grounded AI Analysis in progress</span>
              </div>
           </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5">
           <div className="bg-red-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-red-400">
              <ShieldCheck size={20} />
              <span className="text-sm font-bold">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-4 p-1 rounded-md hover:bg-white/10"
              >
                <X size={16} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
}


