import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ProductImagePicker } from "@/components/ProductImagePicker";

export default function TambahProdukScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addProduct, products, storeSettings } = useStore();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    nama: "", kategori: "", hargaBeli: "", hargaJual: "", stok: "", stokMinimum: storeSettings.stokMinimumDefault.toString(),
  });
  const [foto, setFoto] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setField = (k: keyof typeof form) => (v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nama.trim()) e.nama = "Nama produk tidak boleh kosong";
    else if (products.some((p) => p.nama.toLowerCase() === form.nama.trim().toLowerCase())) e.nama = "Nama produk sudah ada";
    if (!form.kategori.trim()) e.kategori = "Kategori tidak boleh kosong";
    if (!form.hargaBeli) e.hargaBeli = "Harga beli tidak boleh kosong";
    if (!form.hargaJual) e.hargaJual = "Harga jual tidak boleh kosong";
    const hb = parseInt(form.hargaBeli, 10);
    const hj = parseInt(form.hargaJual, 10);
    if (!isNaN(hb) && !isNaN(hj) && hj < hb) e.hargaJual = "Harga jual harus lebih besar dari harga beli";
    if (!form.stok) e.stok = "Stok tidak boleh kosong";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await addProduct({
        nama: form.nama.trim(),
        kategori: form.kategori.trim(),
        hargaBeli: parseInt(form.hargaBeli, 10),
        hargaJual: parseInt(form.hargaJual, 10),
        stok: parseInt(form.stok, 10),
        stokMinimum: parseInt(form.stokMinimum, 10) || storeSettings.stokMinimumDefault,
        foto,
      });
      showToast("success", `Produk "${form.nama}" berhasil ditambahkan`);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tambah Produk</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Foto Produk</Text>
          <ProductImagePicker value={foto} onChange={setFoto} productName={form.nama} />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Input label="Nama Produk" placeholder="Contoh: Indomie Goreng" value={form.nama} onChangeText={setField("nama")} error={errors.nama} leftIcon="box" />
          <Input label="Kategori" placeholder="Contoh: Makanan, Minuman, dll" value={form.kategori} onChangeText={setField("kategori")} error={errors.kategori} leftIcon="tag" />
          <Input label="Harga Beli (Modal)" placeholder="Contoh: 3000" keyboardType="number-pad" value={form.hargaBeli} onChangeText={setField("hargaBeli")} error={errors.hargaBeli} leftIcon="shopping-bag" />
          <Input label="Harga Jual" placeholder="Contoh: 4000" keyboardType="number-pad" value={form.hargaJual} onChangeText={setField("hargaJual")} error={errors.hargaJual} leftIcon="tag" />
          {form.hargaBeli && form.hargaJual && !errors.hargaJual && (
            <View style={[styles.profitHint, { backgroundColor: colors.successBg, borderRadius: 8 }]}>
              <Feather name="trending-up" size={14} color={colors.success} />
              <Text style={[styles.profitText, { color: colors.success }]}>
                Keuntungan: Rp {(parseInt(form.hargaJual || "0", 10) - parseInt(form.hargaBeli || "0", 10)).toLocaleString("id-ID")} per item
              </Text>
            </View>
          )}
          <Input label="Stok Awal" placeholder="Contoh: 100" keyboardType="number-pad" value={form.stok} onChangeText={setField("stok")} error={errors.stok} leftIcon="layers" />
          <Input label="Batas Minimum Stok" placeholder={storeSettings.stokMinimumDefault.toString()} keyboardType="number-pad" value={form.stokMinimum} onChangeText={setField("stokMinimum")} leftIcon="alert-triangle" />
          <Button title="Simpan Produk" onPress={handleSave} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { padding: 16 },
  card: { padding: 16, borderWidth: 1, gap: 14 },
  sectionLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  divider: { height: 1, marginVertical: 4 },
  profitHint: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  profitText: { fontSize: 13, fontWeight: "600" },
});
