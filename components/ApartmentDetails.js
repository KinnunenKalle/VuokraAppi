import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "./AuthContext";

export default function ApartmentDetails({ route, navigation }) {
  const { apartment } = route.params;
  const { accessToken } = useAuth();

  const [streetAddress, setStreetAddress] = useState(apartment.streetAddress);
  const [zipcode, setZipcode] = useState(apartment.zipcode);
  const [size, setSize] = useState(apartment.size);
  const [rent, setRent] = useState(apartment.rent);

  useFocusEffect(
    useCallback(() => {
      const fetchApartmentDetails = async () => {
        try {
          const res = await fetch(
            `https://vuokraappi-api-gw-dev.azure-api.net/apartments/${apartment.id}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const data = await res.json();
          setStreetAddress(data.streetAddress);
          setZipcode(data.zipcode);
          setSize(data.size);
          setRent(data.rent);
        } catch (error) {
          console.error("Virhe haettaessa asunnon tietoja:", error.message);
          Alert.alert("Virhe", "Asunnon tietojen haku epäonnistui.");
        }
      };

      fetchApartmentDetails();
    }, [apartment.id, accessToken])
  );

  const fullAddress = `${streetAddress}, ${zipcode}`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Osoite</Text>
      <Text style={styles.value}>{fullAddress}</Text>

      <Text style={styles.label}>Koko</Text>
      <Text style={styles.value}>{size} m²</Text>

      <Text style={styles.label}>Vuokra</Text>
      <Text style={styles.value}>{rent} € / kk</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate("EditApartment", { apartment: apartment })
        }
      >
        <Text style={styles.buttonText}>Muokkaa asuntoa</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#ccc", marginTop: 15 }]}
        onPress={() => navigation.navigate("Apartments")}
      >
        <Text style={[styles.buttonText, { color: "#333" }]}>
          Takaisin asuntolistaan
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#4CAF50", marginTop: 15 }]}
        onPress={() =>
          navigation.navigate("MapScreen", { address: fullAddress })
        }
      >
        <Text style={styles.buttonText}>Näytä kartalla</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    paddingTop: 40,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    marginTop: 30,
    backgroundColor: "#03bafc",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
