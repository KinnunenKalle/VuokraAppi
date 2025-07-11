import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "./AuthContext";

export default function ApartmentDetails({ route, navigation }) {
  const { apartment } = route.params;
  const { accessToken, userId } = useAuth();

  // Poisto-funktio (esim. API-kutsu, kun toteutat)
  const handleDelete = () => {
    Alert.alert("Poista asunto", "Haluatko varmasti poistaa tämän asunnon?", [
      { text: "Peruuta", style: "cancel" },
      {
        text: "Poista",
        style: "destructive",
        onPress: () => {
          // TODO: Toteuta API-kutsu, jossa käytetään accessTokenia
          // Poiston jälkeen navigoi esim. takaisin asuntojen listaan
          console.log("Poista asunto: ", apartment.id);
          navigation.goBack();
        },
      },
    ]);
  };

  // Muokkaus-funktio (navigoi esim. muokkausnäkymään)
  const handleEdit = () => {
    // TODO: Navigoi muokkausnäkymään ja välitä apartment-objekti
    navigation.navigate("EditApartment", { apartment });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Osoite:</Text>
      <Text style={styles.value}>{apartment.address || "Ei osoitetta"}</Text>

      <Text style={styles.label}>Vuokra:</Text>
      <Text style={styles.value}>
        {apartment.rent !== undefined ? `${apartment.rent} €/kk` : "Ei vuokraa"}
      </Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.buttonEdit} onPress={handleEdit}>
          <Text style={styles.buttonText}>Muokkaa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonDelete} onPress={handleDelete}>
          <Text style={styles.buttonText}>Poista</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: "white",
  },
  label: {
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 15,
  },
  value: {
    fontSize: 16,
    marginTop: 5,
  },
  buttonsContainer: {
    flexDirection: "row",
    marginTop: 40,
    justifyContent: "space-around",
  },
  buttonEdit: {
    backgroundColor: "#03bafc",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonDelete: {
    backgroundColor: "#f44336",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
