import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import React, { useEffect } from "react";

// Expo-moduuli selaimessa avattavan auth-sessionin käsittelyyn
import * as WebBrowser from "expo-web-browser";

// AuthSession: kirjautumispyynnöt ja tokenin vaihto
import {
  useAuthRequest,
  makeRedirectUri,
  exchangeCodeAsync,
} from "expo-auth-session";

// Oma autentikointikonteksti, josta saadaan setAccessToken jne.
import { useAuth } from "./AuthContext";

// Kirjasto JWT-tokenin purkamiseen (accessToken sisältää käyttäjä-ID:n)
import jwt_decode from "jwt-decode";

// Logokomponentti yläosaan
import Logo from "./Logo";

// Sulkee mahdollisen avoinna olevan auth-selaimen
WebBrowser.maybeCompleteAuthSession();

// CIAM:in OAuth 2.0 -päätepisteet
const discovery = {
  authorizationEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/authorize",
  tokenEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/token",
};

export default function Login({ navigation }) {
  // Luo redirect-URI (käytetään Expon proxyä kehityksessä)
  const redirectUri = makeRedirectUri({ useProxy: true });

  // Määrittele kirjautumispyyntö
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: "ea427158-f1f3-47af-b515-8da8a2744379", // Azure CIAMin client ID
      redirectUri,
      responseType: "code", // Käytetään authorization code -flow'ta
      scopes: [
        "openid profile",
        "api://3f790413-a01c-4d36-9823-dbc0ed63bc67/offline", // Oman API:n käyttöoikeus
      ],
    },
    discovery
  );

  // Haetaan kontekstista setterit accessTokenille, userId:lle ja roolille
  const { setAccessToken, setUserId, setSelectedRole } = useAuth();

  // Tämä efekti ajetaan aina kun kirjautumisvastauksen tila (response) muuttuu
  useEffect(() => {
    const getTokenAndUserInfo = async () => {
      if (response?.type === "success") {
        try {
          const code = response.params.code;

          // Vaihdetaan authorization code -> access ja id token
          const tokenResult = await exchangeCodeAsync(
            {
              clientId: "ea427158-f1f3-47af-b515-8da8a2744379",
              redirectUri,
              code,
              extraParams: {
                code_verifier: request.codeVerifier, // PKCE
              },
            },
            discovery
          );

          // Tallennetaan access token ja dekoodataan siitä oid
          const accessToken = tokenResult.accessToken;
          const decodedAccess = jwt_decode(accessToken);
          const userId = decodedAccess?.oid;

          // Tarkista että käyttäjän ID löytyi
          if (!userId) {
            Alert.alert("Virhe", "Käyttäjän ID (oid) puuttuu tokenista.");
            return;
          }

          // Tallennetaan tokenit AuthContextiin
          setAccessToken(accessToken);
          setUserId(userId);

          // Haetaan käyttäjän tiedot backendistä käyttäjä-ID:llä
          const userData = await fetchUserData(userId, accessToken);
          if (userData?.role) {
            setSelectedRole(userData.role); // Tallennetaan rooli AuthContextiin
          } else {
            console.warn("Roolia ei löytynyt backendin vastauksesta.");
          }

          // Navigoidaan pääsivulle (tyhjennetään navigaatiopino)
          if (userData?.role === "Landlord") {
            navigation.reset({
              index: 0,
              routes: [{ name: "Mainapp" }],
            });
          } else if (userData?.role === "TENANT") {
            navigation.reset({
              index: 0,
              routes: [{ name: "TenantHomepage" }],
            });
          } else {
            Alert.alert("Virhe", "Tuntematon rooli: " + userData?.role);
          }

          // Ilmoitus onnistuneesta kirjautumisesta
          Alert.alert("Kirjautuminen onnistui!");
        } catch (err) {
          console.error("Virhe kirjautumisessa:", err);
          Alert.alert("Virhe", "Kirjautuminen epäonnistui.");
        }
      }
    };
    getTokenAndUserInfo();
  }, [response]);

  // Hakee käyttäjän tiedot backendistä GET /users/{id}
  const fetchUserData = async (userId, accessToken) => {
    const response = await fetch(
      `http://vuokraappi-api-gw-dev.azure-api.net/users/${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Käyttäjän haku epäonnistui:", response.status, errorText);
      throw new Error("Käyttäjän tietojen haku epäonnistui.");
    }

    const data = await response.json();
    return data; // oletetaan: { id: "...", role: "Tenant" }
  };

  return (
    <View style={styles.container}>
      {/* Yläosa logolla ja tekstillä */}
      <View style={styles.headerContainer}>
        <Logo size={72} />
        <Text style={styles.headerText}>Tervetuloa VuokraAppiin!</Text>
      </View>

      {/* Kirjautumispainike */}
      <View style={styles.card}>
        <TouchableOpacity onPress={() => promptAsync()} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Kirjaudu sisään selaimessa</Text>
        </TouchableOpacity>
      </View>

      {/* Rekisteröitymispainike */}
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => navigation.navigate("SelectRole")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Rekisteröidy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Tyylit
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8fafc",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 32,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#334155",
    marginTop: 12,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginHorizontal: 24,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginVertical: 12,
  },
  buttonText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
