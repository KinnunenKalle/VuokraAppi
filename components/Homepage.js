import {
  View,
  Text,
  Dimensions,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import Input from "./Input.js";

export default function Homepage({ navigation }) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, flexDirection: "column", justifyContent: "center" }}
      behavior="padding"
      enabled
      keyboardVerticalOffset={100}
    >
      <ScrollView>
        <View>
          <LinearGradient
            colors={["#42a1f5", "#03bafc", "#42c5f5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderBottomLeftRadius: 15,
              borderBottomRightRadius: 15,
              height: Dimensions.get("window").height * 0.2,
              width: "100%",
              alignItems: "center",
              paddingTop: 45,
            }}
          >
            <Text style={{ color: "white", fontSize: 22, fontWight: "bold" }}>
              Vuokranantajan näkymä
            </Text>
          </LinearGradient>
          <View
            style={{
              elevation: 10,
              backgroundColor: "white",
              borderRadius: 10,
              margin: 10,
              marginTop: -20,
              paddingVertical: 20,
              paddingHorizontal: 15,
            }}
          >
            <TouchableOpacity onPress={() => navigation.navigate("Apartments")}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "bold",
                  color: "#03bafc",
                  textAlign: "center",
                }}
              >
                Asunnot
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 25,
    right: 20,
    backgroundColor: "#03bafc",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
  },
  fabText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
