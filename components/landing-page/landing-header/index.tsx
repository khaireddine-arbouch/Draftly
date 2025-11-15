import { Wand2, LogIn, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import logo from "@/public/favicon white.png";
import { navLinks, interFont, animatedStyle } from "../details";


type HeaderProps = {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (value: boolean) => void;
  };
  
export const LandingHeader = ({ mobileMenuOpen, setMobileMenuOpen }: HeaderProps) => {
    const router = useRouter();
    return (
      <header className="flex items-center justify-between border-b border-white/10 bg-black/70 px-5 py-4 sm:px-6">
      <Link
        href="#overview"
        className="flex items-center gap-2"
        data-animate
        style={{ opacity: 0, filter: 'blur(6px)', transform: 'translateY(8px)' }}
      >
        <Image
          src={logo}
          alt="Draftly"
          className="h-9 w-9 rounded-full border border-white/10 bg-white/10 p-1"
          priority={false}
        />
        <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', system-ui" }}>
          Draftly
        </span>
      </Link>
  
      <nav className="hidden items-center gap-7 text-sm text-gray-200 md:flex">
        {navLinks.map(link => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-md px-2 py-1.5 transition-colors hover:bg-white/5 hover:text-white"
            data-animate
            style={animatedStyle(interFont)}
          >
            {link.label}
          </a>
        ))}
      </nav>
  
      <div className="hidden items-center gap-3 md:flex" data-animate style={{ opacity: 0, filter: 'blur(6px)', transform: 'translateY(8px)' }}>
        <button
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow transition-colors hover:bg-gray-100"
          style={{ fontFamily: "'Inter', system-ui" }}
          onClick={() => router.push('/auth/sign-in')}
        >
          <Wand2 className="h-4 w-4" />
          Open Draftly
        </button>
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
          style={{ fontFamily: "'Inter', system-ui" }}
          href="/auth/sign-in"
        >
          <LogIn className="h-4 w-4" />
          View plan
        </Link>
      </div>
  
      <button
        className="rounded-md p-2 text-white transition-colors hover:bg-white/10 md:hidden"
        aria-label="Toggle menu"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
    </header>
    );
  };