import { useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, Text, View, Image, Platform } from 'react-native';
import LoginScreen from './login'; // Import your login screen component
import { Link } from 'expo-router';
import { A } from '@expo/html-elements';
import style from '@/components/style';
import CameraWebView from '@/components/cameraWebView';
import CameraViewMobile from '@/components/cameraViewMobile';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();

  const [photoUri, setPhotoUri] = useState<string | null>(null); // State to store the photo URI
  const [result, setResult] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState<any | null>(null);
  const [cardName, setCardName] = useState<string | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state

  const handleLoginSuccess = () => {
    setIsLoggedIn(true); // Set login state to true after successful login
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
      {result && cardName && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <Text>Name: {cardName || spinner()}</Text>
            <Text>Availability: {cardInfo?.availability || spinner()}</Text>
            <Text>Price: {cardInfo?.price || spinner()}</Text>
            <A style={{ textDecorationLine: 'underline', color: 'blue' }} href={cardInfo?.link || ''}>
              Card Market Link
            </A>
          </View>
          {photoUri && <Image source={{ uri: photoUri }} style={[styles.capturedImage, { flex: 1 }]} />}
          {
            <Image
              source={{
                uri: 'https://www.dbs-cardgame.com/fw/images/cards/card/en/' + JSON.parse(result).best_match,
              }}
              style={[styles.capturedImage, { flex: 1 }]}
            />
          }
        </View>
      )}
      {Platform.OS == 'web' ? (
        <CameraWebView setResult={setResult} setCardName={setCardName} />
      ) : (
        <CameraViewMobile
          setResult={setResult}
          setCardName={setCardName}
          setPhotoUri={setPhotoUri}
          setCardInfo={setCardInfo}
        />
      )}
    </View>
  );
}

const styles = style();