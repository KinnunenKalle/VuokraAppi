import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "./AuthContext";

export default function SelectRoleScreen({ navigation }) {
  const { setSelectedRole } = useAuth();

  // ✅ Kun käyttäjä valitsee roolin, tallennetaan se contextiin (valinnainen)
  // ja välitetään se navigoinnin mukana rekisteröintinäkymään
  const handleRoleSelect = (role) => {
    console.log("Rooli valittu:", role);
    setSelectedRole(role); // Tallennetaan AuthContextiin, jos muualla tarvitaan

    // ⏱ Varmuuden vuoksi pieni viive ennen navigaatiota (ei ole aina pakollinen)
    setTimeout(() => {
      navigation.navigate("Register", { role }); // Navigoidaan ja välitetään rooli propseissa
    }, 0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Valitse roolisi</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#60a5fa" }]}
        onPress={() => handleRoleSelect("Landlord")}
      >
        <Text style={styles.buttonText}>Olen vuokranantaja</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#34d399" }]}
        onPress={() => handleRoleSelect("Tenant")}
      >
        <Text style={styles.buttonText}>Olen vuokralainen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    color: "#111827",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginVertical: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
});
