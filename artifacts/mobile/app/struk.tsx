import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { CartItem, MetodePembayaran } from "@/types";

const METODE_LABEL: Record<MetodePembayaran, string> = {
  tunai: "Tunai",
  transfer: "Transfer Bank",
  qris: "QRIS",
  hutang: "Hutang",
};

export default function StrukScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tx: txRaw, kembalian: kembalianRaw } = useLocalSearchParams<{ tx: string; kembalian: string }>();
  const { storeSettings, transactions } = useStore();

  const txParam = txRaw ? JSON.parse(txRaw) : null;
  const latestTx = transactions[0];
  const tx = latestTx ?? txParam;
  const kembalian = parseInt(kembalianRaw ?? "0", 10);

  if (!tx) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Transaksi tidak ditemukan</Text>
      </View>
    );
  }

  const namaWarung = storeSettings.namaWarung;
  const now = new Date(tx.createdAt ?? Date.now()).toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const receiptText = [
    `*${namaWarung}*`,
    `${now}`,
    `----------------------------`,
    ...tx.items.map((item: any) => `${item.nama} x${item.jumlah}    ${formatCurrency(item.subtotal)}`),
    `----------------------------`,
    `*TOTAL: ${formatCurrency(tx.total)}*`,
    `Metode: ${METODE_LABEL[tx.metodePembayaran as MetodePembayaran]}`,
    ...(tx.metodePembayaran === "tunai" && kembalian > 0 ? [`Kembalian: ${formatCurrency(kembalian)}`] : []),
    ...(tx.metodePembayaran === "hutang" && tx.namaPelanggan ? [`Pelanggan: ${tx.namaPelanggan}`] : []),
    ``,
    `Terima kasih sudah berbelanja! 🙏`,
  ].join("\n");

  const handleWhatsApp = async () => {
    const wa = storeSettings.nomorWhatsapp;
    const url = wa
      ? `whatsapp://send?phone=${wa}&text=${encodeURIComponent(receiptText)}`
      : `whatsapp://send?text=${encodeURIComponent(receiptText)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "WhatsApp tidak terpasang");
    }
  };

  const handlePDF = async () => {
    try {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px}
        h2{text-align:center;color:#1B4F8A}
        .date{text-align:center;color:#666;font-size:12px;margin-bottom:16px}
        .item{display:flex;justify-content:space-between;margin:6px 0}
        .divider{border:none;border-top:1px dashed #ccc;margin:12px 0}
        .total{display:flex;justify-content:space-between;font-weight:bold;font-size:18px;color:#1B4F8A}
        .info{font-size:13px;color:#666;margin:4px 0}
        .footer{text-align:center;margin-top:20px;color:#999;font-size:12px}
      </style></head><body>
        <h2>${namaWarung}</h2>
        <p class="date">${now}</p>
        <hr class="divider">
        ${tx.items.map((i: any) => `<div class="item"><span>${i.nama} x${i.jumlah}</span><span>${formatCurrency(i.subtotal)}</span></div>`).join("")}
        <hr class="divider">
        <div class="total"><span>TOTAL</span><span>${formatCurrency(tx.total)}</span></div>
        <p class="info">Metode: ${METODE_LABEL[tx.metodePembayaran as MetodePembayaran]}</p>
        ${tx.metodePembayaran === "tunai" && kembalian > 0 ? `<p class="info">Kembalian: ${formatCurrency(kembalian)}</p>` : ""}
        ${tx.metodePembayaran === "hutang" && tx.namaPelanggan ? `<p class="info">Pelanggan: ${tx.namaPelanggan}</p>` : ""}
        <p class="footer">Terima kasih sudah berbelanja!</p>
      </body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Bagikan Struk" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Gagal membuat PDF");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Struk Transaksi</Text>
        <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Feather name="printer" size={22} color={colors.text} onPress={handlePDF} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        {/* Success Banner */}
        <View style={[styles.successBanner, { backgroundColor: colors.successBg }]}>
          <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
            <Feather name="check" size={28} color="#fff" />
          </View>
          <Text style={[styles.successTitle, { color: colors.success }]}>Pembayaran Berhasil!</Text>
          <Text style={[styles.successTotal, { color: colors.text }]}>{formatCurrency(tx.total)}</Text>
        </View>

        {/* Struk */}
        <View style={[styles.struk, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {/* Header Struk */}
          <Text style={[styles.strukNamaWarung, { color: colors.primary }]}>{namaWarung}</Text>
          <Text style={[styles.strukDate, { color: colors.mutedForeground }]}>{now}</Text>
          <View style={[styles.dashed, { borderColor: colors.border }]} />

          {/* Items */}
          {tx.items.map((item: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemNama, { color: colors.text }]}>{item.nama}</Text>
                <Text style={[styles.itemQty, { color: colors.mutedForeground }]}>
                  {item.jumlah} x {formatCurrency(item.hargaJual)}
                </Text>
              </View>
              <Text style={[styles.itemSubtotal, { color: colors.text }]}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}

          <View style={[styles.dashed, { borderColor: colors.border }]} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>TOTAL</Text>
            <Text style={[styles.totalVal, { color: colors.primary }]}>{formatCurrency(tx.total)}</Text>
          </View>

          {/* Metode */}
          <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Metode Bayar</Text>
            <Text style={[styles.infoVal, { color: colors.text }]}>{METODE_LABEL[tx.metodePembayaran as MetodePembayaran]}</Text>
          </View>
          {tx.metodePembayaran === "tunai" && tx.jumlahBayar && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Dibayar</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>{formatCurrency(tx.jumlahBayar)}</Text>
            </View>
          )}
          {kembalian > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Kembalian</Text>
              <Text style={[styles.infoVal, { color: colors.success, fontWeight: "700" }]}>{formatCurrency(kembalian)}</Text>
            </View>
          )}
          {tx.namaBank && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Bank</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>{tx.namaBank}</Text>
            </View>
          )}
          {tx.namaPelanggan && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Pelanggan</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>{tx.namaPelanggan}</Text>
            </View>
          )}

          <View style={[styles.dashed, { borderColor: colors.border }]} />
          <Text style={[styles.footer, { color: colors.mutedForeground }]}>Terima kasih sudah berbelanja!</Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#25D366", borderRadius: colors.radius }]} onPress={handleWhatsApp}>
          <Feather name="message-circle" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary, borderRadius: colors.radius }]} onPress={handlePDF}>
          <Feather name="file-text" size={18} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.selesaiBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]} onPress={() => router.replace("/(tabs)/kasir")}>
          <Text style={styles.selesaiText}>Selesai</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { padding: 16, gap: 16 },
  successBanner: { alignItems: "center", padding: 24, borderRadius: 16, gap: 8 },
  checkCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 18, fontWeight: "700" },
  successTotal: { fontSize: 26, fontWeight: "800", letterSpacing: -1 },
  struk: { padding: 20, borderWidth: 1, gap: 0 },
  strukNamaWarung: { fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 4 },
  strukDate: { fontSize: 12, textAlign: "center", marginBottom: 12 },
  dashed: { borderStyle: "dashed", borderTopWidth: 1, marginVertical: 12 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  itemNama: { fontSize: 14, fontWeight: "600" },
  itemQty: { fontSize: 12, marginTop: 2 },
  itemSubtotal: { fontSize: 14, fontWeight: "600" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalVal: { fontSize: 20, fontWeight: "800" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 8 },
  infoLabel: { fontSize: 13 },
  infoVal: { fontSize: 13, fontWeight: "600" },
  footer: { fontSize: 13, textAlign: "center", fontStyle: "italic" },
  bottomBar: { padding: 16, flexDirection: "row", gap: 10, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13 },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  selesaiBtn: { flex: 1.5, alignItems: "center", justifyContent: "center", paddingVertical: 13 },
  selesaiText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
