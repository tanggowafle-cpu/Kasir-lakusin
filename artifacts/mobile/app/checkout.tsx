import { useAuth, useUser } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { CartItem, MetodePembayaran, Transaction } from "@/types";
import { formatCurrency } from "@/utils/format";

const METODE: { id: MetodePembayaran; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: "tunai", label: "Tunai", icon: "dollar-sign" },
  { id: "transfer", label: "Transfer Bank", icon: "credit-card" },
  { id: "qris", label: "QRIS", icon: "grid" },
  { id: "hutang", label: "Hutang", icon: "users" },
];

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cart: cartRaw } = useLocalSearchParams<{ cart: string }>();
  const { user } = useUser();
  const { addTransaction, addDebt, storeSettings } = useStore();
  const { showToast } = useToast();

  const cart: CartItem[] = cartRaw ? JSON.parse(cartRaw) : [];
  const total = cart.reduce((s, c) => s + c.subtotal, 0);
  const modal = cart.reduce((s, c) => s + c.product.hargaBeli * c.jumlah, 0);
  const keuntungan = total - modal;

  const [metode, setMetode] = useState<MetodePembayaran>("tunai");
  const [namaBank, setNamaBank] = useState("");
  const [namaPelanggan, setNamaPelanggan] = useState("");
  const [nomorWaPelanggan, setNomorWaPelanggan] = useState("");
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [qrisConfirmed, setQrisConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const kembalian = metode === "tunai"
    ? Math.max(0, parseInt(jumlahBayar.replace(/\D/g, ""), 10) - total) || 0
    : 0;

  const kurang = metode === "tunai"
    ? total - (parseInt(jumlahBayar.replace(/\D/g, ""), 10) || 0)
    : 0;

  const handleConfirm = async () => {
    if (metode === "tunai") {
      const bayar = parseInt(jumlahBayar.replace(/\D/g, ""), 10) || 0;
      if (bayar < total) { showToast("error", `Jumlah pembayaran kurang Rp ${formatCurrency(kurang)}`); return; }
    }
    if (metode === "transfer" && !namaBank.trim()) { showToast("error", "Nama bank tidak boleh kosong"); return; }
    if (metode === "qris" && !qrisConfirmed) { showToast("error", "Konfirmasi penerimaan QRIS terlebih dahulu"); return; }
    if (metode === "hutang" && !namaPelanggan.trim()) { showToast("error", "Nama pelanggan tidak boleh kosong"); return; }

    setLoading(true);
    try {
      const items = cart.map((c) => ({
        productId: c.product.id,
        nama: c.product.nama,
        hargaBeli: c.product.hargaBeli,
        hargaJual: c.product.hargaJual,
        jumlah: c.jumlah,
        subtotal: c.subtotal,
      }));

      const tx: Omit<Transaction, "id" | "createdAt"> = {
        items,
        total,
        modal,
        keuntungan,
        metodePembayaran: metode,
        namaKasir: user?.firstName ?? "Kasir",
        ...(metode === "transfer" ? { namaBank } : {}),
        ...(metode === "qris" ? {} : {}),
        ...(metode === "hutang" ? { namaPelanggan } : {}),
        ...(metode === "tunai" ? { jumlahBayar: parseInt(jumlahBayar.replace(/\D/g, ""), 10), kembalian } : {}),
      };

      await addTransaction(tx);

      if (metode === "hutang") {
        await addDebt({
          namaPelanggan,
          nomorWhatsapp: nomorWaPelanggan,
          jumlah: total,
          tanggal: new Date().toISOString(),
          sudahLunas: false,
        });
      }

      showToast("success", "Transaksi berhasil disimpan");
      router.replace({ pathname: "/struk", params: { tx: JSON.stringify({ ...tx, id: "latest" }), kembalian: kembalian.toString() } });
    } catch {
      showToast("error", "Gagal menyimpan transaksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pembayaran</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Order Summary */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ringkasan Pesanan</Text>
          {cart.map((c) => (
            <View key={c.product.id} style={styles.cartRow}>
              <Text style={[styles.cartName, { color: colors.text }]}>{c.product.nama}</Text>
              <Text style={[styles.cartQty, { color: colors.mutedForeground }]}>x{c.jumlah}</Text>
              <Text style={[styles.cartSubtotal, { color: colors.text }]}>{formatCurrency(c.subtotal)}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalVal, { color: colors.primary }]}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Metode Pembayaran */}
        <Text style={[styles.label, { color: colors.text }]}>Metode Pembayaran</Text>
        <View style={styles.metodeGrid}>
          {METODE.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.metodeItem, {
                backgroundColor: metode === m.id ? colors.secondary : colors.card,
                borderColor: metode === m.id ? colors.primary : colors.border,
                borderRadius: colors.radius,
              }]}
              onPress={() => { setMetode(m.id); setQrisConfirmed(false); }}
            >
              <Feather name={m.icon} size={20} color={metode === m.id ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.metodeText, { color: metode === m.id ? colors.primary : colors.text }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input berdasarkan metode */}
        {metode === "tunai" && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Input
              label="Jumlah Bayar"
              placeholder={formatCurrency(total)}
              keyboardType="number-pad"
              value={jumlahBayar}
              onChangeText={(v) => setJumlahBayar(v.replace(/\D/g, ""))}
              leftIcon="dollar-sign"
            />
            <View style={[styles.kembalianRow, { backgroundColor: kembalian > 0 ? colors.successBg : kurang > 0 ? colors.errorBg : colors.muted, borderRadius: 8 }]}>
              <Text style={[styles.kembalianLabel, { color: kembalian > 0 ? colors.success : kurang > 0 ? colors.destructive : colors.mutedForeground }]}>
                {kembalian > 0 ? "Kembalian" : kurang > 0 ? "Kekurangan" : "Kembalian"}
              </Text>
              <Text style={[styles.kembalianVal, { color: kembalian > 0 ? colors.success : kurang > 0 ? colors.destructive : colors.mutedForeground }]}>
                {formatCurrency(kembalian > 0 ? kembalian : kurang > 0 ? kurang : 0)}
              </Text>
            </View>
          </View>
        )}

        {metode === "transfer" && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Input label="Nama Bank" placeholder="BCA / BNI / Mandiri / dll" value={namaBank} onChangeText={setNamaBank} leftIcon="credit-card" />
          </View>
        )}

        {metode === "qris" && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, gap: 12 }]}>
            {storeSettings.qrisUri ? (
              <Image source={{ uri: storeSettings.qrisUri }} style={styles.qrisImg} resizeMode="contain" />
            ) : (
              <View style={[styles.qrisPlaceholder, { backgroundColor: colors.muted, borderRadius: 8 }]}>
                <Feather name="grid" size={40} color={colors.mutedForeground} />
                <Text style={[styles.qrisPlaceholderText, { color: colors.mutedForeground }]}>
                  Gambar QRIS belum diupload.{"\n"}Upload di menu Pengaturan.
                </Text>
              </View>
            )}
            <Text style={[styles.qrisTotalText, { color: colors.text }]}>Total: <Text style={{ color: colors.primary, fontWeight: "700" }}>{formatCurrency(total)}</Text></Text>
            <TouchableOpacity
              style={[styles.confirmQrisBtn, { backgroundColor: qrisConfirmed ? colors.success : colors.primary, borderRadius: colors.radius }]}
              onPress={() => setQrisConfirmed(!qrisConfirmed)}
            >
              <Feather name={qrisConfirmed ? "check-circle" : "circle"} size={18} color="#fff" />
              <Text style={styles.confirmQrisText}>{qrisConfirmed ? "Pembayaran Dikonfirmasi" : "Pembayaran Diterima"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {metode === "hutang" && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Input label="Nama Pelanggan" placeholder="Masukkan nama pelanggan" value={namaPelanggan} onChangeText={setNamaPelanggan} leftIcon="user" />
            <Input label="WhatsApp (opsional)" placeholder="08xxxxxxxxxx" keyboardType="phone-pad" value={nomorWaPelanggan} onChangeText={setNomorWaPelanggan} leftIcon="phone" />
            <View style={[styles.hutangInfo, { backgroundColor: colors.warningBg, borderRadius: 8 }]}>
              <Feather name="alert-triangle" size={15} color={colors.warning} />
              <Text style={[styles.hutangText, { color: colors.warning }]}>Transaksi akan dicatat sebagai hutang pelanggan</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>Total Pembayaran</Text>
          <Text style={[styles.bottomTotal, { color: colors.primary }]}>{formatCurrency(total)}</Text>
        </View>
        <Button title="Konfirmasi" onPress={handleConfirm} loading={loading} size="lg" style={{ flex: 1 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { padding: 16, gap: 14 },
  section: { padding: 16, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  cartRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cartName: { flex: 1, fontSize: 14 },
  cartQty: { fontSize: 13 },
  cartSubtotal: { fontSize: 14, fontWeight: "600" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalVal: { fontSize: 18, fontWeight: "800" },
  label: { fontSize: 15, fontWeight: "700" },
  metodeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metodeItem: { flex: 1, minWidth: "45%", alignItems: "center", justifyContent: "center", padding: 14, borderWidth: 1.5, gap: 6 },
  metodeText: { fontSize: 13, fontWeight: "600" },
  kembalianRow: { flexDirection: "row", justifyContent: "space-between", padding: 12 },
  kembalianLabel: { fontSize: 14, fontWeight: "600" },
  kembalianVal: { fontSize: 16, fontWeight: "700" },
  qrisImg: { width: "100%", height: 220 },
  qrisPlaceholder: { alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  qrisPlaceholderText: { fontSize: 13, textAlign: "center" },
  qrisTotalText: { fontSize: 16, textAlign: "center" },
  confirmQrisBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  confirmQrisText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  hutangInfo: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  hutangText: { flex: 1, fontSize: 13, fontWeight: "500" },
  bottomBar: { padding: 16, borderTopWidth: 1, flexDirection: "row", alignItems: "center", gap: 16 },
  bottomLabel: { fontSize: 12 },
  bottomTotal: { fontSize: 20, fontWeight: "800" },
});
