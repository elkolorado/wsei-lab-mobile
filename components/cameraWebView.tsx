import React, { useEffect, useState, useRef } from 'react';
import { Text, View } from 'react-native';
import style from './style';
import { API_ENDPOINT } from '@/constatns/apiConfig';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

interface CameraWebViewProps {
  setResult: (result: string) => void;
  setCardName: (cardName: string | null) => void;
  setCardInfo: (cardInfo: any) => void;
  setPhotoUri: (uri: string | null) => void;
}

const CameraWebView: React.FC<CameraWebViewProps> = ({ setResult, setCardName, setCardInfo, setPhotoUri }) => {
  const styles = style();
  const tabBarHeight = useBottomTabBarHeight(); // Get the tab bar height
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    const startStream = async (mode: 'user' | 'environment') => {
      try {
        // Stop previous stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        // Try with facingMode ideal first (works on mobile)
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: mode } } as any });
        } catch (e) {
          // Fallback to generic video if facingMode not supported or denied
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (!mounted) {
          // component unmounted while acquiring stream
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = document.getElementById('webcam') as HTMLVideoElement | null;
        if (video) video.srcObject = stream;

        // Detect number of video input devices to decide whether to show flip button
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        } catch (err) {
          // enumerateDevices may fail without permissions, ignore
          setHasMultipleCameras(false);
        }
      } catch (err) {
        console.error('Error accessing webcam: ', err);
      }
    };

    startStream(facingMode);

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  // Watch facingMode changes and restart stream
  useEffect(() => {
    // This effect will run when facingMode toggles to reinitialize the stream
    const restart = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } } as any });
        } catch (e) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        streamRef.current = stream;
        const video = document.getElementById('webcam') as HTMLVideoElement | null;
        if (video) video.srcObject = stream;
      } catch (err) {
        console.error('Error restarting stream for facingMode change:', err);
      }
    };

    // Only attempt if component already mounted and mediaDevices available
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      restart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleTakePhoto = async () => {
    const video = document.getElementById('webcam') as HTMLVideoElement;
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const context = canvas?.getContext('2d');

    if (video && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoUri = canvas.toDataURL('image/png');
      setPhotoUri(photoUri); // Save the photo URI to state
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

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>Camera functionality for web</Text>
      <video id="webcam" autoPlay playsInline style={{ width: '100%', height: '90vh' }}></video>
      <canvas id="canvas" style={{ display: 'none' }}></canvas>
      <>
        <button onClick={handleTakePhoto} style={{
          position: 'absolute',
          bottom: tabBarHeight,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: 10,
          backgroundColor: '#007BFF',
          color: '#fff',
          border: 'none',
          borderRadius: 5,
          zIndex: 100000,
        }}>Take Photo</button>
        {hasMultipleCameras && (
          <button onClick={handleFlipCamera} style={{
            position: 'absolute',
            bottom: tabBarHeight,
            left: '62%',
            transform: 'translateX(-50%)',
            padding: 8,
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: 5,
            zIndex: 100000,
          }}>{facingMode === 'user' ? 'Front' : 'Back'}</button>
        )}
      </>
    </View>
  );
};

export default CameraWebView;