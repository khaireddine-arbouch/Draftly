import { ChevronDown } from "lucide-react";
import { faqItems } from "../details";

type FaqProps = {
  openFaqId: string | null;
  setOpenFaqId: (id: string | null) => void;
};

export const Faq = ({ openFaqId, setOpenFaqId }: FaqProps) => (
  <div
    id="faq"
    className="border-t border-white/10 px-5 pb-10 pt-10 sm:px-6 md:pb-14"
    data-animate
    style={{ opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" }}
  >
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-wide text-gray-400">FAQ</p>
      <h2
        className="mt-1 text-3xl tracking-tight md:text-4xl"
        style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 500 }}
      >
        Answers to common questions
      </h2>
    </div>

    <div className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/3">
      {faqItems.map((item) => {
        const isOpen = openFaqId === item.id;
        return (
          <div key={item.id} className="p-5">
            <button
              className="flex w-full items-center justify-between text-left"
              aria-expanded={isOpen}
              onClick={() => setOpenFaqId(isOpen ? null : item.id)}
            >
              <span className="text-sm font-semibold tracking-tight text-white md:text-base">
                {item.question}
              </span>
              <ChevronDown
                className={`h-4.5 w-4.5 text-gray-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                strokeWidth={1.5}
              />
            </button>
            {isOpen && (
              <p className="mt-3 text-sm leading-relaxed text-gray-300">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
