import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const BASE_WIDTH = 393;

const getWindowSize = () => Dimensions.get('window');

export const isTablet = (): boolean => getWindowSize().width >= 768;
export const isSmallPhone = (): boolean => getWindowSize().width < 375;

export const wp = (percentage: number): number => {
  const {width} = getWindowSize();
  const value = (percentage * width) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

export const hp = (percentage: number): number => {
  const {height} = getWindowSize();
  const value = (percentage * height) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

export const rf = (size: number): number => {
  const {width} = getWindowSize();
  const scale = width / BASE_WIDTH;
  const nextSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(nextSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(nextSize)) - 2;
};

export const ms = (size: number, factor = 0.5): number => {
  const {width} = getWindowSize();
  const scale = width / BASE_WIDTH;
  const nextSize = size + (size * (scale - 1) * factor);
  return Math.round(PixelRatio.roundToNearestPixel(nextSize));
};

export const responsiveSpacing = {
  xxs: ms(2),
  xs: ms(4),
  sm: ms(8),
  md: ms(12),
  lg: ms(16),
  xl: ms(24),
  xxl: ms(32),
};

export const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export const responsiveFont = (size: number) => ({
  fontSize: rf(size),
  lineHeight: rf(size) * 1.4,
});

export const responsiveIcon = (size: number) => ms(size);

export const SCREEN_W = getWindowSize().width;
export const SCREEN_H = getWindowSize().height;
