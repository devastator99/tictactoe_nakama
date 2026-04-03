import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, BorderRadius} from '../../theme/colors';
import {rf, ms} from '../../utils/responsive';
import Card from '../../components/common/GlassCard';
import {useLeaderboardStore} from '../../store';
import {nakamaService} from '../../services/nakama.service';
import type {LeaderboardEntry} from '../../types';

export default function LeaderboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const {entries, playerStats, setEntries, setPlayerStats, setLoading} = useLeaderboardStore();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [leaderboard, stats] = await Promise.all([
        nakamaService.getLeaderboard(20),
        nakamaService.getPlayerStats(),
      ]);
      setEntries(leaderboard);
      setPlayerStats(stats);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [setEntries, setPlayerStats, setLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const renderEntry = ({item}: {item: LeaderboardEntry}) => (
    <Card variant="default" style={styles.entryCard}>
      <View style={styles.entryRow}>
        <View style={styles.rankWrap}>
          <Text style={styles.rank}>#{item.rank}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.games}>{item.totalGames} total games</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.wins}>{item.wins} wins</Text>
          <Text style={styles.streak}>{item.winStreak} streak</Text>
        </View>
      </View>
    </Card>
  );

  const renderMyStats = () => {
    if (!playerStats) return null;
    return (
      <Card variant="elevated" style={styles.myStatsCard}>
        <Text style={styles.sectionEyebrow}>YOUR SNAPSHOT</Text>
        <Text style={styles.sectionTitle}>Personal stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: Colors.ui.success}]}>
              {playerStats.wins}
            </Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: Colors.ui.error}]}>
              {playerStats.losses}
            </Text>
            <Text style={styles.statLabel}>Losses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: Colors.primary.orange}]}>
              {playerStats.draws}
            </Text>
            <Text style={styles.statLabel}>Draws</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: Colors.primary.blue}]}>
              {playerStats.bestStreak}
            </Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={item => item.userId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Card variant="elevated" style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>LEADERBOARD</Text>
              <Text style={styles.title}>Top players, softly ranked.</Text>
              <Text style={styles.subtitle}>Refresh the ladder and compare your streaks without losing the premium board feel.</Text>
            </Card>
            {renderMyStats()}
          </View>
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
    gap: ms(14),
  },
  header: {
    gap: ms(18),
    marginBottom: ms(4),
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
    lineHeight: rf(21),
  },
  myStatsCard: {
    width: '100%',
  },
  sectionEyebrow: {
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.text.muted,
    marginBottom: ms(8),
  },
  sectionTitle: {
    fontSize: rf(22),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: ms(16),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: rf(24),
    fontWeight: '700',
  },
  statLabel: {
    fontSize: rf(11),
    color: Colors.text.muted,
    marginTop: ms(4),
  },
  entryCard: {
    width: '100%',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
  },
  rankWrap: {
    width: ms(52),
    height: ms(52),
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontSize: rf(16),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    fontSize: rf(16),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  games: {
    fontSize: rf(12),
    color: Colors.text.muted,
    marginTop: ms(4),
  },
  stats: {
    alignItems: 'flex-end',
    gap: ms(4),
  },
  wins: {
    fontSize: rf(14),
    fontWeight: '700',
    color: Colors.ui.success,
  },
  streak: {
    fontSize: rf(12),
    color: Colors.text.secondary,
  },
});
