import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { CartItem, Product } from "@/types";
import { formatCurrency } from "@/utils/format";
import { EmptyState } from "@/components/EmptyState";

export default function KasirScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { products } = useStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("Semua");
  const [cart, setCart] = useState<CartItem[]>([]);

  const kategoriList = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.kategori)));
    return ["Semua", ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase());
      const matchKat = kategori === "Semua" || p.kategori === kategori;
      return matchSearch && matchKat && p.stok > 0;
    });
  }, [products, search, kategori]);

  const totalItems = cart.reduce((s, c) => s + c.jumlah, 0);
  const totalHarga = cart.reduce((s, c) => s + c.subtotal, 0);

  const addToCart = (product: Product) => {
    if (product.stok <= 0) { showToast("error", "Stok habis"); return; }
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.jumlah >= product.stok) { showToast("error", `Stok ${product.nama} hanya ${product.stok}`); return prev; }
        return prev.map((c) => c.product.id === product.id
          ? { ...c, jumlah: c.jumlah + 1, subtotal: (c.jumlah + 1) * product.hargaJual }
          : c
        );
      }
      return [...prev, { product, jumlah: 1, subtotal: product.hargaJual }];
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === productId);
      if (!existing) return prev;
      if (existing.jumlah === 1) return prev.filter((c) => c.product.id !== productId);
      return prev.map((c) => c.product.id === productId
        ? { ...c, jumlah: c.jumlah - 1, subtotal: (c.jumlah - 1) * c.product.hargaJual }
        : c
      );
    });
  };

  const getCartQty = (productId: string) => cart.find((c) => c.product.id === productId)?.jumlah ?? 0;

  const handleCheckout = () => {
    if (cart.length === 0) { showToast("error", "Keranjang masih kosong"); return; }
    router.push({ pathname: "/checkout", params: { cart: JSON.stringify(cart) } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Kasir</Text>
        {cart.length > 0 && (
          <TouchableOpacity onPress={() => setCart([])} style={[styles.clearBtn, { backgroundColor: colors.errorBg, borderRadius: 8 }]}>
            <Feather name="trash-2" size={15} color={colors.destructive} />
            <Text style={[styles.clearText, { color: colors.destructive }]}>Kosongkan</Text>
          </TouchableOpacity>
        )}
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
        </View>
      </View>

      {/* Kategori */}
      <FlatList
        horizontal
        data={kategoriList}
        keyExtractor={(i) => i}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.katList}
        style={{ flexGrow: 0, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.katItem, { backgroundColor: kategori === item ? colors.primary : colors.muted, borderRadius: 20 }]}
            onPress={() => setKategori(item)}
          >
            <Text style={[styles.katText, { color: kategori === item ? "#fff" : colors.mutedForeground }]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Produk Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={[styles.grid, { paddingBottom: tabBarHeight + (cart.length > 0 ? 90 : 20) }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const qty = getCartQty(item.id);
          return (
            <TouchableOpacity
              style={[styles.prodItem, { backgroundColor: colors.card, borderColor: qty > 0 ? colors.primary : colors.border, borderRadius: colors.radius }]}
              onPress={() => addToCart(item)}
              activeOpacity={0.8}
            >
              {item.foto ? (
                <Image source={{ uri: item.foto }} style={[styles.prodFoto, { borderRadius: 10 }]} />
              ) : (
                <View style={[styles.prodIconWrap, { backgroundColor: qty > 0 ? colors.secondary : colors.muted }]}>
                  <Feather name="box" size={24} color={qty > 0 ? colors.primary : colors.mutedForeground} />
                </View>
              )}
              <Text style={[styles.prodNama, { color: colors.text }]} numberOfLines={2}>{item.nama}</Text>
              <Text style={[styles.prodHarga, { color: colors.primary }]}>{formatCurrency(item.hargaJual)}</Text>
              <Text style={[styles.prodStok, { color: item.stok <= item.stokMinimum ? colors.destructive : colors.mutedForeground }]}>
                Stok: {item.stok}
              </Text>
              {qty > 0 && (
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.errorBg }]}
                    onPress={() => removeFromCart(item.id)}
                  >
                    <Feather name="minus" size={14} color={colors.destructive} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyNum, { color: colors.primary }]}>{qty}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.secondary }]}
                    onPress={() => addToCart(item)}
                  >
                    <Feather name="plus" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="box" title="Tidak ada produk" description={search ? "Coba kata kunci lain" : "Tambah produk di menu Produk"} />
        }
      />

      {/* Cart Bar */}
      {cart.length > 0 && (
        <View style={[styles.cartBar, { bottom: tabBarHeight, backgroundColor: colors.primary, paddingBottom: 16 }]}>
          <View>
            <Text style={styles.cartItems}>{totalItems} item</Text>
            <Text style={styles.cartTotal}>{formatCurrency(totalHarga)}</Text>
          </View>
          <TouchableOpacity style={styles.bayarBtn} onPress={handleCheckout} activeOpacity={0.85}>
            <Text style={styles.bayarText}>Bayar</Text>
            <Feather name="arrow-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  clearText: { fontSize: 12, fontWeight: "600" },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  katList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  katItem: { paddingHorizontal: 14, paddingVertical: 6 },
  katText: { fontSize: 13, fontWeight: "600" },
  grid: { padding: 12, gap: 10 },
  prodItem: { flex: 1, padding: 12, borderWidth: 1.5, gap: 4 },
  prodFoto: { width: 72, height: 72, resizeMode: "cover", marginBottom: 4, alignSelf: "center" },
  prodIconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  prodNama: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  prodHarga: { fontSize: 14, fontWeight: "700" },
  prodStok: { fontSize: 11 },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 15, fontWeight: "700" },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16 },
  cartItems: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  cartTotal: { color: "#fff", fontSize: 20, fontWeight: "800" },
  bayarBtn: { backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  bayarText: { fontSize: 15, fontWeight: "800", color: "#1B4F8A" },
});
