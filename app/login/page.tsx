import { redirect } from 'next/navigation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const target = sp?.redirect || sp?.next || '/checkout';
  redirect(`/auth?redirect=${encodeURIComponent(target)}`);
}
