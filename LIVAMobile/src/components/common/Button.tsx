import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import {Colors, Shadows, BorderRadius} from '../../theme/colors';
import {rf, responsiveSpacing} from '../../utils/responsive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === 'primary' && styles.variant_primary,
        variant === 'secondary' && styles.variant_secondary,
        variant === 'outline' && styles.variant_outline,
        variant === 'ghost' && styles.variant_ghost,
        size === 'sm' && styles.size_sm,
        size === 'md' && styles.size_md,
        size === 'lg' && styles.size_lg,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.86}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.text.white : Colors.primary.blue}
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.text,
              variant === 'primary' && styles.text_primary,
              variant === 'secondary' && styles.text_secondary,
              variant === 'outline' && styles.text_outline,
              variant === 'ghost' && styles.text_ghost,
              size === 'sm' && styles.textSize_sm,
              size === 'md' && styles.textSize_md,
              size === 'lg' && styles.textSize_lg,
              icon ? styles.iconText : undefined,
              textStyle,
            ]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variant_primary: {
    backgroundColor: Colors.primary.blue,
    borderWidth: 1,
    borderColor: 'rgba(77, 141, 255, 0.24)',
    ...Shadows.button,
  },
  variant_secondary: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.small,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary.blue,
  },
  variant_ghost: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  size_sm: {
    paddingVertical: responsiveSpacing.sm + 1,
    paddingHorizontal: responsiveSpacing.lg,
  },
  size_md: {
    paddingVertical: responsiveSpacing.md + 3,
    paddingHorizontal: responsiveSpacing.xl,
  },
  size_lg: {
    paddingVertical: responsiveSpacing.lg + 1,
    paddingHorizontal: responsiveSpacing.xxl,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  text_primary: {
    color: Colors.text.white,
  },
  text_secondary: {
    color: Colors.text.primary,
  },
  text_outline: {
    color: Colors.primary.blue,
  },
  text_ghost: {
    color: Colors.text.secondary,
  },
  textSize_sm: {
    fontSize: rf(12),
  },
  textSize_md: {
    fontSize: rf(14),
  },
  textSize_lg: {
    fontSize: rf(15),
  },
  iconText: {
    marginLeft: responsiveSpacing.sm,
  },
  disabled: {
    opacity: 0.55,
  },
});
