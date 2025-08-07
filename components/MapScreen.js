import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { WebView } from "react-native-webview";

export default function MapScreen({ route }) {
  const { apartment } = route.params;
  const address = `${apartment.streetAddress}, ${apartment.zipcode}`;
  const [mapUrl, setMapUrl] = useState(null);

  useEffect(() => {
    if (!address) {
      Alert.alert("Virhe", "Osoite puuttuu.");
      return;
    }

    const fetchCoordinates = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address
          )}`
        );
        const data = await response.json();

        if (data.length === 0) {
          Alert.alert("Osoitetta ei löytynyt", "Tarkista osoite: " + address);
          return;
        }

        const { lat, lon } = data[0];
        const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
        setMapUrl(url);
      } catch (error) {
        Alert.alert("Virhe karttaa ladatessa", error.message);
      }
    };

    fetchCoordinates();
  }, [address]);

  return (
    <View style={styles.container}>
      {mapUrl ? (
        <WebView source={{ uri: mapUrl }} style={{ flex: 1 }} />
      ) : (
        <ActivityIndicator
          size="large"
          color="#03bafc"
          style={{ marginTop: 50 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
