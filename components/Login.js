// Tuodaan React Native -komponentteja ja tyylit
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
// React ja efektien käyttö
import React, { useEffect } from "react";
// Expo WebBrowser -moduuli, jolla voidaan avata selainikkuna sovelluksen sisällä
import * as WebBrowser from "expo-web-browser";
// Expo Auth Session -kirjasto OAuth-autentikointiin
import {
  useAuthRequest,
  makeRedirectUri,
  exchangeCodeAsync,
} from "expo-auth-session";
// Oma AuthContext, josta saa autentikointitiedot ja setterit
import { useAuth } from "./AuthContext";
// Kirjasto JWT-tokenin purkamiseen
import jwt_decode from "jwt-decode";
// Oma komponentti, joka näyttää logon
import Logo from "./Logo";

// Jos autentikointisessio on kesken, pyritään saattamaan se loppuun
WebBrowser.maybeCompleteAuthSession();

// OAuth-palvelun osoitteet (OpenID Connect -discovery)
const discovery = {
  authorizationEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/authorize",
  tokenEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/token",
};

export default function Login({ navigation }) {
  // OAuth:n uudelleenohjaus-URI, käytetään Expo:n proxyä helpottamaan kehitystä
  const redirectUri = makeRedirectUri({ useProxy: true });

  // Määritellään autentikointipyyntö Expo Auth Sessionilla
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: "ea427158-f1f3-47af-b515-8da8a2744379", // Sovelluksen client ID
      redirectUri, // Mihin palvelu uudelleenohjaa kirjautumisen jälkeen
      responseType: "code", // Käytetään authorization code -virtausta
      scopes: [
        // Oikeudet joita pyydetään
        "openid profile",
        "api://3f790413-a01c-4d36-9823-dbc0ed63bc67/offline",
      ],
    },
    discovery // OAuth palvelun tiedot
  );

  // Haetaan AuthContextista setterit tokenille ja käyttäjä-ID:lle
  const { setAccessToken, setUserId } = useAuth();

  // Efekti suoritetaan aina kun 'response' muuttuu (eli kun kirjautumisesta saadaan vastaus)
  useEffect(() => {
    const getTokenAndCallApi = async () => {
      // Tarkistetaan että vastaus on onnistunut
      if (response?.type === "success") {
        const code = response.params.code; // Otetaan authorization code

        try {
          // Vaihdetaan authorization code access-tokeniksi ja id-tokeniksi
          const tokenResult = await exchangeCodeAsync(
            {
              clientId: "ea427158-f1f3-47af-b515-8da8a2744379",
              redirectUri,
              code,
              extraParams: {
                code_verifier: request.codeVerifier, // PKCE varmistus
              },
            },
            discovery
          );

          // Saadaan access-token ja id-token
          const accessToken = tokenResult.accessToken;
          const idToken = tokenResult.idToken;

          // Puretaan tokenit luettavaksi JSONiksi
          const decodedAccess = jwt_decode(accessToken);
          const decodedId = jwt_decode(idToken);

          // Etsitään käyttäjä-ID tokenista (oid = Object ID)
          const userId = decodedAccess?.oid || decodedId?.oid;

          // Yritetään hakea rooli tokenin eri kentistä
          const roleFromAccess =
            decodedAccess?.roles ||
            decodedAccess?.role ||
            decodedAccess["extension_role"];
          const roleFromId =
            decodedId?.roles || decodedId?.role || decodedId["extension_role"];

          // Tulostetaan purkamisen tulokset konsoliin debuggausta varten
          console.log("Decoded Access Token:", decodedAccess);
          console.log("Decoded ID Token:", decodedId);
          console.log(
            "Rooli access tokenista:",
            roleFromAccess || "Ei löytynyt"
          );
          console.log("Rooli ID-tokenista:", roleFromId || "Ei löytynyt");

          // Jos käyttäjä-ID puuttuu, näytetään virhe
          if (!userId) {
            Alert.alert("Virhe", "Käyttäjä-ID puuttuu tokenista.");
            return;
          }

          // Tallennetaan token ja käyttäjä-ID AuthContextiin (käytetään myöhemmin sovelluksessa)
          setAccessToken(accessToken);
          setUserId(userId);

          // Navigoidaan sovelluksen pääsivulle ja tyhjennetään navigaatiopino (estetään paluu login-sivulle)
          navigation.reset({
            index: 0,
            routes: [{ name: "MainApp" }],
          });

          // Näytetään ilmoitus onnistuneesta kirjautumisesta
          Alert.alert("Kirjautuminen onnistui!");
        } catch (err) {
          // Virheiden käsittely, esim. tokenin vaihto epäonnistui
          console.error("Virhe tokenin haussa tai purkamisessa:", err);
          Alert.alert("Virhe", "Kirjautuminen epäonnistui.");
        }
      }
    };

    // Suoritetaan tokenin haku ja käsittely kun response päivittyy
    getTokenAndCallApi();
  }, [response]);

  return (
    <View style={styles.container}>
      {/* Yläosa logolla ja tervetulotekstillä */}
      <View style={styles.headerContainer}>
        <Logo size={72} />
        <Text style={styles.headerText}>Tervetuloa VuokraAppiin!</Text>
      </View>

      {/* Kirjautumispainike, joka avaa OAuth-kirjautumisen selaimessa */}
      <View style={styles.card}>
        <TouchableOpacity onPress={() => promptAsync()} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Kirjaudu sisään selaimessa</Text>
        </TouchableOpacity>
      </View>

      {/* Rekisteröitymispainike, joka vie rekisteröitymissivulle */}
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

// Tyylit komponentille
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
