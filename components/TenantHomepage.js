import React from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  Linking,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import Logo from "./Logo";
import { useAuth } from "./AuthContext";

export default function TenantHomepage({ navigation }) {
  const { userProfile, accessToken } = useAuth();

  const hasProfile = userProfile?.dateOfBirth && userProfile?.gender;

  const scale = useSharedValue(1);
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressNavigate = () => {
    scale.value = withTiming(0.9, { duration: 120 }, () => {
      runOnJS(navigation.navigate)("Profile");
      scale.value = withTiming(1, { duration: 180 });
    });
  };

  // Vahvan tunnistautumisen käsittelijä
  const handleStrongAuth = async () => {
  try {
    if (!accessToken) {
      Alert.alert("Kirjaudu ensin", "Access token puuttuu");
      return;
    }

    const response = await fetch(
      "https://vuokraappi-api-gw-dev.azure-api.net/users/strongAuthentication",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        redirect: "manual", // ✅ TÄRKEÄ
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Backend virhe:", text);
      throw new Error("Vahvan tunnistautumisen aloitus epäonnistui");
    }

    const data = await response.json();

    if (!data.authUrl) {
      throw new Error("Backend ei palauttanut authUrlia");
    }

    console.log("Avaan Signicat URL:", data.authUrl);
    await Linking.openURL(data.authUrl);

  } catch (err) {
    console.error("Tunnistautumisvirhe:", err);
    Alert.alert("Tunnistautumisvirhe", err.message);
  }
};
  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoWrapper}>
          <Logo size={72} />
        </View>

        <View style={styles.cardContainer}>
          {/* Profiili */}
          <Pressable onPress={onPressNavigate}>
            <Animated.View style={[styles.card, animatedCardStyle]}>
              <View style={styles.cardContent}>
                <Feather name="user" size={22} color="#0f172a" />
                <Text style={styles.cardText}>Profiili</Text>
              </View>
            </Animated.View>
          </Pressable>

          {/* Asunnon haku */}
          {!hasProfile && (
            <Text style={styles.warningText}>
              Täytä profiiliasi, ennen kuin voit etsiä asuntoa.
            </Text>
          )}

          {hasProfile && (
            <Pressable onPress={() => navigation.navigate("SwipeScreen")}>
              <Animated.View style={[styles.card, animatedCardStyle]}>
                <View style={styles.cardContent}>
                  <Feather name="home" size={22} color="#0f172a" />
                  <Text style={styles.cardText}>Etsi asuntoa</Text>
                </View>
              </Animated.View>
            </Pressable>
          )}

          {/* --- OHJE + VAHVA TUNNISTAUTUMINEN --- */}
          <View style={styles.authContainer}>
            <Text style={styles.authInfoText}>
              Jos haluat kaikki sovelluksen toiminnot käyttöön, tee vahva
              tunnistautuminen (esim. viestittely vuokranantajan kanssa).
            </Text>

            <Pressable onPress={handleStrongAuth}>
              <Animated.View style={[styles.card, animatedCardStyle]}>
                <View style={styles.cardContent}>
                  <Feather name="shield" size={22} color="#0f172a" />
                  <Text style={styles.cardText}>
                    Tee vahva tunnistautuminen
                  </Text>
                </View>
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContainer: { flexGrow: 1 },
  logoWrapper: { alignItems: "center", marginTop: 36, marginBottom: 24 },
  cardContainer: { paddingHorizontal: 24 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 16,
  },
  cardContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    letterSpacing: 0.5,
  },
  warningText: { color: "red", marginTop: 8, fontSize: 14 },
  authContainer: { marginTop: 24 },
  authInfoText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
});