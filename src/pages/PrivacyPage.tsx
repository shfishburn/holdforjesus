import { motion } from "framer-motion";
import Seo from "@/components/Seo.tsx";
import { Button } from "@/components/ui/button.tsx";
import { usePreferencesStore } from "@/stores/usePreferencesStore.ts";

const PrivacyPage = () => {
  const analyticsConsent = usePreferencesStore((s) => s.analyticsConsent);
  const setAnalyticsConsent = usePreferencesStore((s) => s.setAnalyticsConsent);

  return (
    <>
      <Seo
        title="Privacy Policy — Hold for Jesus"
        description="Privacy policy for Hold for Jesus, including what metadata is processed, what stays local, and how community submissions are handled."
        path="/privacy"
      />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-primary font-special-elite">Privacy Policy</h1>

          <div className="space-y-4 text-sm text-foreground leading-relaxed">
            <p>
              <strong>Last updated:</strong> Since the beginning of time (or thereabouts).
            </p>

            <h2 className="font-bold text-lg text-foreground mt-6">What We Collect</h2>
            <p>
              <strong>Anonymous by default.</strong> You do not need an account to use the site. We
              do not ask for your name, email, or phone number.
            </p>
            <p>
              When you submit a prayer, we store limited service metadata (for example: faith,
              department, category, interaction mode, safety flags, and timestamps) to operate and
              improve reliability and safety. Prayer history/favorites are stored locally in your
              browser (localStorage).
            </p>
            <p>
              <strong>Prayer text:</strong> regular hotline submissions are processed for response
              generation and are not persisted as prayer-history records on our backend. If you
              choose to post to the Prayer Wall, that submitted wall text is stored server-side.
            </p>

            <h2 className="font-bold text-lg text-foreground mt-6">Cookies</h2>
            <p>
              We use localStorage to remember your preferences (faith, department) and call history.
              We do not use ad-tech trackers. Optional anonymous analytics (GA4) only runs after
              explicit opt-in.
            </p>

            <h2 className="font-bold text-lg text-foreground mt-6">Analytics Consent</h2>
            <p>
              You can change analytics consent at any time. This affects page and event analytics
              for product improvement.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={analyticsConsent ? "default" : "outline"}
                onClick={() => setAnalyticsConsent(true)}
              >
                Enable Analytics
              </Button>
              <Button
                size="sm"
                variant={!analyticsConsent ? "default" : "outline"}
                onClick={() => setAnalyticsConsent(false)}
              >
                Disable Analytics
              </Button>
              <span className="text-xs text-muted-foreground">
                Current status: {analyticsConsent ? "Enabled" : "Disabled"}
              </span>
            </div>

            <h2 className="font-bold text-lg text-foreground mt-6">AI Processing</h2>
            <p>
              When you submit a prayer, your message is sent to an AI language model to generate a
              response. We do not use your prayers to train our own models. Third-party model
              providers process request content according to their service policies.
            </p>

            <h2 className="font-bold text-lg text-foreground mt-6">Your Rights</h2>
            <p>
              You can clear all local data at any time by clearing your browser storage or using the
              "Clear all" button in your call history. For server-side data questions, use the
              contact channel below and include relevant timestamps/details so we can locate
              records.
            </p>

            <h2 className="font-bold text-lg text-foreground mt-6">Contact</h2>
            <p>
              For privacy inquiries, please dial 1-800-JESUS and select the Privacy Department.
              (Just kidding. This is a comedy app.)
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default PrivacyPage;
