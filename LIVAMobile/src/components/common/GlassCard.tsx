import React from 'react';
import {View, StyleSheet, ViewStyle, StyleProp} from 'react-native';
import {Colors, BorderRadius, Shadows} from '../../theme/colors';
import {responsiveSpacing} from '../../utils/responsive';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
  children,
  style,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  return (
    <View
      style={[
        styles.container,
        styles[`variant_${variant}` as keyof typeof styles],
        styles[`padding_${padding}` as keyof typeof styles],
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  variant_default: {
    ...Shadows.card,
  },
  variant_elevated: {
    ...Shadows.large,
  },
  variant_outlined: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    shadowOpacity: 0,
    elevation: 0,
  },
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: responsiveSpacing.md,
  },
  padding_md: {
    padding: responsiveSpacing.xl - 2,
  },
  padding_lg: {
    padding: responsiveSpacing.xl + 4,
  },
});
