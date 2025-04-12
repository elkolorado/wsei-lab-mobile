import { CameraType, CameraView } from "expo-camera"
import { View } from "react-native";
import style from './style';
import { TouchableOpacity, Text } from "react-native";
import { useRef, useState } from "react";
import { matchCard } from '@/actions/matchCard';
import { fetchCardInfo } from '@/actions/cardPrice';


interface CameraViewProps {
    setResult: (result: string) => void;
    setCardName: (cardName: string | null) => void;
    setCardInfo: (cardInfo: any) => void;
    setPhotoUri: (uri: string | null) => void;
}

const CameraViewMobile: React.FC<CameraViewProps> = ({setResult, setCardName, setPhotoUri, setCardInfo}) => {
    const [facing, setFacing] = useState<CameraType>('back');
    const cameraRef = useRef<React.RefObject<CameraView>>(null);
    const styles = style();

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
      }

    async function takePhoto() {
        setPhotoUri(null); // Clear the previous photo URI
        setResult('');
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