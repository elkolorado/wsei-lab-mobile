//@ts-ignore
import { CvInvoke } from 'react-native-opencv3';

export const matchFeatures = async (capturedImagePath: string, referenceFeatures: any[]) => {
  try {
    // Extract features from the captured image
    const capturedFeatures = await CvInvoke.detectAndCompute(capturedImagePath, {
      detector: 'ORB',
    });

    // Match features with each reference image
    for (const ref of referenceFeatures) {
      const matches = await CvInvoke.matchFeatures(capturedFeatures.descriptors, ref.descriptors, {
        matcher: 'BF', // Brute Force matcher
        crossCheck: true,
      });

      if (matches.length > 10) {
        // If enough matches are found, return the matched reference
        return ref.name;
      }
    }

    return null; // No match found
  } catch (error) {
    console.error('Error matching features:', error);
    return null;
  }
};