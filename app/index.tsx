import { useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, Text, View, Image, Platform } from 'react-native';
import LoginScreen from './login'; // Import your login screen component
import { Link } from 'expo-router';
import { A } from '@expo/html-elements';
import style from '@/components/style';
import CameraWebView from '@/components/cameraWebView';
import CameraViewMobile from '@/components/cameraViewMobile';
import FoundCardDetails from '@/components/foundCardDetails';

import { ScrollView } from 'react-native'; // Import ScrollView

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();

  const [photoUri, setPhotoUri] = useState<string | null>(null); // State to store the photo URI
  const [results, setResults] = useState<Array<{ cardName: string; cardInfo: any; photoUri: string; result: string }>>([]); // State to store multiple results
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Track login state

  const handleLoginSuccess = () => {
    setIsLoggedIn(true); // Set login state to true after successful login
  };

  const addResult = (cardName: string, cardInfo: any, photoUri: string, result: string) => {
    setResults((prevResults) => [
      { cardName, cardInfo, photoUri, result },
      ...prevResults, // Add new result at the beginning
    ]);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function spinner() {
    return <Text style={styles.message}>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      {Platform.OS == 'web' ? (
        <CameraWebView
          setResult={(result) => {
            const cardName = JSON.parse(result).best_match?.replace('.webp', '');
            const cardInfo = {}; // Fetch or process card info here
            addResult(cardName, cardInfo, photoUri || '', result);
          }}
          setCardName={() => { }}
          setPhotoUri={setPhotoUri}
          setCardInfo={() => { }}
        />
      ) : (
        <CameraViewMobile
          setResult={(result) => {
            const cardName = JSON.parse(result).best_match?.replace('.webp', '');
            const cardInfo = {}; // Fetch or process card info here
            addResult(cardName, cardInfo, photoUri || '', result);
          }}
          setCardName={() => { }}
          setPhotoUri={setPhotoUri}
          setCardInfo={() => { }}
        />
      )}
      <ScrollView style={{ maxHeight: 175, marginTop: 20 }}>
        {results.map((item, index) => (
          <FoundCardDetails
            key={index}
            cardName={item.cardName}
            cardInfo={item.cardInfo}
            photoUri={item.photoUri}
            result={item.result}
            spinner={spinner}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = style();