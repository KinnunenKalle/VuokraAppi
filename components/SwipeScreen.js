import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
} from "react-native";
import { useAuth } from "./AuthContext";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function SwipeScreen() {
  const { selectedRole } = useAuth();

  const apartments = [
    { id: "1", name: "Kerrostalo, 2h+k" },
    { id: "2", name: "Omakotitalo, 3h+k" },
    { id: "3", name: "Rivitalo, 1h+k" },
  ];

  const tenants = [
    { id: "1", name: "Matti Meikäläinen" },
    { id: "2", name: "Maija Mallikas" },
    { id: "3", name: "Pekka Pieni" },
  ];

  const swipeItems = selectedRole === "tenant" ? apartments : tenants;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [position] = useState(new Animated.ValueXY());

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > 120) {
        swipe("right");
      } else if (gesture.dx < -120) {
        swipe("left");
      } else {
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const swipe = (direction) => {
    const item = swipeItems[currentIndex];
    console.log("Swipattu:", item.name, "suunta:", direction);

    Animated.timing(position, {
      toValue: { x: direction === "right" ? SCREEN_WIDTH : -SCREEN_WIDTH, y: 0 },
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => prev + 1);
    });
  };

  if (currentIndex >= swipeItems.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.finishedText}>Ei enempää kohteita</Text>
      </View>
    );
  }

  const item = swipeItems[currentIndex];
  const type = selectedRole === "tenant" ? "apartment" : "tenant";

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, position.getLayout(), type === "tenant" && styles.tenantCard]}
      >
        <Text style={styles.text}>{item.name}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: 400,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  tenantCard: {
    backgroundColor: "#dbeafe",
  },
  text: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
  },
  finishedText: {
    fontSize: 18,
    color: "#475569",
  },
});