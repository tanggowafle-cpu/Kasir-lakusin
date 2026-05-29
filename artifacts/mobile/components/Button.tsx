import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const colors = useColors();

  const bg = variant === 'primary' ? colors.primary
    : variant === 'secondary' ? colors.secondary
    : variant === 'danger' ? colors.destructive
    : 'transparent';

  const textColor = variant === 'primary' ? '#fff'
    : variant === 'secondary' ? colors.primary
    : variant === 'outline' ? colors.primary
    : variant === 'danger' ? '#fff'
    : colors.primary;

  const borderColor = variant === 'outline' ? colors.primary : 'transparent';

  const paddingV = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const paddingH = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          opacity: disabled || loading ? 0.6 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          borderRadius: colors.radius,
        },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: textColor, fontSize }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
