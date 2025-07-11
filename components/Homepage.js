import {
  View,
  Text,
  Dimensions,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function Homepage({ navigation }) {
  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Yläpalkki gradientilla */}
        <LinearGradient
          colors={["#42a1f5", "#03bafc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Text style={styles.headerText}>Vuokranantajan näkymä</Text>
        </LinearGradient>

        {/* Korttipainike — selkeästi erillään otsikosta */}
        <View style={styles.cardContainer}>
          <Pressable
            onPress={() => navigation.navigate("Apartments")}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardContent}>
              <Ionicons name="home-outline" size={22} color="#03bafc" />
              <Text style={styles.cardText}>Asunnot</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 💅 Tyylit
const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#f6f9fc",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    height: Dimensions.get("window").height * 0.12, // pienempi header
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cardContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#03bafc",
  },
});
