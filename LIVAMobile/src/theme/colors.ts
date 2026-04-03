export const Colors = {
  primary: {
    blue: '#4D8DFF',
    blueLight: '#7FB2FF',
    blueDark: '#326AC8',
    orange: '#FFA24A',
    orangeLight: '#FFC47A',
    orangeDark: '#D97B2F',
    cyan: '#5AC8FA',
    purple: '#8597FF',
  },

  background: {
    primary: '#EEF3F7',
    secondary: '#FFFFFF',
    tertiary: '#F6F8FB',
    card: '#FFFDFC',
    cardHover: '#F5F8FB',
    overlay: 'rgba(15, 23, 32, 0.18)',
    stage: '#21313A',
    blobBlue: 'rgba(77, 141, 255, 0.14)',
    blobOrange: 'rgba(255, 162, 74, 0.16)',
  },

  text: {
    primary: '#1F2A37',
    secondary: '#5C6B7A',
    muted: '#8C97A5',
    white: '#FFFFFF',
    blue: '#4D8DFF',
    orange: '#FFA24A',
    inverse: '#F8FBFF',
  },

  border: {
    default: '#DEE5ED',
    light: '#EDF2F7',
    subtle: 'rgba(120, 137, 154, 0.16)',
    blue: '#4D8DFF',
    error: '#E36C61',
    success: '#35B27E',
  },

  player: {
    x: '#4D8DFF',
    xLight: '#7FB2FF',
    xShadow: '#2F67C1',
    o: '#FFA24A',
    oLight: '#FFC47A',
    oShadow: '#D97B2F',
  },

  button: {
    primary: '#4D8DFF',
    primaryGradient: ['#4D8DFF', '#7FB2FF'],
    secondary: '#FFFFFF',
    success: '#35B27E',
    danger: '#E36C61',
  },

  ui: {
    success: '#35B27E',
    error: '#E36C61',
    warning: '#F0B85B',
    info: '#5AC8FA',
  },

  status: {
    online: '#35B27E',
    offline: '#E36C61',
    waiting: '#F0B85B',
  },

  gradients: {
    blue: ['#4D8DFF', '#7FB2FF'],
    orange: ['#FFA24A', '#FFC47A'],
    card: ['#FFFDFC', '#F5F8FB'],
  },
};

export const Typography = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
    hero: 56,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  round: 9999,
};

export const Shadows = {
  small: {
    shadowColor: '#10202B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  medium: {
    shadowColor: '#10202B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,
  },
  large: {
    shadowColor: '#10202B',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
    elevation: 7,
  },
  button: {
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },
  card: {
    shadowColor: '#10202B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
};
