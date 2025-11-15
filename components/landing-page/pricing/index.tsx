import { Check, Info, Sparkles, Star, X, Zap } from "lucide-react";
import { pricingPlans } from "../details";

const creditBreakdown = [
  { label: "Generate new UI from a screenshot", cost: "1 credit" },
  { label: "Create a workflow companion page", cost: "1 credit" },
  { label: "Full redesign via Design Chat", cost: "4 credits" },
];

export const Pricing = () => (
  <div
    id="pricing"
    className="border-t border-white/10 px-5 pb-10 pt-10 sm:px-6 md:pb-14"
    data-animate
    style={{ opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" }}
  >
    <div className="flex flex-col gap-3">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-wide text-gray-400">Pricing</p>
        <h2
          className="mt-1 text-3xl tracking-tight md:text-4xl"
          style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 500 }}
        >
          A single plan with clear credit usage.
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          Draftly currently runs on one paid plan. You get unlimited projects,
          moodboards, and canvas sessions plus 10 AI credits every month. Extra
          credit packs unlock from the same billing screen soon.
        </p>
      </div>
    </div>

    <div className="mt-6 grid gap-5 md:grid-cols-3">
      {pricingPlans.map((plan) => (
        <div
          key={plan.id}
          className={`relative rounded-2xl border border-white/10 p-5 transition-colors ${
            plan.highlighted
              ? "bg-linear-to-br from-white/7 to-white/2 ring-1 ring-white/10"
              : "bg-white/3"
          }`}
        >
          {plan.badge && (
            <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] text-black">
              <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
              {plan.badge}
            </span>
          )}
          <div className="flex items-center justify-between text-gray-400">
            <h3
              className="text-lg font-semibold tracking-tight text-white"
              style={{ fontFamily: "'Space Grotesk', system-ui" }}
            >
              {plan.name}
            </h3>
            <span className="text-[11px]">{plan.target}</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span
              className="text-3xl tracking-tight"
              style={{
                fontFamily: "'Space Grotesk', system-ui",
                fontWeight: 500,
              }}
            >
              {typeof plan.price.monthly === "number"
                ? `$${plan.price.monthly}`
                : plan.price.monthly}
            </span>
            <span className="text-sm text-gray-400">{plan.price.unit}</span>
          </div>
          <p className="mt-2 text-sm text-gray-300">{plan.description}</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-200">
            {plan.perks.map((perk) =>
              typeof perk === "string" ? (
                <li key={perk} className="flex items-center gap-2">
                  <Check
                    className="h-3.5 w-3.5 text-white/90"
                    strokeWidth={1.5}
                  />
                  {perk}
                </li>
              ) : (
                <li
                  key={perk.label}
                  className="flex items-center gap-2 text-gray-500 line-through"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {perk.label}
                </li>
              )
            )}
          </ul>
          <button
            className={`mt-5 w-full rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
              plan.variant === "secondary"
                ? "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            {plan.id === "standard" && (
              <Sparkles className="mr-2 inline h-4 w-4" strokeWidth={1.5} />
            )}
            {plan.cta}
          </button>
        </div>
      ))}
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-400">
          <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
          Credit usage
        </div>
        <div className="mt-4 space-y-3 text-sm text-gray-200">
          {creditBreakdown.map((credit) => (
            <div
              key={credit.label}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2"
            >
              <p>{credit.label}</p>
              <span className="text-emerald-200">{credit.cost}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-400">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          Included forever
        </div>
        <ul className="mt-4 space-y-2 text-sm text-gray-200">
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-white/90" strokeWidth={1.5} />
            Unlimited projects, frames, and exports
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-white/90" strokeWidth={1.5} />
            Moodboard uploads + style guide generation
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-white/90" strokeWidth={1.5} />
            Canvas tools, selection, undo/redo, PNG export
          </li>
        </ul>
        <p className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <Info className="h-3.5 w-3.5" strokeWidth={1.5} />
          Manage billing anytime inside the protected /billing route.
        </p>
      </div>
    </div>
  </div>
);
