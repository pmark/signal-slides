import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldQuestion, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  HelpCircle, 
  Link as LinkIcon,
  ChevronLeft,
  User
} from 'lucide-react';
import { AtomicClaim, Source, Interaction, InteractionType, cn } from '../lib/types';
import { topicService } from '../lib/topicService';
import { useAuth } from './AuthProvider';

export default function ClaimPage() {
  const { topicId, claimId } = useParams<{ topicId: string; claimId: string }>();
  const { user, signIn } = useAuth();
  
  const [claim, setClaim] = useState<AtomicClaim | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (topicId && claimId) {
      setLoading(true);
      
      // Fetch initial claim data
      topicService.getClaimById(topicId, claimId).then(setClaim);
      
      // Subscribe to interactions
      const unsubInteractions = topicService.subscribeToClaimInteractions(topicId, claimId, setInteractions);
      
      // Subscribe to all sources to find relevant ones
      const unsubSources = topicService.subscribeToSources(topicId, setSources);
      
      setLoading(false);
      return () => {
        unsubInteractions();
        unsubSources();
      };
    }
  }, [topicId, claimId]);

  const claimSources = sources.filter(s => claim?.sourceIds.includes(s.id));

  const handleInteraction = async (type: InteractionType) => {
    if (!user) {
      signIn();
      return;
    }

    if (!topicId || !claimId) return;

    setIsSubmitting(true);
    try {
      await topicService.recordInteraction({
        claimId,
        topicId,
        userId: user.uid,
        type,
        content: comment.trim() || undefined
      });
      setComment('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified': return { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', label: 'Verified' };
      case 'disputed': return { icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', label: 'Disputed' };
      default: return { icon: ShieldQuestion, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Unverified' };
    }
  };

  if (loading || !claim) return <div className="py-40 text-center animate-pulse">Deconstructing Claim...</div>;

  const status = getStatusConfig(claim.status);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-8 space-y-8"
    >
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          to={`/topic/${topicId}`} 
          className="text-[12px] font-bold text-ink/40 hover:text-ink flex items-center gap-2 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Topic Directory
        </Link>
        <div className="text-[10px] font-bold text-ink/20 uppercase tracking-[0.2em]">
          Claim Forensic Report
        </div>
      </div>

      <div className="bg-white border border-border-theme rounded-3xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 md:p-12 border-b border-border-theme bg-white">
          <div className="space-y-6">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border",
              status.bg, status.color, status.border
            )}>
              <status.icon size={14} />
              {status.label} Claim
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-ink leading-tight tracking-tight">
              {claim.statement}
            </h1>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-[12px] font-extrabold text-ink/40 uppercase tracking-widest pt-2">
              <div className="flex items-center gap-2">
                <span className="opacity-40">Classification:</span> 
                <span className="text-ink">{claim.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="opacity-40">Confidence:</span> 
                <span className="text-accent">{(claim.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="opacity-40">Signal ID:</span> 
                <span className="text-ink/60 font-mono">{claim.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-12 space-y-16">
          
          {/* Sources Section */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 text-[14px] font-extrabold uppercase tracking-widest text-ink">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                   <LinkIcon size={16} />
                </div>
                Primary Grounding Sources
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {claimSources.length > 0 ? claimSources.map(source => (
                 <a 
                   key={source.id}
                   href={source.url}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="group p-6 bg-bg border border-border-theme rounded-2xl hover:border-accent hover:bg-white transition-all flex flex-col justify-between"
                 >
                   <div className="space-y-2">
                     <p className="text-[16px] font-bold text-ink group-hover:text-accent transition-colors leading-snug">{source.title}</p>
                     <p className="text-[12px] text-ink-muted leading-relaxed line-clamp-2 italic opacity-60">“{source.citation}”</p>
                   </div>
                   <div className="mt-6 flex items-center justify-between text-[11px] font-bold text-accent uppercase tracking-wider">
                      Visit Source Reference
                      <ExternalLink size={14} className="opacity-40 group-hover:opacity-100 transition-all" />
                   </div>
                 </a>
               )) : (
                 <div className="md:col-span-2 p-12 border-2 border-dashed border-border-theme rounded-3xl text-center bg-bg/50">
                    <p className="text-[14px] font-medium text-ink/40 italic">No formal source references have been indexed for this claim yet.</p>
                 </div>
               )}
             </div>
          </section>

          {/* Interaction Section */}
          <section className="space-y-8">
             <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <div className="flex items-center gap-3 text-[14px] font-extrabold uppercase tracking-widest text-ink">
                   <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                      <MessageSquare size={16} />
                   </div>
                   Participant Interaction Feed
                </div>
                <div className="text-[11px] font-bold text-ink/20">
                   {interactions.length} Protocol Events
                </div>
             </div>
             
             <div className="space-y-6">
                {interactions.map(interaction => (
                  <div key={interaction.id} className="flex gap-6 group items-start">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-border-theme slide-shadow flex items-center justify-center shrink-0">
                      {interaction.type === 'confirm' ? <ThumbsUp size={20} className="text-green-600" /> :
                       interaction.type === 'dispute' ? <ThumbsDown size={20} className="text-red-600" /> :
                       interaction.type === 'question' ? <HelpCircle size={20} className="text-amber-600" /> :
                       <ShieldCheck size={20} className="text-blue-600" />}
                    </div>
                    <div className="space-y-2 flex-grow">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-bold">Signal Participant</span>
                          <span className="w-1 h-1 rounded-full bg-ink/10" />
                          <span className="text-[11px] text-ink/30 font-medium">{new Date(interaction.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                          interaction.type === 'confirm' ? "bg-green-50 text-green-700 border-green-100" :
                          interaction.type === 'dispute' ? "bg-red-50 text-red-700 border-red-100" : "bg-bg text-ink/40 border-border-theme/50"
                        )}>
                          {interaction.type}ed
                        </span>
                      </div>
                      {interaction.content && (
                        <div className="p-4 bg-bg rounded-2xl border border-border-theme/50">
                          <p className="text-[14px] text-ink/80 leading-relaxed italic">“{interaction.content}”</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {interactions.length === 0 && (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-[14px] text-ink/40 italic font-medium">This claim is currently awaiting community interrogation.</p>
                    <p className="text-[11px] text-ink/20 uppercase tracking-widest">Initial deconstruction protocol complete</p>
                  </div>
                )}
             </div>
          </section>
        </div>

        {/* Action Tray */}
        <div className="p-8 md:p-12 bg-panel border-t border-border-theme">
           <div className="max-w-2xl mx-auto space-y-8">
              {!user ? (
                <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-border-theme text-center space-y-6 slide-shadow">
                   <div className="w-16 h-16 bg-accent/5 rounded-full flex items-center justify-center mx-auto text-accent">
                      <User size={32} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-serif font-bold text-ink">Participate in Interrogation</h3>
                      <p className="text-[14px] text-ink-muted max-w-sm mx-auto">
                        Authentication is required to contribute evidence, verify claims, or dispute specific data points in the topic manifest.
                      </p>
                   </div>
                   <button 
                    onClick={() => signIn()}
                    className="bg-ink text-white px-10 py-4 rounded-2xl font-bold text-sm hover:bg-accent transition-all hover:scale-[1.02] active:scale-[0.98] slide-shadow"
                   >
                     Sign In to Contribute
                   </button>
                   <p className="text-[10px] text-ink/20 font-bold uppercase tracking-widest pt-2">
                     Core Protocol Verification Required
                   </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Interrogation Protocol</span>
                        <div className="flex-grow h-px bg-accent/10" />
                     </div>
                     <textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Provide counter-evidence, verification links, or structured queries..."
                        className="w-full bg-white border border-border-theme rounded-2xl p-6 text-[15px] min-h-[120px] focus:border-accent focus:ring-2 focus:ring-accent/5 transition-all resize-none shadow-inner"
                     />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {[
                       { type: 'confirm', label: 'Verify Claim', icon: ThumbsUp, theme: 'hover:bg-green-50 hover:border-green-600 hover:text-green-600' },
                       { type: 'question', label: 'Deep Search', icon: HelpCircle, theme: 'hover:bg-amber-50 hover:border-amber-600 hover:text-amber-600' },
                       { type: 'dispute', label: 'Dispute Claim', icon: ThumbsDown, theme: 'hover:bg-red-50 hover:border-red-600 hover:text-red-600' }
                     ].map(action => (
                       <button 
                         key={action.type}
                         disabled={isSubmitting}
                         onClick={() => handleInteraction(action.type as InteractionType)}
                         className={cn(
                           "flex items-center justify-center gap-3 bg-white border border-border-theme px-6 py-4 rounded-2xl font-bold text-[13px] transition-all disabled:opacity-50 slide-shadow",
                           action.theme
                         )}
                       >
                         <action.icon size={18} /> {action.label}
                       </button>
                     ))}
                  </div>
                  <p className="text-[10px] text-center text-ink/30 font-bold uppercase tracking-widest">
                    Interactions are recorded to the immutable topic manifest
                  </p>
                </>
              )}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
