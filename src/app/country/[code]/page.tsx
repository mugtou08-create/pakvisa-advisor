import { permanentRedirect, notFound } from 'next/navigation';
import { CODE_TO_SLUG, SLUG_TO_CODE } from '@/lib/country-slug';

// ISR with 1-hour revalidation — these are just redirects, very cheap to cache
export const revalidate = 3600;

export default async function CountryRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const slug = CODE_TO_SLUG[code];
  if (!slug) {
    // Unknown country code — return 404 instead of a broken redirect
    notFound();
  }
  permanentRedirect(`/${slug}`);
}
