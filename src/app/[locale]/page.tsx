import { HomeOnboarding } from '@/components/home/HomeOnboarding';

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const ready = params.ready;
  const skipSplash = Array.isArray(ready) ? ready.includes('1') : ready === '1';

  return <HomeOnboarding skipSplash={skipSplash} />;
}
