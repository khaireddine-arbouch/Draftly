import { SubscriptionEntitlementQuery } from '@/app/convex/query.config';
import { combinedSlug } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Navbar } from "@/components/navbar";

// Layout component
export default async function Layout({ children }: { children: React.ReactNode }) {
    const { entitlement, profileName } = await SubscriptionEntitlementQuery();
  // Do not redirect here; allow session pages to render. Billing is handled elsewhere.
  return (
    <div className='grid grid-cols-1'>
        <Navbar />
      {children}
    </div>
  )
}