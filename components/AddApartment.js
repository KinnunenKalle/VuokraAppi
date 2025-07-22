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
import Input from "./Input.js";
import { useAuth } from "./AuthContext";

export default function AddApartment({ navigation }) {
  // Tarvittavat kentät Azure API:n mukaan
  const [streetaddress, setStreetAddress] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [size, setSize] = useState("");
  const [rent, setRent] = useState("");

  const { accessToken, userId } = useAuth();

  const handleAddApartment = () => {
    // Tarkistetaan, että kaikki kentät on täytetty
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

    // Rakennetaan uusi asunto API:n vaatiman skeeman mukaan
    const newApartment = {
      streetAddress: streetaddress,
      city: "",
      region: "",
      zipcode,
      size: sizeNumber,
      rent: rentNumber,
      userId,
    };
    console.log("Lähetettävä asunto:", newApartment);

    fetch("https://vuokraappi-api-gw-dev.azure-api.net/apartments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(newApartment),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => {
        Alert.alert("Asunto lisätty!");
        navigation.navigate("Apartments");
      })
      .catch((err) => {
        console.error("Virhe lisätessä asuntoa:", err);
        Alert.alert("Virhe", "Asunnon lisääminen epäonnistui.");
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
          {/* Otsikko */}
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

          {/* Lomakekentät */}
          <View
            style={{
              elevation: 10,
              backgroundColor: "white",
              borderRadius: 10,
              margin: 10,
              marginTop: -20,
              paddingVertical: 20,
              paddingHorizontal: 15,
            }}
          >
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
