import React, { useState } from "react";
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from "react-native";
import Input from "./Input.js";
import { useAuth } from "./AuthContext";

export default function AddApartment({ navigation }) {
  // Käyttäjän syöttämät kentät
  const [streetaddress, setStreetAddress] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [size, setSize] = useState("");
  const [rent, setRent] = useState("");

  // Haetaan käyttäjän token ja ID kontekstista
  const { accessToken, userId } = useAuth();

  // Napin painallus: validoi kentät, hae koordinaatit ja lähetä asunto
  const handleAddApartment = async () => {
    // 1. Kenttävalidointi
    if (!streetaddress || !zipcode || !size || !rent) {
      Alert.alert("Täytä kaikki kentät!");
      return;
    }

    const sizeNumber = Number(size);
    const rentNumber = Number(rent);

    if (
      isNaN(sizeNumber) ||
      sizeNumber <= 0 ||
      isNaN(rentNumber) ||
      rentNumber <= 0
    ) {
      Alert.alert("Anna kelvolliset numerot vuokralle ja koolle.");
      return;
    }

    // 2. Haetaan koordinaatit Nominatim-palvelusta
    const fullAddress = `${streetaddress}, ${zipcode}`;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          fullAddress
        )}`
      );

      const data = await response.json();

      if (data.length === 0) {
        Alert.alert("Osoitetta ei löytynyt", "Tarkista osoite: " + fullAddress);
        return;
      }

      const { lat, lon } = data[0];

      // 3. Rakennetaan asunto-objekti
      const newApartment = {
        streetAddress: streetaddress,
        city: "", // Valinnainen kenttä, ei käytössä
        region: "", // Valinnainen kenttä, ei käytössä
        zipcode,
        size: sizeNumber,
        rent: rentNumber,
        userId,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      };

      // 4. Lähetetään asunto API:in
      const res = await fetch(
        "https://vuokraappi-api-gw-dev.azure-api.net/apartments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(newApartment),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Asunto lisätty!");
      navigation.navigate("Apartments");
    } catch (err) {
      console.error("Virhe lisätessä asuntoa:", err);
      Alert.alert("Virhe", "Asunnon lisääminen epäonnistui.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView>
        {/* Otsikko */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Lisää asunto</Text>
        </View>

        {/* Lomakekentät */}
        <View style={styles.formContainer}>
          <Input
            title="Katuosoite"
            placeholder="Esim. Koivurannantie 6"
            value={streetaddress}
            onChangeText={setStreetAddress}
            keyboard="default"
          />
          <Input
            title="Postinumero"
            placeholder="Esim. 00550"
            value={zipcode}
            onChangeText={setZipcode}
            keyboard="numeric"
          />
          <Input
            title="Asunnon koko (m²)"
            placeholder="Esim. 55"
            value={size}
            onChangeText={setSize}
            keyboard="numeric"
          />
          <Input
            title="Vuokra (€)"
            placeholder="Esim. 750"
            value={rent}
            onChangeText={setRent}
            keyboard="numeric"
          />

          {/* Lähetä-nappi */}
          <TouchableOpacity style={styles.button} onPress={handleAddApartment}>
            <Text style={styles.buttonText}>Tallenna asunto</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Tyylit
const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    height: Dimensions.get("window").height * 0.2,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 45,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerText: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "bold",
  },
  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: -10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 8,
  },
  button: {
    backgroundColor: "#0ea5e9",
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
