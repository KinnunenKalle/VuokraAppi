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
            streetAddress: address.trim(), // oikea kenttä API:lle
            zipcode: zipcode.trim(),
            rent: rentNumber,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

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

            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }

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
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Osoite */}
        <Text style={styles.label}>Osoite</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Osoite"
          autoCapitalize="words"
          editable={!loading}
        />

        {/* Postinumero */}
        <Text style={styles.label}>Postinumero</Text>
        <TextInput
          style={styles.input}
          value={zipcode}
          onChangeText={setZipcode}
          placeholder="Postinumero"
          keyboardType="numeric"
          editable={!loading}
        />

        {/* Vuokra */}
        <Text style={styles.label}>Vuokra (€ / kk)</Text>
        <TextInput
          style={styles.input}
          value={rent}
          onChangeText={setRent}
          placeholder="Vuokra"
          keyboardType="numeric"
          editable={!loading}
        />

        {/* Tallenna-painike */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Tallennetaan..." : "Tallenna"}
          </Text>
        </TouchableOpacity>

        {/* Poista-painike */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#f44336", marginTop: 20 }]}
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
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "white",
    flexGrow: 1,
  },
  label: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#03bafc",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
});
