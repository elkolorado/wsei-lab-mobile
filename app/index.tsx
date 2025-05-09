import { useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, Text, View, Platform } from 'react-native';
import LoginScreen from './login';
import style from '@/components/style';
import CameraWebView from '@/components/cameraWebView';
import CameraViewMobile from '@/components/cameraViewMobile';
import FoundCardDetails from '@/components/foundCardDetails';
import { useSession } from '@/hooks/useAuth';
import { ScrollView } from 'react-native'; 

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();

  const [photoUri, setPhotoUri] = useState<string | null>(null); 
  const [results, setResults] = useState<Array<{ cardName: string; cardInfo: any; photoUri: string; result: string }>>([]); 
  const { session } = useSession(); 



  const addResult = (cardName: string, cardInfo: any, photoUri: string, result: string) => {
    setResults((prevResults) => [
      { cardName, cardInfo, photoUri, result },
      ...prevResults,
    ]);
  };

  if (!session) {
    return <LoginScreen />;
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