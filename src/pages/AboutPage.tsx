import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo.tsx";

const AboutPage = () => (
  <>
    <Seo
      title="About — Hold for Jesus"
      description="Hold for Jesus is a satirical AI prayer hotline exploring how chatbots should handle spiritual questions, grounded by real crisis resources and the Global Pain Index."
      path="/about"
    />

    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-primary font-special-elite">
          About the Divine Hotline
        </h1>

        <div className="space-y-4 text-sm text-foreground leading-relaxed">
          <p>
            <strong>Hold for Jesus</strong> (and its multi-faith siblings) is a satirical AI prayer
            hotline that imagines what it would be like if the divine ran a customer service
            department. Complete with hold music, ticket numbers, and celestial bureaucracy.
          </p>
          <p>
            The humor is directed at corporate call center culture, never at the beliefs themselves.
            Each faith tradition gets its own unique voice, hotline number, and AI persona crafted
            with care and research.
          </p>
          <p>
            <strong>This is not a religious service.</strong> It's a satirical text experience and
            AI authority governance research project. No prayers are actually transmitted to any
            deity, cosmic entity, or celestial switchboard. Responses are AI-generated and should
            not be taken as spiritual counsel.
          </p>
        </div>

        {/* The Serious Side */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="font-bold text-foreground font-special-elite">The Serious Side</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Satire works best when it's honest about what it's satirizing. The joke is never that
            people suffer — it's that a chatbot thinks it can fix it. That's why this project is
            deliberately grounded by two sincere, non-satirical sections:
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Link
              to="/observatory"
              className="block p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                🌍 Global Pain Index
              </p>
              <p className="text-sm text-foreground font-medium">The State of the World</p>
              <p className="text-xs text-muted-foreground mt-1">
                Data on poverty, displacement, conflict, and mortality from global datasets. No
                satire — just the numbers.
              </p>
            </Link>
            <Link
              to="/crisis"
              className="block p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                📞 Crisis Resources
              </p>
              <p className="text-sm text-foreground font-medium">Real Help for Real Crises</p>
              <p className="text-xs text-muted-foreground mt-1">
                Free, confidential hotlines and verified charities. Get help or give help across 8
                categories of human need.
              </p>
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 className="font-bold text-foreground font-special-elite">How the Hotline Works</h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Choose your faith tradition (or go secular)</li>
            <li>Pick a department and optional category</li>
            <li>Write what's on your mind</li>
            <li>Enjoy hold music while our AI "agent" processes your call</li>
            <li>Receive a response in the voice of your chosen tradition</li>
          </ol>
        </div>

        {/* Research Framing */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 className="font-bold text-foreground font-special-elite">Research Purpose</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This project is an experiment in <strong>AI authority governance</strong> — studying how
            language models handle topics where false confidence can cause real harm. The satirical
            framing is itself a guardrail: by presenting AI responses as "divine customer service,"
            we make it impossible to mistake them for actual spiritual authority.
          </p>
          <div className="text-xs text-muted-foreground space-y-1.5 mt-2">
            <p>
              <strong>Detection modes:</strong> Crisis · Troll Absorption · Off-topic Redirect ·
              Reality Anchor · Scrupulosity Care
            </p>
            <p>
              <strong>Failure modes watched for:</strong> Divine drift · Therapeutic replacement ·
              Authority creep · Spiritual bypassing · Parasocial attachment
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          Built with love, irreverence, and zero divine endorsement.
        </p>
      </motion.div>
    </div>
  </>
);

export default AboutPage;
