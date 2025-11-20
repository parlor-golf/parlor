/**
 * Firebase configuration and initialization for Parlor
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZAt3J7EBhObYOuxgT8rR0VI_z88dGrGM",
  authDomain: "parlor-1752e.firebaseapp.com",
  databaseURL: "https://parlor-1752e-default-rtdb.firebaseio.com/",
  projectId: "parlor-1752e",
  storageBucket: "parlor-1752e.firebasestorage.app",
  messagingSenderId: "951195595957",
  appId: "1:951195595957:web:bf22610ed7f0991d0f3afc",
  measurementId: "G-M8QF1GWMED"
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);
const auth = getAuth(app);

/**
 * Upload an image to Firebase Storage
 * @param uri - Local URI of the image
 * @param path - Storage path (e.g., 'profile-photos/userId.jpg')
 * @returns Download URL of the uploaded image
 */
export const uploadImage = async (uri: string, path: string): Promise<string> => {
  try {
    // Fetch the image and convert to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create storage reference
    const storageRef = ref(storage, path);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get and return the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Upload a profile photo
 * @param uri - Local URI of the image
 * @param userId - User ID
 * @returns Download URL of the uploaded image
 */
export const uploadProfilePhoto = async (uri: string, userId: string): Promise<string> => {
  const timestamp = Date.now();
  const path = `profile-photos/${userId}_${timestamp}.jpg`;
  return uploadImage(uri, path);
};

/**
 * Upload a session photo
 * @param uri - Local URI of the image
 * @param userId - User ID
 * @param sessionId - Session ID
 * @param index - Photo index in the session
 * @returns Download URL of the uploaded image
 */
export const uploadSessionPhoto = async (
  uri: string,
  userId: string,
  sessionId: string,
  index: number
): Promise<string> => {
  const timestamp = Date.now();
  const path = `session-photos/${userId}/${sessionId}_${index}_${timestamp}.jpg`;
  return uploadImage(uri, path);
};

/**
 * Delete an image from Firebase Storage
 * @param url - Download URL of the image to delete
 */
export const deleteImage = async (url: string): Promise<void> => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export { app, storage, auth };
