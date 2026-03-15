export function markMilestone(name: string) {
  if (typeof performance === 'undefined') return;
  performance.mark(`pitchr:${name}`);
}

export function measureMilestone(name: string, startMark: string) {
  if (typeof performance === 'undefined') return;
  try {
    performance.measure(`pitchr:${name}`, `pitchr:${startMark}`);
  } catch {
    // Start mark may not exist
  }
}

export function getDeviceType(): string {
  if (typeof document === 'undefined') return 'unknown';
  const match = document.cookie.match(/x-device-type=(\w+)/);
  return match?.[1] || 'unknown';
}

export function reportCustomMetric(name: string, value: number) {
  if (typeof window === 'undefined') return;
  const va = (window as unknown as Record<string, unknown>).va;
  if (typeof va === 'function') {
    va('event', {
      name: `perf:${name}`,
      data: { value, device: getDeviceType() },
    });
  }
}
