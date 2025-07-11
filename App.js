import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "./components/Login.js";
import UserInfo from "./components/UserInfo.js";
import Homepage from "./components/Homepage.js";
import Apartments from "./components/Apartments.js";
import DrawerNavigator from "./components/DrawerNavigator.js";
import AddApartment from "./components/AddApartment.js";
import ApartmentDetails from "./components/ApartmentDetails.js";
import EditApartment from "./components/EditAparments.js";

import { AuthProvider } from "./components/AuthContext"; // ✅ tuo AuthProvider

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="MainApp" component={DrawerNavigator} />
          <Stack.Screen name="Apartments" component={Apartments} />
          <Stack.Screen name="AddApartment" component={AddApartment} />
          <Stack.Screen name="ApartmentDetails" component={ApartmentDetails} />
          <Stack.Screen name="EditApartment" component={EditApartment} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
