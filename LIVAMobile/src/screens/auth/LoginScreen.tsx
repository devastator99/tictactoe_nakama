import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, BorderRadius} from '../../theme/colors';
import {rf, responsiveSpacing, hp, ms} from '../../utils/responsive';
import Button from '../../components/common/Button';
import Card from '../../components/common/GlassCard';
import {XSymbol, OSymbol} from '../../components/game/Symbol';
import {useAuthStore} from '../../store';
import {useNakama} from '../../hooks/useNakama';

export default function LoginScreen({navigation}: any) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {setLoading} = useAuthStore();
  const {authenticate} = useNakama();

  const handleLogin = async () => {
    if (!username.trim()) return;
    setIsLoading(true);
    setLoading(true);
    try {
      await authenticate(username.trim());
      navigation.replace('Main');
    } catch {
      // Error handled in hook
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setLoading(true);
    try {
      await authenticate();
      navigation.replace('Main');
    } catch {
      // Error handled in hook
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      <View style={styles.topBlobBlue} />
      <View style={styles.topBlobOrange} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.iconContainer}>
              <XSymbol size={ms(78)} />
              <OSymbol size={ms(78)} />
            </View>
            <Text style={styles.title}>Tic Tac Toe</Text>
            <Text style={styles.subtitle}>A softer multiplayer board with the same live gameplay underneath.</Text>
          </View>

          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardEyebrow}>PLAYER NAME</Text>
            <Text style={styles.cardTitle}>Enter your name</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Nickname"
              placeholderTextColor={Colors.text.muted}
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              title="CONTINUE"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading || !username.trim()}
              style={styles.continueButton}
            />

            <Button
              title="Play as Guest"
              onPress={handleGuestLogin}
              variant="secondary"
              size="md"
              loading={isLoading}
              disabled={isLoading}
              style={styles.guestButton}
            />
          </Card>

          <View style={styles.footerPills}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Version 1.0.0</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Realtime</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Private Rooms</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: responsiveSpacing.xl,
    paddingVertical: hp(8),
  },
  topBlobBlue: {
    position: 'absolute',
    top: -ms(60),
    right: -ms(40),
    width: ms(180),
    height: ms(180),
    borderRadius: ms(90),
    backgroundColor: Colors.background.blobBlue,
  },
  topBlobOrange: {
    position: 'absolute',
    bottom: ms(80),
    left: -ms(50),
    width: ms(160),
    height: ms(160),
    borderRadius: ms(80),
    backgroundColor: Colors.background.blobOrange,
  },
  hero: {
    alignItems: 'center',
    marginBottom: ms(28),
  },
  iconContainer: {
    flexDirection: 'row',
    gap: ms(18),
    marginBottom: ms(22),
  },
  title: {
    fontSize: rf(34),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: ms(8),
  },
  subtitle: {
    fontSize: rf(14),
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: rf(21),
    maxWidth: 300,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  cardEyebrow: {
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.text.muted,
    marginBottom: ms(10),
  },
  cardTitle: {
    fontSize: rf(24),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: ms(18),
  },
  input: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: BorderRadius.xl,
    paddingVertical: ms(15),
    paddingHorizontal: ms(16),
    fontSize: rf(16),
    color: Colors.text.primary,
    marginBottom: ms(16),
  },
  continueButton: {
    width: '100%',
    marginBottom: ms(12),
  },
  guestButton: {
    width: '100%',
  },
  footerPills: {
    marginTop: ms(22),
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: ms(10),
  },
  pill: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(8),
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  pillText: {
    fontSize: rf(11),
    fontWeight: '600',
    color: Colors.text.secondary,
  },
});
