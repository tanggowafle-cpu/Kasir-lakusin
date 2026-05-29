import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/context/ToastContext';
import { useColors } from '@/hooks/useColors';
import { ToastMessage } from '@/types';

function ToastItem({ toast }: { toast: ToastMessage }) {
  const colors = useColors();
  const { removeToast } = useToast();

  const bgColor = toast.type === 'success'
    ? colors.success
    : toast.type === 'error'
    ? colors.destructive
    : colors.warning;

  const icon = toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : '⚠';

  return (
    <TouchableOpacity
      onPress={() => removeToast(toast.id)}
      style={[styles.toast, { backgroundColor: bgColor }]}
      activeOpacity={0.9}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
    </TouchableOpacity>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 20,
  },
});
