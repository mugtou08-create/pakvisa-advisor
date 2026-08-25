import { permanentRedirect } from 'next/navigation';
import { CODE_TO_SLUG } from '@/lib/country-slug';

// Force dynamic — avoid pre-rendering at build time
export const dynamic = 'force-dynamic';

export default async function CountryRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const slug = CODE_TO_SLUG[code] || code;
  permanentRedirect(`/${slug}`);
}
