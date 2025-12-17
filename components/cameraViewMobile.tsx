import { CameraType, CameraView } from "expo-camera"
import { View } from "react-native";
import style from './style';
import { TouchableOpacity, Text } from "react-native";
import { useRef, useState } from "react";
import { matchCards } from '@/actions/matchCards';
import { matchCard } from '@/actions/matchCard';

import { fetchCardInfo } from '@/actions/cardPrice';


interface CameraViewProps {
  setResult: (result: string) => void;
  setPhotoUri?: (uri: string | null) => void;
}

const CameraViewMobile: React.FC<CameraViewProps> = ({setResult}) => {
    const [facing, setFacing] = useState<CameraType>('back');
    const cameraRef = useRef<CameraView>(null);
    const styles = style();

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
      }

    function onSetOrientation(orientation: string) {
        console.log('Orientation changed:', orientation);
      }

    async function takePhoto() {
      console.log('takePhoto called', await cameraRef.current?.getAvailablePictureSizesAsync());
      // setResult('');
    
        let availablePictureSizes = undefined;
        try {
          availablePictureSizes = await cameraRef.current?.getAvailablePictureSizesAsync();
          console.log('Available picture sizes:', availablePictureSizes);
        } catch (err) {
          console.log('Error getting available picture sizes:', err);
        }
        let sizes = availablePictureSizes?.map((size) => {
          let sizeArray = size.split("x");
          return parseInt(sizeArray[0]) * parseInt(sizeArray[1]);
        });
        console.log('Calculated sizes:', sizes);
    
        if (cameraRef.current) {
          console.log('Camera ref is valid, taking picture...');
          const photo = await cameraRef.current.takePictureAsync({
            shutterSound: false,
          });
          console.log('Photo taken:', photo);

          const photoUri = photo.uri;
          if (setPhotoUri) setPhotoUri(photoUri);

          let result = await matchCard(photo.uri);
          try {
            const parsed = JSON.parse(result);
            const wrapped = JSON.stringify({ apiResult: parsed, raw: result, photoUri });
            setResult(wrapped);
          } catch (e) {
            setResult(JSON.stringify({ apiResult: null, raw: result, photoUri }));
          }

    
          // let cardInfo = await fetchCardInfo(cardName);
          // console.log('Fetched card info:', cardInfo);
        } else {
          console.log('Camera ref is null, cannot take picture.');
        }
      }



    return (
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
    )
}

export default CameraViewMobile;