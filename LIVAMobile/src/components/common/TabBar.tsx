import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {Colors, Shadows, BorderRadius} from '../../theme/colors';
import {rf, ms} from '../../utils/responsive';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

const tabIcons: Record<string, string> = {
  Lobby: 'XO',
  Leaderboard: '1',
  Analytics: 'A',
  Settings: 'S',
};

export default function TabBar({state, descriptors, navigation}: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabActive]}
              activeOpacity={0.82}>
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Text
                  style={[
                    styles.icon,
                    isFocused && styles.iconActive,
                  ]}>
                  {tabIcons[route.name] || '•'}
                </Text>
              </View>
              <Text
                style={[
                  styles.label,
                  isFocused && styles.labelActive,
                ]}>
                {typeof label === 'string' ? label : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: ms(18),
    paddingTop: ms(8),
    paddingBottom: ms(14),
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    paddingHorizontal: ms(10),
    paddingVertical: ms(10),
    ...Shadows.medium,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(6),
    gap: ms(6),
  },
  tabActive: {
    transform: [{translateY: -1}],
  },
  iconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(77, 141, 255, 0.12)',
  },
  icon: {
    fontSize: rf(13),
    fontWeight: '700',
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
  iconActive: {
    color: Colors.primary.blue,
  },
  label: {
    fontSize: rf(10),
    fontWeight: '600',
    color: Colors.text.muted,
  },
  labelActive: {
    color: Colors.text.primary,
  },
});
