import { motion } from 'motion/react';
import { ShieldCheck, Zap, Split, Scale, Hash, AlertTriangle } from 'lucide-react';

export default function About() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-12 space-y-20"
    >
      <div className="space-y-6 text-center">
        <h2 className="text-4xl font-serif font-bold tracking-tight text-ink">
          The SignalSlides Protocol
        </h2>
        <p className="text-xl text-ink-muted max-w-2xl mx-auto leading-relaxed">
          SignalSlides is a forensic deconstruction engine. We transform narrative noise into structured claim-sets to foster deep understanding and objective verification.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {[
          {
            icon: Hash,
            title: "Atomic Claim Deconstruction",
            desc: "We don't settle for summaries. Every input is broken down into atomic, falsifiable claims, each categorized by its epistemic type: fact, opinion, or speculation."
          },
          {
            icon: ShieldCheck,
            title: "Verification Logic",
            desc: "Truth is treated as a dynamic coefficient. We track the verification status of claims across time and source material, highlighting areas of consensus and dispute."
          },
          {
            icon: Split,
            title: "Structured Perspective",
            desc: "Instead of linear stories, we generate cross-sectional analyses. Whether you need a comparison of datasets or a challenge to the prevailing narrative, our structure remains consistent."
          },
          {
            icon: Scale,
            title: "Source Transparency",
            desc: "Citations are the primary units of trust. Every insight generated is tethered to verifiable records, allowing for complete forensic audit trails."
          }
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl border border-border-theme space-y-4 slide-shadow">
            <div className="w-12 h-12 bg-accent/5 rounded-xl flex items-center justify-center text-accent">
              <item.icon size={24} />
            </div>
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p className="text-ink-muted leading-relaxed text-[15px]">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-ink text-white p-12 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="max-w-xl space-y-6 relative z-10">
          <div className="flex items-center gap-2 text-accent text-[11px] font-bold uppercase tracking-widest">
            <AlertTriangle size={14} /> The Goal: Epistemic Clarity
          </div>
          <h4 className="text-3xl font-serif font-bold italic leading-tight">Moving from passive reading to active deconstruction.</h4>
          <p className="text-white/70 leading-relaxed text-lg">
            SignalSlides acts as a slowing mechanism for information consumption. By forcing a structured deconstruction for every topic, we replace the emotional pull of narrative with the logical rigor of claim verification.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
