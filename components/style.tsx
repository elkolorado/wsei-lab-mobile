import { StyleSheet } from "react-native";
import { colors } from "@/constants/themeColors";

export default function style(){
    return StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          backgroundColor: colors.colorBackground,
          paddingHorizontal: 16,
          paddingTop: 16
        },
        scannedCardsContainer: {
          flex: 1,
          marginTop: 16,
          borderColor: "#d4af374d",
          borderRadius: 16,
          borderWidth: 2,
          maxHeight: 175,
          maxWidth: 1506,
          marginInline: "auto",
          width: "100%",
          backgroundColor: colors.colorBackground          
        },
        noResultsContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        noResultsMessage: {
          fontSize: 16,
          color: colors.mutedForeground,
        },
        noResultsSubMessage: {
          paddingTop: 6,
          fontSize: 14,
          color: colors.mutedForeground,
        },
        cameraContainer: {
          flex: 1,
                    borderWidth: 2,
          borderColor: '#614a00ff',
          maxWidth: 1506,
          marginInline: "auto",
          width: "100%",
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: 'rgb(0,0,0) 0px 0px 0px 0px, rgb(0,0,0) 0px 0px 0px 0px, rgb(0,0,0) 0px 0px 0px 0px, oklab(0.766528 -0.00256398 0.138653 / 0.1) 0px 20px 25px -5px, oklab(0.766528 -0.00256398 0.138653 / 0.1)  0 8px 10px -6px',
        },
        primaryButton: {
            backgroundColor: '#d4af37'
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