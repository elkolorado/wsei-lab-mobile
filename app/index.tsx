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
import { Redirect } from 'expo-router';
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
    return <Redirect href="/login"/>;
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
    <View style={[styles.container]}>
      <View style={styles.cameraContainer}>
      {Platform.OS == 'web' ? (
        <CameraWebView
          setResult={(result) => {
            // Expecting wrapped JSON: { apiResult, raw, photoUri }
            try {
              const parsed = JSON.parse(result);
              if (parsed && parsed.apiResult !== undefined) {
                const api = parsed.apiResult;
                const cardName = api?.card_details?.cardMarketId || api?.best_match?.replace?.('.webp', '') || '';
                const cardInfo = api?.card_details || api || null;
                const sentPhoto = parsed.photoUri || '';
                addResult(cardName, cardInfo, sentPhoto, parsed.raw || result);
                return;
              }
            } catch (e) {
              // fall through
            }

            // Fallback for old/raw result
            try {
              const raw = JSON.parse(result);
              const cardName = raw.card_details?.cardMarketId;
              const cardInfo = raw.card_details;
              addResult(cardName, cardInfo, photoUri || '', result);
            } catch (err) {
              addResult('', null, photoUri || '', result);
            }
          }}
          setCardName={() => { }}
          setPhotoUri={setPhotoUri}
          setCardInfo={() => { }}
        />
      ) : (
        <CameraViewMobile
          setPhotoUri={setPhotoUri}
          setResult={(result) => {
            // Support wrapped result from mobile camera which may include photoUri
            try {
              const parsed = JSON.parse(result);
              if (parsed && parsed.apiResult !== undefined) {
                const api = parsed.apiResult;
                const cardName = api?.card_details?.cardMarketId || api?.best_match?.replace?.('.webp', '') || '';
                const cardInfo = api?.card_details || api || null;
                const sentPhoto = parsed.photoUri || '';
                addResult(cardName, cardInfo, sentPhoto, parsed.raw || result);
                return;
              }
            } catch (e) {
              // fall through
            }

            try {
              const raw = JSON.parse(result);
              const cardName = raw.card_details?.cardMarketId;
              const cardInfo = raw.card_details;
              addResult(cardName, cardInfo, photoUri || '', result);
            } catch (err) {
              addResult('', null, photoUri || '', result);
            }
          }}
        />
      )}
      </View>
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