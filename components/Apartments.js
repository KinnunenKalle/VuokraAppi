import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "./AuthContext";
import { useFocusEffect } from "@react-navigation/native";

export default function Apartments({ navigation }) {
  // Tilamuuttuja asunnoille
  const [apartments, setApartments] = useState([]);
  // Haetaan käyttäjän tunnistetiedot AuthContextista
  const { accessToken, userId } = useAuth();

  // Käytetään useFocusEffect hookia, jotta haetaan asunnot aina kun
  // näkymä tulee näkyville (esim. palataan tästä näkymästä)
  useFocusEffect(
    useCallback(() => {
      // Haetaan asunnot vain jos userId ja token ovat saatavilla
      if (userId && accessToken) {
        getApartments();
      }
    }, [userId, accessToken])
  );

  // Funktio asuntolistan hakemiseen APIsta
  const getApartments = () => {
    // Rakennetaan API:n URL käyttäjän id:llä
    const URL = `https://vuokraappi-api-gw-dev.azure-api.net/apartments/user/${userId}`;

    // Tehdään fetch-kutsu
    fetch(URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Token headerissa autentikointiin
      },
    })
      .then((res) => {
        if (!res.ok) {
          // Jos palvelin vastaa virheellä, heitetään virhe
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        // Muutoin parsitaan vastaus JSONiksi
        return res.json();
      })
      .then((data) => {
        // API voi palauttaa asunnot joko suoraan listana
        // tai objektissa data.apartments
        setApartments(data.apartments || data);
      })
      .catch((error) => {
        // Virheen sattuessa tulostetaan konsoliin
        console.error("Failed to fetch apartments:", error);
      });
  };

  return (
    // KeyboardAvoidingView estää näppäimistön peittämästä sisältöä
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        <FlatList
          data={apartments} // Näytettävä data
          keyExtractor={(item, index) =>
            // Käytetään asunnon id:tä avaimena, jos ei ole niin indeksiä
            item.id ? item.id.toString() : index.toString()
          }
          contentContainerStyle={{ paddingBottom: 150 }}
          ListHeaderComponent={
            // Tyylikäs yläosa liukuväreillä ja otsikolla
            <LinearGradient
              colors={["#42a1f5", "#03bafc", "#42c5f5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <Text style={styles.headerText}>Hallinnassa olevat asuntosi</Text>
            </LinearGradient>
          }
          renderItem={({ item }) => (
            // Asunnot ovat klikattavia, navigoi ApartmentDetails-näkymään
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate("ApartmentDetails", { apartment: item })
              }
            >
              <Text style={styles.itemText}>
                {/* Näytetään osoite, nimi tai id, jos osoitetta ei ole */}
                {item.address || item.name || item.id || "Tuntematon asunto"}
              </Text>
            </TouchableOpacity>
          )}
          // Jos asuntoja ei ole, näytetään käyttäjälle viesti
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Ei asuntoja näytettäväksi</Text>
          )}
        />

        {/* Lisää asunto -painike oikeassa alakulmassa */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("AddApartment")}
        >
          <Text style={styles.fabText}>＋ Lisää asunto</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Tyylit erikseen StyleSheetillä
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    height: Dimensions.get("window").height * 0.2,
    width: "100%",
    alignItems: "center",
    paddingTop: 45,
  },
  headerText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  item: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginHorizontal: 15,
  },
  itemText: {
    fontSize: 18,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 50,
    textAlign: "center",
    fontSize: 16,
    color: "#999",
  },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 20,
    backgroundColor: "#03bafc",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
    zIndex: 10,
  },
  fabText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
