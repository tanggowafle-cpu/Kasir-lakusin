import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function SimpleBarChart({ data, labels, color, height = 160, formatValue }: Props) {
  const colors = useColors();
  const barColor = color ?? colors.primary;
  const maxVal = Math.max(...data, 1);

  return (
    <View style={styles.container}>
      <View style={[styles.chart, { height }]}>
        {data.map((val, i) => {
          const barH = Math.max(4, (val / maxVal) * (height - 30));
          return (
            <View key={i} style={styles.barWrap}>
              {val > 0 && (
                <Text style={[styles.valLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {formatValue ? formatValue(val) : val.toString()}
                </Text>
              )}
              <View style={[styles.barBg, { height: height - 24, justifyContent: 'flex-end' }]}>
                <View style={[styles.bar, { height: barH, backgroundColor: barColor, borderRadius: 4 }]} />
              </View>
              <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>{labels[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barWrap: { flex: 1, alignItems: 'center', gap: 2 },
  barBg: { width: '100%' },
  bar: { width: '100%' },
  label: { fontSize: 9, textAlign: 'center' },
  valLabel: { fontSize: 8, textAlign: 'center' },
});
