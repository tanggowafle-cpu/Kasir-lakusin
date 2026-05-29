import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ProductImagePicker } from "@/components/ProductImagePicker";

export default function EditProdukScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, updateProduct, updateStok } = useStore();
  const { showToast } = useToast();

  const product = products.find((p) => p.id === id);

  const [form, setForm] = useState({
    nama: product?.nama ?? "", kategori: product?.kategori ?? "",
    hargaBeli: product?.hargaBeli.toString() ?? "", hargaJual: product?.hargaJual.toString() ?? "",
    stokMinimum: product?.stokMinimum.toString() ?? "5",
  });
  const [foto, setFoto] = useState<string | undefined>(product?.foto);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showStokModal, setShowStokModal] = useState(false);
  const [stokJenis, setStokJenis] = useState<"masuk" | "keluar">("masuk");
  const [stokJumlah, setStokJumlah] = useState("");
  const [stokCatatan, setStokCatatan] = useState("");

  const setField = (k: keyof typeof form) => (v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nama.trim()) e.nama = "Nama produk tidak boleh kosong";
    else {
      const dup = products.find((p) => p.nama.toLowerCase() === form.nama.trim().toLowerCase() && p.id !== id);
      if (dup) e.nama = "Nama produk sudah ada";
    }
    if (!form.kategori.trim()) e.kategori = "Kategori tidak boleh kosong";
    if (!form.hargaBeli) e.hargaBeli = "Harga beli tidak boleh kosong";
    if (!form.hargaJual) e.hargaJual = "Harga jual tidak boleh kosong";
    const hb = parseInt(form.hargaBeli, 10);
    const hj = parseInt(form.hargaJual, 10);
    if (!isNaN(hb) && !isNaN(hj) && hj < hb) e.hargaJual = "Harga jual harus lebih besar dari harga beli";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await updateProduct(id!, {
        nama: form.nama.trim(), kategori: form.kategori.trim(),
        hargaBeli: parseInt(form.hargaBeli, 10), hargaJual: parseInt(form.hargaJual, 10),
        stokMinimum: parseInt(form.stokMinimum, 10) || 5,
        foto,
      });
      showToast("success", "Produk berhasil diperbarui");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStok = async () => {
    const jml = parseInt(stokJumlah, 10);
    if (isNaN(jml) || jml <= 0) { showToast("error", "Jumlah stok tidak valid"); return; }
    if (stokJenis === "keluar" && jml > (product?.stok ?? 0)) { showToast("error", "Stok tidak mencukupi"); return; }
    await updateStok(id!, stokJenis, jml, stokCatatan);
    showToast("success", `Stok ${stokJenis === "masuk" ? "ditambah" : "dikurangi"} ${jml} unit`);
    setShowStokModal(false);
    setStokJumlah("");
    setStokCatatan("");
  };

  if (!product) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text>Produk tidak ditemukan</Text></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Produk</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Stok sekarang */}
        <View style={[styles.stokBanner, { backgroundColor: colors.secondary }]}>
          <View>
            <Text style={[styles.stokLabel, { color: colors.primary }]}>Stok Sekarang</Text>
            <Text style={[styles.stokVal, { color: product.stok <= product.stokMinimum ? colors.destructive : colors.text }]}>{product.stok} unit</Text>
          </View>
          <TouchableOpacity style={[styles.stokBtn, { backgroundColor: colors.primary, borderRadius: 8 }]} onPress={() => setShowStokModal(true)}>
            <Feather name="edit-3" size={15} color="#fff" />
            <Text style={styles.stokBtnText}>Update Stok</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Foto Produk</Text>
          <ProductImagePicker value={foto} onChange={setFoto} productName={form.nama} />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Input label="Nama Produk" value={form.nama} onChangeText={setField("nama")} error={errors.nama} leftIcon="box" />
          <Input label="Kategori" value={form.kategori} onChangeText={setField("kategori")} error={errors.kategori} leftIcon="tag" />
          <Input label="Harga Beli (Modal)" keyboardType="number-pad" value={form.hargaBeli} onChangeText={setField("hargaBeli")} error={errors.hargaBeli} leftIcon="shopping-bag" />
          <Input label="Harga Jual" keyboardType="number-pad" value={form.hargaJual} onChangeText={setField("hargaJual")} error={errors.hargaJual} leftIcon="tag" />
          <Input label="Batas Minimum Stok" keyboardType="number-pad" value={form.stokMinimum} onChangeText={setField("stokMinimum")} leftIcon="alert-triangle" />
          <Button title="Simpan Perubahan" onPress={handleSave} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />
        </View>
      </ScrollView>

      {/* Modal Update Stok */}
      <Modal visible={showStokModal} transparent animationType="slide" onRequestClose={() => setShowStokModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderRadius: 20 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Update Stok</Text>
            <Text style={[styles.modalProduct, { color: colors.mutedForeground }]}>{product.nama} (Sekarang: {product.stok})</Text>
            <View style={styles.jenisRow}>
              {(["masuk", "keluar"] as const).map((j) => (
                <TouchableOpacity
                  key={j}
                  style={[styles.jenisBtn, {
                    backgroundColor: stokJenis === j ? (j === "masuk" ? "#DCFCE7" : colors.errorBg) : colors.muted,
                    borderRadius: 8, flex: 1,
                  }]}
                  onPress={() => setStokJenis(j)}
                >
                  <Text style={[styles.jenisText, { color: stokJenis === j ? (j === "masuk" ? colors.success : colors.destructive) : colors.mutedForeground }]}>
                    {j === "masuk" ? "Stok Masuk (+)" : "Stok Keluar (-)"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Jumlah" placeholder="Masukkan jumlah" keyboardType="number-pad" value={stokJumlah} onChangeText={setStokJumlah} leftIcon="layers" />
            <Input label="Catatan (opsional)" placeholder="Alasan perubahan stok" value={stokCatatan} onChangeText={setStokCatatan} leftIcon="edit-2" />
            <View style={styles.modalBtns}>
              <Button title="Batal" variant="outline" onPress={() => setShowStokModal(false)} style={{ flex: 1 }} />
              <Button title="Simpan" onPress={handleUpdateStok} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { padding: 16, gap: 14 },
  stokBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 12 },
  stokLabel: { fontSize: 12, fontWeight: "600" },
  stokVal: { fontSize: 24, fontWeight: "800" },
  stokBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  stokBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  card: { padding: 16, borderWidth: 1, gap: 14 },
  sectionLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  divider: { height: 1, marginVertical: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { padding: 24, gap: 14, marginHorizontal: 0, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalProduct: { fontSize: 13 },
  jenisRow: { flexDirection: "row", gap: 10 },
  jenisBtn: { paddingVertical: 12, alignItems: "center" },
  jenisText: { fontSize: 13, fontWeight: "700" },
  modalBtns: { flexDirection: "row", gap: 12 },
});
