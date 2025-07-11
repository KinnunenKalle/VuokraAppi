import React, { useEffect, useState } from "react";
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
import { useAuth } from "./AuthContext"; // Tuodaan autentikointikonteksti accessTokenin ja userId:n saamiseksi

export default function Apartments({ navigation }) {
  const [apartments, setApartments] = useState([]); // Tallennetaan haetut asunnot tilaan
  const { accessToken, userId } = useAuth(); // Haetaan kirjautuneen käyttäjän tiedot

  // Kun käyttäjä tai accessToken vaihtuu (tai näkymä aukeaa), haetaan asunnot
  useEffect(() => {
    if (userId && accessToken) {
      getApartments();
    }
  }, [userId, accessToken]);

  // Funktio hakee käyttäjän hallinnoimat asunnot API:sta
  const getApartments = () => {
    const URL = `https://vuokraappi-api-gw-dev.azure-api.net/apartments/user/${userId}`;

    fetch(URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Lähetetään accessToken Authorization-headerissa
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // API voi palauttaa listan joko suoraan tai objektin sisällä (data.apartments)
        setApartments(data.apartments || data);
      })
      .catch((error) => {
        console.error("Failed to fetch apartments:", error); // Virheen lokitus
      });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        <FlatList
          data={apartments} // Lista näytettävistä asunnoista
          keyExtractor={(item, index) =>
            item.id ? item.id.toString() : index.toString()
          }
          contentContainerStyle={{ paddingBottom: 150 }}
          // Listaotsikko yläreunaan
          ListHeaderComponent={
            <LinearGradient
              colors={["#42a1f5", "#03bafc", "#42c5f5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <Text style={styles.headerText}>Hallinnassa olevat asuntosi</Text>
            </LinearGradient>
          }
          // Renderöidään yksittäinen asunto rivinä – koko rivi toimii napin tavoin
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate("ApartmentDetails", { apartment: item })
              }
            >
              <Text style={styles.itemText}>
                {item.address || item.name || item.id || "Tuntematon asunto"}
              </Text>
            </TouchableOpacity>
          )}
          // Näytetään, jos käyttäjällä ei ole asuntoja
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

// Tyylit
const styles = StyleSheet.create({
  container: { flex: 1 },
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
