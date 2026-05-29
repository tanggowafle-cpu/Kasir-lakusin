import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/format';

interface Props {
  product: Product;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  selectable?: boolean;
  selected?: boolean;
}

export function ProductCard({ product, onPress, onEdit, onDelete, showActions, selectable, selected }: Props) {
  const colors = useColors();
  const lowStock = product.stok <= product.stokMinimum;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.secondary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderRadius: colors.radius,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.left}>
        {product.foto ? (
          <Image source={{ uri: product.foto }} style={[styles.foto, { borderRadius: 8 }]} />
        ) : (
          <View style={[styles.fotoPlaceholder, { backgroundColor: colors.muted, borderRadius: 8 }]}>
            <Feather name="box" size={18} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.nama, { color: colors.text }]} numberOfLines={1}>{product.nama}</Text>
          <Text style={[styles.kategori, { color: colors.mutedForeground }]}>{product.kategori}</Text>
          <View style={styles.row}>
            <Text style={[styles.harga, { color: colors.primary }]}>{formatCurrency(product.hargaJual)}</Text>
            <View style={[styles.stokBadge, { backgroundColor: lowStock ? colors.errorBg : colors.muted }]}>
              <Text style={[styles.stokText, { color: lowStock ? colors.destructive : colors.mutedForeground }]}>
                Stok: {product.stok}
              </Text>
            </View>
          </View>
        </View>
      </View>
      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={[styles.actionBtn, { backgroundColor: colors.secondary }]}>
              <Feather name="edit-2" size={15} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, { backgroundColor: colors.errorBg }]}>
              <Feather name="trash-2" size={15} color={colors.destructive} />
            </TouchableOpacity>
          )}
        </View>
      )}
      {selectable && (
        <View style={[styles.checkCircle, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' }]}>
          {selected && <Feather name="check" size={12} color="#fff" />}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  foto: { width: 44, height: 44, resizeMode: 'cover' },
  fotoPlaceholder: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  nama: { fontSize: 15, fontWeight: '600' },
  kategori: { fontSize: 12 },
  harga: { fontSize: 14, fontWeight: '700' },
  stokBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  stokText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8, borderRadius: 8 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
