import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useAuth } from "./AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

export default function Profile({ navigation }) {
  const { accessToken, userId, selectedRole, setUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);

  // Profiilikentät
  const [birthdate, setBirthdate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [introduction, setIntroduction] = useState("");
  const [hasPet, setHasPet] = useState(false);
  const [pet, setPet] = useState("");
  const [gender, setGender] = useState("");

  // Ladataan profiili aina kun näkymä avataan
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://vuokraappi-api-gw-dev.azure-api.net/users/${userId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!res.ok) throw new Error("Profiilin haku epäonnistui");

        const data = await res.json();
        setBirthdate(data.dateOfBirth ? new Date(data.dateOfBirth) : null);
        setIntroduction(data.introduction || "");
        setHasPet(!!data.pet);
        setPet(data.pet || "");
        setGender(data.gender || "");
        setUserProfile(data); // Tallennetaan profiili Contextiin
      } catch (err) {
        console.error(err);
        Alert.alert("Virhe", "Profiilin haku epäonnistui.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);
  // Tämä täytyy määritellä funktiossa, koska birthdate voi olla null
  const saveProfile = async () => {
    try {
      // Muotoillaan päivämäärä muodossa YYYY-MM-DD (ilman kellonaikaa)
      const formattedDate = birthdate
        ? birthdate.toISOString().split("T")[0]
        : null;

      const body = {
        id: userId,
        role: selectedRole || "tenant",
        dateOfBirth: formattedDate, // Käytetään oikeaa muotoa
        introduction: introduction || "",
        pet: hasPet && pet ? pet : "",
        gender: gender || null,
      };

      console.log("Lähetettävä JSON:", body);

      const res = await fetch(
        `https://vuokraappi-api-gw-dev.azure-api.net/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.log("PATCH failed:", res.status, text);
        Alert.alert("Virhe", `Tallennus epäonnistui: ${res.status}`);
        return;
      }

      // Päivitetään profiili uudelleen Contextiin
      const profileRes = await fetch(
        `https://vuokraappi-api-gw-dev.azure-api.net/users/${userId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (profileRes.ok) {
        const updatedProfile = await profileRes.json();
        setUserProfile(updatedProfile);
      }

      // Navigointi
      navigation.navigate("TenantApp");
    } catch (err) {
      console.error(err);
      Alert.alert("Virhe", "Tallennus epäonnistui.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Ladataan...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Syntymäaika</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>
            {birthdate ? birthdate.toLocaleDateString() : "Valitse syntymäaika"}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={birthdate || new Date(2000, 0, 1)}
            mode="date"
            display="spinner"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setBirthdate(date);
            }}
          />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Kuvaus itsestä</Text>
        <TextInput
          style={[styles.input, { height: 120, textAlignVertical: "top" }]}
          value={introduction}
          onChangeText={(text) => setIntroduction(text)}
          placeholder="Kerro hieman itsestäsi..."
          multiline
        />
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Onko sinulla lemmikki?</Text>
          <Switch value={hasPet} onValueChange={setHasPet} />
        </View>
        {hasPet && (
          <TextInput
            style={styles.input}
            value={pet}
            onChangeText={setPet}
            placeholder="Kuvaile lemmikkiäsi..."
          />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Sukupuoli</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
          >
            <Picker.Item label="Valitse sukupuoli" value="" />
            <Picker.Item label="Mies" value="male" />
            <Picker.Item label="Nainen" value="female" />
            <Picker.Item label="Muu" value="other" />
          </Picker>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Tallenna</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    marginBottom: 20,
  },
  label: { fontWeight: "bold", color: "black", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 10,
  },
  buttonText: { fontSize: 16, color: "black" },
});
