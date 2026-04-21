import { motion } from 'motion/react';
import { ShieldCheck, Split, Scale, Hash, AlertTriangle } from 'lucide-react';

export default function About() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-12 space-y-20"
    >
      <div className="space-y-6 text-center">
        <h2 className="text-4xl font-serif font-bold tracking-tight text-ink">
          The Research Framework
        </h2>
        <p className="text-xl text-ink-muted max-w-2xl mx-auto leading-relaxed">
          SignalSlides is a platform for structured claim analysis. We organize complex information into verifiable points to foster objective understanding and rigorous cross-examination.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {[
          {
            icon: Hash,
            title: "Analytical Breakdown",
            desc: "Every topic is broken down into specific, falsifiable claims, each categorized by type: verified facts, stated opinions, or supported interpretations."
          },
          {
            icon: ShieldCheck,
            title: "Verification Standards",
            desc: "Verification is treated as an ongoing process. We track the status of claims across multiple sources, highlighting areas of consensus and documented disagreement."
          },
          {
            icon: Split,
            title: "Structured Narratives",
            desc: "By moving away from linear storytelling, we provide a cross-sectional view of any subject, ensuring that conflicting viewpoints are presented within a consistent framework."
          },
          {
            icon: Scale,
            title: "Citation Integrity",
            desc: "Primary sources are the foundation of trust. Every analytical point is tethered to verifiable records, allowing for complete transparency and auditability."
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
            <AlertTriangle size={14} /> The Goal: Analytical Clarity
          </div>
          <h4 className="text-3xl font-serif font-bold italic leading-tight">Moving from passive reading to active analysis.</h4>
          <p className="text-white/70 leading-relaxed text-lg">
            SignalSlides encourages a deliberate approach to information. By promoting a structured review of every topic, we replace the emotional weight of narrative with the clarity of evidence-based verification.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
