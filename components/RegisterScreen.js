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

// WebBrowser mahdollistaa OAuth-kirjautumisen selaimessa ja tämän avulla saadaan suljettua selainikkuna oikein.
WebBrowser.maybeCompleteAuthSession();

// OAuth-palvelimen päätepisteet, joita käytetään kirjautumiseen ja tokenin vaihtoon.
const discovery = {
  authorizationEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/authorize",
  tokenEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/token",
};

// Roolien appRoleId:t, joita API käyttää tunnistamaan käyttäjän roolin
const roleIds = {
  Landlord: "53fc7f95-4883-4883-af70-375270557682", // Vuokranantaja
  Tenant: "1cf794e6-77a1-44c5-bc9e-e6b690713740", // Vuokralainen
};

export default function RegisterScreen({ navigation, route }) {
  // Route-parametrina saadaan rekisteröitävän käyttäjän rooli, esim. "Landlord" tai "Tenant"
  const { role } = route.params || {};

  // OAuth-redirect URI, jossa Expo proxy auttaa kehitysvaiheessa
  const redirectUri = makeRedirectUri({ useProxy: true });

  // Määritellään autentikointipyyntö käyttäen annettuja scopeja.
  // Scopet määräävät, mitä oikeuksia pyydetään OAuth-palvelimelta.
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: "ea427158-f1f3-47af-b515-8da8a2744379",
      redirectUri,
      responseType: "code", // Käytetään authorization code -virtausta (turvallinen tapa)
      scopes: [
        "openid",
        "profile",
        "api://3f790413-a01c-4d36-9823-dbc0ed63bc67/offline", // API:n käyttöoikeus
      ],
    },
    discovery
  );

  // Haetaan AuthContextin setterit tokenin ja käyttäjä-ID:n tallentamiseen sovelluksen tilaan
  const { setAccessToken, setUserId } = useAuth();

  // Lataustilan hallinta (näytetään spinner kun odotetaan vastauksia)
  const [loading, setLoading] = useState(false);

  // Efekti käynnistyy aina kun OAuth-vastaus (response) muuttuu
  useEffect(() => {
    // Jos OAuth onnistui ja rooli on valittu, jatketaan käsittelyä
    if (response?.type === "success" && role) {
      handleAuth(response);
    } else if (response?.type === "error") {
      Alert.alert("Virhe", "Kirjautuminen epäonnistui.");
    }
  }, [response, role]);

  // Funktio käsittelee OAuth-vastauksen: vaihtaa koodin tokeniksi, purkaa tokenin,
  // tallentaa tokenin, ja asettaa roolin kutsumalla APIa.
  const handleAuth = async (response) => {
    setLoading(true); // Aloitetaan lataustila

    try {
      // Haetaan authorization code vastauksesta
      const code = response.params.code;

      // Vaihdetaan authorization code access- ja id-tokeneiksi tokenEndpointilla
      const tokenResult = await exchangeCodeAsync(
        {
          clientId: "ea427158-f1f3-47af-b515-8da8a2744379",
          redirectUri,
          code,
          extraParams: {
            code_verifier: request.codeVerifier, // PKCE-varmistus turvaamaan vaihto
          },
        },
        discovery
      );

      const accessToken = tokenResult.accessToken; // OAuth access token
      const idToken = tokenResult.idToken; // OAuth ID token

      // Puretaan tokenit JSON-muotoon, jotta voimme lukea käyttäjätiedot
      const decodedAccess = jwt_decode(accessToken);
      const decodedId = jwt_decode(idToken);

      // Etsitään käyttäjän Object ID tokenista (oid)
      const userId = decodedAccess?.oid || decodedId?.oid;

      if (!userId) {
        Alert.alert("Virhe", "Käyttäjä-ID puuttuu tokenista.");
        setLoading(false);
        return;
      }

      // Tallennetaan token ja userId sovelluksen tilaan AuthContextiin
      setAccessToken(accessToken);
      setUserId(userId);

      // Kutsutaan funktiota, joka asettaa käyttäjälle roolin kutsumalla APIa
      await assignRoleToUser(userId, role, accessToken);

      // Ilmoitetaan onnistumisesta ja navigoidaan pääsivulle (tyhjennetään historia)
      Alert.alert("✅ Rekisteröityminen onnistui ja rooli asetettu!");
      navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
    } catch (error) {
      console.error("Virhe rekisteröitymisessä:", error);
      Alert.alert("Virhe", "Rekisteröityminen epäonnistui.");
    } finally {
      setLoading(false); // Lopetetaan lataustila
    }
  };

  // Funktio tekee POST-pyynnön API:lle, joka asettaa käyttäjälle roolin
  const assignRoleToUser = async (userId, role, accessToken) => {
    // Haetaan appRoleId roolin nimen perusteella (Landlord tai Tenant)
    const appRoleId = roleIds[role];

    if (!appRoleId) {
      throw new Error("Tuntematon rooli: " + role);
    }

    // API-osoite roolin asettamiselle (POST-pyyntö)
    const url = `http://vuokraappi-api-gw-dev.azure-api.net/users/${userId}/appRoleAssignments`;

    // Pyynnön body noudattaa Postman-esimerkkiä:
    // principalId = käyttäjän Object ID
    // resourceId = kiinteä resource tunniste (API:n id)
    // appRoleId = valitun roolin id
    const body = {
      principalId: userId,
      resourceId: "527e1349-11e8-45e2-b038-f461d1626275",
      appRoleId: appRoleId,
    };

    // Lähetetään POST-pyyntö, mukana accessToken Bearer -otsakkeessa
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // Varmistaa, että API hyväksyy pyynnön
      },
      body: JSON.stringify(body),
    });

    // Tarkistetaan vastaus, jos epäonnistui heitetään virhe
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Roolin asetus epäonnistui: ${response.status} ${errorText}`
      );
    }
  };

  // JSX: Renderöidään rekisteröitymispainike ja latausspinneri
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

// Tyylit, jotka tekevät UI:sta siistin ja selkeän
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 40,
    color: "#334155",
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 18 },
});
