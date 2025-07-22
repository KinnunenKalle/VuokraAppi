import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Input from "./Input";
import jwt_decode from "jwt-decode";
import { useAuth } from "./AuthContext";

export default function UserInfo({ navigation }) {
  const { accessToken } = useAuth();

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
        const decoded = jwt_decode(accessToken);
        const oid = decoded.oid;
        if (!oid) throw new Error("OID puuttuu tokenista");

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
      style={styles.container}
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
            style={styles.header}
          >
            <Text style={styles.headerText}>VUOKRA ÄPPI</Text>
          </LinearGradient>

          <View style={styles.formCard}>
            <Text style={styles.title}>Muokkaa tietojasi</Text>

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

            <TouchableOpacity onPress={updateUserData} style={styles.button}>
              <Text style={styles.buttonText}>Tallenna muutokset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  formCard: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: -20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0ea5e9",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
