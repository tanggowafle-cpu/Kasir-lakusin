import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useToast } from "@/context/ToastContext";

type Step = "email" | "reset";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) { showToast("error", "Email tidak boleh kosong"); return; }
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: email.trim() });
      setStep("reset");
      showToast("success", "Kode reset dikirim ke email Anda");
    } catch {
      showToast("error", "Email tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!code.trim()) { showToast("error", "Kode tidak boleh kosong"); return; }
    if (!newPassword) { showToast("error", "Password baru tidak boleh kosong"); return; }
    if (newPassword.length < 8) { showToast("error", "Password minimal 8 karakter"); return; }
    if (newPassword !== konfirmasi) { showToast("error", "Konfirmasi password tidak cocok"); return; }
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPassword,
      } as any);
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        showToast("success", "Password berhasil direset");
        router.replace("/(tabs)/beranda");
      }
    } catch {
      showToast("error", "Kode salah atau sudah kedaluwarsa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.warning }]}>
            <Feather name="unlock" size={28} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Lupa Password</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {step === "email" ? "Masukkan email untuk menerima kode reset" : "Masukkan kode dan password baru"}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius + 4 }]}>
          {step === "email" ? (
            <View style={styles.form}>
              <Input label="Email" placeholder="nama@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} leftIcon="mail" />
              <Button title="Kirim Kode Reset" onPress={handleSendCode} loading={loading} fullWidth size="lg" />
            </View>
          ) : (
            <View style={styles.form}>
              <Input label="Kode Verifikasi" placeholder="6 digit kode dari email" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} leftIcon="key" />
              <Input label="Password Baru" placeholder="Minimal 8 karakter" isPassword value={newPassword} onChangeText={setNewPassword} leftIcon="lock" />
              <Input label="Konfirmasi Password" placeholder="Ulangi password baru" isPassword value={konfirmasi} onChangeText={setKonfirmasi} leftIcon="lock" />
              <Button title="Reset Password" onPress={handleReset} loading={loading} fullWidth size="lg" />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 24 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  header: { alignItems: "center", gap: 8 },
  logo: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, textAlign: "center" },
  card: { padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  form: { gap: 14 },
});
