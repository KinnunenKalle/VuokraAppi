import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Input from "./Input";
import jwt_decode from "jwt-decode"; //  Korjattu import

export default function UserInfo({ navigation, route }) {
  const { accessToken } = route.params;

  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState({
    givenName: "",
    surname: "",
    mail: "",
    mobilePhone: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        //  1. Dekoodataan token ja poimitaan oid
        const decoded = jwt_decode(accessToken);
        const oid = decoded.oid;

        if (!oid) throw new Error("OID puuttuu tokenista");

        //  2. Haetaan käyttäjän tiedot OID:lla
        const res = await fetch(
          `https://vuokraappi-api-gw-dev.azure-api.net/users/${oid}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) throw new Error("Virhe palvelimelta");

        const user = await res.json();
        console.log(user.id);
        setUserId(user.id);
        setUserData({
          givenName: user.givenName || "",
          surname: user.surname || "",
          mail: user.mail || "",
          mobilePhone: user.mobilePhone || "",
        });
      } catch (error) {
        console.error("Virhe käyttäjän hakemisessa", error);
        Alert.alert("Virhe", "Käyttäjätietojen hakeminen epäonnistui.");
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (key, value) => {
    setUserData((prev) => ({ ...prev, [key]: value }));
  };

  const updateUserData = async () => {
    try {
      const response = await fetch(
        `https://vuokraappi-api-gw-dev.azure-api.net/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (response.ok) {
        Alert.alert("Onnistui", "Käyttäjätiedot päivitetty.");
      } else {
        Alert.alert("Virhe", "Tietojen päivitys epäonnistui.");
      }
    } catch (err) {
      console.error("Virhe päivityksessä", err);
      Alert.alert("Virhe", "Tietojen päivitys epäonnistui.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
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

            <Input
              title="Etunimi"
              placeholder="Etunimesi"
              keyboard="default"
              value={userData.givenName}
              onChangeText={(text) => handleChange("givenName", text)}
            />
            <Input
              title="Sukunimi"
              placeholder="Sukunimesi"
              keyboard="default"
              value={userData.surname}
              onChangeText={(text) => handleChange("surname", text)}
            />
            <Input
              title="Sähköposti"
              placeholder="Sähköpostisi"
              keyboard="email-address"
              value={userData.mail}
              onChangeText={(text) => handleChange("mail", text)}
            />
            <Input
              title="Puhelin"
              placeholder="Puhelinnumerosi"
              keyboard="phone-pad"
              value={userData.mobilePhone}
              onChangeText={(text) => handleChange("mobilePhone", text)}
            />

            <TouchableOpacity onPress={updateUserData}>
              <Text
                style={{
                  color: "#03bafc",
                  fontSize: 16,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginVertical: 15,
                }}
              >
                Tallenna muutokset
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
