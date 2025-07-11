import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "./AuthContext";

export default function ApartmentDetails({ route, navigation }) {
  // Reitiltä saadaan asunnon perusdata (id ym.)
  const { apartment } = route.params;

  // AuthContextista accessToken
  const { accessToken } = useAuth();

  // Tilat päivittyvälle osoitteelle ja vuokralle
  const [address, setAddress] = useState(apartment.address);
  const [rent, setRent] = useState(apartment.rent);

  // useFocusEffect hakee uusimmat tiedot palvelimelta aina kun näkymä tulee aktiiviseksi
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
          setAddress(data.address);
          setRent(data.rent);
        } catch (error) {
          console.error("Virhe haettaessa asunnon tietoja:", error.message);
          Alert.alert("Virhe", "Asunnon tietojen haku epäonnistui.");
        }
      };

      fetchApartmentDetails();
    }, [apartment.id, accessToken])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Osoite</Text>
      <Text style={styles.value}>{address}</Text>

      <Text style={styles.label}>Vuokra (€ / kk)</Text>
      <Text style={styles.value}>{rent} €</Text>

      {/* Painike siirtymään muokkausnäkymään */}
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate("EditApartment", { apartment: apartment })
        }
      >
        <Text style={styles.buttonText}>Muokkaa asuntoa</Text>
      </TouchableOpacity>
      {/* Painike takaisin asuntolistaan */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#ccc", marginTop: 15 }]}
        onPress={() => navigation.navigate("Apartments")}
      >
        <Text style={[styles.buttonText, { color: "#333" }]}>
          Takaisin asuntolistaan
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Tyylit
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
