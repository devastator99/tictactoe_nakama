import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Colors, BorderRadius, Shadows } from '../../theme/colors'
import { rf, ms, responsiveSpacing } from '../../utils/responsive'

interface ReplayNotFoundProps {
  matchId?: string
  reason?: 'not-found' | 'deleted' | 'error'
  onBrowseReplays?: () => void
  onBackToLobby?: () => void
}

const reasonMessages: Record<string, { title: string; body: string; icon: string }> = {
  'not-found': {
    title: 'Replay Not Found',
    body: 'The match you are looking for does not exist in our database. Check the match ID and try again.',
    icon: '⚙️',
  },
  deleted: {
    title: 'Replay Deleted',
    body: 'This match replay was archived or removed. Recent matches are available in the replay browser.',
    icon: '🗑️',
  },
  error: {
    title: 'Failed to Load Replay',
    body: 'Something went wrong while loading the match data. Try refreshing or come back later.',
    icon: '⚠️',
  },
}

export default function ReplayNotFound({
  matchId,
  reason = 'not-found',
  onBrowseReplays,
  onBackToLobby,
}: ReplayNotFoundProps) {
  const message = reasonMessages[reason] ?? reasonMessages['not-found']

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <Text style={styles.icon} allowFontScaling={false}>
          {message.icon}
        </Text>

        {/* Title */}
        <Text style={styles.title}>{message.title}</Text>

        {/* Body */}
        <Text style={styles.body}>{message.body}</Text>

        {/* Match ID if provided */}
        {matchId && (
          <View style={styles.matchIdContainer}>
            <Text style={styles.matchIdLabel}>Match ID:</Text>
            <Text style={styles.matchIdValue}>{matchId}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable
            style={({ pressed }) => [styles.button, styles.buttonPrimary, pressed && styles.buttonPressed]}
            onPress={onBrowseReplays}
          >
            <Text style={styles.buttonTextPrimary}>Browse Replays</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.button, styles.buttonSecondary, pressed && styles.buttonPressed]}
            onPress={onBackToLobby}
          >
            <Text style={styles.buttonTextSecondary}>Back to Lobby</Text>
          </Pressable>
        </View>

        {/* Help text */}
        <Text style={styles.helpText}>Replays are stored for 30 days after match completion.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: responsiveSpacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  icon: {
    fontSize: rf(48),
    marginBottom: responsiveSpacing.lg,
  },
  title: {
    fontSize: rf(24),
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: responsiveSpacing.md,
  },
  body: {
    fontSize: rf(14),
    lineHeight: rf(14) * 1.6,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: responsiveSpacing.lg,
  },
  matchIdContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    marginBottom: responsiveSpacing.xl,
    alignSelf: 'stretch',
  },
  matchIdLabel: {
    fontSize: rf(12),
    color: Colors.text.secondary,
    marginBottom: responsiveSpacing.xs as any,
  },
  matchIdValue: {
    fontSize: rf(11),
    fontFamily: 'Courier New',
    color: Colors.text.primary,
  },
  buttonsContainer: {
    gap: responsiveSpacing.md,
    width: '100%',
    marginBottom: responsiveSpacing.xl,
  },
  button: {
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.lg,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary.blue,
    ...Shadows.button,
  },
  buttonSecondary: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  buttonTextPrimary: {
    fontSize: rf(14),
    fontWeight: '600',
    color: Colors.text.white,
  },
  buttonTextSecondary: {
    fontSize: rf(14),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  helpText: {
    fontSize: rf(11),
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: responsiveSpacing.md,
  },
})
