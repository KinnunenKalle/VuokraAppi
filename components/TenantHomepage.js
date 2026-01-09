import React, { useState } from "react";
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
import { makeRedirectUri } from "expo-auth-session"; // ← TÄMÄ PUUTUI
import Logo from "./Logo";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "./AuthContext";

export default function TenantHomepage({ navigation }) {
  const { userProfile, accessToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);

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
      // 1️⃣ Luo deep link, johon Signicat ohjaa tunnistautumisen jälkeen
      const redirectUri = makeRedirectUri({ useProxy: true });
      console.log('Redirect URI:', redirectUri);

      // 2️⃣ Avaamme browserin OAuth2 Signicat -endpointiin
      const result = await WebBrowser.openAuthSessionAsync(
        'https://vuokraappi-api-gw-dev.azure-api.net/oauth2/authorization/signicat',
        redirectUri
      );

      console.log('WebBrowser result:', result);

      if (result.type === 'success') {
        // result.url sisältää takaisin ohjatun URL:n, josta voi purkaa tokenin
        Alert.alert('Onnistui!', 'Vahva tunnistautuminen suoritettu');
        // Tässä vaiheessa pitäisi käsitellä token deep linkistä
        // esim. parseTokenFromUrl(result.url)
      } else if (result.type === 'cancel') {
        Alert.alert('Peruutettu', 'Tunnistautuminen peruutettiin');
      }
    } catch (err) {
      console.error('Tunnistautumisvirhe:', err);
      Alert.alert('Tunnistautumisvirhe', err.message);
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

            <Text style={[styles.authInfoText, { color: "#dc143c" }]}>
              Huom: iOS saattaa näyttää varmistuksen “Saako käyttää sisäänkirjautumiseen”. Tämä on normaalia – kyse on vain tunnistautumisesta.
            </Text>

            <Pressable
              onPress={handleStrongAuth}
              disabled={!accessToken || !userId}
            >
              <Animated.View
                style={[
                  styles.card,
                  animatedCardStyle,
                  (!accessToken || !userId) && { opacity: 0.5 },
                ]}
              >
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