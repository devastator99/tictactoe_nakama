import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, BorderRadius} from '../../theme/colors';
import {rf, ms, wp} from '../../utils/responsive';
import Card from '../../components/common/GlassCard';
import {nakamaService} from '../../services/nakama.service';
import type {AnalyticsData} from '../../types';

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await nakamaService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  }, [loadAnalytics]);

  const formatDuration = (durationMs: number) => {
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}m ${remaining}s`;
  };

  const renderStatCard = (
    title: string,
    value: string | number,
    color: string,
  ) => (
    <Card variant="default" style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, {color}]}>{value}</Text>
    </Card>
  );

  if (loading && !analytics) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.blue}
          />
        }
        showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>ANALYTICS</Text>
          <Text style={styles.title}>How the board is being used.</Text>
          <Text style={styles.subtitle}>Track pacing, pressure points, and mode balance across the live game pool.</Text>
        </Card>

        <View style={styles.statsGrid}>
          {renderStatCard('Total Matches', analytics?.totalMatches || 0, Colors.text.primary)}
          {renderStatCard('Active Now', analytics?.activeMatches || 0, Colors.ui.success)}
          {renderStatCard('Avg Duration', formatDuration(analytics?.averageDurationMs || 0), Colors.primary.orange)}
          {renderStatCard('Total Moves', analytics?.totalMoves || 0, Colors.primary.blue)}
        </View>

        <View style={styles.statsGrid}>
          {renderStatCard('Quantum Moves', analytics?.quantumMoves || 0, Colors.primary.purple)}
          {renderStatCard('Suspicious', analytics?.suspiciousMoves || 0, Colors.ui.error)}
          {renderStatCard('Shadow Bans', analytics?.shadowBans || 0, Colors.primary.orange)}
        </View>

        <Card variant="elevated" style={styles.heatmapCard}>
          <Text style={styles.sectionEyebrow}>CELL HEAT</Text>
          <Text style={styles.sectionTitle}>Board interactions</Text>
          <View style={styles.heatmapGrid}>
            {analytics?.cellClicks?.map((clicks, index) => {
              const maxClicks = Math.max(...(analytics?.cellClicks || [1]), 1);
              const intensity = clicks / maxClicks;
              const backgroundColor = `rgba(77, 141, 255, ${0.1 + intensity * 0.65})`;
              return (
                <View
                  key={index}
                  style={[styles.heatmapCell, {backgroundColor}]}>
                  <Text style={styles.heatmapIndex}>{index + 1}</Text>
                  <Text style={styles.heatmapCellText}>{clicks}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card variant="elevated" style={styles.modeCard}>
          <Text style={styles.sectionEyebrow}>MODE SPLIT</Text>
          <Text style={styles.sectionTitle}>Distribution</Text>
          {Object.entries(analytics?.modeCounts || {}).map(([mode, count]) => {
            const total = Object.values(analytics?.modeCounts || {}).reduce((sum, value) => sum + value, 0);
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <View key={mode} style={styles.modeRow}>
                <Text style={styles.modeName}>
                  {mode.replace('vs_ai_', 'AI ')}
                </Text>
                <View style={styles.modeBar}>
                  <View
                    style={[
                      styles.modeBarFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor:
                          mode === 'classic'
                            ? Colors.primary.blue
                            : mode === 'timed'
                            ? Colors.primary.orange
                            : Colors.primary.purple,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.modeCount}>{count}</Text>
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    padding: ms(20),
    gap: ms(16),
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: rf(14),
    color: Colors.text.muted,
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
  statsGrid: {
    flexDirection: 'row',
    gap: ms(12),
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
  },
  statTitle: {
    fontSize: rf(11),
    color: Colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: ms(8),
    fontWeight: '700',
  },
  statValue: {
    fontSize: rf(24),
    fontWeight: '700',
  },
  heatmapCard: {
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
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
  },
  heatmapCell: {
    width: (wp(100) - ms(20) * 2 - ms(8) * 2) / 3,
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapIndex: {
    fontSize: rf(11),
    fontWeight: '700',
    color: Colors.text.white,
    opacity: 0.75,
    marginBottom: ms(4),
  },
  heatmapCellText: {
    fontSize: rf(16),
    fontWeight: '700',
    color: Colors.text.white,
  },
  modeCard: {
    width: '100%',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    marginBottom: ms(12),
  },
  modeName: {
    width: 82,
    fontSize: rf(12),
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  modeBar: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 999,
    overflow: 'hidden',
  },
  modeBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  modeCount: {
    width: 30,
    fontSize: rf(12),
    color: Colors.text.muted,
    textAlign: 'right',
  },
});
