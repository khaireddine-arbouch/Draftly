import {
  Bot,
  ClipboardPenLine,
  FolderKanban,
  Layers2,
  Palette,
  PenSquare,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { CSSProperties } from "react";

export const navLinks = [
  { label: "Overview", href: "#overview" },
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const heroStats = [
  {
    label: "Projects per workspace",
    value: "Unlimited",
    icon: FolderKanban,
  },
  {
    label: "Included AI credits",
    value: "10 / mo",
    icon: Sparkles,
  },
  {
    label: "Built-in copilots",
    value: "3",
    icon: Bot,
  },
];

export const productSections = [
  {
    title: "Projects hub",
    description:
      "Create, rename, archive, and restore projects without leaving the dashboard. Everything syncs through Convex so nothing gets lost.",
    bullets: [
      "Unlimited projects with autosaved thumbnails",
      "Role-gated access before the canvas opens",
    ],
    icon: FolderKanban,
  },
  {
    title: "Moodboard & style guide",
    description:
      "Upload up to six inspiration images, let Draftly extract palettes and typography, and reuse the tokens in every generation.",
    bullets: [
      "Images stored privately in Convex storage",
      "Color + type scales editable inside the app",
    ],
    icon: Palette,
  },
  {
    title: "Infinite canvas",
    description:
      "Frames, rectangles, text, arrows, and freehand drawing ship today. Edit copy with a sidebar and keep multiple frames per project.",
    bullets: [
      "Selection, duplicate, undo/redo, and export",
      "Inspiration sidebar appears automatically on new frames",
    ],
    icon: PenSquare,
  },
  {
    title: "AI copilots",
    description:
      "One-click generation, workflow extensions, and the redesign chat all live beside the canvas so you never juggle tabs.",
    bullets: [
      "1 credit streams a brand-new UI from your screenshot",
      "4 credits run a full redesign via chat with history",
    ],
    icon: Sparkles,
  },
];

export const workflowSteps = [
  {
    id: "1",
    title: "Capture your context",
    subtitle: "Collect",
    copy: "Drop images into the inspiration board and turn them into a reusable palette + typography scale for the project.",
    icon: Palette,
    bullets: [
      "Upload up to 6 images per project",
      "Generate colors & type straight from the moodboard",
    ],
  },
  {
    id: "2",
    title: "Stream UI onto the canvas",
    subtitle: "Generate",
    copy: "Send screenshots or frames to the AI generator, then review the HTML + Tailwind markup directly inside the infinite canvas.",
    icon: Layers2,
    bullets: [
      "1 credit per brand-new generation",
      "Frames save to the project history automatically",
    ],
  },
  {
    id: "3",
    title: "Iterate with copilots",
    subtitle: "Refine & ship",
    copy: "Open the redesign chat or trigger the workflow generator to build additional pages that stay consistent with your style guide.",
    icon: Workflow,
    bullets: [
      "Chat-based redesign costs 4 credits",
      "Workflow companion pages cost 1 credit",
    ],
  },
];

export const secondaryHighlights = [
  {
    title: "Context stays attached to the project",
    copy: "Moodboards, style guides, and generated UI live in the same Convex document so you never have to re-upload assets between sessions.",
    bullets: [
      "Inspiration board opens automatically on new frames",
      "Tokens regenerate on demand from the same images",
    ],
    icon: ClipboardPenLine,
  },
  {
    title: "Transparent credit meter",
    copy: "The billing page gives you 10 credits every month. Each AI task removes a known amount so there are no surprise charges.",
    bullets: [
      "1 credit = new UI generation or workflow page",
      "4 credits = full redesign via Design Chat",
    ],
    icon: ShieldCheck,
  },
];

export const pricingPlans = [
  {
    id: "standard",
    name: "Standard",
    target: "Built-in plan",
    description:
      "Everything in the current app: projects, moodboards, canvas, AI generation, and exports.",
    price: { monthly: 20, annual: null, unit: "/month" },
    perks: [
      "Unlimited projects & inspiration boards",
      "10 AI credits each month (auto-refresh)",
      "Generate UI, workflows, and run design chat",
      "Export semantic HTML + Tailwind classes",
    ],
    badge: "Available now",
    cta: "Manage inside Draftly",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    target: "Coming soon",
    description:
      "Need more than 10 credits per month? Extra usage tiers unlock from the same billing screen soon.",
    price: { monthly: "On request", annual: "On request", unit: "" },
    perks: [
      "Priority access to higher credit packs",
      "Shared billing across teams",
      { label: "Self-hosted option", available: false },
      { label: "Dedicated support SLA", available: false },
    ],
    cta: "Join waitlist",
    variant: "secondary",
  },
];

export const faqItems = [
  {
    id: "faq-1",
    question: "What can I build with Draftly today?",
    answer:
      "Draftly ships with a project dashboard, a moodboard + style guide generator, an infinite canvas, and three AI copilots (generation, workflow, and redesign chat). Every screenshot you upload becomes editable HTML + Tailwind on the canvas.",
  },
  {
    id: "faq-2",
    question: "How does the inspiration board affect generation?",
    answer:
      "The images you add feed the style-guide generator. The resulting palette + typography are stored on Convex and injected into every AI prompt so colors, spacing, and type stay consistent across frames and workflow pages.",
  },
  {
    id: "faq-3",
    question: "How do credits work?",
    answer:
      "You get 10 credits each month. Streaming a brand-new UI or workflow page costs 1 credit. Running a full redesign through the chat costs 4 credits because it keeps a longer conversation history.",
  },
  {
    id: "faq-4",
    question: "What does AI export?",
    answer:
      "The generator streams semantic HTML with Tailwind classes. You can copy the markup, export a PNG from any frame, or keep iterating inside the canvas. There are no proprietary runtimes.",
  },
  {
    id: "faq-5",
    question: "Can I leave and come back later?",
    answer:
      "Yes. Projects, style guides, and inspiration images persist in Convex. When you sign back in, Draftly restores your canvas state and credit balance automatically.",
  },
];

export const generationLog = `$ draftly generate ui --project sales-ops

> loading style-guide tokens......... done
> inspiration images attached: 3
> uploading screenshot: dashboard.png
> credits consumed: 1 (remaining: 9)

✔ streamed HTML to canvas
  - frame: Revenue Overview
  - workflow placeholder attached

Tip: open Design Chat to request spacing or color tweaks.`;

export const interFont: CSSProperties = { fontFamily: "'Inter', system-ui" };
export const spaceGroteskFont: CSSProperties = {
  fontFamily: "'Space Grotesk', system-ui",
};

export const animateInStyle: CSSProperties = {
  opacity: 0,
  filter: "blur(6px)",
  transform: "translateY(8px)",
};

export const animatedStyle = (style?: CSSProperties): CSSProperties => ({
  ...animateInStyle,
  ...style,
});
