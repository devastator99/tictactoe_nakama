import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, BorderRadius} from '../../theme/colors';
import {rf, responsiveSpacing, ms} from '../../utils/responsive';
import Button from '../../components/common/Button';
import Card from '../../components/common/GlassCard';
import {XSymbol, OSymbol} from '../../components/game/Symbol';
import {useAuthStore} from '../../store';
import {useNakama} from '../../hooks/useNakama';
import type {GameMode} from '../../types';

type PlayMode = 'ai' | 'friend';

export default function LobbyScreen({navigation}: any) {
  const [playMode, setPlayMode] = useState<PlayMode | null>(null);
  const [selectedSide, setSelectedSide] = useState<'X' | 'O' | null>(null);
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const [privateCode, setPrivateCode] = useState('');
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);
  const [isJoiningPrivate, setIsJoiningPrivate] = useState(false);

  const {user} = useAuthStore();
  const {connect, findMatch, createPrivateMatch, joinPrivateMatch, onMatchmakerMatched, isConnected} = useNakama();

  useEffect(() => {
    if (!isConnected) {
      connect().catch(console.error);
    }
  }, [connect, isConnected]);

  useEffect(() => {
    const handleMatched = (matchId: string) => {
      setIsFindingMatch(false);
      navigation.navigate('Game', {matchId});
    };
    onMatchmakerMatched(handleMatched);
  }, [navigation, onMatchmakerMatched]);

  const handleStartGame = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }

    setIsFindingMatch(true);
    try {
      if (playMode === 'ai') {
        const mode: GameMode = selectedSide === 'O' ? 'vs_ai_medium' : 'vs_ai_medium';
        const result = await createPrivateMatch(mode);
        navigation.navigate('Game', {matchId: result.matchId});
      } else {
        const result = await findMatch('classic');
        if (result.direct && result.matchId) {
          navigation.navigate('Game', {matchId: result.matchId});
        }
      }
    } catch {
      setIsFindingMatch(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!privateCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }
    setIsJoiningPrivate(true);
    try {
      const matchId = await joinPrivateMatch(privateCode.trim().toUpperCase());
      setPrivateCode('');
      navigation.navigate('Game', {matchId});
    } catch {
      setIsJoiningPrivate(false);
    }
  };

  const handleBack = () => {
    setPlayMode(null);
    setSelectedSide(null);
  };

  const renderHeader = (title: string, subtitle: string, showBack = false) => (
    <View style={styles.header}>
      {showBack && (
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      )}
      <View style={styles.logoContainer}>
        <XSymbol size={ms(54)} />
        <OSymbol size={ms(54)} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );

  if (!playMode) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.blobBlue} />
        <View style={styles.blobOrange} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderHeader('Choose your play mode', `Hi ${user?.username || 'Player'}, pick a clean way into the board.`)}

          <Card variant="elevated" style={styles.modeCard}>
            <Button
              title="WITH AI"
              onPress={() => setPlayMode('ai')}
              variant="primary"
              size="lg"
              style={styles.fullButton}
            />
            <Button
              title="WITH A FRIEND"
              onPress={() => setPlayMode('friend')}
              variant="secondary"
              size="lg"
              style={styles.fullButton}
            />
          </Card>

          <Card variant="default" style={styles.joinCard}>
            <Text style={styles.sectionEyebrow}>PRIVATE ROOM</Text>
            <Text style={styles.sectionTitle}>Join with a code</Text>
            <View style={styles.joinRow}>
              <TextInput
                style={styles.codeInput}
                value={privateCode}
                onChangeText={setPrivateCode}
                placeholder="Enter Code"
                placeholderTextColor={Colors.text.muted}
                maxLength={8}
                autoCapitalize="characters"
              />
              <Button
                title="JOIN"
                onPress={handleJoinRoom}
                variant="primary"
                size="md"
                loading={isJoiningPrivate}
                disabled={isJoiningPrivate || !privateCode.trim()}
              />
            </View>
          </Card>

          <View style={styles.connectionPill}>
            <Text style={styles.connectionText}>{isConnected ? 'Connected' : 'Reconnecting...'}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (playMode === 'ai' && !selectedSide) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderHeader('Pick your side', 'Choose the symbol you want to carry into the AI match.', true)}

          <Card variant="elevated" style={styles.sideCard}>
            <View style={styles.sideSelection}>
              <Pressable
                style={[styles.sideOption, selectedSide === 'X' && styles.sideOptionSelected]}
                onPress={() => setSelectedSide('X')}>
                <XSymbol size={ms(70)} />
              </Pressable>

              <Pressable
                style={[styles.sideOption, selectedSide === 'O' && styles.sideOptionSelected]}
                onPress={() => setSelectedSide('O')}>
                <OSymbol size={ms(70)} />
              </Pressable>
            </View>
          </Card>

          <Button
            title="CONTINUE"
            onPress={handleStartGame}
            variant="primary"
            size="lg"
            loading={isFindingMatch}
            disabled={isFindingMatch || !selectedSide}
            style={styles.actionButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderHeader('Play with a friend', 'Go straight to matchmaking or spin up a private room.', true)}

        <Card variant="elevated" style={styles.friendCard}>
          <Button
            title="QUICK MATCH"
            onPress={handleStartGame}
            variant="primary"
            size="lg"
            loading={isFindingMatch}
            disabled={isFindingMatch}
            style={styles.fullButton}
          />

          <Button
            title="CREATE ROOM"
            onPress={async () => {
              setIsCreatingPrivate(true);
              try {
                const result = await createPrivateMatch('classic');
                Alert.alert('Room Created', `Code: ${result.code}`);
                navigation.navigate('Game', {matchId: result.matchId});
              } catch {
                setIsCreatingPrivate(false);
              }
            }}
            variant="secondary"
            size="lg"
            loading={isCreatingPrivate}
            disabled={isCreatingPrivate}
            style={styles.fullButton}
          />
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
    flexGrow: 1,
    padding: responsiveSpacing.xl,
    gap: ms(18),
  },
  blobBlue: {
    position: 'absolute',
    top: -ms(70),
    right: -ms(40),
    width: ms(180),
    height: ms(180),
    borderRadius: ms(90),
    backgroundColor: Colors.background.blobBlue,
  },
  blobOrange: {
    position: 'absolute',
    bottom: ms(60),
    left: -ms(50),
    width: ms(150),
    height: ms(150),
    borderRadius: ms(75),
    backgroundColor: Colors.background.blobOrange,
  },
  header: {
    alignItems: 'center',
    marginBottom: ms(8),
  },
  logoContainer: {
    flexDirection: 'row',
    gap: ms(14),
    marginBottom: ms(18),
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: ms(10),
    paddingHorizontal: ms(12),
    paddingVertical: ms(8),
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  backText: {
    fontSize: rf(12),
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  title: {
    fontSize: rf(30),
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: ms(8),
  },
  subtitle: {
    fontSize: rf(14),
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: rf(21),
    maxWidth: 300,
  },
  modeCard: {
    gap: ms(12),
  },
  fullButton: {
    width: '100%',
  },
  joinCard: {
    width: '100%',
  },
  sectionEyebrow: {
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.text.muted,
    marginBottom: ms(10),
  },
  sectionTitle: {
    fontSize: rf(22),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: ms(16),
  },
  joinRow: {
    gap: ms(12),
  },
  codeInput: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: BorderRadius.xl,
    paddingVertical: ms(14),
    paddingHorizontal: ms(16),
    fontSize: rf(16),
    color: Colors.text.primary,
  },
  connectionPill: {
    alignSelf: 'center',
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  connectionText: {
    fontSize: rf(12),
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  sideCard: {
    width: '100%',
  },
  sideSelection: {
    flexDirection: 'row',
    gap: ms(16),
    justifyContent: 'space-between',
  },
  sideOption: {
    flex: 1,
    minHeight: ms(140),
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideOptionSelected: {
    borderColor: 'rgba(77, 141, 255, 0.24)',
    backgroundColor: 'rgba(77, 141, 255, 0.08)',
  },
  actionButton: {
    width: '100%',
  },
  friendCard: {
    gap: ms(12),
  },
});
