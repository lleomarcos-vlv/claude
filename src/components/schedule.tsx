import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { toISODate, WEEKDAYS_SHORT } from '../utils/dates';

export function DayStrip(props: {
  days: Date[];
  selected: string;
  onSelect: (iso: string) => void;
  openDays: number[];
  /** Dias (ISO) que devem exibir um pontinho de aviso (ex.: pendências). */
  badges?: Set<string>;
}) {
  const { days, selected, onSelect, openDays, badges } = props;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dayStrip}
    >
      {days.map((day) => {
        const iso = toISODate(day);
        const isOpen = openDays.includes(day.getDay());
        const isSelected = iso === selected;
        return (
          <Pressable
            key={iso}
            testID={`day-${iso}`}
            disabled={!isOpen}
            onPress={() => onSelect(iso)}
            style={[
              styles.dayChip,
              isSelected && styles.dayChipSelected,
              !isOpen && styles.dayChipClosed,
            ]}
          >
            <Text
              style={[
                styles.dayChipWeekday,
                isSelected && { color: colors.onGold },
              ]}
            >
              {WEEKDAYS_SHORT[day.getDay()]}
            </Text>
            <Text
              style={[
                styles.dayChipNumber,
                isSelected && { color: colors.onGold },
                !isOpen && { color: colors.textDim },
              ]}
            >
              {day.getDate()}
            </Text>
            {!isOpen ? (
              <Text style={styles.dayChipClosedLabel}>fechado</Text>
            ) : badges?.has(iso) ? (
              <View style={styles.dayChipBadge} />
            ) : (
              <View style={{ height: 6 }} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export type SlotState = 'free' | 'taken' | 'past' | 'selected' | 'mine';

export function SlotGrid(props: {
  slots: string[];
  stateOf: (time: string) => SlotState;
  onSelect: (time: string) => void;
}) {
  const { slots, stateOf, onSelect } = props;
  return (
    <View style={styles.slotGrid}>
      {slots.map((time) => {
        const state = stateOf(time);
        const disabled = state === 'taken' || state === 'past' || state === 'mine';
        return (
          <Pressable
            key={time}
            testID={`slot-${time}`}
            disabled={disabled}
            onPress={() => onSelect(time)}
            style={[
              styles.slot,
              state === 'selected' && styles.slotSelected,
              state === 'taken' && styles.slotTaken,
              state === 'mine' && styles.slotMine,
              state === 'past' && styles.slotPast,
            ]}
          >
            <Text
              style={[
                styles.slotText,
                state === 'selected' && { color: colors.onGold, fontWeight: '700' },
                (state === 'taken' || state === 'past') && {
                  color: colors.textDim,
                  textDecorationLine: 'line-through',
                },
                state === 'mine' && { color: colors.green, fontWeight: '700' },
              ]}
            >
              {time}
            </Text>
            {state === 'mine' && <Text style={styles.slotMineLabel}>seu horário</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dayStrip: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dayChip: {
    width: 62,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 2,
  },
  dayChipSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  dayChipClosed: {
    opacity: 0.45,
  },
  dayChipWeekday: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  dayChipNumber: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  dayChipClosedLabel: {
    color: colors.textDim,
    fontSize: 9,
  },
  dayChipBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.amber,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slot: {
    minWidth: 76,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  slotSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  slotTaken: {
    backgroundColor: colors.cardAlt,
    opacity: 0.55,
  },
  slotMine: {
    borderColor: colors.green,
    backgroundColor: colors.greenBg,
  },
  slotPast: {
    opacity: 0.35,
  },
  slotText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  slotMineLabel: {
    color: colors.green,
    fontSize: 9,
    marginTop: 2,
  },
});
