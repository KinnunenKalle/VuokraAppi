import {
  View,
  Text,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "./AuthContext";

export default function Apartments({ navigation }) {
  const [apartments, setApartments] = useState([]);
  const { accessToken, userId } = useAuth();

  useEffect(() => {
    getApartments();
  }, []);

  const getApartments = () => {
    const URL = `https://vuokraappi-api-gw-dev.azure-api.net/apartments/user/${userId}`;
    fetch(URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setApartments(data);
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
          keyExtractor={(item, index) => index.toString()}
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
            <View>
              <Text style={styles.itemText}>{item.apartmentid}</Text>
            </View>
          )}
        />

        {/* Floating Button fixed on bottom right */}
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
  itemText: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 10,
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
