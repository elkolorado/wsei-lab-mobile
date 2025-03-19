import { Camera, CameraType, CameraView, useCameraPermissions, CameraOrientation } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { matchFeatures } from '@/components/matchFeatures';
import { matchCard } from '@/actions/matchCard';
import { Link } from 'expo-router';
import { fetchCardInfo } from '@/actions/cardPrice';
import { A } from '@expo/html-elements';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<React.RefObject<CameraView>>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null); // State to store the photo URI
  const [orientation, setOrientation] = useState<CameraOrientation>(1)
  //result of fetch
  const [result, setResult] = useState<string | null>(null);
  //card info
  const [cardInfo, setCardInfo] = useState<any | null>(null);
  const [cardName, setCardName] = useState<string | null>(null);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function spinner() {
    return (
        <Text style={styles.message}>Loading...</Text>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePhoto() {
    setPhotoUri(null); // Clear the previous photo URI
    setResult(null);
    setCardName(null);
    setCardInfo(null);


    //get lowest size getAvailablePictureSizesAsync()
    const availablePictureSizes = await cameraRef.current?.getAvailablePictureSizesAsync();
    console.log(availablePictureSizes);
    //pick medium file size from array by multiplying the size aaxbb
    let sizes = availablePictureSizes.map((size) => {
      let sizeArray = size.split("x");
      return parseInt(sizeArray[0]) * parseInt(sizeArray[1]);
    });
    //pick medium size
    // let mediumSize = availablePictureSizes[sizes.indexOf(Math.(...sizes))];
    // console.log(mediumSize);

    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        shutterSound: false,
      });
      setPhotoUri(photo.uri); // Save the photo URI to state

      //pass to mmachFeatures
      // Define referenceFeatures with appropriate data
      let result = await matchCard(photo.uri);
      setResult(result);

      const cardName = JSON.parse(result).best_match?.replace(".webp", "");
      setCardName(cardName);


      // get card info
      let cardInfo = await fetchCardInfo(cardName);
      // let cardInfo = null;
      setCardInfo(cardInfo);

      // Display the result as a text on top of the screen


    }
  }

  return (
    <View style={styles.container}>
      {result && cardName && (  // Display the result if it's available
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <Text style={styles.message}>Name: {cardName || spinner()}</Text>
            <Text style={styles.message}>Availability: {cardInfo?.availability || spinner()}</Text>
            <Text style={styles.message}>Price: {cardInfo?.price || spinner()}</Text>
            <A style={{textDecorationLine: 'underline', color: 'blue'}} href={cardInfo?.link || ''}>Card Market Link</A>
            {/* <Link href={`https://www.cardmarket.com/en/DragonBallSuper/Products/Search?searchString=${JSON.parse(result).best_match?.replace(".webp", "")}`}>{JSON.parse(result).best_match}</Link> */}

          </View>
          {photoUri && <Image source={{ uri: photoUri }} style={[styles.capturedImage, { flex: 1 }]} />}
          {<Image source={{ uri: 'https://www.dbs-cardgame.com/fw/images/cards/card/en/' + JSON.parse(result).best_match }} style={[styles.capturedImage, { flex: 1 }]} />}

        </View>
      )}
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} pictureSize='1080x1920' responsiveOrientationWhenOrientationLocked={true}
        onResponsiveOrientationChanged={(e) => onSetOrientation(e.orientation)}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={takePhoto}>
              <Text style={styles.text}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  capturedImage: {
    // Display the captured image at the top of the screen
    height: 100,
    resizeMode: 'contain',
  },
});