import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../../theme/colors';
import {rf, ms} from '../../utils/responsive';

interface TimerRingProps {
  timeLeft: string;
  isLowTime: boolean;
  isActive: boolean;
}

export default function TimerRing({timeLeft, isLowTime, isActive}: TimerRingProps) {
  const [minutes, seconds] = timeLeft.split(':').map(Number);
  const totalSeconds = (minutes || 0) * 60 + (seconds || 0);
  const progress = Math.max(0, (30 - totalSeconds) / 30);

  const getColor = () => {
    if (isLowTime) return Colors.border.error;
    if (isActive) return Colors.primary.cyan;
    return Colors.primary.purple;
  };

  const color = getColor();

  return (
    <View style={styles.container}>
      <View style={styles.ringContainer}>
        <View style={[styles.backgroundRing, {borderColor: Colors.background.tertiary}]} />
        <View
          style={[
            styles.progressRing,
            {
              borderColor: color,
              transform: [{rotate: `${progress * 360 - 90}deg`}],
            },
          ]}
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.timeText, {color}]}>{timeLeft}</Text>
      </View>

      {isLowTime && <View style={[styles.lowTimeGlow, {shadowColor: Colors.border.error}]} />}
    </View>
  );
}

const SIZE = ms(80);
const STROKE_WIDTH = ms(6);

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
  },
  backgroundRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
    borderWidth: STROKE_WIDTH,
    opacity: 0.3,
  },
  progressRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
    borderWidth: STROKE_WIDTH,
    borderTopColor: 'transparent',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: rf(18),
    fontWeight: 'bold',
  },
  lowTimeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
});
