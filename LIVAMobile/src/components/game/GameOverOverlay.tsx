import React from 'react';
import {View, Text, StyleSheet, Modal, Pressable} from 'react-native';
import {Colors} from '../../theme/colors';
import {rf, ms} from '../../utils/responsive';
import Button from '../common/Button';
import Card from '../common/GlassCard';
import {XSymbol, OSymbol} from './Symbol';
import type {GameState} from '../../types';

interface GameOverOverlayProps {
  visible: boolean;
  gameState: GameState | null;
  userId: string | null;
  onRematch: () => void;
  onExit: () => void;
}

export default function GameOverOverlay({
  visible,
  gameState,
  userId,
  onRematch,
  onExit,
}: GameOverOverlayProps) {
  if (!gameState || !visible) return null;

  const isWinner = gameState.winner === userId;
  const isDraw = !gameState.winner && gameState.phase === 'game_over';
  const winnerInfo = gameState.players.find(p => p.userId === gameState.winner);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay}>
        <Card variant="elevated" style={styles.card}>
          <View style={styles.content}>
            <View style={styles.mark}>
              <XSymbol size={ms(42)} />
              <OSymbol size={ms(42)} />
            </View>

            <Text style={styles.eyebrow}>MATCH COMPLETE</Text>
            <Text style={[styles.title, isWinner && styles.winnerText]}>
              {isWinner ? 'You won' : isDraw ? 'Draw game' : 'You lost'}
            </Text>

            <Text style={styles.subtitle}>
              {isDraw ? 'Both players held the line.' : isWinner ? 'Sharp finish. Queue another one?' : `${winnerInfo?.username || 'Opponent'} took the board this round.`}
            </Text>

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{gameState.moveCount}</Text>
                <Text style={styles.statLabel}>Moves</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {gameState.mode === 'classic' ? '∞' : '30s'}
                </Text>
                <Text style={styles.statLabel}>Clock</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Button
                title="REMATCH"
                onPress={onRematch}
                variant="primary"
                size="lg"
                style={styles.rematchButton}
              />
              <Button
                title="Leave"
                onPress={onExit}
                variant="secondary"
                size="md"
                style={styles.exitButton}
              />
            </View>
          </View>
        </Card>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 18, 24, 0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ms(24),
  },
  card: {
    width: '100%',
    maxWidth: 340,
  },
  content: {
    alignItems: 'center',
    gap: ms(14),
  },
  mark: {
    flexDirection: 'row',
    gap: ms(14),
    marginBottom: ms(6),
  },
  eyebrow: {
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 1.3,
    color: Colors.text.muted,
  },
  title: {
    fontSize: rf(28),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  winnerText: {
    color: Colors.ui.success,
  },
  subtitle: {
    fontSize: rf(14),
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: rf(21),
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ms(12),
    paddingHorizontal: ms(24),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: rf(24),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: rf(11),
    color: Colors.text.muted,
    marginTop: ms(4),
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border.default,
  },
  actions: {
    width: '100%',
    marginTop: ms(18),
    gap: ms(12),
  },
  rematchButton: {
    width: '100%',
  },
  exitButton: {
    width: '100%',
  },
});
