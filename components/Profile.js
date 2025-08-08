import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function Profile() {
  const [name, setName] = useState("Matti Meikäläinen");
  const [email, setEmail] = useState("matti@example.com");

  const handleSave = () => {
    // TODO: Lähetä muutokset API:in
    console.log("Tallennetaan:", { name, email });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profiili</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nimi"
      />

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Sähköposti"
        keyboardType="email-address"
      />

      <Button title="Tallenna" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#1e293b",
  },
  input: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
});
