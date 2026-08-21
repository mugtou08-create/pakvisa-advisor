import { permanentRedirect } from 'next/navigation';
import { db } from '@/lib/db';
import { CODE_TO_SLUG } from '@/lib/country-slug';

export async function generateStaticParams() {
  const countries = await db.country.findMany({ select: { code: true } });
  return countries.map((c) => ({ code: c.code }));
}

export default async function CountryRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const slug = CODE_TO_SLUG[code] || code;
  permanentRedirect(`/${slug}`);
}
