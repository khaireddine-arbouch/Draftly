import { SubscriptionEntitlementQuery } from '@/app/convex/query.config';
import { combinedSlug } from '@/lib/utils';
import { redirect } from 'next/navigation';

// Page component
const Page = async () => {
  const { entitlement, profileName } =
    await SubscriptionEntitlementQuery();

  if (!entitlement) {
    redirect(`/billing/${combinedSlug(profileName!)}`);
  }

  redirect(`/dashboard/${combinedSlug(profileName!)}`);
};


export default Page;
