import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmModal } from "@/components/ConfirmModal";
import { formatCurrency, formatDate, isThisMonth } from "@/utils/format";
import { Expense } from "@/types";

const KATEGORI_LIST = ["Operasional", "Gaji", "Listrik & Air", "Sewa", "Bahan Baku", "Transportasi", "Lainnya"];

export default function PengeluaranScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { expenses, addExpense, deleteExpense } = useStore();
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [form, setForm] = useState({ keterangan: "", jumlah: "", kategori: KATEGORI_LIST[0] });
  const [loading, setLoading] = useState(false);

  const thisMonthExpenses = useMemo(() => expenses.filter((e) => isThisMonth(e.tanggal)), [expenses]);
  const totalThisMonth = useMemo(() => thisMonthExpenses.reduce((s, e) => s + e.jumlah, 0), [thisMonthExpenses]);

  const handleAdd = async () => {
    if (!form.keterangan.trim()) { showToast("error", "Keterangan tidak boleh kosong"); return; }
    if (!form.jumlah) { showToast("error", "Jumlah tidak boleh kosong"); return; }
    setLoading(true);
    try {
      await addExpense({
        keterangan: form.keterangan.trim(),
        jumlah: parseInt(form.jumlah, 10),
        kategori: form.kategori,
        tanggal: new Date().toISOString(),
      });
      showToast("success", "Pengeluaran dicatat");
      setForm({ keterangan: "", jumlah: "", kategori: KATEGORI_LIST[0] });
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + topPaddingWeb + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pengeluaran</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: 8 }]} onPress={() => setShowModal(true)}>
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.summary, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.summaryLabel, { color: colors.primary }]}>Total Pengeluaran Bulan Ini</Text>
        <Text style={[styles.summaryVal, { color: colors.destructive }]}>{formatCurrency(totalThisMonth)}</Text>
        <Text style={[styles.summaryCount, { color: colors.mutedForeground }]}>{thisMonthExpenses.length} catatan</Text>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={[styles.kategoriDot, { backgroundColor: colors.destructive }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.keterangan, { color: colors.text }]}>{item.keterangan}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.kategori} · {formatDate(item.tanggal)}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <Text style={[styles.jumlah, { color: colors.destructive }]}>{formatCurrency(item.jumlah)}</Text>
              <TouchableOpacity onPress={() => setDeleteTarget(item)}>
                <Feather name="trash-2" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="minus-circle" title="Belum ada pengeluaran" description="Catat pengeluaran operasional toko Anda" actionLabel="Tambah Pengeluaran" onAction={() => setShowModal(true)} />}
      />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderRadius: 20, paddingBottom: insets.bottom + 24 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Tambah Pengeluaran</Text>
            <Text style={[styles.katLabel, { color: colors.mutedForeground }]}>Kategori</Text>
            <View style={styles.katGrid}>
              {KATEGORI_LIST.map((k) => (
                <TouchableOpacity key={k} style={[styles.katItem, { backgroundColor: form.kategori === k ? colors.primary : colors.muted, borderRadius: 8 }]} onPress={() => setForm((f) => ({ ...f, kategori: k }))}>
                  <Text style={[styles.katText, { color: form.kategori === k ? "#fff" : colors.mutedForeground }]}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Keterangan" placeholder="Contoh: Bayar listrik" value={form.keterangan} onChangeText={(v) => setForm((f) => ({ ...f, keterangan: v }))} leftIcon="edit-2" />
            <Input label="Jumlah (Rp)" placeholder="Contoh: 150000" keyboardType="number-pad" value={form.jumlah} onChangeText={(v) => setForm((f) => ({ ...f, jumlah: v }))} leftIcon="dollar-sign" />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button title="Batal" variant="outline" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
              <Button title="Simpan" onPress={handleAdd} loading={loading} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal visible={!!deleteTarget} title="Hapus Pengeluaran" message={`Hapus catatan "${deleteTarget?.keterangan}"?`} onConfirm={async () => { await deleteExpense(deleteTarget!.id); showToast("success", "Pengeluaran dihapus"); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} danger />
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
  list: { padding: 16, gap: 8 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1 },
  kategoriDot: { width: 4, height: 36, borderRadius: 2 },
  keterangan: { fontSize: 14, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  jumlah: { fontSize: 15, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { padding: 24, gap: 14 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  katLabel: { fontSize: 13, fontWeight: "600" },
  katGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  katItem: { paddingHorizontal: 12, paddingVertical: 6 },
  katText: { fontSize: 12, fontWeight: "600" },
});
