import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Feather.glyphMap;
  iconBg?: string;
  iconColor?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export function StatsCard({ title, value, subtitle, icon, iconBg, iconColor, style, onPress }: Props) {
  const colors = useColors();

  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: iconBg ?? colors.secondary }]}>
        <Feather name={icon} size={20} color={iconColor ?? colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.mutedForeground }]}>{title}</Text>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>}
      {onPress && (
        <View style={styles.tapHint}>
          <Feather name="chevron-right" size={12} color={colors.mutedForeground} />
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }, style]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    gap: 6,
    minWidth: 140,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  title: { fontSize: 12, fontWeight: '500' },
  value: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 11 },
  tapHint: { position: 'absolute', top: 12, right: 12 },
});
