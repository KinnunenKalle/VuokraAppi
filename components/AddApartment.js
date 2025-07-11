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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Input from "./Input.js"; // Oma komponentti kentille
import { useAuth } from "./AuthContext"; // Haetaan accessToken ja userId kontekstista

export default function AddApartment({ navigation }) {
  // Tilat osoitteelle ja vuokralle
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");

  // AuthContextista haetaan kirjautuneen käyttäjän tiedot
  const { accessToken, userId } = useAuth();

  // Lähetetään asunto API:in
  const handleAddApartment = () => {
    // Tarkistetaan, että kaikki kentät on täytetty
    if (!address || !rent) {
      Alert.alert("Täytä kaikki kentät!");
      return;
    }

    // Rakennetaan asunto-objekti JSON-muodossa
    const newApartment = {
      address,
      rent: Number(rent), // varmistetaan että rent on numero
      userId,
    };

    // Lähetetään POST-pyyntö API:in
    fetch("https://vuokraappi-api-gw-dev.azure-api.net/apartments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // Tunnistaudutaan tokenilla
      },
      body: JSON.stringify(newApartment), // Muunnetaan objekti JSONiksi
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`); // Heitetään virhe jos ei 2xx vastaus
        return res.json(); // Parsitaan vastaus
      })
      .then((data) => {
        Alert.alert("Asunto lisätty!"); // Ilmoitetaan onnistumisesta
        navigation.navigate("Apartments"); // Palataan listaan (päivitetään automaattisesti)
      })
      .catch((err) => {
        console.error("Virhe lisätessä asuntoa:", err); // Debug-tuloste
        Alert.alert("Virhe", "Asunnon lisääminen epäonnistui."); // Näytetään virheilmoitus
      });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView>
        <View>
          {/* Yläosan gradient-tunniste/otsikko */}
          <LinearGradient
            colors={["#42a1f5", "#03bafc", "#42c5f5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderBottomLeftRadius: 15,
              borderBottomRightRadius: 15,
              height: Dimensions.get("window").height * 0.2,
              width: "100%",
              alignItems: "center",
              paddingTop: 45,
            }}
          >
            <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
              Lisää asunto
            </Text>
          </LinearGradient>

          <View
            style={{
              elevation: 10,
              backgroundColor: "white",
              borderRadius: 10,
              margin: 10,
              marginTop: -20, // nostetaan vähän ylöspäin
              paddingVertical: 20,
              paddingHorizontal: 15,
            }}
          >
            {/* Osoite-kenttä */}
            <Input
              title="Osoite"
              placeholder="Esim. Koivurannantie 6"
              value={address}
              onChangeText={setAddress}
              keyboard="default"
            />

            {/* Vuokra-kenttä */}
            <Input
              title="Vuokra (€)"
              placeholder="Esim. 750"
              value={rent}
              onChangeText={setRent}
              keyboard="numeric"
            />

            {/* Lähetä-painike */}
            <TouchableOpacity onPress={handleAddApartment}>
              <Text
                style={{
                  backgroundColor: "#03bafc",
                  color: "white",
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginTop: 20,
                }}
              >
                Tallenna asunto
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
