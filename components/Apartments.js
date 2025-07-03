import { View, Text, Dimensions, FlatList, Image } from "react-native";
import React, { useDebugValue, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Input from "./Input.js";

export default function Apartments({ navigation }) {
  const [apartments, setApartments] = useState([]);

  useEffect(() => {
    getApartments();
  }, []);

  const getApartments = () => {
    const URL = "https://ed711e0b-5dc0-4b93-a0ff-f04370ff1bc6.mock.pstmn.io";

    fetch(URL)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setApartments(data);
        console.log(data);
      });
  };
  return (
    <View>
      <LinearGradient
        colors={["#42a1f5", "#03bafc", "#42c5f5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderBottomLeftRadius: 15,
          borderBottomRightRadius: 15,
          height: Dimensions.get("window").height * 0.2,
          width: "100%",
          alignItems: "center",
          paddingTop: 45,
        }}
      >
        <Text style={{ color: "white", fontSize: 22, fontWight: "bold" }}>
          Hallinnassa olevat asuntosi
        </Text>
      </LinearGradient>
      <FlatList
        data={apartments}
        renderItem={({ item }) => (
          <View>
            <Text style={{ fontsize: 18, textAlign: "center" }}>
              {item.apartmentid}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
