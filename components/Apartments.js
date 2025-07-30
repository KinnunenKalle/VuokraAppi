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
import { useAuth } from "./AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

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
        setApartments(Array.isArray(data) ? data : data.apartments || []);
      })
      .catch((error) => {
        console.error("Failed to fetch apartments:", error);
      });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
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
            <View style={styles.header}>
              <Text style={styles.headerText}>Hallinnassa olevat asuntosi</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate("ApartmentDetails", { apartment: item })
              }
            >
              <View style={styles.cardContent}>
                <Feather name="home" size={20} color="#0f172a" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {item.streetAddress}, {item.zipcode}
                  </Text>
                  <Text style={styles.cardSubtext}>
                    {item.size} m² – {item.rent} €/kk
                  </Text>
                </View>
              </View>
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
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    height: Dimensions.get("window").height * 0.18,
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
  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    letterSpacing: 0.4,
  },
  cardSubtext: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
  },
  emptyText: {
    marginTop: 50,
    textAlign: "center",
    fontSize: 16,
    color: "#94a3b8",
  },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 20,
    backgroundColor: "#0ea5e9",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  fabText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.4,
  },
});
