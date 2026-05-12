import { cookies } from 'next/headers';
import type { DeviceType } from '@/lib/detectDevice';
import { AppLayoutClient } from './AppLayoutClient';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const deviceType = (cookieStore.get('x-device-type')?.value || 'desktop') as DeviceType;

  return <AppLayoutClient deviceType={deviceType}>{children}</AppLayoutClient>;
}
