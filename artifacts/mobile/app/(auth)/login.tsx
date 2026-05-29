import { useSignIn, useOAuth } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useToast } from "@/context/ToastContext";
import { Feather } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email tidak boleh kosong";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Format email tidak valid";
    if (!password) e.password = "Password tidak boleh kosong";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate() || !isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/beranda");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message ?? "Email atau password salah";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive: setAct } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/", { scheme: "mobile" }),
      });
      if (createdSessionId && setAct) {
        await setAct({ session: createdSessionId });
        router.replace("/(tabs)/beranda");
      }
    } catch (err: any) {
      showToast("error", "Gagal masuk dengan Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Feather name="shopping-bag" size={32} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>Lakusin</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Aplikasi Kasir Modern</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius + 4 }]}>
          <Text style={[styles.title, { color: colors.text }]}>Selamat Datang</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Masuk untuk melanjutkan</Text>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="nama@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
              error={errors.email}
              leftIcon="mail"
            />
            <Input
              label="Password"
              placeholder="Masukkan password"
              isPassword
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
              error={errors.password}
              leftIcon="lock"
            />

            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")} style={styles.forgotWrap}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Lupa Password?</Text>
            </TouchableOpacity>

            <Button
              title="Masuk"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: 4 }}
            />

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>atau</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}
              onPress={handleGoogle}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.googleG}>G</Text>
              <Text style={[styles.googleText, { color: colors.text }]}>
                {googleLoading ? "Memuat..." : "Masuk dengan Google"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Belum punya akun?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}> Daftar Sekarang</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 24 },
  header: { alignItems: "center", gap: 8 },
  logo: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  tagline: { fontSize: 14 },
  card: { padding: 24, gap: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, marginBottom: 8 },
  form: { gap: 14, marginTop: 8 },
  forgotWrap: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, fontWeight: "600" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, borderWidth: 1.5, paddingVertical: 13 },
  googleG: { fontSize: 18, fontWeight: "800", color: "#4285F4" },
  googleText: { fontSize: 15, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "700" },
});
