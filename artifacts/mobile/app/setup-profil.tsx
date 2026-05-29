import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useToast } from "@/context/ToastContext";
import { useUserProfile } from "@/context/UserContext";

export default function SetupProfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();
  const { createInitialProfile } = useUserProfile();

  const [form, setForm] = useState({ namaLengkap: "", namaWarung: "", nomorWhatsapp: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (k: keyof typeof form) => (v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!form.namaLengkap.trim()) e.namaLengkap = "Nama lengkap tidak boleh kosong";
    if (!form.namaWarung.trim()) e.namaWarung = "Nama warung tidak boleh kosong";
    if (!form.nomorWhatsapp.trim()) e.nomorWhatsapp = "Nomor WhatsApp tidak boleh kosong";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await createInitialProfile(form);
      showToast("success", "Profil berhasil disimpan! Trial 14 hari dimulai.");
      router.replace("/(tabs)/beranda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Feather name="user-check" size={28} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Lengkapi Profil</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Isi data toko Anda untuk memulai</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius + 4 }]}>
          <View style={styles.form}>
            <Input label="Nama Lengkap" placeholder="Nama Anda" value={form.namaLengkap} onChangeText={setField("namaLengkap")} error={errors.namaLengkap} leftIcon="user" />
            <Input label="Nama Warung" placeholder="Nama toko/warung" value={form.namaWarung} onChangeText={setField("namaWarung")} error={errors.namaWarung} leftIcon="home" />
            <Input label="Nomor WhatsApp" placeholder="08xxxxxxxxxx" keyboardType="phone-pad" value={form.nomorWhatsapp} onChangeText={setField("nomorWhatsapp")} error={errors.nomorWhatsapp} leftIcon="phone" />
            <Button title="Simpan & Mulai" onPress={handleSave} loading={loading} fullWidth size="lg" />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 24 },
  header: { alignItems: "center", gap: 8 },
  logo: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14, textAlign: "center" },
  card: { padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  form: { gap: 14 },
});
