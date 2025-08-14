import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import { useAuth } from "./AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

// Profile-näkymä vuokralaisen profiilin muokkaamiseen
export default function Profile() {
  const { accessToken, userId } = useAuth(); // AuthContextista haetaan token ja userId

  const [loading, setLoading] = useState(true); // latausindikaattori

  // --- Profiilin kenttien state-muuttujat ---
  const [birthdate, setBirthdate] = useState(null); // date_of_birth (datetime2)
  const [showDatePicker, setShowDatePicker] = useState(false); // näytetään datepicker
  const [introduction, setIntroduction] = useState(""); // introduction
  const [hasPet, setHasPet] = useState(false); // onko lemmikki
  const [pet, setPet] = useState(""); // pet
  const [gender, setGender] = useState(""); // gender smallint

  // --- Profiilin tietojen haku API:sta ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `https://vuokraappi-api-gw-dev.azure-api.net/users/${userId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!res.ok) throw new Error("Virhe ladattaessa profiilia");

        const data = await res.json();

        // Syntymäaika, jos ei ole null
        setBirthdate(data.date_of_birth ? new Date(data.date_of_birth) : null);
        setIntroduction(data.introduction || "");
        setHasPet(!!data.pet);
        setPet(data.pet || "");

        // gender smallint kenttään: 0=En halua kertoa, 1=Mies, 2=Nainen, 3=Muu
        setGender(data.gender !== null ? data.gender.toString() : "");
      } catch (error) {
        console.error(error);
        Alert.alert("Virhe", "Profiilin lataus epäonnistui.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // --- Tallennus API:iin ---
  const saveProfile = async () => {
    try {
      // Muodostetaan PATCH-kutsun body
      const body = {
        date_of_birth: birthdate ? birthdate.toISOString() : null,
        introduction,
        pet: hasPet ? pet : "",
        gender: gender !== "" ? parseInt(gender, 10) : null,
      };

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

      // API:n vastaus JSON-muodossa
      const data = await res.json();
      console.log("PATCH response:", data);

      if (res.ok) {
        Alert.alert("Tallennettu", "Profiilin tiedot päivitettiin.");
      } else {
        Alert.alert("Virhe", "Tallennus epäonnistui. Tarkista tiedot.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Virhe", "Tallennus epäonnistui.");
    }
  };

  // --- Ladataan näkymä, jos loading true ---
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Ladataan...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* --- Syntymäaika --- */}
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

      {/* --- Kuvaus itsestä --- */}
      <View style={styles.card}>
        <Text style={styles.label}>Kuvaus itsestä (max 1000 merkkiä)</Text>
        <TextInput
          style={[styles.input, { height: 120, textAlignVertical: "top" }]}
          value={introduction}
          onChangeText={(text) => setIntroduction(text.slice(0, 1000))}
          placeholder="Kerro hieman itsestäsi..."
          multiline
        />
        <Text style={styles.charCount}>{introduction.length}/1000</Text>
      </View>

      {/* --- Lemmikkieläin --- */}
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

      {/* --- Sukupuoli --- */}
      <View style={styles.card}>
        <Text style={styles.label}>Sukupuoli</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
          >
            <Picker.Item label="Valitse sukupuoli" value="" />
            <Picker.Item label="Mies" value="1" />
            <Picker.Item label="Nainen" value="2" />
            <Picker.Item label="Muu" value="3" />
            <Picker.Item label="En halua kertoa" value="0" />
          </Picker>
        </View>
      </View>

      {/* --- Tallenna-painike --- */}
      <TouchableOpacity style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Tallenna</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- Tyylit ---
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
  charCount: { textAlign: "right", fontSize: 12, color: "#999", marginTop: 4 },
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
  },
  buttonText: { fontSize: 16, color: "black" },
});
