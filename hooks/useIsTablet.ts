import * as Device from 'expo-device';
import { useMemo } from 'react';

export function useIsTablet() {
  return useMemo(() => {
    return (
      Device.deviceType === Device.DeviceType.TABLET ||
      Device.deviceType === Device.DeviceType.DESKTOP
    );
  }, []);
}
