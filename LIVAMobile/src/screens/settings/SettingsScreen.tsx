import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors} from '../../theme/colors';
import {rf, ms} from '../../utils/responsive';
import Card from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import {useAuthStore, useSettingsStore} from '../../store';
import {useNakama} from '../../hooks/useNakama';

export default function SettingsScreen({navigation}: any) {
  const {user} = useAuthStore();
  const {
    soundEnabled,
    hapticsEnabled,
    voiceEnabled,
    setSoundEnabled,
    setHapticsEnabled,
    setVoiceEnabled,
  } = useSettingsStore();
  const {logout} = useNakama();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({index: 0, routes: [{name: 'Login'}]});
        },
      },
    ]);
  };

  const renderSettingRow = (
    label: string,
    value: boolean,
    onToggle: (value: boolean) => void,
  ) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{false: Colors.border.default, true: 'rgba(77, 141, 255, 0.34)'}}
        thumbColor={value ? Colors.primary.blue : Colors.text.white}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>SETTINGS</Text>
          <Text style={styles.title}>Tune the feel.</Text>
          <Text style={styles.subtitle}>Control feedback, voice, and the profile details tied to your current session.</Text>
        </Card>

        {user && (
          <Card variant="elevated" style={styles.section}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user.username}</Text>
                <Text style={styles.profileId}>ID: {user.userId.slice(0, 8)}...</Text>
              </View>
            </View>
          </Card>
        )}

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionEyebrow}>PREFERENCES</Text>
          <Text style={styles.sectionTitle}>Immersion</Text>
          {renderSettingRow('Sound Effects', soundEnabled, setSoundEnabled)}
          {renderSettingRow('Haptic Feedback', hapticsEnabled, setHapticsEnabled)}
          {renderSettingRow('Voice Chat', voiceEnabled, setVoiceEnabled)}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionEyebrow}>ABOUT</Text>
          <Text style={styles.sectionTitle}>Product</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Engine</Text>
            <Text style={styles.aboutValue}>React Native CLI</Text>
          </View>
        </Card>

        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          size="lg"
          style={styles.logoutButton}
        />
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
    gap: ms(18),
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
  section: {
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
    marginBottom: ms(14),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(16),
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: rf(24),
    fontWeight: '700',
    color: Colors.text.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: rf(18),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  profileId: {
    fontSize: rf(12),
    color: Colors.text.muted,
    marginTop: ms(4),
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingLabel: {
    fontSize: rf(14),
    color: Colors.text.primary,
    fontWeight: '600',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  aboutLabel: {
    fontSize: rf(13),
    color: Colors.text.secondary,
  },
  aboutValue: {
    fontSize: rf(13),
    color: Colors.text.primary,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: ms(4),
    borderColor: Colors.ui.error,
  },
});
