import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { EmptyState } from "@/components/EmptyState";
import { formatDateTime } from "@/utils/format";

export default function RiwayatStokScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { stockHistory, products } = useStore();

  const filtered = useMemo(() => {
    if (productId) return stockHistory.filter((h) => h.productId === productId);
    return stockHistory;
  }, [stockHistory, productId]);

  const product = productId ? products.find((p) => p.id === productId) : null;
  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + topPaddingWeb + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {product ? `Stok: ${product.nama}` : "Riwayat Stok"}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {product && (
        <View style={[styles.summary, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.stokLabel, { color: colors.primary }]}>Stok Sekarang</Text>
          <Text style={[styles.stokVal, { color: product.stok <= product.stokMinimum ? colors.destructive : colors.text }]}>{product.stok} unit</Text>
          <Text style={[styles.stokMin, { color: colors.mutedForeground }]}>Minimum: {product.stokMinimum}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={[styles.iconWrap, { backgroundColor: item.jenis === "masuk" ? "#DCFCE7" : colors.errorBg }]}>
              <Feather
                name={item.jenis === "masuk" ? "arrow-up" : "arrow-down"}
                size={18}
                color={item.jenis === "masuk" ? colors.success : colors.destructive}
              />
            </View>
            <View style={{ flex: 1 }}>
              {!productId && <Text style={[styles.prodNama, { color: colors.text }]}>{item.namaProduct}</Text>}
              <Text style={[styles.jenis, { color: item.jenis === "masuk" ? colors.success : colors.destructive }]}>
                {item.jenis === "masuk" ? `+${item.jumlah}` : `-${item.jumlah}`} unit
              </Text>
              <Text style={[styles.stokChange, { color: colors.mutedForeground }]}>
                {item.stokSebelum} → {item.stokSesudah}
              </Text>
              {item.catatan ? <Text style={[styles.catatan, { color: colors.mutedForeground }]}>{item.catatan}</Text> : null}
              <Text style={[styles.tanggal, { color: colors.mutedForeground }]}>{formatDateTime(item.tanggal)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="clock" title="Belum ada riwayat" description="Riwayat perubahan stok akan muncul di sini" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  summary: { padding: 16, alignItems: "center" },
  stokLabel: { fontSize: 12, fontWeight: "600" },
  stokVal: { fontSize: 32, fontWeight: "800" },
  stokMin: { fontSize: 12 },
  list: { padding: 16, gap: 8 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  prodNama: { fontSize: 14, fontWeight: "600" },
  jenis: { fontSize: 16, fontWeight: "700" },
  stokChange: { fontSize: 12 },
  catatan: { fontSize: 12, fontStyle: "italic" },
  tanggal: { fontSize: 11, marginTop: 2 },
});
