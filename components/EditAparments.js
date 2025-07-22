import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "./AuthContext";

export default function EditApartment({ route, navigation }) {
  const { apartment } = route.params;
  const { accessToken } = useAuth();

  const [address, setAddress] = useState(apartment.streetAddress || "");
  const [zipcode, setZipcode] = useState(apartment.zipcode || "");
  const [rent, setRent] = useState(
    apartment.rent ? String(apartment.rent) : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!address.trim()) {
      Alert.alert("Virhe", "Osoite ei voi olla tyhjä");
      return;
    }
    if (!zipcode.trim()) {
      Alert.alert("Virhe", "Postinumero ei voi olla tyhjä");
      return;
    }

    const rentNumber = Number(rent);
    if (isNaN(rentNumber) || rentNumber < 0) {
      Alert.alert("Virhe", "Vuokran tulee olla positiivinen numero");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://vuokraappi-api-gw-dev.azure-api.net/apartments/${apartment.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            streetAddress: address.trim(),
            zipcode: zipcode.trim(),
            rent: rentNumber,
          }),
        }
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      Alert.alert("Asunto päivitetty onnistuneesti");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Virhe päivityksessä", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert("Vahvista poisto", "Haluatko varmasti poistaa tämän asunnon?", [
      { text: "Peruuta", style: "cancel" },
      {
        text: "Poista",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            const res = await fetch(
              `https://vuokraappi-api-gw-dev.azure-api.net/apartments/${apartment.id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            Alert.alert("Asunto poistettu onnistuneesti");
            navigation.navigate("Apartments");
          } catch (error) {
            Alert.alert("Virhe poistossa", error.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Osoite</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Esim. Koivukujantie 5"
          autoCapitalize="words"
          editable={!loading}
        />

        <Text style={styles.label}>Postinumero</Text>
        <TextInput
          style={styles.input}
          value={zipcode}
          onChangeText={setZipcode}
          placeholder="Esim. 00100"
          keyboardType="numeric"
          editable={!loading}
        />

        <Text style={styles.label}>Vuokra (€ / kk)</Text>
        <TextInput
          style={styles.input}
          value={rent}
          onChangeText={setRent}
          placeholder="Esim. 850"
          keyboardType="numeric"
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Tallennetaan..." : "Tallenna"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonDelete}
          onPress={handleDelete}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Poista asunto</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    padding: 24,
    paddingTop: 40,
    flexGrow: 1,
  },
  label: {
    fontWeight: "600",
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonPrimary: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    elevation: 4,
  },
  buttonDelete: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    elevation: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
