import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert, FlatList, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { useUserProfile } from "@/context/UserContext";
import { StatsCard } from "@/components/StatsCard";
import { TransactionCard } from "@/components/TransactionCard";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency, formatDate, isToday } from "@/utils/format";

export default function BerandaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const { profile, daysRemaining } = useUserProfile();
  const { transactions, products, debts, storeSettings } = useStore();

  const todayTx = useMemo(() => transactions.filter((t) => isToday(t.createdAt)), [transactions]);
  const todayRevenue = useMemo(() => todayTx.reduce((s, t) => s + t.total, 0), [todayTx]);
  const todayProfit = useMemo(() => todayTx.reduce((s, t) => s + t.keuntungan, 0), [todayTx]);
  const lowStockProducts = useMemo(() => products.filter((p) => p.stok <= p.stokMinimum), [products]);
  const unpaidDebts = useMemo(() => debts.filter((d) => !d.sudahLunas), [debts]);
  const totalDebt = useMemo(() => unpaidDebts.reduce((s, d) => s + d.jumlah, 0), [unpaidDebts]);
  const recentTx = transactions.slice(0, 5);

  const namaWarung = profile?.namaWarung ?? storeSettings.namaWarung ?? "Warung Saya";
  const namaUser = profile?.namaLengkap ?? user?.firstName ?? "Pemilik";

  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + topPaddingWeb + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Selamat datang,</Text>
          <Text style={[styles.name, { color: colors.text }]}>{namaUser} 👋</Text>
          <Text style={[styles.warung, { color: colors.primary }]}>{namaWarung}</Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/hutang")}
        >
          <Feather name="bell" size={20} color={colors.text} />
          {(lowStockProducts.length > 0 || unpaidDebts.length > 0) && (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.badgeText}>{lowStockProducts.length + unpaidDebts.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Trial Banner */}
      {profile?.statusAkun === "trial" && daysRemaining <= 3 && (
        <View style={[styles.trialBanner, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
          <Feather name="alert-triangle" size={16} color={colors.warning} />
          <Text style={[styles.trialText, { color: colors.warning }]}>
            Trial Anda berakhir dalam {daysRemaining} hari. Segera upgrade akun.
          </Text>
        </View>
      )}

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: colors.errorBg, borderColor: colors.destructive }]}
          onPress={() => router.push("/(tabs)/produk")}
        >
          <Feather name="alert-circle" size={16} color={colors.destructive} />
          <Text style={[styles.alertText, { color: colors.destructive }]}>
            {lowStockProducts.length} produk stok hampir habis
          </Text>
          <Feather name="chevron-right" size={14} color={colors.destructive} />
        </TouchableOpacity>
      )}

      {/* Stats Hari Ini */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Hari Ini</Text>
      <View style={styles.statsRow}>
        <StatsCard
          title="Pendapatan"
          value={formatCurrency(todayRevenue)}
          icon="dollar-sign"
          iconBg={colors.secondary}
          iconColor={colors.primary}
          subtitle={`${todayTx.length} transaksi`}
          style={{ flex: 1 }}
          onPress={() => router.push("/(tabs)/laporan")}
        />
        <StatsCard
          title="Keuntungan"
          value={formatCurrency(todayProfit)}
          icon="trending-up"
          iconBg="#DCFCE7"
          iconColor={colors.success}
          style={{ flex: 1 }}
          onPress={() => router.push("/(tabs)/laporan")}
        />
      </View>
      <View style={styles.statsRow}>
        <StatsCard
          title="Total Hutang"
          value={formatCurrency(totalDebt)}
          icon="users"
          iconBg={colors.warningBg}
          iconColor={colors.warning}
          subtitle={`${unpaidDebts.length} belum lunas`}
          style={{ flex: 1 }}
          onPress={() => router.push("/hutang")}
        />
        <StatsCard
          title="Total Produk"
          value={products.length.toString()}
          icon="box"
          iconBg={colors.muted}
          iconColor={colors.mutedForeground}
          subtitle={`${lowStockProducts.length} stok rendah`}
          style={{ flex: 1 }}
          onPress={() => router.push("/(tabs)/produk")}
        />
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Akses Cepat</Text>
      <View style={styles.quickGrid}>
        {[
          { label: "Kasir", icon: "shopping-cart" as const, route: "/(tabs)/kasir", color: colors.primary },
          { label: "Tambah Produk", icon: "plus-square" as const, route: "/tambah-produk", color: colors.success },
          { label: "Hutang", icon: "users" as const, route: "/hutang", color: colors.warning },
          { label: "Pengeluaran", icon: "minus-circle" as const, route: "/pengeluaran", color: colors.destructive },
          { label: "Laporan", icon: "bar-chart-2" as const, route: "/(tabs)/laporan", color: colors.primaryLight },
          { label: "Analisa", icon: "pie-chart" as const, route: "/analisa", color: colors.accent },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.quickItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIcon, { backgroundColor: item.color + "18" }]}>
              <Feather name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Transaksi Terbaru</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/laporan")}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      {recentTx.length === 0 ? (
        <EmptyState icon="shopping-bag" title="Belum ada transaksi" description="Mulai transaksi pertama dari menu Kasir" />
      ) : (
        recentTx.map((tx) => (
          <TransactionCard
            key={tx.id}
            transaction={tx}
            onPress={() => router.push({ pathname: "/detail-transaksi", params: { id: tx.id } })}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, gap: 0 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { fontSize: 13 },
  name: { fontSize: 20, fontWeight: "700" },
  warung: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  badge: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  trialBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  trialText: { flex: 1, fontSize: 13, fontWeight: "600" },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  alertText: { flex: 1, fontSize: 13, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10, marginTop: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 8 },
  seeAll: { fontSize: 13, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 8 },
  quickItem: { width: "30%", flex: 1, alignItems: "center", paddingVertical: 12, paddingHorizontal: 4, gap: 8 },
  quickIcon: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
});
