import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "./AuthContext";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

// React Native Gesture Handler ja Reanimated kirjastot swipe-käsittelyyn
import {
  PanGestureHandler,
  State as GestureState,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedGestureHandler,
  runOnJS,
} from "react-native-reanimated";

// Maksimimäärä kuvia per asunto
const MAX_IMAGES = 15;

// Näytön mitat (swipe-animaatioita varten)
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

export default function ApartmentDetails({ route, navigation }) {
  // Saadaan navigaation kautta valittu asunto
  const { apartment } = route.params;
  // AuthContextista token ja käyttäjäID
  const { accessToken, userId } = useAuth();

  // Asunnon tiedot komponentin tilana, alustetaan parametrien perusteella
  const [streetAddress, setStreetAddress] = useState(apartment.streetAddress);
  const [zipcode, setZipcode] = useState(apartment.zipcode);
  const [size, setSize] = useState(apartment.size);
  const [rent, setRent] = useState(apartment.rent);

  // SAS-url blobien lataukseen ja kuvatiedostojen osoitteet
  const [sasUrl, setSasUrl] = useState(null);
  const [imageUris, setImageUris] = useState([]);

  // Modalin näkyvyys ja valitun kuvan indeksi
  const [modalVisible, setModalVisible] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // Kokonaisosoite kätevästi valmiina käyttöön
  const fullAddress = `${streetAddress}, ${zipcode}`;

  // Reanimated shared value swipe-animaatiota varten
  const translateX = useSharedValue(0);

  // Haetaan asunnon tiedot ja SAS-url kuville aina kun näkymä aktivoituu (navigointi takaisin)
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          // Haetaan asunto APIsta (voi päivittää tiedot, jos muokattu)
          const res = await fetch(
            `https://vuokraappi-api-gw-dev.azure-api.net/apartments/${apartment.id}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (!res.ok) throw new Error("Asunnon haku epäonnistui");
          const data = await res.json();

          // Päivitetään tila uusilla tiedoilla
          setStreetAddress(data.streetAddress);
          setZipcode(data.zipcode);
          setSize(data.size);
          setRent(data.rent);

          // Haetaan SAS-url blob storageen
          const sasRes = await fetch(
            `https://vuokraappi-api-gw-dev.azure-api.net/apartments/uploadPic?userId=${userId}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (!sasRes.ok) throw new Error("SAS-url haku epäonnistui");
          const sasData = await sasRes.json();

          setSasUrl(sasData.sasUrl);

          // Haetaan kuvat blobstoragesta
          await fetchImages(sasData.sasUrl);
        } catch (e) {
          console.error(e);
          Alert.alert("Virhe", "Asunnon tiedot tai kuvat eivät latautuneet.");
        }
      };
      fetchData();
    }, [apartment.id, accessToken, userId])
  );

  // Haetaan kuvat blobstoragesta HEAD-pyynnöillä kuvan olemassaolon varmistamiseksi
  const fetchImages = async (sasUrl) => {
    if (!sasUrl) return;

    let uris = [];

    try {
      const [baseUrl, sasToken] = sasUrl.split("?");

      for (let i = 1; i <= MAX_IMAGES; i++) {
        const url = `${baseUrl}/${userId}/${apartment.id}-${i}.jpg?${sasToken}`;

        const headRes = await fetch(url, { method: "HEAD" });
        if (headRes.ok) {
          uris.push(url);
        }
      }

      setImageUris(uris);
    } catch (e) {
      console.error("Virhe fetchImages-funktiossa", e);
    }
  };

  // Näyttää valintavalikon kuvan lisäämiseksi
  const chooseImageSource = () => {
    Alert.alert("Lisää kuva", "Valitse lähde", [
      { text: "Kamera", onPress: () => pickImage("camera") },
      { text: "Galleria", onPress: () => pickImage("gallery") },
      { text: "Peruuta", style: "cancel" },
    ]);
  };

  // Käyttää Expo ImagePickeriä kameran tai gallerian avaamiseen
  const pickImage = async (source) => {
    try {
      let result;
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Virhe", "Kameran käyttö estetty.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaType?.Images,
          quality: 0.7,
          base64: false,
        });
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Virhe", "Gallerian käyttö estetty.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaType?.Images,
          quality: 0.7,
          base64: false,
        });
      }

      // Jos kuva valittu, ladataan se
      if (!result.canceled) {
        await uploadImage(result.assets[0]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Virhe", "Kuvan valinta epäonnistui.");
    }
  };

  // Lataa kuvan blob storagen allekirjoitettuun osoitteeseen PUT-pyynnöllä
  const uploadImage = async (asset) => {
    if (!sasUrl) {
      Alert.alert("Virhe", "Ei SAS-urlia ladattavaksi");
      return;
    }

    // Etsitään ensimmäinen vapaa kuvan indeksi (1-15)
    let index = 1;
    while (
      imageUris.some((uri) => uri.includes(`-${index}.jpg`)) &&
      index <= MAX_IMAGES
    ) {
      index++;
    }
    if (index > MAX_IMAGES) {
      Alert.alert("Virhe", "Maksimissaan 15 kuvaa sallittu");
      return;
    }

    // Muodostetaan täydellinen blob URL SAS-tokenilla
    const [baseUrl, sasToken] = sasUrl.split("?");
    const blobUrl = `${baseUrl}/${userId}/${apartment.id}-${index}.jpg?${sasToken}`;

    try {
      // Haetaan kuvan data blobiksi
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // Lähetetään PUT-pyyntö blob storagelle
      const uploadRes = await fetch(blobUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": "image/jpeg",
        },
        body: blob,
      });
      if (!uploadRes.ok) {
        throw new Error(`Upload epäonnistui: ${uploadRes.status}`);
      }

      // Päivitetään tila uusilla kuvan osoitteella ja näytetään ilmoitus
      setImageUris((prev) => [...prev, blobUrl]);
      Alert.alert("Kuva ladattu onnistuneesti!");
    } catch (e) {
      console.error(e);
      Alert.alert("Virhe", "Kuvan lataus epäonnistui.");
    }
  };

  // Poistaa valitun kuvan blobstoragesta DELETE-pyynnöllä
  const deleteImage = async (uri) => {
    try {
      const res = await fetch(uri, { method: "DELETE" });
      if (!res.ok) throw new Error("Poisto epäonnistui");

      // Poistetaan kuva tilasta ja suljetaan modal
      setImageUris((prev) => prev.filter((u) => u !== uri));
      setModalVisible(false);
      Alert.alert("Kuva poistettu");
    } catch (e) {
      console.error(e);
      Alert.alert("Virhe", "Kuvan poistaminen epäonnistui.");
    }
  };

  // Avataan modal tietylle kuvalle indeksillä
  const openModal = (index) => {
    setModalIndex(index);
    setModalVisible(true);
  };

  // Suljetaan modal
  const closeModal = () => {
    setModalVisible(false);
    translateX.value = 0; // Nollataan swipe-arvo
  };

  // Swipe-gesture event käsittelijä
  const onPanGestureEvent = useAnimatedGestureHandler({
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: (event) => {
      if (event.translationX < -50) {
        const nextIndex = (modalIndex + 1) % imageUris.length;
        runOnJS(setModalIndex)(nextIndex);
      } else if (event.translationX > 50) {
        const prevIndex =
          modalIndex === 0 ? imageUris.length - 1 : modalIndex - 1;
        runOnJS(setModalIndex)(prevIndex);
      }
      translateX.value = withTiming(0);
    },
  });

  // Swipe päättyy, tarkistetaan swipe-suunnat ja vaihdetaan kuvaa tarpeen mukaan
  const onPanHandlerStateChange = (event) => {
    if (event.nativeEvent.state === GestureState.END) {
      const translationX = event.nativeEvent.translationX;

      if (translationX < -50) {
        // Swipe vasemmalle, seuraava kuva
        const nextIndex = (modalIndex + 1) % imageUris.length;
        setModalIndex(nextIndex);
      } else if (translationX > 50) {
        // Swipe oikealle, edellinen kuva
        const prevIndex =
          modalIndex === 0 ? imageUris.length - 1 : modalIndex - 1;
        setModalIndex(prevIndex);
      }
      translateX.value = withTiming(0);
    }
  };

  // Animated tyyli swipe-kontainerille (kuvan liike vaakasuunnassa)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {/* Näytetään asunnon perustiedot */}
        <Text style={styles.label}>Osoite</Text>
        <Text style={styles.value}>{streetAddress}</Text>

        <Text style={styles.label}>Postinumero</Text>
        <Text style={styles.value}>{zipcode}</Text>

        <Text style={styles.label}>Koko (m²)</Text>
        <Text style={styles.value}>{size}</Text>

        <Text style={styles.label}>Vuokra (€)</Text>
        <Text style={styles.value}>{rent}</Text>

        {/* Kuvagalleria pikkukuvilla */}
        <View style={styles.imageGallery}>
          {imageUris.slice(0, MAX_IMAGES).map((uri, index) => (
            <TouchableOpacity key={index} onPress={() => openModal(index)}>
              <Image source={{ uri }} style={styles.thumbnail} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Lisää kuva nappi (jos alle MAX_IMAGES) */}
        {imageUris.length < MAX_IMAGES && (
          <TouchableOpacity
            onPress={chooseImageSource}
            style={styles.buttonAddImage}
          >
            <Feather
              name="camera"
              size={20}
              color="#000"
              style={styles.iconLeft}
            />
            <Text style={styles.buttonTextBlack}>Lisää kuva</Text>
          </TouchableOpacity>
        )}

        {/* Modal koko kuvalle ja selaus */}
        <Modal
          visible={modalVisible}
          transparent={true}
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackground}>
            {/* Swipe-gesture käsittely koko kuvan ympärillä */}
            <PanGestureHandler
              onGestureEvent={onPanGestureEvent}
              onHandlerStateChange={onPanHandlerStateChange}
            >
              <Animated.View
                style={[styles.animatedImageContainer, animatedStyle]}
              >
                <Image
                  source={{ uri: imageUris[modalIndex] }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </PanGestureHandler>

            {/* Modalin ohjaimet: edellinen, poista, seuraava */}
            <View style={styles.modalControls}>
              <TouchableOpacity
                onPress={() =>
                  setModalIndex(
                    modalIndex === 0 ? imageUris.length - 1 : modalIndex - 1
                  )
                }
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
                <Text style={{ color: "#ffffff" }}>Edellinen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => deleteImage(imageUris[modalIndex])}
                style={styles.deleteButton}
              >
                <Ionicons name="trash" size={24} color="#ffffff" />
                <Text style={{ color: "#ffffff" }}>Poista</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setModalIndex((modalIndex + 1) % imageUris.length)
                }
                style={styles.navButton}
              >
                <Ionicons name="chevron-forward" size={24} color="#ffffff" />
                <Text style={{ color: "#ffffff" }}>Seuraava</Text>
              </TouchableOpacity>
            </View>

            {/* Sulje nappi modaalin oikeassa yläkulmassa */}
            <TouchableOpacity onPress={closeModal} style={styles.closeArea}>
              <Text style={styles.closeTextBlack}>Sulje</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>

      {/* Alaosan navigaatiopainikkeet ikonien kanssa */}
      <View style={styles.bottomButtonContainer}>
        <Pressable
          style={styles.linkButton}
          onPress={() => navigation.navigate("Apartments")}
        >
          <Feather name="home" size={20} color="#0f172a" />
          <Text style={styles.linkButtonText}>Takaisin asuntolistaan</Text>
        </Pressable>

        <Pressable
          style={styles.linkButton}
          onPress={() => navigation.navigate("EditApartment", { apartment })}
        >
          <Feather name="edit" size={20} color="#0f172a" />
          <Text style={styles.linkButtonText}>Muokkaa asunnon tietoja</Text>
        </Pressable>

        <Pressable
          style={styles.linkButton}
          onPress={() => navigation.navigate("MapScreen", { apartment })}
        >
          <Feather name="map-pin" size={20} color="#0f172a" />
          <Text style={styles.linkButtonText}>Näytä kartalla</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 10,
  },
  label: {
    fontWeight: "600",
    fontSize: 16,
    marginTop: 12,
    color: "#1e293b",
  },
  value: {
    fontSize: 18,
    fontWeight: "400",
    color: "#1e293b",
    marginBottom: 8,
  },
  imageGallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    justifyContent: "center",
    gap: 10,
  },
  thumbnail: {
    width: 100,
    height: 75,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  buttonAddImage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  buttonTextBlack: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  animatedImageContainer: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  modalControls: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  closeArea: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 10,
  },
  closeTextBlack: {
    color: "#fff",
    fontSize: 18,
  },
  bottomButtonContainer: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
    gap: 18,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
});
