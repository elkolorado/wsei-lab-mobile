import { StyleSheet } from "react-native";


export default function style(){
    return StyleSheet.create({
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
}