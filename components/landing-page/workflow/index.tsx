import { Check } from "lucide-react";
import { secondaryHighlights, workflowSteps } from "../details";

export const Workflow = () => (
  <div
    id="workflow"
    className="border-t border-white/10 px-5 pb-10 pt-10 sm:px-6 md:pb-14"
    data-animate
    style={{ opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" }}
  >
    <div className="mb-6">
      <p
        className="text-xs uppercase tracking-wide text-gray-400"
        style={{ fontFamily: "'Inter', system-ui" }}
      >
        Workflow
      </p>
      <h2
        className="mt-1 text-3xl tracking-tight md:text-4xl"
        style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 500 }}
      >
        The exact path Draftly follows inside the product.
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-gray-300">
        Every step below is live right now: capture references, stream UI onto
        the infinite canvas, and keep iterating with the built-in copilots.
        Credits refresh monthly so you always know what each action costs.
      </p>
    </div>

    <div className="grid gap-5 md:grid-cols-3">
      {workflowSteps.map((step) => (
        <div
          key={step.id}
          className="rounded-2xl border border-white/10 bg-white/3 p-5 transition-colors hover:bg-white/5"
        >
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <step.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
            {step.id}. {step.subtitle}
          </div>
          <h3
            className="mt-2 text-xl font-semibold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', system-ui" }}
          >
            {step.title}
          </h3>
          <p className="mt-2 text-sm text-gray-300 leading-relaxed">
            {step.copy}
          </p>
          <ul className="mt-3 space-y-1 text-xs text-gray-300">
            {step.bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div className="mt-5 grid gap-5 md:grid-cols-2">
      {secondaryHighlights.map((highlight) => (
        <div
          key={highlight.title}
          className="rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-white/2 p-5 transition-colors hover:bg-white/7"
        >
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <highlight.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
            {highlight.title}
          </div>
          <h3
            className="mt-2 text-xl font-semibold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', system-ui" }}
          >
            {highlight.copy.split(".")[0]}.
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">
            {highlight.copy}
          </p>
          <ul className="mt-3 space-y-1 text-xs text-gray-300">
            {highlight.bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);
