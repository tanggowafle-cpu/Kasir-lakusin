import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Transaction } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';

const METODE_LABEL: Record<string, string> = {
  tunai: 'Tunai',
  transfer: 'Transfer',
  qris: 'QRIS',
  hutang: 'Hutang',
};

const METODE_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  tunai: 'dollar-sign',
  transfer: 'credit-card',
  qris: 'grid',
  hutang: 'users',
};

interface Props {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionCard({ transaction, onPress }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
        <Feather name={METODE_ICON[transaction.metodePembayaran] ?? 'shopping-bag'} size={20} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.total, { color: colors.text }]}>{formatCurrency(transaction.total)}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {METODE_LABEL[transaction.metodePembayaran]} · {transaction.items.length} item
        </Text>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{formatDateTime(transaction.createdAt)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.profit, { color: colors.success }]}>+{formatCurrency(transaction.keuntungan)}</Text>
        {transaction.metodePembayaran === 'hutang' && (
          <View style={[styles.badge, { backgroundColor: colors.warningBg }]}>
            <Text style={[styles.badgeText, { color: colors.warning }]}>Hutang</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  total: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 12 },
  time: { fontSize: 11 },
  right: { alignItems: 'flex-end', gap: 4 },
  profit: { fontSize: 13, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '600' },
});
