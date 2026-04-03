import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {Colors} from '../../theme/colors';
import {rf, responsiveSpacing, ms} from '../../utils/responsive';
import Card from './GlassCard';
import {XSymbol, OSymbol} from '../game/Symbol';

interface StatusScreenProps {
  title: string;
  message?: string;
  isLoading?: boolean;
  error?: string;
}

export default function StatusScreen({
  title,
  message,
  isLoading = false,
  error,
}: StatusScreenProps) {
  return (
    <View style={styles.container}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.mark}>
          <XSymbol size={ms(44)} />
          <OSymbol size={ms(44)} />
        </View>

        {isLoading && (
          <ActivityIndicator
            size="large"
            color={Colors.primary.blue}
            style={styles.spinner}
          />
        )}

        <Text style={styles.title}>{title}</Text>

        {message && <Text style={styles.message}>{message}</Text>}

        {error && <Text style={styles.error}>{error}</Text>}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsiveSpacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    paddingVertical: responsiveSpacing.xxl,
    paddingHorizontal: responsiveSpacing.xl,
  },
  mark: {
    flexDirection: 'row',
    gap: ms(14),
    marginBottom: responsiveSpacing.lg,
  },
  spinner: {
    marginBottom: responsiveSpacing.md,
  },
  title: {
    fontSize: rf(24),
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  message: {
    marginTop: responsiveSpacing.sm,
    fontSize: rf(14),
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: rf(22),
  },
  error: {
    marginTop: responsiveSpacing.sm,
    fontSize: rf(14),
    color: Colors.border.error,
    textAlign: 'center',
  },
});
