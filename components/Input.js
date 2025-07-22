import { View, Text, TextInput, StyleSheet } from "react-native";
import React, { useState } from "react";

const Input = ({
  title,
  placeholder,
  keyboard = "default",
  is_password = false,
  value,
  onChangeText,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{title}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        style={[styles.input, isFocused && styles.inputFocused]}
        secureTextEntry={is_password}
        keyboardType={keyboard}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: "#0ea5e9",
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputFocused: {
    borderColor: "#0ea5e9",
    backgroundColor: "#ffffff",
  },
});

export default Input;
