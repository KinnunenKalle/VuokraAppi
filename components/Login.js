import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import React, { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import {
  useAuthRequest,
  makeRedirectUri,
  exchangeCodeAsync,
} from "expo-auth-session";
import { useAuth } from "./AuthContext";
import jwt_decode from "jwt-decode";
import Logo from "./Logo"; // ✅ varmista oikea polku

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/authorize",
  tokenEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/token",
};

export default function Login({ navigation }) {
  const redirectUri = makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: "ea427158-f1f3-47af-b515-8da8a2744379",
      redirectUri,
      responseType: "code",
      scopes: [
        "api://3f790413-a01c-4d36-9823-dbc0ed63bc67/openid",
        "api://3f790413-a01c-4d36-9823-dbc0ed63bc67/offline",
      ],
    },
    discovery
  );

  const { setAccessToken, setUserId } = useAuth();

  useEffect(() => {
    const getTokenAndCallApi = async () => {
      if (response?.type === "success") {
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

          navigation.reset({
            index: 0,
            routes: [{ name: "MainApp" }],
          });

          Alert.alert("Kirjautuminen onnistui!");
        } catch (err) {
          console.error("Virhe tokenin haussa tai JWT-purussa", err);
          Alert.alert("Virhe", "Kirjautuminen epäonnistui.");
        }
      }
    };

    getTokenAndCallApi();
  }, [response]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Logo size={72} />
        <Text style={styles.headerText}>Tervetuloa VuokraAppiin!</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity onPress={() => promptAsync()} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Kirjaudu sisään selaimessa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  },
  buttonText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
