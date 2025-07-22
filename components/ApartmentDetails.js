import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>Osoite</Text>
        <Text style={styles.value}>{fullAddress}</Text>

        <Text style={styles.label}>Koko</Text>
        <Text style={styles.value}>{size} m²</Text>

        <Text style={styles.label}>Vuokra</Text>
        <Text style={styles.value}>{rent} € / kk</Text>
      </View>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() =>
          navigation.navigate("EditApartment", { apartment: apartment })
        }
      >
        <Text style={styles.buttonText}>Muokkaa asuntoa</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => navigation.navigate("Apartments")}
      >
        <Text style={styles.buttonSecondaryText}>Takaisin asuntolistaan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSuccess}
        onPress={() =>
          navigation.navigate("MapScreen", { address: fullAddress })
        }
      >
        <Text style={styles.buttonText}>Näytä kartalla</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: "#475569",
    marginBottom: 16,
  },
  buttonPrimary: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    elevation: 4,
  },
  buttonSuccess: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondaryText: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "600",
  },
});
