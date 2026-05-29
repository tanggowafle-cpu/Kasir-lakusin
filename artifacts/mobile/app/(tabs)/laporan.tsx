import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import { StatsCard } from "@/components/StatsCard";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency, formatDate, isToday, isThisWeek, isThisMonth } from "@/utils/format";
import { Transaction } from "@/types";

type Period = "harian" | "mingguan" | "bulanan";

function filterByPeriod(transactions: Transaction[], period: Period) {
  return transactions.filter((t) => {
    if (period === "harian") return isToday(t.createdAt);
    if (period === "mingguan") return isThisWeek(t.createdAt);
    return isThisMonth(t.createdAt);
  });
}

function getLast7DaysData(transactions: Transaction[]) {
  const days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("id-ID", { weekday: "short" });
    const value = transactions
      .filter((t) => new Date(t.createdAt).toDateString() === d.toDateString())
      .reduce((s, t) => s + t.total, 0);
    days.push({ label, value });
  }
  return days;
}

function getLast6MonthsData(transactions: Transaction[]) {
  const months: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString("id-ID", { month: "short" });
    const value = transactions
      .filter((t) => {
        const td = new Date(t.createdAt);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      })
      .reduce((s, t) => s + t.total, 0);
    months.push({ label, value });
  }
  return months;
}

export default function LaporanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, expenses, storeSettings } = useStore();
  const [period, setPeriod] = useState<Period>("harian");

  const filtered = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (period === "harian") return isToday(e.tanggal);
      if (period === "mingguan") return isThisWeek(e.tanggal);
      return isThisMonth(e.tanggal);
    });
  }, [expenses, period]);

  const totalPendapatan = useMemo(() => filtered.reduce((s, t) => s + t.total, 0), [filtered]);
  const totalModal = useMemo(() => filtered.reduce((s, t) => s + t.modal, 0), [filtered]);
  const totalKeuntungan = useMemo(() => filtered.reduce((s, t) => s + t.keuntungan, 0), [filtered]);
  const totalPengeluaran = useMemo(() => filteredExpenses.reduce((s, e) => s + e.jumlah, 0), [filteredExpenses]);
  const labaBersih = totalKeuntungan - totalPengeluaran;

  const chartData7Days = useMemo(() => getLast7DaysData(transactions), [transactions]);
  const chartData6Months = useMemo(() => getLast6MonthsData(transactions), [transactions]);

  const exportHTML = () => {
    const rows = filtered.map((t) => `
      <tr>
        <td>${formatDate(t.createdAt)}</td>
        <td>${t.items.map((i) => i.nama).join(", ")}</td>
        <td>${t.metodePembayaran}</td>
        <td>${formatCurrency(t.total)}</td>
        <td>${formatCurrency(t.keuntungan)}</td>
      </tr>
    `).join("");

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#1B4F8A}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#1B4F8A;color:#fff}tr:nth-child(even){background:#f2f2f2}.summary{margin:20px 0;padding:16px;background:#f0f4f8;border-radius:8px}</style>
</head><body>
<h1>Laporan Penjualan - ${storeSettings.namaWarung}</h1>
<p>Periode: ${period === "harian" ? "Hari Ini" : period === "mingguan" ? "Minggu Ini" : "Bulan Ini"}</p>
<div class="summary">
<p><strong>Total Pendapatan:</strong> ${formatCurrency(totalPendapatan)}</p>
<p><strong>Total Modal:</strong> ${formatCurrency(totalModal)}</p>
<p><strong>Keuntungan Kotor:</strong> ${formatCurrency(totalKeuntungan)}</p>
<p><strong>Total Pengeluaran:</strong> ${formatCurrency(totalPengeluaran)}</p>
<p><strong>Laba Bersih:</strong> ${formatCurrency(labaBersih)}</p>
</div>
<h2>Rincian Transaksi</h2>
<table><thead><tr><th>Tanggal</th><th>Produk</th><th>Metode</th><th>Total</th><th>Keuntungan</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
  };

  const handleExportPDF = async () => {
    try {
      const html = exportHTML();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Export Laporan PDF" });
    } catch {
      Alert.alert("Error", "Gagal export PDF");
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const data = filtered.map((t) => ({
        Tanggal: formatDate(t.createdAt),
        Produk: t.items.map((i) => i.nama).join(", "),
        Metode: t.metodePembayaran,
        Total: t.total,
        Keuntungan: t.keuntungan,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const uri = (FileSystem.cacheDirectory ?? "") + "laporan.xlsx";
      await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri, { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", dialogTitle: "Export Laporan Excel" });
    } catch {
      Alert.alert("Error", "Gagal export Excel");
    }
  };

  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + topPaddingWeb + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Laporan</Text>
        <View style={styles.exportRow}>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.secondary, borderRadius: 8 }]} onPress={handleExportPDF}>
            <Feather name="file-text" size={14} color={colors.primary} />
            <Text style={[styles.exportText, { color: colors.primary }]}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: "#DCFCE7", borderRadius: 8 }]} onPress={handleExportExcel}>
            <Feather name="grid" size={14} color={colors.success} />
            <Text style={[styles.exportText, { color: colors.success }]}>Excel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Period Tabs */}
      <View style={[styles.periodRow, { backgroundColor: colors.muted, borderRadius: 12 }]}>
        {(["harian", "mingguan", "bulanan"] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodTab, { backgroundColor: period === p ? colors.primary : "transparent", borderRadius: 10 }]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, { color: period === p ? "#fff" : colors.mutedForeground }]}>
              {p === "harian" ? "Harian" : p === "mingguan" ? "Mingguan" : "Bulanan"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatsCard title="Pendapatan" value={formatCurrency(totalPendapatan)} icon="dollar-sign" iconBg={colors.secondary} iconColor={colors.primary} style={{ flex: 1 }} />
        <StatsCard title="Keuntungan" value={formatCurrency(totalKeuntungan)} icon="trending-up" iconBg="#DCFCE7" iconColor={colors.success} style={{ flex: 1 }} />
      </View>
      <View style={styles.statsGrid}>
        <StatsCard title="Pengeluaran" value={formatCurrency(totalPengeluaran)} icon="minus-circle" iconBg={colors.errorBg} iconColor={colors.destructive} style={{ flex: 1 }} />
        <StatsCard title="Laba Bersih" value={formatCurrency(labaBersih)} icon="award" iconBg={labaBersih >= 0 ? "#DCFCE7" : colors.errorBg} iconColor={labaBersih >= 0 ? colors.success : colors.destructive} style={{ flex: 1 }} />
      </View>
      <StatsCard title="Jumlah Transaksi" value={filtered.length.toString()} icon="shopping-bag" iconBg={colors.muted} iconColor={colors.mutedForeground} subtitle={`Modal: ${formatCurrency(totalModal)}`} />

      {/* Grafik */}
      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Pendapatan 7 Hari</Text>
        <SimpleBarChart
          data={chartData7Days.map((d) => d.value)}
          labels={chartData7Days.map((d) => d.label)}
          color={colors.primary}
          formatValue={(v) => v > 0 ? `${Math.round(v / 1000)}rb` : ""}
        />
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Pendapatan 6 Bulan</Text>
        <SimpleBarChart
          data={chartData6Months.map((d) => d.value)}
          labels={chartData6Months.map((d) => d.label)}
          color={colors.primaryLight}
          formatValue={(v) => v > 0 ? `${Math.round(v / 1000)}rb` : ""}
        />
      </View>

      {/* Akses */}
      <View style={styles.linkRow}>
        <TouchableOpacity style={[styles.linkBtn, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]} onPress={() => router.push("/pengeluaran")}>
          <Feather name="minus-circle" size={18} color={colors.destructive} />
          <Text style={[styles.linkText, { color: colors.text }]}>Pengeluaran Operasional</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkBtn, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]} onPress={() => router.push("/analisa")}>
          <Feather name="pie-chart" size={18} color={colors.primary} />
          <Text style={[styles.linkText, { color: colors.text }]}>Analisa Produk</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, gap: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  exportRow: { flexDirection: "row", gap: 8 },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6 },
  exportText: { fontSize: 12, fontWeight: "700" },
  periodRow: { flexDirection: "row", padding: 4, gap: 4 },
  periodTab: { flex: 1, paddingVertical: 8, alignItems: "center" },
  periodText: { fontSize: 13, fontWeight: "700" },
  statsGrid: { flexDirection: "row", gap: 10 },
  chartCard: { padding: 16, borderWidth: 1 },
  chartTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  linkRow: { gap: 8 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1 },
  linkText: { flex: 1, fontSize: 14, fontWeight: "600" },
});
