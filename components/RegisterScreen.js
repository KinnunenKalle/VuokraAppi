import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  useAuthRequest,
  makeRedirectUri,
  exchangeCodeAsync,
} from "expo-auth-session";
import { useAuth } from "./AuthContext";
import jwt_decode from "jwt-decode";

// Varmistaa, että selainikkuna sulkeutuu oikein kirjautumisen jälkeen
WebBrowser.maybeCompleteAuthSession();

// OAuth 2.0 -palvelimen päätepisteet
const discovery = {
  authorizationEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/authorize",
  tokenEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/token",
};

export default function RegisterScreen({ navigation }) {
  // Luodaan redirect URI Expo-proxyn kautta
  const redirectUri = makeRedirectUri({ useProxy: true });

  const [loading, setLoading] = useState(false);

  // AuthContext: accessToken, userId ja rooli
  const { setAccessToken, setUserId, setSelectedRole } = useAuth();

  // Määritellään OAuth-kirjautumispyyntö
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: "ea427158-f1f3-47af-b515-8da8a2744379",
      redirectUri,
      responseType: "code",
      scopes: [
        "openid",
        "profile",
        "api://3f790413-a01c-4d36-9823-dbc0ed63bc67/offline",
      ],
    },
    discovery
  );

  // Käsittelee OAuth-vastauksen
  useEffect(() => {
    if (response?.type === "success") {
      handleAuth(response);
    } else if (response?.type === "error") {
      Alert.alert("Virhe", "Kirjautuminen epäonnistui.");
    }
  }, [response]);

  // OAuth-tokenin vaihto ja käyttäjän luonti
  const handleAuth = async (response) => {
    setLoading(true);
    try {
      const code = response.params.code;

      const tokenResult = await exchangeCodeAsync(
        {
          clientId: "ea427158-f1f3-47af-b515-8da8a2744379",
          redirectUri,
          code,
          extraParams: { code_verifier: request.codeVerifier },
        },
        discovery
      );

      const accessToken = tokenResult.accessToken;
      const idToken = tokenResult.idToken;

      const decodedAccess = jwt_decode(accessToken);
      const decodedId = jwt_decode(idToken);
      const userId = decodedAccess?.oid || decodedId?.oid;

      if (!userId) {
        Alert.alert("Virhe", "Käyttäjä-ID puuttuu tokenista.");
        setLoading(false);
        return;
      }

      setAccessToken(accessToken);
      setUserId(userId);

      // Luodaan käyttäjä backendissä (jos ei vielä ole olemassa)
      await createUser(userId, accessToken);

      // Haetaan oikea rooli backendistä
      const res = await fetch(
        `http://vuokraappi-api-gw-dev.azure-api.net/users/${userId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();

      setSelectedRole(data.role);

      Alert.alert("Rekisteröityminen onnistui!");

      // Navigoidaan roolin mukaan
      if (data.role === "Landlord") {
        navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "TenantApp" }] });
      }
    } catch (error) {
      console.error("Virhe rekisteröitymisessä:", error);
      Alert.alert("Virhe", "Rekisteröityminen epäonnistui.");
    } finally {
      setLoading(false);
    }
  };

  // Lähettää uuden käyttäjän tiedot omaan backend-APIin (POST /users)
  const createUser = async (userId, accessToken) => {
    const body = { id: userId };

    console.log("Lähetetään backendille:", body);

    const response = await fetch(
      "http://vuokraappi-api-gw-dev.azure-api.net/users/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend palautti virheen:", response.status, errorText);
      throw new Error(
        `Käyttäjän luonti epäonnistui: ${response.status} ${errorText}`
      );
    }

    console.log("Käyttäjä luotu onnistuneesti!");
  };

  // Renderöinti: painike ja latausindikaattori
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { opacity: request ? 1 : 0.5 }]}
        disabled={!request || loading}
        onPress={() => promptAsync()}
      >
        <Text style={styles.buttonText}>
          {loading ? "Ladataan..." : "Rekisteröidy selaimessa"}
        </Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={{ marginTop: 20 }}
        />
      )}
    </View>
  );
}

// Tyylit
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
  },
});
