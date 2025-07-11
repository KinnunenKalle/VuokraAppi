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

export default function Homepage({ navigation }) {
  const scale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressNavigate = () => {
    scale.value = withTiming(0.9, { duration: 120 }, () => {
      runOnJS(navigation.navigate)("Apartments");
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
        {/* Logo näkyy suoraan sivun yläreunassa */}
        <View style={styles.logoWrapper}>
          <Logo size={72} />
        </View>

        {/* Painikekortti */}
        <View style={styles.cardContainer}>
          <Pressable onPress={onPressNavigate}>
            <Animated.View style={[styles.card, animatedCardStyle]}>
              <View style={styles.cardContent}>
                <Feather name="home" size={22} color="#0f172a" />
                <Text style={styles.cardText}>Asunnot</Text>
              </View>
            </Animated.View>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  logoWrapper: {
    alignItems: "center",
    marginTop: 36,
    marginBottom: 24,
  },
  title: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "600",
    color: "#1e293b",
    letterSpacing: 0.3,
  },
  cardContainer: {
    paddingHorizontal: 24,
  },
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
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    letterSpacing: 0.5,
  },
});
