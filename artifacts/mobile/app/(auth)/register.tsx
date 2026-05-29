import { useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useToast } from "@/context/ToastContext";
import { useUserProfile } from "@/context/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Step = "form" | "verify";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();
  const { createInitialProfile } = useUserProfile();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [pendingData, setPendingData] = useState<{
    namaLengkap: string; namaWarung: string; nomorWhatsapp: string;
  } | null>(null);

  const [form, setForm] = useState({
    namaLengkap: "",
    email: "",
    namaWarung: "",
    nomorWhatsapp: "",
    password: "",
    konfirmasi: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (k: keyof typeof form) => (v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.namaLengkap.trim()) e.namaLengkap = "Nama lengkap tidak boleh kosong";
    if (!form.email.trim()) e.email = "Email tidak boleh kosong";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Format email tidak valid";
    if (!form.namaWarung.trim()) e.namaWarung = "Nama warung tidak boleh kosong";
    if (!form.nomorWhatsapp.trim()) e.nomorWhatsapp = "Nomor WhatsApp tidak boleh kosong";
    else if (!/^[0-9+]{8,15}$/.test(form.nomorWhatsapp.replace(/\s/g, ""))) e.nomorWhatsapp = "Nomor WhatsApp tidak valid";
    if (!form.password) e.password = "Password tidak boleh kosong";
    else if (form.password.length < 8) e.password = "Password minimal 8 karakter";
    if (!form.konfirmasi) e.konfirmasi = "Konfirmasi password tidak boleh kosong";
    else if (form.konfirmasi !== form.password) e.konfirmasi = "Konfirmasi password tidak cocok";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate() || !isLoaded) return;
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: form.email.trim(),
        password: form.password,
        firstName: form.namaLengkap.split(" ")[0],
        lastName: form.namaLengkap.split(" ").slice(1).join(" ") || undefined,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingData({ namaLengkap: form.namaLengkap, namaWarung: form.namaWarung, nomorWhatsapp: form.nomorWhatsapp });
      setStep("verify");
      showToast("success", "Kode verifikasi dikirim ke email Anda");
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message ?? "Gagal mendaftar";
      if (msg.toLowerCase().includes("email")) {
        setErrors((e) => ({ ...e, email: "Email sudah terdaftar" }));
        showToast("error", "Email sudah terdaftar");
      } else {
        showToast("error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim() || !isLoaded || !pendingData) return;
    if (code.trim().length !== 6) {
      showToast("error", "Kode verifikasi harus 6 digit");
      return;
    }
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        await createInitialProfile(pendingData);
        showToast("success", "Akun berhasil dibuat! Trial 14 hari dimulai.");
        router.replace("/(tabs)/beranda");
      }
    } catch (err: any) {
      showToast("error", "Kode verifikasi salah atau sudah kedaluwarsa");
    } finally {
      setLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => setStep("form")} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.header}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Feather name="mail" size={28} color="#fff" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Verifikasi Email</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Masukkan kode 6 digit yang dikirim ke {form.email}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius + 4 }]}>
            <Input
              label="Kode Verifikasi"
              placeholder="Contoh: 123456"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              leftIcon="key"
            />
            <Button title="Verifikasi & Daftar" onPress={handleVerify} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Feather name="shopping-bag" size={28} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Buat Akun Baru</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Trial gratis 14 hari setelah daftar</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius + 4 }]}>
          <View style={styles.form}>
            <Input label="Nama Lengkap" placeholder="Nama lengkap Anda" value={form.namaLengkap} onChangeText={setField("namaLengkap")} error={errors.namaLengkap} leftIcon="user" />
            <Input label="Email" placeholder="nama@email.com" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={setField("email")} error={errors.email} leftIcon="mail" />
            <Input label="Nama Warung" placeholder="Nama toko/warung Anda" value={form.namaWarung} onChangeText={setField("namaWarung")} error={errors.namaWarung} leftIcon="home" />
            <Input label="Nomor WhatsApp" placeholder="08xxxxxxxxxx" keyboardType="phone-pad" value={form.nomorWhatsapp} onChangeText={setField("nomorWhatsapp")} error={errors.nomorWhatsapp} leftIcon="phone" />
            <Input label="Password" placeholder="Minimal 8 karakter" isPassword value={form.password} onChangeText={setField("password")} error={errors.password} leftIcon="lock" />
            <Input label="Konfirmasi Password" placeholder="Ulangi password" isPassword value={form.konfirmasi} onChangeText={setField("konfirmasi")} error={errors.konfirmasi} leftIcon="lock" />
            <Button title="Daftar Sekarang" onPress={handleRegister} loading={loading} fullWidth size="lg" style={{ marginTop: 4 }} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Sudah punya akun?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}> Masuk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 20 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  header: { alignItems: "center", gap: 8 },
  logo: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, textAlign: "center" },
  card: { padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  form: { gap: 14 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "700" },
});
