import { motion } from "framer-motion";
import { HandHeart, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo.tsx";
import { CRISIS_CATEGORIES, type CrisisResource } from "@/lib/crisisResources";

const CrisisPage = () => {
  return (
    <>
      <Seo
        title="Crisis Resources — Real Help When You Need It"
        description="If you or someone you know is in crisis, these resources provide real and immediate support. Free, confidential, and available 24/7."
        path="/crisis"
      />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <motion.div
          className="space-y-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-primary font-special-elite">
              Real Help for Real Crises
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We're a comedy app, but your feelings are never a joke. If you're struggling, please
              reach out. If you're in a position to help, every link below matters.
            </p>
          </div>

          {/* Emergency banner */}
          <motion.a
            href="tel:988"
            className="block bg-primary/5 border-2 border-primary/30 rounded-xl p-6 text-center hover:border-primary/50 transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <p className="text-2xl mb-1">📞</p>
            <p className="font-bold text-foreground">
              If you're in immediate danger, call 988 or 911
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The 988 Suicide & Crisis Lifeline is free, confidential, and available 24/7
            </p>
          </motion.a>

          {/* Categories */}
          {CRISIS_CATEGORIES.map((category, catIdx) => (
            <motion.div
              key={category.title}
              className="space-y-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + catIdx * 0.05 }}
            >
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <span className="text-xl">{category.emoji}</span>
                <h2 className="text-lg font-bold text-foreground font-special-elite">
                  {category.title}
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Get Help Column */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Heart className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Get Help
                    </span>
                  </div>
                  {category.getHelp.map((resource) => (
                    <ResourceCard key={resource.name} resource={resource} variant="get" />
                  ))}
                </div>

                {/* Give Help Column */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <HandHeart className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Give Help
                    </span>
                  </div>
                  {category.giveHelp.map((resource) => (
                    <ResourceCard key={resource.name} resource={resource} variant="give" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Footer */}
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-3">
            <p className="text-sm text-foreground font-medium">
              You matter. Your pain is valid. Help is available — and so is the chance to help
              others.
            </p>
            <p className="text-xs text-muted-foreground">
              All crisis services listed are free and confidential. Charity links go directly to
              verified organizations.
            </p>
          </div>

          {/* Pain Index bridge */}
          <div className="bg-card/60 border border-border/50 rounded-lg p-5 text-center space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              🌍 See the bigger picture
            </p>
            <p className="text-sm text-muted-foreground">
              The{" "}
              <Link
                to="/observatory"
                className="text-primary underline hover:text-foreground transition-colors font-medium"
              >
                Global Pain Index
              </Link>{" "}
              tracks regularly refreshed data on poverty, displacement, conflict, and mortality from
              multiple authoritative sources.
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              ← Return to the Hotline
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
};

const ResourceCard = ({
  resource,
  variant,
}: {
  resource: CrisisResource;
  variant: "get" | "give";
}) => (
  <motion.a
    href={resource.href}
    target={resource.external ? "_blank" : undefined}
    rel={resource.external ? "noopener noreferrer" : undefined}
    className={`block rounded-lg border p-4 transition-colors ${
      variant === "get"
        ? "bg-card border-border hover:border-destructive/30"
        : "bg-card border-border hover:border-primary/30"
    }`}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
  >
    <h3 className="font-bold text-foreground text-sm">{resource.name}</h3>
    <p className="text-[11px] text-muted-foreground mt-0.5">{resource.description}</p>
    <p
      className={`text-xs font-bold mt-2 ${variant === "get" ? "text-destructive" : "text-primary"}`}
    >
      {resource.action} →
    </p>
  </motion.a>
);

export default CrisisPage;
