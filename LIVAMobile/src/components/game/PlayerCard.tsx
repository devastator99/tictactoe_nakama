import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, BorderRadius} from '../../theme/colors';
import {rf, ms} from '../../utils/responsive';
import Card from '../common/GlassCard';
import Symbol from './Symbol';
import type {PlayerInfo, GamePhase} from '../../types';

interface PlayerCardProps {
  player?: PlayerInfo;
  isCurrentTurn: boolean;
  isWinner: boolean;
  gamePhase: GamePhase;
  isOpponent?: boolean;
}

export default function PlayerCard({
  player,
  isCurrentTurn,
  isWinner,
  gamePhase,
  isOpponent = false,
}: PlayerCardProps) {
  if (!player) {
    return (
      <Card variant="outlined" style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyAvatar}>
            <Text style={styles.emptyAvatarText}>?</Text>
          </View>
          <Text style={styles.waitingText}>Waiting for opponent</Text>
        </View>
      </Card>
    );
  }

  const isActive = isCurrentTurn && gamePhase === 'playing';

  const getStatusText = () => {
    if (!player.connected) return {text: 'Disconnected', color: Colors.ui.error};
    if (isWinner) return {text: 'Winner', color: Colors.ui.success};
    if (gamePhase === 'game_over' && !isWinner) return {text: 'Finished', color: Colors.text.muted};
    if (isActive) return {text: 'Turn live', color: Colors.primary.blue};
    if (gamePhase === 'playing') return {text: 'Waiting', color: Colors.text.muted};
    return {text: 'Ready', color: Colors.primary.orange};
  };

  const status = getStatusText();

  return (
    <Card
      variant={isActive ? 'elevated' : 'default'}
      style={[
        styles.container,
        isActive && styles.activeContainer,
        isWinner && styles.winnerContainer,
      ]}>
      <View style={styles.content}>
        <View
          style={[
            styles.symbolWrap,
            player.symbol === 'X' ? styles.symbolWrapX : styles.symbolWrapO,
          ]}>
          <Symbol type={player.symbol} size={ms(38)} />
        </View>

        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.username} numberOfLines={1}>
              {isOpponent ? player.username : player.username}
            </Text>
            {isActive && <View style={styles.turnBadge}><Text style={styles.turnBadgeText}>TURN</Text></View>}
          </View>
          <Text style={[styles.statusText, {color: status.color}]}>
            {status.text}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 120,
  },
  activeContainer: {
    borderColor: 'rgba(77, 141, 255, 0.22)',
  },
  winnerContainer: {
    borderColor: 'rgba(53, 178, 126, 0.28)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
  },
  emptyState: {
    alignItems: 'center',
    gap: ms(12),
  },
  emptyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  emptyAvatarText: {
    fontSize: rf(24),
    color: Colors.text.muted,
  },
  waitingText: {
    fontSize: rf(12),
    color: Colors.text.muted,
  },
  symbolWrap: {
    width: 58,
    height: 58,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolWrapX: {
    backgroundColor: 'rgba(77, 141, 255, 0.12)',
  },
  symbolWrapO: {
    backgroundColor: 'rgba(255, 162, 74, 0.14)',
  },
  textBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginBottom: ms(5),
  },
  username: {
    flex: 1,
    fontSize: rf(15),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statusText: {
    fontSize: rf(12),
    fontWeight: '600',
  },
  turnBadge: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(77, 141, 255, 0.14)',
  },
  turnBadgeText: {
    fontSize: rf(9),
    fontWeight: '700',
    color: Colors.primary.blue,
    letterSpacing: 0.6,
  },
});
