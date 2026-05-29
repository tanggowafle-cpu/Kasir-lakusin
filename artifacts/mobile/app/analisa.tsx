import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency } from "@/utils/format";

export default function AnalisaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, products } = useStore();

  const productStats = useMemo(() => {
    const stats: Record<string, { nama: string; terjual: number; pendapatan: number; keuntungan: number }> = {};
    transactions.forEach((tx) => {
      tx.items.forEach((item) => {
        if (!stats[item.productId]) {
          stats[item.productId] = { nama: item.nama, terjual: 0, pendapatan: 0, keuntungan: 0 };
        }
        stats[item.productId].terjual += item.jumlah;
        stats[item.productId].pendapatan += item.subtotal;
        stats[item.productId].keuntungan += (item.hargaJual - item.hargaBeli) * item.jumlah;
      });
    });
    return Object.values(stats).sort((a, b) => b.terjual - a.terjual);
  }, [transactions]);

  const terlaris = productStats.slice(0, 5);
  const perlahan = [...productStats].sort((a, b) => a.terjual - b.terjual).slice(0, 5);
  const keuntunganTertinggi = [...productStats].sort((a, b) => b.keuntungan - a.keuntungan).slice(0, 5);

  const restokRekomendasi = useMemo(() => {
    return products
      .filter((p) => p.stok <= p.stokMinimum)
      .sort((a, b) => a.stok - b.stok);
  }, [products]);

  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + topPaddingWeb + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analisa Produk</Text>
        <View style={{ width: 22 }} />
      </View>

      {transactions.length === 0 ? (
        <EmptyState icon="pie-chart" title="Belum ada data" description="Data analisa akan muncul setelah ada transaksi" />
      ) : (
        <>
          {/* Produk Terlaris */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Produk Terlaris</Text>
          {terlaris.map((item, i) => (
            <View key={i} style={[styles.rankCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.rankNum, { backgroundColor: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : colors.muted }]}>
                <Text style={[styles.rankNumText, { color: i < 3 ? "#fff" : colors.mutedForeground }]}>#{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rankNama, { color: colors.text }]}>{item.nama}</Text>
                <Text style={[styles.rankMeta, { color: colors.mutedForeground }]}>Terjual {item.terjual} unit · {formatCurrency(item.pendapatan)}</Text>
              </View>
            </View>
          ))}

          {/* Produk Perlahan */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Produk Paling Lambat</Text>
          {perlahan.map((item, i) => (
            <View key={i} style={[styles.rankCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.rankNum, { backgroundColor: colors.muted }]}>
                <Feather name="trending-down" size={14} color={colors.destructive} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rankNama, { color: colors.text }]}>{item.nama}</Text>
                <Text style={[styles.rankMeta, { color: colors.mutedForeground }]}>Terjual {item.terjual} unit saja</Text>
              </View>
            </View>
          ))}

          {/* Keuntungan Tertinggi */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Keuntungan Tertinggi</Text>
          {keuntunganTertinggi.map((item, i) => (
            <View key={i} style={[styles.rankCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.rankNum, { backgroundColor: "#DCFCE7" }]}>
                <Feather name="trending-up" size={14} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rankNama, { color: colors.text }]}>{item.nama}</Text>
                <Text style={[styles.rankMeta, { color: colors.mutedForeground }]}>Terjual {item.terjual} unit</Text>
              </View>
              <Text style={[styles.profit, { color: colors.success }]}>{formatCurrency(item.keuntungan)}</Text>
            </View>
          ))}

          {/* Rekomendasi Restok */}
          {restokRekomendasi.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Perlu Restok Segera</Text>
              {restokRekomendasi.map((p) => (
                <View key={p.id} style={[styles.rankCard, { backgroundColor: colors.errorBg, borderColor: colors.destructive, borderRadius: colors.radius }]}>
                  <View style={[styles.rankNum, { backgroundColor: colors.destructive }]}>
                    <Feather name="alert-triangle" size={14} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rankNama, { color: colors.text }]}>{p.nama}</Text>
                    <Text style={[styles.rankMeta, { color: colors.destructive }]}>Stok: {p.stok} (min: {p.stokMinimum})</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push({ pathname: "/edit-produk", params: { id: p.id } })}>
                    <Text style={[{ color: colors.primary, fontSize: 12, fontWeight: "700" }]}>Tambah Stok</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, gap: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", textAlign: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 8 },
  rankCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderWidth: 1 },
  rankNum: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rankNumText: { fontSize: 12, fontWeight: "700" },
  rankNama: { fontSize: 14, fontWeight: "600" },
  rankMeta: { fontSize: 12 },
  profit: { fontSize: 14, fontWeight: "700" },
});
