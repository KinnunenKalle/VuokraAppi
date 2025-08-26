import React from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
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
  const { userProfile } = useAuth();

  // Näytetään "Etsi asuntoa" vain, jos profiili on täytetty
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
          <Pressable onPress={onPressNavigate}>
            <Animated.View style={[styles.card, animatedCardStyle]}>
              <View style={styles.cardContent}>
                <Feather name="user" size={22} color="#0f172a" />
                <Text style={styles.cardText}>Profiili</Text>
              </View>
            </Animated.View>
          </Pressable>

          {!hasProfile && (
            <Text style={styles.warningText}>
              Täytä profiiliasi, ennen kuin voit etsiä asuntoa.
            </Text>
          )}

          {hasProfile && (
            <Pressable onPress={() => navigation.navigate("Apartments")}>
              <Animated.View style={[styles.card, animatedCardStyle]}>
                <View style={styles.cardContent}>
                  <Feather name="home" size={22} color="#0f172a" />
                  <Text style={styles.cardText}>Etsi asuntoa</Text>
                </View>
              </Animated.View>
            </Pressable>
          )}
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
});
