import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Product } from "@/types";

export default function ProdukScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { products, deleteProduct } = useStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("Semua");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const kategoriList = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.kategori)));
    return ["Semua", ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase()) ||
        p.kategori.toLowerCase().includes(search.toLowerCase());
      const matchKat = kategori === "Semua" || p.kategori === kategori;
      return matchSearch && matchKat;
    });
  }, [products, search, kategori]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteProduct(deleteTarget.id);
    showToast("success", `Produk "${deleteTarget.nama}" dihapus`);
    setDeleteTarget(null);
  };

  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + topPaddingWeb + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Produk & Stok</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          onPress={() => router.push("/tambah-produk")}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Cari produk..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Kategori Filter */}
      <FlatList
        horizontal
        data={kategoriList}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.katList}
        style={{ flexGrow: 0, backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.katItem,
              {
                backgroundColor: kategori === item ? colors.primary : colors.muted,
                borderRadius: 20,
              }
            ]}
            onPress={() => setKategori(item)}
          >
            <Text style={[styles.katText, { color: kategori === item ? "#fff" : colors.mutedForeground }]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Summary */}
      <View style={[styles.summary, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
          {filtered.length} produk · {filtered.filter((p) => p.stok <= p.stokMinimum).length} stok rendah
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            showActions
            onPress={() => router.push({ pathname: "/riwayat-stok", params: { productId: item.id } })}
            onEdit={() => router.push({ pathname: "/edit-produk", params: { id: item.id } })}
            onDelete={() => setDeleteTarget(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="box"
            title={search ? "Produk tidak ditemukan" : "Belum ada produk"}
            description={search ? "Coba kata kunci lain" : "Tambah produk pertama Anda"}
            actionLabel={!search ? "Tambah Produk" : undefined}
            onAction={!search ? () => router.push("/tambah-produk") : undefined}
          />
        }
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Hapus Produk"
        message={`Yakin ingin menghapus "${deleteTarget?.nama}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  katList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  katItem: { paddingHorizontal: 14, paddingVertical: 6 },
  katText: { fontSize: 13, fontWeight: "600" },
  summary: { paddingHorizontal: 16, paddingVertical: 8 },
  summaryText: { fontSize: 12 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
});
