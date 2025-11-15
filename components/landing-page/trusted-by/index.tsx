import { Check } from "lucide-react";
import { productSections } from "../details";

export const TrustedBy = () => (
  <section
    id="product"
    className="border-t border-white/10 px-5 pt-10 sm:px-6 md:pt-14"
    data-animate
    style={{ opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" }}
  >
    <p
      className="text-xs uppercase tracking-wide text-gray-400 text-center"
      style={{ fontFamily: "'Inter', system-ui" }}
    >
      Everything that ships inside Draftly today
    </p>
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {productSections.map((section) => (
        <article
          key={section.title}
          className="rounded-2xl border border-white/10 bg-white/3 p-5 transition-colors hover:bg-white/6"
        >
          <div className="flex items-center gap-2 text-sm text-emerald-100">
            <section.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
            {section.title}
          </div>
          <p className="mt-2 text-sm text-gray-300 leading-relaxed">
            {section.description}
          </p>
          <ul className="mt-3 space-y-1 text-xs text-gray-200">
            {section.bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-200" strokeWidth={1.5} />
                {bullet}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  </section>
);
