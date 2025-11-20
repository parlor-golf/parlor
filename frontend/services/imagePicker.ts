/**
 * Image picker service for camera and gallery access
 */

import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
}

/**
 * Request camera permissions
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Camera Permission Required',
      'Please enable camera access in your device settings to take photos.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

/**
 * Request media library permissions
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Photo Library Permission Required',
      'Please enable photo library access in your device settings to select photos.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

/**
 * Take a photo using the camera
 */
export const takePhoto = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<ImagePickerResult | null> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [4, 3],
    quality: options?.quality ?? 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    type: asset.mimeType,
    fileName: asset.fileName || undefined,
  };
};

/**
 * Pick an image from the photo library
 */
export const pickImage = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
}): Promise<ImagePickerResult[] | null> => {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: options?.allowsMultipleSelection ? false : (options?.allowsEditing ?? true),
    aspect: options?.aspect ?? [4, 3],
    quality: options?.quality ?? 0.8,
    allowsMultipleSelection: options?.allowsMultipleSelection ?? false,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets.map(asset => ({
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    type: asset.mimeType,
    fileName: asset.fileName || undefined,
  }));
};

/**
 * Pick a single image from the photo library
 */
export const pickSingleImage = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<ImagePickerResult | null> => {
  const result = await pickImage({
    ...options,
    allowsMultipleSelection: false,
  });
  return result ? result[0] : null;
};

/**
 * Show action sheet to choose between camera and gallery
 */
export const showImagePickerOptions = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<ImagePickerResult | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Add Photo',
      'Choose a source',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const result = await takePhoto(options);
            resolve(result);
          },
        },
        {
          text: 'Photo Library',
          onPress: async () => {
            const result = await pickSingleImage(options);
            resolve(result);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true }
    );
  });
};
