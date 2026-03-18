import { useWindowDimensions } from 'react-native';

export const useIsDesktop = (): boolean => {
  const { width } = useWindowDimensions();
  return width >= 768;
};

