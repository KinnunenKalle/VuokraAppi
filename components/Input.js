import { View, Text, TextInput } from "react-native";
import React from "react";

const Input = ({
  title,
  placeholder,
  keyboard = "default", // oletuskenttä keyboard-tyypille
  is_password = false, // oletus false, jos salasana-kenttä ei ole
  value,
  onChangeText,
}) => {
  return (
    <View style={{ marginVertical: 10 }}>
      {/* Kentän otsikko */}
      <Text style={{ fontSize: 16, color: "#03bafc" }}>{title}</Text>

      {/* Tekstikenttä */}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="gray"
        style={{
          borderBottomColor: "#03bafc",
          borderBottomWidth: 1,
          paddingVertical: 5,
          marginTop: 5,
        }}
        secureTextEntry={is_password}
        keyboardType={keyboard}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

export default Input;
