import React, { useState, useRef } from 'react';
import { TextInput, View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface AppTextInputProps extends React.ComponentProps<typeof TextInput> {
  label?: string;
  error?: string;
  icon?: string;
}

export default function AppTextInput({ label, error, icon, ...props }: AppTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onFocus?.(null as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onBlur?.(null as any);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : colors.border, error ? colors.error : colors.primary],
  });

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, isFocused && styles.labelFocused]}>
          {label}
        </Text>
      )}
      <Animated.View style={[styles.inputContainer, { borderColor }]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textLight}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error && <Text style={styles.errorText}>⚠ {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
    marginLeft: 2,
  },
  labelFocused: {
    color: colors.primary,
  },
  inputContainer: {
    backgroundColor: colors.surfaceMid,
    borderWidth: 1.5,
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    fontWeight: '500',
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
});
