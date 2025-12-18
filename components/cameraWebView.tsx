import React, { useEffect, useState, useRef } from 'react';
import { Text, View } from 'react-native';
import style from './style';
import { API_ENDPOINT } from '@/constants/apiConfig';
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
        try {
          const parsed = JSON.parse(result);
          const wrapped = JSON.stringify({ apiResult: parsed, raw: result, photoUri });
          setResult(wrapped);
          const cardName = parsed.best_match?.replace('.webp', '') || parsed.card_details?.cardMarketId;
          setCardName(cardName);
        } catch (e) {
          setResult(JSON.stringify({ apiResult: null, raw: result, photoUri }));
        }
      } catch (error) {
        console.error('Error sending photo to server:', error);
      }
    }
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // or call it on ctrl+V by calling clipboardmatchweb
  useEffect(() => {
    window.addEventListener('paste', clipboardMatchWeb);
    return () => {
      window.removeEventListener('paste', clipboardMatchWeb);
    };
  }, [setCardName, setPhotoUri, setResult]);
  

  const clipboardMatchWeb = async () => {
    try {
      // Try Async Clipboard API first
      const cb = (navigator as any).clipboard;
      if (cb && cb.read) {
        const items: any[] = await cb.read();
        for (const item of items) {
          const imageType = (item.types || []).find((t: string) => t.startsWith('image/'));
          if (imageType) {
            const blob: Blob = await item.getType(imageType);
            const photoUri = URL.createObjectURL(blob);
            setPhotoUri(photoUri);

            const formData = new FormData();
            formData.append('file', blob, 'clipboard.png');
            console.log('Sending clipboard image to server', formData);

            try {
              const response = await fetch(`${API_ENDPOINT}/matchCard`, {
                method: 'POST',
                body: formData,
              });
              const result = await response.text();
              try {
                const parsed = JSON.parse(result);
                const wrapped = JSON.stringify({ apiResult: parsed, raw: result, photoUri });
                setResult(wrapped);
                const cardName = parsed.best_match?.replace('.webp', '') || parsed.card_details?.cardMarketId;
                setCardName(cardName);
              } catch (e) {
                setResult(JSON.stringify({ apiResult: null, raw: result, photoUri }));
              }
            } catch (err) {
              console.error('Error sending clipboard image to server:', err);
            }

            return;
          }
        }
        console.error('No image found in clipboard items');
        return;
      }

      // Fallback: rely on paste event (handled by window paste listener below)
      console.error('Clipboard.read not supported in this browser');
    } catch (err) {
      console.error('Error reading clipboard: ', err);
    }
  };

  return (
    <View style={[styles.container, { paddingHorizontal: 16 }]}>
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
        <button onClick={clipboardMatchWeb} style={{
          position: 'absolute',
          bottom: tabBarHeight,
          left: '38%',
          transform: 'translateX(-50%)',
          padding: 8,
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: 5,
          zIndex: 100000,
        }}>Paste Image</button>
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