import 'react-native-gesture-handler';
import React, {useEffect} from 'react';
import {StatusBar, LogBox} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator, BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {Colors} from './src/theme/colors';
import {useAuthStore} from './src/store';
import {nakamaService} from './src/services/nakama.service';

import LoginScreen from './src/screens/auth/LoginScreen';
import LobbyScreen from './src/screens/lobby/LobbyScreen';
import GameScreen from './src/screens/game/GameScreen';
import LeaderboardScreen from './src/screens/leaderboard/LeaderboardScreen';
import ReplayScreen from './src/screens/replay/ReplayScreen';
import AnalyticsScreen from './src/screens/analytics/AnalyticsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import TabBar from './src/components/common/TabBar';
import StatusScreen from './src/components/common/StatusScreen';

LogBox.ignoreLogs(['Non-serializable values']);

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Game: {matchId: string};
  Replay: {matchId?: string};
};

export type TabParamList = {
  Lobby: undefined;
  Leaderboard: undefined;
  Analytics: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const appRootStyle = {flex: 1} as const;
const stackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right' as const,
  contentStyle: {backgroundColor: Colors.background.primary},
};

function renderTabBar(props: BottomTabBarProps) {
  return <TabBar {...props} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Lobby" component={LobbyScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  const {user, login} = useAuthStore();
  const [isRestoring, setIsRestoring] = React.useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = nakamaService.restoreSession();
        if (session) {
          const refreshed = await nakamaService.refreshSession();
          if (refreshed) {
            login({
              userId: refreshed.user_id || '',
              username: refreshed.username || 'Player',
              token: refreshed.token,
            });
          }
        }
      } catch (error) {
        console.error('Session restore failed:', error);
        nakamaService.clearSession();
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, [login]);

  if (isRestoring) {
    return (
      <StatusScreen
        title="Restoring Session"
        message="Checking for existing login..."
        isLoading
      />
    );
  }

  return (
    <GestureHandlerRootView style={appRootStyle}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={Colors.background.primary}
            translucent={false}
          />
          <Stack.Navigator screenOptions={stackScreenOptions}>
            {user ? (
              <>
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen
                  name="Game"
                  component={GameScreen}
                  options={{animation: 'fade'}}
                />
                <Stack.Screen
                  name="Replay"
                  component={ReplayScreen}
                  options={{animation: 'slide_from_bottom'}}
                />
              </>
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
