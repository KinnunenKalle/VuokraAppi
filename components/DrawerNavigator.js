import React from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import Ionicons from "react-native-vector-icons/Ionicons";

import Homepage from "./Homepage";

import UserInfo from "./UserInfo";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
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
            onPress={() => {
              props.navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            }}
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
