import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Colors} from '../../theme/colors';

interface SymbolProps {
  size?: number;
}

interface FullSymbolProps {
  type: 'X' | 'O';
  size?: number;
}

export function XSymbol({size = 48}: SymbolProps) {
  const lineWidth = Math.max(10, size * 0.16);
  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <View
        style={[
          styles.xLine,
          styles.xLineLeft,
          {
            width: size * 0.84,
            height: lineWidth,
            borderRadius: lineWidth / 2,
            backgroundColor: Colors.player.x,
            shadowColor: Colors.player.x,
          },
        ]}
      />
      <View
        style={[
          styles.xLine,
          styles.xLineRight,
          {
            width: size * 0.84,
            height: lineWidth,
            borderRadius: lineWidth / 2,
            backgroundColor: Colors.player.x,
            shadowColor: Colors.player.x,
          },
        ]}
      />
      <View
        style={[
          styles.xHighlight,
          styles.xLineLeft,
          {
            width: size * 0.74,
            height: Math.max(3, lineWidth * 0.32),
            borderRadius: lineWidth / 2,
          },
        ]}
      />
      <View
        style={[
          styles.xHighlight,
          styles.xLineRight,
          {
            width: size * 0.74,
            height: Math.max(3, lineWidth * 0.32),
            borderRadius: lineWidth / 2,
          },
        ]}
      />
    </View>
  );
}

export function OSymbol({size = 48}: SymbolProps) {
  const ringWidth = Math.max(10, size * 0.16);
  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <View
        style={[
          styles.oRing,
          {
            width: size * 0.82,
            height: size * 0.82,
            borderRadius: size,
            borderWidth: ringWidth,
            borderColor: Colors.player.o,
            shadowColor: Colors.player.o,
          },
        ]}
      />
      <View
        style={[
          styles.oHighlight,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: size,
            borderWidth: Math.max(3, ringWidth * 0.24),
          },
        ]}
      />
    </View>
  );
}

export default function Symbol({type, size = 48}: FullSymbolProps) {
  if (type === 'X') return <XSymbol size={size} />;
  return <OSymbol size={size} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  xLine: {
    position: 'absolute',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  xLineLeft: {
    transform: [{rotate: '45deg'}],
  },
  xLineRight: {
    transform: [{rotate: '-45deg'}],
  },
  xHighlight: {
    position: 'absolute',
    backgroundColor: Colors.player.xLight,
    opacity: 0.7,
  },
  oRing: {
    position: 'absolute',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 6,
  },
  oHighlight: {
    position: 'absolute',
    borderColor: Colors.player.oLight,
    opacity: 0.65,
    top: '15%',
    left: '15%',
  },
});
