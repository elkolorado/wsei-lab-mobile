import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import style from './style';
import { API_ENDPOINT } from '@/constatns/apiConfig';

interface CameraWebViewProps {
  setResult: (result: string) => void;
  setCardName: (cardName: string | null) => void;
}

const CameraWebView: React.FC<CameraWebViewProps> = ({ setResult, setCardName }) => {
  const styles = style();

  useEffect(() => {
    const initializeWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.getElementById('webcam') as HTMLVideoElement;
        if (video) {
          video.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing webcam: ', err);
      }
    };

    initializeWebcam();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  const handleTakePhoto = async () => {
    const video = document.getElementById('webcam') as HTMLVideoElement;
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const context = canvas?.getContext('2d');

    if (video && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoUri = canvas.toDataURL('image/png');
      console.log(photoUri);

      // Send the photo to the server
      const blob = await (await fetch(photoUri)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'photo.png');

      try {
        const response = await fetch(`${API_ENDPOINT}/matchCard`, {
          method: 'POST',
          body: formData,
        });
        const result = await response.text();
        setResult(result);

        const cardName = JSON.parse(result).best_match?.replace('.webp', '');
        setCardName(cardName);
      } catch (error) {
        console.error('Error sending photo to server:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>Camera functionality for web</Text>
      <video id="webcam" autoPlay playsInline style={{ width: '100%', height: '90vh' }}></video>
      <canvas id="canvas" style={{ display: 'none' }}></canvas>
      <button onClick={handleTakePhoto}>Take Photo</button>
    </View>
  );
};

export default CameraWebView;