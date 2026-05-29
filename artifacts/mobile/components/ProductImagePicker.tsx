import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  value?: string;
  onChange: (uri: string | undefined) => void;
  productName?: string;
}

const API_BASE = `https://${process.env["EXPO_PUBLIC_DOMAIN"]}/api`;

export function ProductImagePicker({ value, onChange, productName }: Props) {
  const colors = useColors();
  const [showModal, setShowModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiImages, setAiImages] = useState<string[]>([]);
  const [aiError, setAiError] = useState("");

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
      setShowModal(false);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
      setShowModal(false);
    }
  };

  const fetchAiSuggestions = async () => {
    if (!productName?.trim()) {
      setAiError("Isi nama produk terlebih dahulu");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setAiImages([]);
    try {
      const resp = await fetch(`${API_BASE}/ai/suggest-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Gagal");
      setAiImages(data.imageUrls ?? []);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Gagal mendapatkan saran gambar");
    } finally {
      setAiLoading(false);
    }
  };

  const selectAiImage = (url: string) => {
    onChange(url);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.picker, { borderColor: colors.border, borderRadius: colors.radius, backgroundColor: colors.muted }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        {value ? (
          <Image source={{ uri: value }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Feather name="image" size={28} color={colors.mutedForeground} />
            <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>Tambah Foto</Text>
          </View>
        )}
        <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
          <Feather name="camera" size={12} color="#fff" />
        </View>
      </TouchableOpacity>

      {value && (
        <TouchableOpacity onPress={() => onChange(undefined)} style={styles.removeBtn}>
          <Feather name="x-circle" size={14} color={colors.destructive} />
          <Text style={[styles.removeText, { color: colors.destructive }]}>Hapus Foto</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderRadius: 20 }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Pilih Foto Produk</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={styles.sourceRow}>
              <TouchableOpacity style={[styles.sourceBtn, { backgroundColor: colors.secondary, borderRadius: 12 }]} onPress={pickFromGallery}>
                <Feather name="image" size={22} color={colors.primary} />
                <Text style={[styles.sourceBtnText, { color: colors.primary }]}>Galeri</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sourceBtn, { backgroundColor: colors.secondary, borderRadius: 12 }]} onPress={pickFromCamera}>
                <Feather name="camera" size={22} color={colors.primary} />
                <Text style={[styles.sourceBtnText, { color: colors.primary }]}>Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sourceBtn, { backgroundColor: "#EDE9FE", borderRadius: 12 }]}
                onPress={fetchAiSuggestions}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color="#7C3AED" />
                ) : (
                  <Feather name="zap" size={22} color="#7C3AED" />
                )}
                <Text style={[styles.sourceBtnText, { color: "#7C3AED" }]}>AI Saran</Text>
              </TouchableOpacity>
            </View>

            {aiError ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{aiError}</Text>
            ) : null}

            {aiImages.length > 0 && (
              <>
                <Text style={[styles.aiLabel, { color: colors.mutedForeground }]}>
                  Pilih gambar yang sesuai
                </Text>
                <FlatList
                  data={aiImages}
                  keyExtractor={(_, i) => i.toString()}
                  numColumns={3}
                  columnWrapperStyle={{ gap: 6 }}
                  contentContainerStyle={{ gap: 6 }}
                  style={{ maxHeight: 260 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => selectAiImage(item)} activeOpacity={0.8}>
                      <Image
                        source={{ uri: item }}
                        style={[styles.aiThumb, { borderRadius: 8 }]}
                      />
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            {aiLoading && (
              <View style={styles.aiLoadingWrap}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.aiLoadingText, { color: colors.mutedForeground }]}>AI sedang mencari gambar...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  picker: { width: 100, height: 100, borderWidth: 1.5, borderStyle: "dashed", overflow: "hidden", alignSelf: "center" },
  preview: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  placeholderText: { fontSize: 11, fontWeight: "500" },
  editBadge: { position: "absolute", bottom: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  removeBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "center", marginTop: 6 },
  removeText: { fontSize: 12, fontWeight: "500" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { padding: 20, paddingBottom: 40, gap: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sourceRow: { flexDirection: "row", gap: 10 },
  sourceBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  sourceBtnText: { fontSize: 12, fontWeight: "700" },
  errorText: { fontSize: 13, textAlign: "center" },
  aiLabel: { fontSize: 12, fontWeight: "500" },
  aiThumb: { width: "100%", aspectRatio: 1, minWidth: 90 },
  aiLoadingWrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  aiLoadingText: { fontSize: 13 },
});
