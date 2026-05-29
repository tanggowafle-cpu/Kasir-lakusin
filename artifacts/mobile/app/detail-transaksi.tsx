import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { MetodePembayaran } from "@/types";

const METODE_LABEL: Record<MetodePembayaran, string> = {
  tunai: "Tunai", transfer: "Transfer Bank", qris: "QRIS", hutang: "Hutang",
};

export default function DetailTransaksiScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions } = useStore();

  const tx = transactions.find((t) => t.id === id);
  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;

  if (!tx) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Transaksi tidak ditemukan</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + topPaddingWeb + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detail Transaksi</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.total, { color: colors.primary }]}>{formatCurrency(tx.total)}</Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDateTime(tx.createdAt)}</Text>
          <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{METODE_LABEL[tx.metodePembayaran]}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Item Pembelian</Text>
          {tx.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemNama, { color: colors.text }]}>{item.nama}</Text>
                <Text style={[styles.itemQty, { color: colors.mutedForeground }]}>{item.jumlah} x {formatCurrency(item.hargaJual)}</Text>
              </View>
              <Text style={[styles.itemSubtotal, { color: colors.text }]}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalVal, { color: colors.primary }]}>{formatCurrency(tx.total)}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informasi Transaksi</Text>
          {[
            { label: "Metode Bayar", value: METODE_LABEL[tx.metodePembayaran] },
            tx.namaBank ? { label: "Bank", value: tx.namaBank } : null,
            tx.namaPelanggan ? { label: "Pelanggan", value: tx.namaPelanggan } : null,
            tx.jumlahBayar ? { label: "Dibayar", value: formatCurrency(tx.jumlahBayar) } : null,
            tx.kembalian ? { label: "Kembalian", value: formatCurrency(tx.kembalian) } : null,
            { label: "Modal", value: formatCurrency(tx.modal) },
            { label: "Keuntungan", value: formatCurrency(tx.keuntungan) },
            { label: "Kasir", value: tx.namaKasir },
          ].filter(Boolean).map((row, i) => (
            <View key={i} style={[styles.infoRow, { borderTopColor: colors.border, borderTopWidth: i === 0 ? 0 : 1 }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row!.label}</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>{row!.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { padding: 16, gap: 12 },
  card: { padding: 16, borderWidth: 1, gap: 8 },
  total: { fontSize: 32, fontWeight: "800" },
  date: { fontSize: 13 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  itemNama: { fontSize: 14, fontWeight: "600" },
  itemQty: { fontSize: 12 },
  itemSubtotal: { fontSize: 14, fontWeight: "600" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, marginTop: 4, borderTopWidth: 1 },
  totalLabel: { fontSize: 15, fontWeight: "700" },
  totalVal: { fontSize: 18, fontWeight: "800" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10 },
  infoLabel: { fontSize: 13 },
  infoVal: { fontSize: 13, fontWeight: "600" },
});
