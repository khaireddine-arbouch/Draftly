"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronsRight, LogIn, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { LandingHeader } from "@/components/landing-page/landing-header";
import { navLinks } from "@/components/landing-page/details";
import { Hero } from "@/components/landing-page/hero";
import { TrustedBy } from "@/components/landing-page/trusted-by";
import { Workflow } from "@/components/landing-page/workflow";
import { Pricing } from "@/components/landing-page/pricing";
import { Faq } from "@/components/landing-page/faq";
import { FinalCta } from "@/components/landing-page/final-cta";
import { Footer } from "@/components/landing-page/footer";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    const animatedEls =
      document.querySelectorAll<HTMLElement>("[data-animate]");

    const reveal = (el: HTMLElement) => {
      el.style.opacity = "1";
      el.style.filter = "blur(0px)";
      el.style.transform = "translateY(0px)";
    };

    if (!("IntersectionObserver" in window)) {
      animatedEls.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    animatedEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-black text-white antialiased selection:bg-white/10 selection:text-white">
      <div
        className="fixed top-0 -z-10 h-screen w-full bg-cover bg-center opacity-70"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1800&q=80')",
        }}
      />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.35),transparent_55%),radial-gradient(circle_at_bottom,rgba(15,118,110,0.5),transparent_60%)]" />

      <main className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/85 shadow-2xl">
          <LandingHeader
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />

          {mobileMenuOpen && (
            <nav className="border-b border-white/10 bg-black/80 md:hidden">
              <div className="grid gap-1.5 px-5 py-3 text-sm">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-white/10"
                  >
                    <span>{link.label}</span>
                    <ChevronsRight className="h-4 w-4 text-white/70" />
                  </a>
                ))}
                <div className="flex gap-2 pt-2">
                  <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-100">
                    <Wand2 className="h-4 w-4" />
                    Try Draftly
                  </button>
                  <button
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/15"
                    onClick={() => router.push("/auth/sign-in")}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </button>
                </div>
              </div>
            </nav>
          )}

          <Hero />
          <TrustedBy />
          <Workflow />
          <Pricing />
          <Faq openFaqId={openFaqId} setOpenFaqId={setOpenFaqId} />
          <FinalCta />
          <Footer currentYear={currentYear} />
        </section>
      </main>
    </div>
  );
}
