import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, FlatList, Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmModal } from "@/components/ConfirmModal";
import { formatCurrency, formatDate } from "@/utils/format";
import { Debt } from "@/types";

export default function HutangScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { debts, addDebt, markDebtPaid, deleteDebt } = useStore();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<"semua" | "belum" | "lunas">("belum");
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const [payTarget, setPayTarget] = useState<Debt | null>(null);
  const [form, setForm] = useState({ namaPelanggan: "", jumlah: "", nomorWa: "", catatan: "" });
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return debts.filter((d) => {
      if (filter === "belum") return !d.sudahLunas;
      if (filter === "lunas") return d.sudahLunas;
      return true;
    });
  }, [debts, filter]);

  const totalBelumLunas = useMemo(() => debts.filter((d) => !d.sudahLunas).reduce((s, d) => s + d.jumlah, 0), [debts]);

  const handleAdd = async () => {
    if (!form.namaPelanggan.trim()) { showToast("error", "Nama pelanggan tidak boleh kosong"); return; }
    if (!form.jumlah) { showToast("error", "Jumlah hutang tidak boleh kosong"); return; }
    setLoading(true);
    try {
      await addDebt({
        namaPelanggan: form.namaPelanggan.trim(),
        nomorWhatsapp: form.nomorWa.trim(),
        jumlah: parseInt(form.jumlah, 10),
        catatan: form.catatan.trim(),
        tanggal: new Date().toISOString(),
        sudahLunas: false,
      });
      showToast("success", "Hutang berhasil dicatat");
      setForm({ namaPelanggan: "", jumlah: "", nomorWa: "", catatan: "" });
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!payTarget) return;
    await markDebtPaid(payTarget.id);
    showToast("success", `Hutang ${payTarget.namaPelanggan} ditandai lunas`);
    setPayTarget(null);
  };

  const handleWA = (debt: Debt) => {
    if (!debt.nomorWhatsapp) { showToast("warning", "Nomor WhatsApp tidak tersedia"); return; }
    const msg = `Halo ${debt.namaPelanggan}, mengingatkan hutang sebesar ${formatCurrency(debt.jumlah)} pada tanggal ${formatDate(debt.tanggal)}. Terima kasih.`;
    Linking.openURL(`whatsapp://send?phone=${debt.nomorWhatsapp}&text=${encodeURIComponent(msg)}`);
  };

  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + topPaddingWeb + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Kelola Hutang</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: 8 }]} onPress={() => setShowModal(true)}>
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={[styles.summary, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.summaryLabel, { color: colors.primary }]}>Total Hutang Belum Lunas</Text>
        <Text style={[styles.summaryVal, { color: colors.primary }]}>{formatCurrency(totalBelumLunas)}</Text>
        <Text style={[styles.summaryCount, { color: colors.mutedForeground }]}>{debts.filter((d) => !d.sudahLunas).length} pelanggan</Text>
      </View>

      {/* Filter */}
      <View style={[styles.filterRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["belum", "lunas", "semua"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, { borderBottomColor: filter === f ? colors.primary : "transparent" }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? colors.primary : colors.mutedForeground }]}>
              {f === "belum" ? "Belum Lunas" : f === "lunas" ? "Lunas" : "Semua"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.debtCard, { backgroundColor: colors.card, borderColor: item.sudahLunas ? colors.border : colors.primaryLighter, borderRadius: colors.radius }]}>
            <View style={styles.debtMain}>
              <View style={[styles.debtAvatar, { backgroundColor: item.sudahLunas ? colors.muted : colors.secondary }]}>
                <Feather name="user" size={18} color={item.sudahLunas ? colors.mutedForeground : colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.debtNama, { color: colors.text }]}>{item.namaPelanggan}</Text>
                <Text style={[styles.debtTanggal, { color: colors.mutedForeground }]}>{formatDate(item.tanggal)}</Text>
                {item.catatan ? <Text style={[styles.debtCatatan, { color: colors.mutedForeground }]}>{item.catatan}</Text> : null}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.debtJumlah, { color: item.sudahLunas ? colors.success : colors.destructive }]}>
                  {formatCurrency(item.jumlah)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: item.sudahLunas ? "#DCFCE7" : colors.errorBg }]}>
                  <Text style={[styles.statusText, { color: item.sudahLunas ? colors.success : colors.destructive }]}>
                    {item.sudahLunas ? "Lunas" : "Belum Lunas"}
                  </Text>
                </View>
              </View>
            </View>
            {!item.sudahLunas && (
              <View style={[styles.debtActions, { borderTopColor: colors.border }]}>
                {item.nomorWhatsapp && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#DCFCE7" }]} onPress={() => handleWA(item)}>
                    <Feather name="message-circle" size={15} color="#25D366" />
                    <Text style={{ color: "#25D366", fontSize: 12, fontWeight: "600" }}>Ingatkan</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#DCFCE7" }]} onPress={() => setPayTarget(item)}>
                  <Feather name="check-circle" size={15} color={colors.success} />
                  <Text style={{ color: colors.success, fontSize: 12, fontWeight: "600" }}>Tandai Lunas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.errorBg }]} onPress={() => setDeleteTarget(item)}>
                  <Feather name="trash-2" size={15} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="users" title="Tidak ada hutang" description="Semua hutang sudah lunas!" />}
      />

      {/* Modal Tambah */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderRadius: 20, paddingBottom: insets.bottom + 24 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Catat Hutang Baru</Text>
            <Input label="Nama Pelanggan" placeholder="Nama pelanggan" value={form.namaPelanggan} onChangeText={(v) => setForm((f) => ({ ...f, namaPelanggan: v }))} leftIcon="user" />
            <Input label="Jumlah Hutang" placeholder="Contoh: 50000" keyboardType="number-pad" value={form.jumlah} onChangeText={(v) => setForm((f) => ({ ...f, jumlah: v }))} leftIcon="dollar-sign" />
            <Input label="Nomor WhatsApp (opsional)" placeholder="08xxxxxxxxxx" keyboardType="phone-pad" value={form.nomorWa} onChangeText={(v) => setForm((f) => ({ ...f, nomorWa: v }))} leftIcon="phone" />
            <Input label="Catatan (opsional)" value={form.catatan} onChangeText={(v) => setForm((f) => ({ ...f, catatan: v }))} leftIcon="edit-2" />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button title="Batal" variant="outline" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
              <Button title="Simpan" onPress={handleAdd} loading={loading} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal visible={!!payTarget} title="Tandai Lunas" message={`Tandai hutang ${payTarget?.namaPelanggan} sebagai lunas?`} onConfirm={handlePay} onCancel={() => setPayTarget(null)} />
      <ConfirmModal visible={!!deleteTarget} title="Hapus Hutang" message={`Hapus catatan hutang ${deleteTarget?.namaPelanggan}?`} onConfirm={async () => { await deleteDebt(deleteTarget!.id); showToast("success", "Hutang dihapus"); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} danger />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  addBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  summary: { padding: 16, alignItems: "center" },
  summaryLabel: { fontSize: 12, fontWeight: "600" },
  summaryVal: { fontSize: 28, fontWeight: "800" },
  summaryCount: { fontSize: 12 },
  filterRow: { flexDirection: "row", borderBottomWidth: 1 },
  filterTab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2 },
  filterText: { fontSize: 13, fontWeight: "600" },
  list: { padding: 16, gap: 10 },
  debtCard: { borderWidth: 1.5 },
  debtMain: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  debtAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  debtNama: { fontSize: 15, fontWeight: "700" },
  debtTanggal: { fontSize: 12 },
  debtCatatan: { fontSize: 12, fontStyle: "italic" },
  debtJumlah: { fontSize: 15, fontWeight: "800" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  debtActions: { flexDirection: "row", gap: 8, padding: 10, borderTopWidth: 1 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { padding: 24, gap: 14 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
});
