import {
  View,
  Text,
  Dimensions,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import Input from "./Input.js";

export default function UserInfo({ navigation }) {
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
            <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
              VUOKRA ÄPPI
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
            <Text
              style={{
                fontSize: 17,
                fontWeight: "bold",
                color: "#03bafc",
                textAlign: "center",
              }}
            >
              Muokkaa tietojasi
            </Text>
            <Input title="Etunimi" placeholder="Etunimesi" keyboard="default" />
            <Input
              title="Sukunimi"
              placeholder="Sukunimesi"
              keyboard="default"
            />
            <Input
              title="Sähköposti"
              placeholder="Syötä sähköpostisi tähän"
              keyboard="email-address"
            />
            <Input
              title="Puhelinnumero"
              placeholder="Puhelinnumerosi"
              keyboard="numeric"
            />
            <Input
              title="Salasana"
              placeholder="*******"
              keyboard="default"
              is_password={true}
            />
            <Input
              title="Vahvista salasanasi"
              placeholder="*******"
              keyboard="default"
              is_password={true}
            />

            <TouchableOpacity onPress={() => {}}>
              <Text
                style={{
                  color: "#03bafc",
                  fontSize: 16,
                  textAlign: "left",
                  marginBottom: 10,
                  marginTop: 0,
                }}
              >
                Rekisteröidy
              </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Text style={{ color: "#03bafc", fontSize: 14 }}>
                Onko sinulla jo käyttäjä?{"   "}
              </Text>
              <Text
                style={{
                  color: "#03bafc",
                  fontSize: 14,
                  textDecorationLine: "underline",
                }}
                onPress={() => navigation.navigate("Login")}
              >
                Kirjaudu sisään
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
