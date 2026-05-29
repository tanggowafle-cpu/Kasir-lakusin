import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { useUserProfile } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { formatDate } from "@/utils/format";

export default function PengaturanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { profile, daysRemaining } = useUserProfile();
  const { storeSettings, updateStoreSettings } = useStore();
  const { showToast } = useToast();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [form, setForm] = useState({
    namaWarung: storeSettings.namaWarung,
    nomorWhatsapp: storeSettings.nomorWhatsapp,
    alamat: storeSettings.alamat ?? "",
    stokMinimumDefault: storeSettings.stokMinimumDefault.toString(),
  });

  useEffect(() => {
    setForm({
      namaWarung: storeSettings.namaWarung,
      nomorWhatsapp: storeSettings.nomorWhatsapp,
      alamat: storeSettings.alamat ?? "",
      stokMinimumDefault: storeSettings.stokMinimumDefault.toString(),
    });
  }, [storeSettings]);

  const handleSave = async () => {
    if (!form.namaWarung.trim()) { showToast("error", "Nama warung tidak boleh kosong"); return; }
    const stokMin = parseInt(form.stokMinimumDefault, 10);
    if (isNaN(stokMin) || stokMin < 0) { showToast("error", "Batas stok harus angka valid"); return; }
    await updateStoreSettings({
      namaWarung: form.namaWarung.trim(),
      nomorWhatsapp: form.nomorWhatsapp.trim(),
      alamat: form.alamat.trim(),
      stokMinimumDefault: stokMin,
    });
    showToast("success", "Pengaturan berhasil disimpan");
  };

  const pickImage = async (type: "logo" | "qris") => {
    try {
      // Minta izin galeri
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast("error", "Izin akses galeri diperlukan");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: type === "logo",
        aspect: type === "logo" ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        await updateStoreSettings({
          [type === "logo" ? "logoUri" : "qrisUri"]: uri,
        });
        showToast("success", `${type === "logo" ? "Logo" : "QRIS"} berhasil diupload`);
      }
    } catch {
      showToast("error", "Gagal membuka galeri");
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      // AuthGuard di _layout.tsx otomatis redirect ke login
    } catch {
      showToast("error", "Gagal keluar, coba lagi");
      setLoggingOut(false);
    }
    setShowLogoutModal(false);
  };

  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + topPaddingWeb + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pengaturan</Text>

        {/* Profil */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={[styles.profileRow]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{(profile?.namaLengkap ?? user?.firstName ?? "U")[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.text }]}>{profile?.namaLengkap ?? user?.fullName ?? "Pengguna"}</Text>
              <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.primaryEmailAddress?.emailAddress}</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: profile?.statusAkun === "trial" ? colors.warningBg : profile?.statusAkun === "aktif" ? "#DCFCE7" : colors.errorBg
              }]}>
                <Text style={[styles.statusText, {
                  color: profile?.statusAkun === "trial" ? colors.warning : profile?.statusAkun === "aktif" ? colors.success : colors.destructive
                }]}>
                  {profile?.statusAkun === "trial" ? `Trial (${daysRemaining} hari lagi)` : profile?.statusAkun === "aktif" ? "Aktif" : "Expired"}
                </Text>
              </View>
            </View>
          </View>
          {profile && (
            <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Paket</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>{profile.paket === "basic" ? "Basic" : "Pro"}</Text>
            </View>
          )}
          {profile?.tanggalExpired && (
            <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Berlaku hingga</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>{formatDate(profile.tanggalExpired)}</Text>
            </View>
          )}
        </View>

        {/* Pengaturan Toko */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pengaturan Toko</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.form}>
            <Input label="Nama Warung" value={form.namaWarung} onChangeText={(v) => setForm((f) => ({ ...f, namaWarung: v }))} leftIcon="home" />
            <Input label="Nomor WhatsApp" value={form.nomorWhatsapp} onChangeText={(v) => setForm((f) => ({ ...f, nomorWhatsapp: v }))} keyboardType="phone-pad" leftIcon="phone" />
            <Input label="Alamat (opsional)" value={form.alamat} onChangeText={(v) => setForm((f) => ({ ...f, alamat: v }))} leftIcon="map-pin" />
            <Input label="Batas Minimum Stok (default)" value={form.stokMinimumDefault} onChangeText={(v) => setForm((f) => ({ ...f, stokMinimumDefault: v }))} keyboardType="number-pad" leftIcon="alert-triangle" />
            <Button title="Simpan Pengaturan" onPress={handleSave} fullWidth />
          </View>
        </View>

        {/* Logo & QRIS */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Logo & QRIS</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, gap: 16 }]}>
          {/* Logo */}
          <View>
            <Text style={[styles.imgLabel, { color: colors.mutedForeground }]}>Logo Warung</Text>
            <TouchableOpacity
              style={[styles.imgPicker, { borderColor: colors.primary, borderRadius: colors.radius }]}
              onPress={() => pickImage("logo")}
              activeOpacity={0.7}
            >
              {storeSettings.logoUri ? (
                <>
                  <Image source={{ uri: storeSettings.logoUri }} style={styles.imgPreview} resizeMode="cover" />
                  <View style={styles.imgOverlay}>
                    <Feather name="edit-2" size={20} color="#fff" />
                    <Text style={styles.imgOverlayText}>Ganti Logo</Text>
                  </View>
                </>
              ) : (
                <View style={styles.imgPlaceholder}>
                  <View style={[styles.imgIconWrap, { backgroundColor: colors.secondary }]}>
                    <Feather name="image" size={28} color={colors.primary} />
                  </View>
                  <Text style={[styles.imgPlaceholderText, { color: colors.text }]}>Upload Logo Warung</Text>
                  <Text style={[styles.imgPlaceholderSub, { color: colors.mutedForeground }]}>Ketuk untuk pilih dari galeri</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* QRIS */}
          <View>
            <Text style={[styles.imgLabel, { color: colors.mutedForeground }]}>Gambar QRIS</Text>
            <TouchableOpacity
              style={[styles.imgPicker, { borderColor: colors.primary, borderRadius: colors.radius, height: 180 }]}
              onPress={() => pickImage("qris")}
              activeOpacity={0.7}
            >
              {storeSettings.qrisUri ? (
                <>
                  <Image source={{ uri: storeSettings.qrisUri }} style={styles.imgPreview} resizeMode="contain" />
                  <View style={styles.imgOverlay}>
                    <Feather name="edit-2" size={20} color="#fff" />
                    <Text style={styles.imgOverlayText}>Ganti QRIS</Text>
                  </View>
                </>
              ) : (
                <View style={styles.imgPlaceholder}>
                  <View style={[styles.imgIconWrap, { backgroundColor: colors.secondary }]}>
                    <Feather name="grid" size={28} color={colors.primary} />
                  </View>
                  <Text style={[styles.imgPlaceholderText, { color: colors.text }]}>Upload Gambar QRIS</Text>
                  <Text style={[styles.imgPlaceholderSub, { color: colors.mutedForeground }]}>Digunakan di struk pembayaran QRIS</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Aksi Lain */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Lainnya</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, gap: 0 }]}>
          {[
            { label: "Riwayat Stok", icon: "clock" as const, route: "/riwayat-stok" },
            { label: "Kelola Hutang", icon: "users" as const, route: "/hutang" },
            { label: "Pengeluaran", icon: "minus-circle" as const, route: "/pengeluaran" },
            { label: "Analisa Produk", icon: "pie-chart" as const, route: "/analisa" },
          ].map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, { borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: colors.secondary }]}>
                <Feather name={item.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tombol Keluar */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.destructive }]}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Keluar Akun</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>Lakusin v1.0.0</Text>
      </ScrollView>

      {/* Modal konfirmasi keluar */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Keluar Akun"
        message="Yakin ingin keluar dari akun Anda?"
        confirmLabel={loggingOut ? "Memproses..." : "Keluar"}
        cancelLabel="Batal"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
        danger
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, gap: 12 },
  headerTitle: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  section: { padding: 16, borderWidth: 1 },
  profileRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, fontWeight: "800", color: "#fff" },
  profileName: { fontSize: 16, fontWeight: "700" },
  profileEmail: { fontSize: 13, marginTop: 2 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10, marginTop: 10, borderTopWidth: 1 },
  infoLabel: { fontSize: 13 },
  infoVal: { fontSize: 13, fontWeight: "600" },
  form: { gap: 14 },
  imgLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  imgPicker: { borderWidth: 1.5, borderStyle: "dashed", height: 140, overflow: "hidden", position: "relative" },
  imgPreview: { width: "100%", height: "100%" },
  imgOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.45)", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 6 },
  imgOverlayText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  imgPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 16 },
  imgIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  imgPlaceholderText: { fontSize: 14, fontWeight: "600" },
  imgPlaceholderSub: { fontSize: 12 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  menuIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 12, borderWidth: 1.5, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: "700" },
  version: { textAlign: "center", fontSize: 12, marginBottom: 8 },
});
