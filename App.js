import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Näkymät
import Login from "./components/Login.js";
import UserInfo from "./components/UserInfo.js";
import Homepage from "./components/Homepage.js";
import Apartments from "./components/Apartments.js";
import DrawerNavigator from "./components/DrawerNavigator.js";
import AddApartment from "./components/AddApartment.js";
import ApartmentDetails from "./components/ApartmentDetails.js";
import EditApartment from "./components/EditAparments.js";
import SelectRoleScreen from "./components/SelectRoleScreen.js"; // ✅ Uusi rekisteröintivaiheen roolivalintasivu

// AuthContext-provideri tokenin ja käyttäjän hallintaan
import { AuthProvider } from "./components/AuthContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Kirjautuminen */}
          <Stack.Screen name="Login" component={Login} />

          {/* Rekisteröinnin roolivalinta */}
          <Stack.Screen name="SelectRole" component={SelectRoleScreen} />

          {/* Sovelluksen pääsisältö drawerin sisällä */}
          <Stack.Screen name="MainApp" component={DrawerNavigator} />

          {/* Asuntoihin liittyvät näkymät */}
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
