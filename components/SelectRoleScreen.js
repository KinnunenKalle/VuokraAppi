import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  useAuthRequest,
  makeRedirectUri,
  exchangeCodeAsync,
} from "expo-auth-session";
import jwt_decode from "jwt-decode";
import { useAuth } from "./AuthContext";

WebBrowser.maybeCompleteAuthSession(); // Tarvitaan Expo Auth Sessionin kanssa

// ENTRA discovery endpoints (authorize + token)
const discovery = {
  authorizationEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/authorize",
  tokenEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/token",
};

// API-roolin lisäysfunktio
const assignRoleToUser = async (userId, role, accessToken) => {
  const url = `http://vuokraappi-api-gw-dev.azure-api.net/users/${userId}/appRoleAssignments`;

  const body = {
    resourceId: "527e1349-11e8-45e2-b038-f461d1626275",
    appRole: role,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error("Roolin lisäys epäonnistui");
    }
  } catch (err) {
    console.error("Roolin lisäys epäonnistui:", err);
    Alert.alert("Virhe", "Roolin asettaminen epäonnistui.");
  }
};

export default function SelectRoleScreen({ navigation }) {
  const redirectUri = makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: "ea427158-f1f3-47af-b515-8da8a2744379",
      redirectUri,
      responseType: "code",
      scopes: [
        "openid profile",
        "api://3f790413-a01c-4d36-9823-dbc0ed63bc67/offline",
      ],
    },
    discovery
  );

  const { setAccessToken, setUserId, selectedRole, setSelectedRole } =
    useAuth();

  // Käsitellään ENTRA:sta palaaminen ja tokenin haku
  useEffect(() => {
    const handleAuth = async () => {
      if (response?.type === "success" && selectedRole) {
        const code = response.params.code;

        try {
          const tokenResult = await exchangeCodeAsync(
            {
              clientId: "ea427158-f1f3-47af-b515-8da8a2744379",
              redirectUri,
              code,
              extraParams: {
                code_verifier: request.codeVerifier,
              },
            },
            discovery
          );

          const accessToken = tokenResult.accessToken;
          const decoded = jwt_decode(accessToken);
          const userId = decoded?.oid;

          if (!userId) {
            Alert.alert("Virhe", "Käyttäjä-ID puuttuu tokenista.");
            return;
          }

          setAccessToken(accessToken);
          setUserId(userId);

          //  Asetetaan valittu rooli käyttäjälle APIin
          await assignRoleToUser(userId, selectedRole, accessToken);

          //  Siirrytään pääsovellukseen
          navigation.reset({
            index: 0,
            routes: [{ name: "MainApp" }],
          });

          Alert.alert("Rekisteröinti onnistui!");
        } catch (err) {
          console.error("Virhe kirjautumisessa tai roolin asettamisessa:", err);
          Alert.alert("Virhe", "Kirjautuminen epäonnistui.");
        }
      }
    };

    handleAuth();
  }, [response]);

  // Funktio, joka asettaa roolin ja käynnistää kirjautumisprosessin
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    promptAsync(); // Avaa selaimen kirjautumiseen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Valitse roolisi</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#60a5fa" }]}
        onPress={() => handleRoleSelect("Landlord")}
      >
        <Text style={styles.buttonText}>Olen vuokranantaja</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#34d399" }]}
        onPress={() => handleRoleSelect("Tenant")}
      >
        <Text style={styles.buttonText}>Olen vuokralainen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 36,
    color: "#1f2937",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 12,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
