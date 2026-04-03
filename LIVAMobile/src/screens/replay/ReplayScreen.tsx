import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors} from '../../theme/colors';
import {rf, ms} from '../../utils/responsive';
import Card from '../../components/common/GlassCard';
import {nakamaService} from '../../services/nakama.service';
import {Log} from '../../utils/logger';
import type {ReplayRecord} from '../../types';

export default function ReplayScreen() {
  const [replays, setReplays] = useState<ReplayRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadReplays = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      Log.debug('other', null, 'Loading recent replays...');
      const data = await nakamaService.getRecentReplays(20);
      setReplays(data);
      Log.info('other', { count: data.length }, `Loaded replays`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Log.error('other', null, `Failed to load replays: ${errorMessage}`);
      setLoadError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReplays();
  }, [loadReplays]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoadError(null);
    await loadReplays();
    setRefreshing(false);
  }, [loadReplays]);

  const formatDuration = (durationMs: number) => {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWinnerName = (replay: ReplayRecord) => {
    if (!replay.winner) return 'Draw';
    const winner = replay.players.find(p => p.userId === replay.winner);
    return winner?.username || 'Unknown';
  };

  const renderReplay = ({item}: {item: ReplayRecord}) => (
    <Pressable style={styles.replayCard}>
      <Card variant="default" padding="md">
        <View style={styles.replayHeader}>
          <Text style={styles.mode}>{item.mode.replace('vs_ai_', 'AI ')}</Text>
          <Text style={styles.date}>{formatDate(item.startedAt)}</Text>
        </View>
        <View style={styles.players}>
          {item.players.map((player, index) => (
            <React.Fragment key={player.userId}>
              <View style={styles.player}>
                <Text
                  style={[
                    styles.playerSymbol,
                    {color: player.symbol === 'X' ? Colors.player.x : Colors.player.o},
                  ]}>
                  {player.symbol}
                </Text>
                <Text style={styles.playerName}>{player.username}</Text>
              </View>
              {index < item.players.length - 1 && (
                <Text style={styles.vs}>vs</Text>
              )}
            </React.Fragment>
          ))}
        </View>
        <View style={styles.replayFooter}>
          <Text style={styles.winner}>
            {item.winner ? `Winner: ${getWinnerName(item)}` : 'Draw'}
          </Text>
          <Text style={styles.meta}>{item.moves.length} moves</Text>
          <Text style={styles.meta}>{formatDuration(item.durationMs)}</Text>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loadError && (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>Failed to load replays</Text>
            <Text style={styles.errorDetail}>{loadError}</Text>
            <Pressable style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      )}
      <FlatList
        data={replays}
        renderItem={renderReplay}
        keyExtractor={item => item.matchId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Card variant="elevated" style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>REPLAY LIBRARY</Text>
              <Text style={styles.title}>Recent matches.</Text>
              <Text style={styles.subtitle}>{replays.length} recorded games ready for review.</Text>
            </Card>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No replays yet</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.blue}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  listContent: {
    padding: ms(20),
    gap: ms(12),
  },
  header: {
    marginBottom: ms(12),
  },
  heroCard: {
    width: '100%',
  },
  heroEyebrow: {
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.text.muted,
    marginBottom: ms(10),
  },
  title: {
    fontSize: rf(28),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: ms(8),
  },
  subtitle: {
    fontSize: rf(14),
    color: Colors.text.secondary,
  },
  replayCard: {
    width: '100%',
  },
  replayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(12),
  },
  mode: {
    fontSize: rf(12),
    fontWeight: '700',
    color: Colors.primary.blue,
    textTransform: 'uppercase',
  },
  date: {
    fontSize: rf(11),
    color: Colors.text.muted,
  },
  players: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(14),
    marginBottom: ms(12),
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },
  playerSymbol: {
    fontSize: rf(18),
    fontWeight: '700',
  },
  playerName: {
    fontSize: rf(14),
    color: Colors.text.primary,
    fontWeight: '600',
  },
  vs: {
    fontSize: rf(11),
    color: Colors.text.muted,
  },
  replayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: ms(12),
  },
  winner: {
    fontSize: rf(12),
    color: Colors.ui.success,
    fontWeight: '600',
  },
  meta: {
    fontSize: rf(12),
    color: Colors.text.muted,
  },
  empty: {
    padding: ms(32),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: rf(14),
    color: Colors.text.muted,
  },
  errorContainer: {
    padding: ms(20),
    backgroundColor: Colors.ui.error + '10',
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.error + '30',
  },
  errorContent: {
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: rf(32),
    marginBottom: ms(12),
  },
  errorText: {
    fontSize: rf(14),
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: ms(4),
  },
  errorDetail: {
    fontSize: rf(12),
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: ms(12),
  },
  retryButton: {
    paddingHorizontal: ms(20),
    paddingVertical: ms(10),
    backgroundColor: Colors.primary.blue,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: rf(12),
    fontWeight: '600',
    color: Colors.text.white,
  },
});
