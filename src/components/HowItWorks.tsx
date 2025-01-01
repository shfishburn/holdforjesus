import { motion } from "framer-motion";
import { PenLine, PhoneCall, Sparkles } from "lucide-react";

const steps = [
  {
    icon: PenLine,
    title: "Write Your Prayer",
    desc: "Choose your faith, pick a department, and pour out what's on your heart",
  },
  {
    icon: PhoneCall,
    title: "Hold for Processing",
    desc: "Enjoy celestial hold music while your call is routed to the right agent",
  },
  {
    icon: Sparkles,
    title: "Receive Wisdom",
    desc: "A heavenly customer service rep responds with tradition-specific guidance",
  },
];

const HowItWorks = () => {
  return (
    <motion.div
      className="w-full max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <h2 className="text-lg font-bold text-foreground uppercase tracking-widest text-center mb-6 font-special-elite">
        How It Works
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            className="relative flex flex-col items-center text-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.12 }}
          >
            {/* Step number badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
              {i + 1}
            </div>

            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mt-1">
              <step.icon className="w-5 h-5 text-primary" />
            </div>

            <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Connector lines (desktop only) */}
      <div className="hidden sm:flex justify-center -mt-[4.5rem] mb-[4.5rem] pointer-events-none">
        <div className="flex items-center w-full max-w-md px-16">
          <div className="flex-1 h-px bg-border" />
          <div className="flex-1 h-px bg-border" />
        </div>
      </div>
    </motion.div>
  );
};

export default HowItWorks;
