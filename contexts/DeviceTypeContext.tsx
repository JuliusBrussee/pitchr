'use client';

import { createContext, useContext } from 'react';
import type { DeviceType } from '@/lib/detectDevice';

const DeviceTypeContext = createContext<DeviceType>('desktop');

export function DeviceTypeProvider({
  deviceType,
  children,
}: {
  deviceType: DeviceType;
  children: React.ReactNode;
}) {
  return (
    <DeviceTypeContext.Provider value={deviceType}>
      {children}
    </DeviceTypeContext.Provider>
  );
}

export { DeviceTypeContext };
