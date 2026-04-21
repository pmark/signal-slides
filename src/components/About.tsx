import { motion } from 'motion/react';
import { ShieldCheck, Zap, LayoutGrid } from 'lucide-react';

export default function About() {
  const principles = [
    {
      icon: Zap,
      title: "Clarity over Completeness",
      desc: "We prioritize atomic, understandable claims over overwhelming summaries. See the core points instantly."
    },
    {
      icon: LayoutGrid,
      title: "Structure over Freeform",
      desc: "Information is more useful when ordered. We transform messy content into structured narrative decks."
    },
    {
      icon: ShieldCheck,
      title: "Transparency over Authority",
      desc: "We don't tell you what's 'true'. we show you what is claimed, and how it's classified (fact vs. opinion)."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto py-20 space-y-24"
    >
      <div className="text-center space-y-6">
        <h2 className="text-5xl font-serif font-bold text-ink tracking-tight">The Methodology</h2>
        <p className="text-xl text-ink-muted leading-relaxed max-w-2xl mx-auto font-medium opacity-70">
          SignalSlides is built on the principle that structured information is more resilient to misinformation than generic summaries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {principles.map((p, i) => (
          <div key={i} className="space-y-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-accent/5 rounded-[2rem] flex items-center justify-center text-accent">
              <p.icon size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{p.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed opacity-70">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border-theme p-12 rounded-[3rem] slide-shadow space-y-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-serif font-bold text-ink">The Claim Graph</h3>
            <p className="text-ink-muted leading-relaxed">
              Unlike traditional news sites, SignalSlides doesn't store 'articles'. It stores **Claims**. 
              Claims can be linked, opposed, and remixed across different narratives.
            </p>
            <ul className="space-y-4">
              {[
                "Atomic deconstruction of long-form reports.",
                "Classification of statements: fact vs perspective.",
                "Narrative remixing for better explanations."
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-ink/60">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-bg rounded-2xl p-8 border border-border-theme/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-4">
               <div className="h-4 w-32 bg-accent/20 rounded-full" />
               <div className="space-y-2">
                 <div className="h-6 w-full bg-ink/10 rounded-lg" />
                 <div className="h-6 w-4/5 bg-ink/10 rounded-lg" />
               </div>
               <div className="pt-4 flex gap-2">
                 <div className="h-3 w-12 bg-green-100 rounded" />
                 <div className="h-3 w-12 bg-blue-100 rounded" />
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-12">
        <p className="text-[11px] font-bold text-ink/20 uppercase tracking-[0.4em]">SignalSlides Structural thinker v1.0</p>
      </div>
    </motion.div>
  );
}
