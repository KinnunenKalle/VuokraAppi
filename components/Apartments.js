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
  const [apartments, setApartments] = useState([]);
  const { accessToken, userId } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (userId && accessToken) {
        getApartments();
      }
    }, [userId, accessToken])
  );

  const getApartments = () => {
    const URL = `https://vuokraappi-api-gw-dev.azure-api.net/apartments/user/${userId}`;

    fetch(URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Haettu asunto-data:", data); // Lisätty konsoliloki datasta
        // Jos data on lista, käytetään sitä suoraan
        // Jos data sisältää asuntojen listan jossain kentässä, esim. data.apartments, käytä sitä
        setApartments(Array.isArray(data) ? data : data.apartments || []);
      })
      .catch((error) => {
        console.error("Failed to fetch apartments:", error);
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
          data={apartments}
          keyExtractor={(item, index) =>
            item.id ? item.id.toString() : index.toString()
          }
          contentContainerStyle={{ paddingBottom: 150 }}
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
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate("ApartmentDetails", { apartment: item })
              }
            >
              <Text style={styles.itemText}>
                {item.streetAddress}, {item.zipcode}
              </Text>
              <Text style={styles.itemSubtext}>
                {item.size} m² – {item.rent} €/kk
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Ei asuntoja näytettäväksi</Text>
          )}
        />

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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginHorizontal: 15,
  },
  itemText: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: "500",
  },
  itemSubtext: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginTop: 4,
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
