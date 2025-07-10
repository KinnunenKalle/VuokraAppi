import { View, Text, Dimensions, TouchableOpacity, Alert } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import Input from "./Input.js"; // oletettavasti sähköposti/salasana kentät
import * as WebBrowser from "expo-web-browser";
import {
  useAuthRequest,
  makeRedirectUri,
  exchangeCodeAsync,
} from "expo-auth-session";

// Tarvitaan sulkemaan selain automaattisesti kirjautumisen jälkeen
WebBrowser.maybeCompleteAuthSession();

// Entra ID:n päätepisteet
const discovery = {
  authorizationEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/authorize",
  tokenEndpoint:
    "https://vuokraappi.ciamlogin.com/95e94f96-fda6-4111-953a-439ab54fce6e/oauth2/v2.0/token",
};

export default function Login({ navigation }) {
  // Luo redirectUri joka toimii Expo Go:ssa (käyttää proxyä)
  const redirectUri = makeRedirectUri({
    useProxy: true,
  });

  // Luodaan kirjautumispyyntö
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

  // Kun käyttäjä on kirjautunut ja saanut koodin, haetaan token ja kutsutaan APIa
  React.useEffect(() => {
    const getTokenAndCallApi = async () => {
      if (response?.type === "success") {
        const code = response.params.code;

        try {
          // Vaihdetaan authorization code access tokeniksi

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
          const idToken = tokenResult.idToken;

          // Käytetään access tokenia backend-APIin
          const res = await fetch(
            "https://vuokraappi-api-gw-dev.azure-api.net/users",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await res.json();

          const userId = data?.id || null;

          //Navigoidaan kirjautumisen jälkeen vuokranantajan näkymään

          navigation.navigate("MainApp", {
            accessToken: accessToken,
            userId: userId,
          });

          Alert.alert("Kirjautuminen onnistui!");
        } catch (err) {
          console.error("Virhe tokenin haussa tai API-kutsussa", err);
          Alert.alert("Virhe", "Kirjautuminen tai API-kutsu epäonnistui.");
        }
      }
    };

    getTokenAndCallApi();
  }, [response]);

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
        <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
          VUOKRA ÄPPI
        </Text>
      </LinearGradient>

      <View
        style={{
          elevation: 10,
          backgroundColor: "white",
          borderRadius: 10,
          margin: 10,
          marginTop: -20,
          paddingVertical: 20,
          paddingHorizontal: 15,
        }}
      >
        {/* Kirjautumisnappi avaa selaimen */}
        <TouchableOpacity onPress={() => promptAsync()}>
          <Text
            style={{
              color: "#03bafc",
              fontSize: 16,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 10,
              marginTop: 10,
            }}
          >
            Kirjaudu sisään selaimessa
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
