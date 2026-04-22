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
  ExtractionDebug,
  cn 
} from './lib/types';
import { extractClaimsAndNarrative, ExtractionError } from './lib/gemini';
import { sourceService } from './lib/sourceService';
import { useAuth } from './components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ShieldCheck, 
  Zap, 
  LayoutGrid, 
  Sparkles,
  X,
  FileText
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
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-ink tracking-tight leading-tight">
          Break down any content into <span className="text-accent italic font-normal">key claims.</span>
        </h1>
        <p className="text-xl text-ink-muted leading-relaxed font-medium opacity-70">
          SignalSlides is a structural thinking tool. Paste a URL or article to extract classified assertions and build clear, shareable narrative decks in seconds.
        </p>
      </div>

      <SourceInput onSubmit={onSubmit} isLoading={isLoading} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-border-theme">
        {[
          { icon: ShieldCheck, label: 'Clear Claims', desc: 'Every statement is clear and classified: fact, opinion, or speculation.' },
          { icon: LayoutGrid, label: 'Structural Thinking', desc: 'Reconstruct claims into ordered presentation decks.' },
          { icon: Zap, label: 'Instant Presentations', desc: 'Go from complex content to a shareable presentation in under 60 seconds.' }
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
  const { sourceId, deckId } = useParams<{ sourceId: string, deckId?: string }>();
  const [source, setSource] = useState<Source | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loadedDeck, setLoadedDeck] = useState<Partial<Deck> | undefined>(
    (location.state as { initialDeck?: Partial<Deck> })?.initialDeck
  );
  
  const [currentDeckId, setCurrentDeckId] = useState<string | undefined>(loadedDeck?.id || deckId);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Load Source and Claims
  useEffect(() => {
    if (sourceId) {
      setLoading(true);
      sourceService.getSourceById(sourceId).then(setSource);
      const unsub = sourceService.subscribeToClaims(sourceId, setClaims);
      setLoading(false);
      return unsub;
    }
  }, [sourceId]);

  // 2. Draft Exclusivity Check: If the user arrives at /workspace/:sourceId without a deckId, 
  // try to find the one single draft for this source and redirect to it.
  useEffect(() => {
    if (sourceId && !deckId && user) {
      sourceService.getLatestDraftForSource(sourceId, user.uid).then(draft => {
        if (draft) {
          navigate(`/workspace/${sourceId}/${draft.id}`, { replace: true });
        }
      });
    }
  }, [sourceId, deckId, user, navigate]);

  // 3. Load specific deck if deckId is present
  useEffect(() => {
    const finalId = deckId || currentDeckId;
    if (sourceId && finalId && !loadedDeck) {
      sourceService.getDeckById(sourceId, finalId).then(deck => {
        if (deck) {
          setLoadedDeck(deck);
          if (!currentDeckId) setCurrentDeckId(deck.id);
        }
      });
    }
  }, [sourceId, deckId, currentDeckId, loadedDeck]);

  const handleSaveDeck = async (deck: Partial<Deck>, navigateAfterSave = true) => {
    if (!sourceId || !user) return;
    setIsSaving(true);
    try {
      const finalDeckId = currentDeckId || crypto.randomUUID();
      await sourceService.createDeck(sourceId, {
        ...deck,
        id: finalDeckId,
        creatorName: user.displayName || 'Anonymous',
        creatorPhoto: user.photoURL || ''
      }, user.uid);
      
      setCurrentDeckId(finalDeckId);
      setLoadedDeck({ ...deck, id: finalDeckId });
      
      if (navigateAfterSave) {
        navigate(`/deck/${sourceId}/${finalDeckId}`);
      } else if (!deckId) {
        // If we just created the draft, update the URL so refreshes work
        navigate(`/workspace/${sourceId}/${finalDeckId}`, { replace: true });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!source || loading) return <div className="py-40 text-center animate-pulse">Initializing Workspace...</div>;
  if (currentDeckId && !loadedDeck) return <div className="py-40 text-center animate-pulse">Loading Draft...</div>;

  return (
    <ClaimWorkspace 
      source={source}
      claims={claims}
      initialDeck={loadedDeck}
      onSave={handleSaveDeck}
      onCancel={() => navigate(-1)}
      isLoading={isSaving}
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
    <>
      <Helmet>
        <title>{deck.title} | SignalSlides</title>
        <meta name="description" content={`A dynamic deconstruction of ${source.title}. ${deck.slides.length} key claims explored.`} />
        <meta property="og:title" content={deck.title} />
        <meta property="og:description" content={`Structural narrative built from ${source.title}`} />
        <meta name="twitter:title" content={deck.title} />
      </Helmet>
      <DeckViewer 
        source={source}
        deck={deck}
        claims={claims}
        onRemix={() => navigate(`/workspace/${params.sourceId}/${params.deckId}`, { state: { initialDeck: deck } })}
      />
    </>
  );
}

// --- Main App ---

export default function App() {
  const { user, signIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<ExtractionDebug | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [extractionSteps, setExtractionSteps] = useState([
    { id: 'auth', label: 'Verifying identity', status: 'pending' },
    { id: 'fetch', label: 'Resolving source URL', status: 'pending' },
    { id: 'read', label: 'Reading content', status: 'pending' },
    { id: 'analyze', label: 'Extracting key claims', status: 'pending' },
    { id: 'classify', label: 'Classifying assertions', status: 'pending' },
    { id: 'narrative', label: 'Synthesizing initial deck', status: 'pending' },
    { id: 'save', label: 'Finalizing workspace', status: 'pending' }
  ]);

  const updateStep = (id: string, status: 'pending' | 'running' | 'completed' | 'error') => {
    setExtractionSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status } : step
    ));
  };

  const handleGenerate = async (options: GenerationOptions) => {
    if (!user) {
      signIn();
      return;
    }
    
    setIsLoading(true);
    setIsTakingLong(false);
    setError(null);
    setDebugInfo(null);
    setShowDebug(false);
    setExtractionSteps([
      { id: 'auth', label: 'Verifying identity', status: 'completed' },
      { id: 'fetch', label: 'Resolving source URL', status: 'running' },
      { id: 'read', label: 'Reading content', status: 'pending' },
      { id: 'analyze', label: 'Extracting key claims', status: 'pending' },
      { id: 'classify', label: 'Classifying assertions', status: 'pending' },
      { id: 'narrative', label: 'Synthesizing initial deck', status: 'pending' },
      { id: 'save', label: 'Finalizing workspace', status: 'pending' }
    ]);

    try {
      // Step 2-4 handled by AI call
      updateStep('fetch', 'running');
      
      // Dynamic updates to feel more active
      const statusTimers: ReturnType<typeof setTimeout>[] = [];
      statusTimers.push(setTimeout(() => updateStep('read', 'running'), 2000));
      statusTimers.push(setTimeout(() => updateStep('analyze', 'running'), 6000));
      const longUpdateTimer = setTimeout(() => setIsTakingLong(true), 15000);
      
      // Implement a 35-second timeout for the AI call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      try {
        const result = await extractClaimsAndNarrative(options);
        clearTimeout(timeoutId);
        clearTimeout(longUpdateTimer);
        statusTimers.forEach(t => clearTimeout(t));
        setIsTakingLong(false);

        if (result.fromCache) {
          updateStep('fetch', 'completed');
          updateStep('read', 'completed');
          updateStep('analyze', 'completed');
          updateStep('classify', 'completed');
          updateStep('narrative', 'completed');
          // Short delay for user to see the cache hit
          await new Promise(r => setTimeout(r, 800));
        } else {
          updateStep('fetch', 'completed');
          updateStep('read', 'completed');
          updateStep('analyze', 'completed');
          
          updateStep('classify', 'running');
          await new Promise(r => setTimeout(r, 600));
          updateStep('classify', 'completed');
          
          updateStep('narrative', 'running');
          await new Promise(r => setTimeout(r, 800));
          updateStep('narrative', 'completed');
        }
        
        updateStep('save', 'running');
        
        const idMap = new Map<string, string>();
        const safeClaims = result.claims.map(c => {
          const oldId = c.id || crypto.randomUUID();
          const cleanId = oldId.replace(/[^a-zA-Z0-9_-]/g, '-').substring(0, 128);
          idMap.set(oldId, cleanId);
          
          let classification = (c.classification || '').toLowerCase();
          if (!['verifiable', 'opinion', 'speculation', 'prediction'].includes(classification)) {
            classification = 'verifiable';
          }
          
          const claimData: Record<string, unknown> = {
            id: cleanId,
            statement: (c.statement || '').substring(0, 2000),
            classification
          };
          
          if (Array.isArray(c.relatedClaimIds)) claimData.relatedClaimIds = c.relatedClaimIds.slice(0, 50);
          if (Array.isArray(c.opposingClaimIds)) claimData.opposingClaimIds = c.opposingClaimIds.slice(0, 50);
          return claimData;
        });

        let safeDeck: Partial<Deck> | undefined;
        if (result.initialDeck) {
          safeDeck = {
            title: (result.initialDeck.title || `Extracted claims for ${result.source.title || 'Untitled'}`).substring(0, 300),
            intent: ['explain', 'case', 'challenge', 'compare'].includes(options.intent) ? options.intent : 'explain',
            slides: (result.initialDeck.slides || []).map((s, index) => {
              const mappedClaimId = s.claimId ? (idMap.get(s.claimId) || s.claimId.replace(/[^a-zA-Z0-9_-]/g, '-').substring(0, 128)) : '';
              return {
                claimId: mappedClaimId,
                order: typeof s.order === 'number' ? s.order : index,
                narration: typeof s.narration === 'string' ? s.narration : ''
              };
            }).slice(0, 100)
          };
        }

        const { sourceId } = await sourceService.createExtractionPackage({
          source: {
            title: (result.source.title || 'Extracted Source').substring(0, 300),
            url: options.sourceInput.startsWith('http') ? options.sourceInput.substring(0, 2000) : undefined,
            content: !options.sourceInput.startsWith('http') ? options.sourceInput.substring(0, 200000) : undefined
          },
          claims: safeClaims,
          initialDeck: safeDeck,
          userId: user.uid
        });
        updateStep('save', 'completed');

        setTimeout(() => {
          navigate(`/workspace/${sourceId}`, { state: { initialDeck: result.initialDeck } });
        }, 500);
      } catch (innerErr: unknown) {
        statusTimers.forEach(t => clearTimeout(t));
        clearTimeout(longUpdateTimer);
        clearTimeout(timeoutId);

        if (innerErr instanceof Error) {
          if (innerErr.name === 'AbortError') {
            throw new Error('TIMEOUT: The AI is taking too long to analyze this source. This usually happens with very long documents or complex URLs. Try a shorter snippet.', { cause: innerErr });
          }
          throw new Error(innerErr.message, { cause: innerErr });
        }
        throw new Error('An unknown error occurred during extraction', { cause: innerErr });
      }
      
    } catch (err: unknown) {
      console.error(err);
      const errorStr = err instanceof Error ? err.message : String(err);
      let errorMsg = 'Extraction failed. The AI could not deconstruct this content.';
      
      // Capture debug info if present on the error object
      if (err instanceof ExtractionError && err.debug) {
        setDebugInfo(err.debug);
      } else if (err instanceof Error && err.cause && (err.cause as { debug?: ExtractionDebug }).debug) {
        setDebugInfo((err.cause as { debug?: ExtractionDebug }).debug || null);
      }

      // Mark current running step as error
      setExtractionSteps(prev => prev.map(step => 
        step.status === 'running' ? { ...step, status: 'error' as const } : step
      ));

      if (errorStr.includes('429') || errorStr.includes('quota')) {
        errorMsg = 'Rate limit exceeded. Please wait a moment before trying again. Check your Google AI Studio plan for quota limits.';
      } else if (errorStr.includes('block') || errorStr.includes('safety')) {
        errorMsg = 'Content was flagged by safety filters and could not be analyzed.';
      } else if (errorStr.includes('TIMEOUT')) {
        errorMsg = errorStr;
      } else if (errorStr.includes('network') || !window.navigator.onLine) {
        errorMsg = 'Network connection error. Check your internet and try again.';
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-accent/10 selection:text-accent flex flex-col">
      <Helmet>
        <title>SignalSlides | Claim-Based Argument Builder</title>
        <meta name="description" content="Break down complex content into key claims and build structured narrative decks." />
      </Helmet>

      {/* Header */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border-theme flex items-center justify-between px-6 md:px-12 sticky top-0 z-[60]">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-ink rounded-xl flex items-center justify-center text-white font-serif font-black text-xl group-hover:scale-105 transition-all shadow-xl shadow-ink/10 italic">s</div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none hidden sm:block">SignalSlides</h1>
          </Link>
          
          <nav className="flex items-center gap-4 sm:gap-8">
            <NavLink
              to="/"
              className={({ isActive }) => cn(
                "text-[12px] font-bold flex items-center gap-2 transition-all p-2 rounded-md",
                isActive ? "text-accent" : "text-ink/40 hover:text-ink"
              )}
              title="Creator"
            >
              <Plus size={16} className="sm:hidden" />
              <span className="hidden sm:flex items-center gap-2"><Plus size={14} /> Creator</span>
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => cn(
                "text-[12px] font-bold flex items-center gap-2 transition-all p-2 rounded-md",
                isActive ? "text-accent" : "text-ink/40 hover:text-ink"
              )}
              title="My Library"
            >
              <FileText size={16} className="sm:hidden" />
              <span className="hidden sm:flex items-center gap-2"><FileText size={14} /> My Library</span>
            </NavLink>
          </nav>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          {user ? (
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => logout()}>
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[12px] font-bold leading-tight group-hover:text-red-500 transition-colors">{user.displayName}</span>
                <span className="text-[10px] font-bold text-ink/20 uppercase tracking-widest">Sign Out</span>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-border-theme overflow-hidden bg-white shadow-sm p-0.5">
                {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-full" />}
              </div>
            </div>
          ) : (
            <button 
              onClick={() => signIn()}
              className="bg-ink text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-[12px] font-bold hover:bg-accent transition-all shadow-lg shadow-ink/10 whitespace-nowrap"
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
            <Route index element={<LandingPage onSubmit={handleGenerate} isLoading={isLoading} />} />
            <Route path="/workspace/:sourceId" element={<WorkspacePage />} />
            <Route path="/workspace/:sourceId/:deckId" element={<WorkspacePage />} />
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
             <div className="w-8 h-8 bg-ink/5 rounded-lg flex items-center justify-center text-ink/20 font-bold">s</div>
             <span className="text-[11px] font-bold text-ink/20 uppercase tracking-[0.2em]">SignalSlides v{pkg.version}</span>
          </div>
          <nav className="flex gap-8 text-[11px] font-bold text-ink/40 uppercase tracking-widest">
            <Link to="/about" className="hover:text-accent">Methodology</Link>
            <Link to="/history" className="hover:text-accent">My Library</Link>
          </nav>
        </div>
      </footer>

      {/* Detailed Extraction Progress Toast */}
      {(isLoading || error) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/60 backdrop-blur-sm px-6">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white border border-border-theme p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-8"
           >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight">
                    {error ? "Analysis Failed" : "Extracting claims"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-ink/40 font-medium uppercase tracking-widest">
                      {error ? "Problem deconstructing source" : "Grounded analysis in progress"}
                    </p>
                    {isLoading && !error && extractionSteps.every(s => s.status === 'completed' || s.id === 'save') && (
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                        Cache Hit
                      </span>
                    )}
                  </div>
                </div>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  error ? "bg-red-50 text-red-500" : "bg-accent/10 text-accent"
                )}>
                  {error ? <X size={20} /> : <Sparkles size={20} className="animate-pulse" />}
                </div>
              </div>

              {!error ? (
                <div className="space-y-4">
                  {extractionSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-4 group">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center transition-colors border",
                        step.status === 'completed' ? "bg-green-500 border-green-500 text-white" :
                        step.status === 'running' ? "bg-accent border-accent text-white animate-pulse" :
                        step.status === 'error' ? "bg-red-500 border-red-500 text-white" :
                        "bg-transparent border-border-theme"
                      )}>
                        {step.status === 'completed' && <ShieldCheck size={12} strokeWidth={3} />}
                        {step.status === 'running' && <Zap size={10} fill="currentColor" />}
                        {step.status === 'error' && <X size={12} strokeWidth={3} />}
                      </div>
                      <span className={cn(
                        "text-[13px] font-bold transition-all",
                        step.status === 'pending' ? "text-ink/20" : 
                        step.status === 'running' ? "text-accent translate-x-1" : 
                        "text-ink"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                    <p className="text-[13px] font-medium text-red-600 leading-relaxed">
                      {error}
                    </p>
                  </div>
                  
                  {debugInfo && (
                    <div className="space-y-3">
                      <button 
                        onClick={() => setShowDebug(!showDebug)} 
                        className="text-[10px] font-bold text-ink/40 uppercase tracking-widest hover:text-ink transition-colors flex items-center gap-2"
                      >
                        {showDebug ? "Hide Debug Logs" : "Show Raw AI Response"}
                      </button>
                      
                      <AnimatePresence>
                        {showDebug && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-ink/5 border border-border-theme rounded-xl p-4 max-h-[200px] overflow-y-auto scrollbar-thin">
                               <pre className="text-[11px] font-mono whitespace-pre-wrap break-all text-ink/60">
                                 {JSON.stringify(debugInfo, null, 2)}
                               </pre>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setError(null);
                      setIsLoading(false);
                      setDebugInfo(null);
                      setShowDebug(false);
                    }}
                    className="w-full py-4 bg-ink text-white rounded-2xl text-[13px] font-bold hover:bg-ink/90 transition-all"
                  >
                    Close & Try Again
                  </button>
                </div>
              )}

              {!error && isTakingLong && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-accent/5 border border-accent/10 rounded-2xl space-y-3"
                >
                  <p className="text-[12px] font-medium leading-relaxed text-ink/60">
                    This source is taking longer than usual to deconstruct. This often happens with large documents or complex URL structures.
                  </p>
                  <button 
                    onClick={() => {
                        setIsLoading(false);
                        setIsTakingLong(false);
                    }}
                    className="text-[11px] font-bold text-accent uppercase tracking-widest hover:underline"
                  >
                    Cancel & Try a shorter snippet
                  </button>
                </motion.div>
              )}

              {!error && (
                <div className="pt-4 border-t border-border-theme flex items-center justify-between">
                  <span className="text-[10px] font-mono text-ink/30 italic">
                    {extractionSteps.find(s => s.status === 'running')?.label || "Processing..."}
                  </span>
                  <div className="flex gap-1">
                     {extractionSteps.map((step, i) => (
                       <div 
                         key={i}
                         className={cn(
                           "w-1 h-1 rounded-full transition-all",
                           step.status === 'completed' ? "bg-green-500" :
                           step.status === 'running' ? "bg-accent w-4" :
                           "bg-ink/10"
                         )}
                       />
                     ))}
                  </div>
                </div>
              )}
           </motion.div>
        </div>
      )}

      {/* Legacy Error Toast Removed (Integrated into modal) */}
    </div>
  );
}


