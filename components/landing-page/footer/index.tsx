import Image from "next/image";
import Link from "next/link";
import logo from "@/public/favicon white.png";

type FooterProps = {
  currentYear: number;
};

export const Footer = ({ currentYear }: FooterProps) => (
  <footer
    className="border-t border-white/10 px-5 py-6 sm:px-6"
    data-animate
    style={{ opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" }}
  >
    <div className="flex flex-col gap-4 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <Image
          src={logo}
          alt="Draftly logo"
          className="h-7 w-7 rounded-full border border-white/10 bg-white/10 p-1"
        />
        <div className="space-y-0.5">
          <p className="text-xs text-gray-300">Draftly</p>
          <p className="text-[11px] text-gray-500">
            Projects · Moodboards · Canvas · AI copilots
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-4">
          <Link href="#product" className="transition-colors hover:text-gray-200">
            Product
          </Link>
          <Link href="#workflow" className="transition-colors hover:text-gray-200">
            Workflow
          </Link>
          <Link href="#pricing" className="transition-colors hover:text-gray-200">
            Pricing
          </Link>
          <Link href="#faq" className="transition-colors hover:text-gray-200">
            FAQ
          </Link>
          <Link href="/auth/sign-in" className="transition-colors hover:text-gray-200">
            Sign in
          </Link>
        </div>
        <span className="text-[11px] text-gray-500 md:ml-4">
          © {currentYear} Draftly. Built with Next.js + Convex.
        </span>
      </div>
    </div>
  </footer>
);
