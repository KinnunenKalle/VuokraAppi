import React from "react";
import {
  View,
  Text,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

export default function Homepage({ navigation }) {
  const scale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressApartment = () => {
    scale.value = withTiming(0.8, { duration: 200 }, () => {
      runOnJS(navigation.navigate)("Apartments");
      scale.value = withTiming(1, { duration: 200 });
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LinearGradient
          colors={["#42a1f5", "#03bafc", "#42c5f5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Text style={styles.headerText}>Vuokranantajan näkymä</Text>
        </LinearGradient>

        <View style={styles.cardContainer}>
          <Pressable onPress={onPressApartment}>
            <Animated.View style={[styles.card, animatedCardStyle]}>
              <View style={styles.cardContent}>
                <Ionicons name="home-outline" size={22} color="#03bafc" />
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
    backgroundColor: "#f6f9fc",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    height: Dimensions.get("window").height * 0.12,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  headerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cardContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#03bafc",
  },
});
