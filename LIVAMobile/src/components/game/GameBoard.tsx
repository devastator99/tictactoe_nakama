import React, {useMemo} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {Colors, BorderRadius, Shadows} from '../../theme/colors';
import {wp, ms} from '../../utils/responsive';
import Symbol from './Symbol';
import type {CellValue} from '../../types';

interface GameBoardProps {
  board: CellValue[];
  onCellClick: (position: number) => void;
  disabled: boolean;
  winLine?: number[] | null;
  selectedCells?: number[];
  isQuantumArmed?: boolean;
}

function Cell({
  value,
  onPress,
  disabled,
  isWinning,
  isSelected,
  isQuantumArmed,
}: {
  value: CellValue;
  onPress: () => void;
  disabled: boolean;
  isWinning: boolean;
  isSelected: boolean;
  isQuantumArmed: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.cell,
        isWinning && styles.cellWinning,
        isSelected && styles.cellSelected,
        isQuantumArmed && !value && styles.cellQuantumArmed,
        disabled && !value && styles.cellDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || value !== null}
      activeOpacity={0.86}>
      <View style={styles.cellContent}>
        {value && <Symbol type={value} size={CELL_SIZE * 0.5} />}
      </View>
    </TouchableOpacity>
  );
}

export default function GameBoard({
  board,
  onCellClick,
  disabled,
  winLine,
  selectedCells = [],
  isQuantumArmed = false,
}: GameBoardProps) {
  const cells = useMemo(
    () =>
      board.map((cell, index) => ({
        value: cell,
        index,
        isWinning: winLine?.includes(index) ?? false,
        isSelected: selectedCells.includes(index),
      })),
    [board, winLine, selectedCells],
  );

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {cells.map(({value, index, isWinning, isSelected}) => (
          <Cell
            key={index}
            value={value}
            onPress={() => onCellClick(index)}
            disabled={disabled}
            isWinning={isWinning}
            isSelected={isSelected}
            isQuantumArmed={isQuantumArmed}
          />
        ))}
      </View>
    </View>
  );
}

const CELL_SIZE = Math.min(wp(25), ms(96));

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: CELL_SIZE * 3 + ms(14) * 2 + ms(10) * 2,
    gap: ms(10),
    padding: ms(18),
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.large,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.small,
  },
  cellWinning: {
    borderColor: 'rgba(53, 178, 126, 0.32)',
    backgroundColor: 'rgba(53, 178, 126, 0.08)',
  },
  cellSelected: {
    borderColor: 'rgba(255, 162, 74, 0.34)',
    backgroundColor: 'rgba(255, 162, 74, 0.10)',
    borderWidth: 2,
  },
  cellQuantumArmed: {
    borderColor: 'rgba(77, 141, 255, 0.24)',
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  cellDisabled: {
    opacity: 0.75,
  },
  cellContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
