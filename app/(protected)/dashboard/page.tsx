import { SubscriptionEntitlementQuery } from '@/app/convex/query.config';
import { combinedSlug } from '@/lib/utils';
import { redirect } from 'next/navigation';

// Page component
const Page = async () => {
  // Get entitlement and profile name from the query
  const { entitlement, profileName } = await SubscriptionEntitlementQuery();

  const slug = profileName ? combinedSlug(profileName) : 'untitled';
  
  // Always route to the dashboard session slug
  redirect(`/dashboard/${slug}`);
};

export default Page;
