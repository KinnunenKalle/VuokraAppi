import React from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Alert } from "react-native";

import Homepage from "./Homepage";
import UserInfo from "./UserInfo";
import { useAuth } from "./AuthContext";

const Drawer = createDrawerNavigator();

export const logoutWithConfirmation = (
  accessToken,
  userId,
  navigation,
  setAccessToken,
  setUserId
) => {
  Alert.alert(
    "Vahvista uloskirjautuminen",
    "Haluatko varmasti kirjautua ulos?",
    [
      { text: "Peruuta", style: "cancel" },
      {
        text: "Kirjaudu ulos",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(
              `https://vuokraappi-api-gw-dev.azure-api.net/users/${userId}/revokeSignInSessions`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.ok) {
              setAccessToken(null);
              setUserId(null);
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } else {
              // Ei yritetä lukea response.json(), koska response ei välttämättä ole JSON
              console.error(
                "Uloskirjautuminen epäonnistui: status",
                response.status
              );
              Alert.alert("Virhe", "Uloskirjautuminen epäonnistui.");
            }
          } catch (err) {
            console.error("Virhe uloskirjautumisessa:", err);
            Alert.alert("Virhe", "Uloskirjautuminen epäonnistui.");
          }
        },
      },
    ]
  );
};

export default function DrawerNavigator({ navigation }) {
  const { accessToken, userId, setAccessToken, setUserId } = useAuth(); //  Contextista

  return (
    <Drawer.Navigator
      initialRouteName="Etusivu"
      screenOptions={{
        drawerActiveTintColor: "#03bafc",
        headerShown: true,
      }}
      drawerContent={(props) => (
        <DrawerContentScrollView {...props}>
          <DrawerItemList {...props} />
          <DrawerItem
            label="Kirjaudu ulos"
            labelStyle={{ color: "blue" }}
            onPress={() =>
              logoutWithConfirmation(
                accessToken,
                userId,
                navigation,
                setAccessToken,
                setUserId
              )
            }
          />
        </DrawerContentScrollView>
      )}
    >
      <Drawer.Screen
        name="Etusivu"
        component={Homepage}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="UserInfo"
        component={UserInfo}
        options={{
          title: "Muokkaa käyttäjätietoja",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
