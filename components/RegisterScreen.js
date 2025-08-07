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

//  Varmistaa, että selainikkuna sulkeutuu oikein kirjautumisen jälkeen
WebBrowser.maybeCompleteAuthSession();

//  OAuth 2.0 -palvelimen päätepisteet kirjautumiselle ja tokenien vaihdolle
const discovery = {
  authorizationEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/authorize",

  tokenEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/token",
};

export default function RegisterScreen({ navigation, route }) {
  //  Rooli valitaan SelectRoleScreenissä ja välitetään route-parametrina
  const { role } = route.params || {};

  //  Luo redirect-osoitteen, johon OAuth vastaa (käytetään Expo-proxya)
  const redirectUri = makeRedirectUri({ useProxy: true });

  //  Määritellään kirjautumispyyntö expo-auth-sessionin kautta
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: "ea427158-f1f3-47af-b515-8da8a2744379", // Azure CIAM client ID
      redirectUri,
      responseType: "code", // Käytetään Authorization Code -flow'ta
      scopes: [
        "openid",
        "profile",
        "api://3f790413-a01c-4d36-9823-dbc0ed63bc67/offline", // API:n käyttöoikeus
      ],
    },
    discovery
  );

  //  Tallennetaan accessToken ja userId sovelluksen tilaan kontekstin kautta
  const { setAccessToken, setUserId, setSelectedRole } = useAuth();

  const [loading, setLoading] = useState(false); // Lataustilan hallinta

  //  Tarkkaillaan OAuth-vastausta
  useEffect(() => {
    if (response?.type === "success" && role) {
      // Jos kirjautuminen onnistui ja rooli on valittu, jatketaan
      handleAuth(response);
    } else if (response?.type === "error") {
      Alert.alert("Virhe", "Kirjautuminen epäonnistui.");
    }
  }, [response, role]);

  //  Käsittelee OAuth-vastauksen: vaihtaa koodin tokeniksi, purkaa tiedot, ja kutsuu omaa APIa
  const handleAuth = async (response) => {
    setLoading(true);

    try {
      const code = response.params.code; // Haetaan authorization code

      //  Vaihdetaan koodi access- ja id-tokeniksi
      const tokenResult = await exchangeCodeAsync(
        {
          clientId: "ea427158-f1f3-47af-b515-8da8a2744379",
          redirectUri,
          code,
          extraParams: {
            code_verifier: request.codeVerifier, // PKCE-suojaus
          },
        },
        discovery
      );

      const accessToken = tokenResult.accessToken;
      const idToken = tokenResult.idToken;

      //  Puretaan access- ja id-token JWT:stä
      const decodedAccess = jwt_decode(accessToken);
      const decodedId = jwt_decode(idToken);
      //  Haetaan käyttäjän OID (Azure AD:n käyttäjä-ID)
      const userId = decodedAccess?.oid || decodedId?.oid;

      if (!userId) {
        Alert.alert("Virhe", "Käyttäjä-ID puuttuu tokenista.");
        setLoading(false);
        return;
      }
      console.log("Lähetetään käyttäjän luontiin:", {
        userId,
        role,
        accessToken,
      });
      if (!role) {
        Alert.alert(
          "Virhe",
          "Rooli puuttuu – tarkista, että valitsit roolin ennen rekisteröitymistä."
        );
        setLoading(false);
        return;
      }

      //  Tallennetaan käyttäjätilat globaaliin AuthContextiin
      setAccessToken(accessToken);
      setUserId(userId);
      setSelectedRole(role);

      //  Luodaan käyttäjä backendin API:in ja asetetaan rooli
      await createUser(userId, role, accessToken);

      //  Ilmoitus ja navigointi pääsivulle
      Alert.alert("✅ Rekisteröityminen onnistui!");
      navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
    } catch (error) {
      console.error("Virhe rekisteröitymisessä:", error);
      Alert.alert("Virhe", "Rekisteröityminen epäonnistui.");
    } finally {
      setLoading(false);
    }
  };

  //  Lähettää uuden käyttäjän tiedot omaan backend-APIin (POST /users)
  const createUser = async (userId, role, accessToken) => {
    const url = "http://vuokraappi-api-gw-dev.azure-api.net/users/";

    const body = {
      id: userId, // Käyttäjän Object ID
      role: role, // "Landlord" tai "Tenant"
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // OAuth token headerissa
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Käyttäjän luonti epäonnistui: ${response.status} ${errorText}`
      );
    }
  };

  //  Käyttöliittymä: näytetään painike ja mahdollinen latausindikaattori
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

// 🎨 Tyylit: moderni ja yksinkertainen ulkoasu
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
