'use client';

import { useContext } from 'react';
import { DeviceTypeContext } from '@/contexts/DeviceTypeContext';
import type { DeviceType } from '@/lib/detectDevice';

export function useDeviceType(): DeviceType {
  return useContext(DeviceTypeContext);
}
