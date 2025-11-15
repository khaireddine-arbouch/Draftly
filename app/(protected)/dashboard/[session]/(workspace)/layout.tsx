import { SubscriptionEntitlementQuery } from "@/app/convex/query.config";
import { combinedSlug } from "@/lib/utils";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";

// Layout component
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { entitlement, profileName } = await SubscriptionEntitlementQuery();
  if (!entitlement) {
    const slug = profileName ? combinedSlug(profileName) : "default";
    redirect(`/billing/${slug}`);
  }
  return (
    <div className="grid grid-cols-1">
      <Navbar />
      {children}
    </div>
  );
}
