/**
 * Detect whether a User-Agent string represents a mobile phone or desktop/tablet.
 *
 * Phones return 'mobile'. Tablets (iPad, Android tablets) and desktops return 'desktop'.
 * This keeps the desktop experience for tablets whose screens are large enough.
 */

const PHONE_UA_REGEX =
  /iPhone|iPod|Android.*Mobile|webOS|BlackBerry|Windows Phone|Opera Mini|IEMobile/i;

export type DeviceType = 'mobile' | 'desktop';

export function detectDeviceType(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) return 'desktop';
  return PHONE_UA_REGEX.test(userAgent) ? 'mobile' : 'desktop';
}
