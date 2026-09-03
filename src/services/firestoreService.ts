import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  deleteDoc,
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FormConfig, FormResponse } from '../types';

// Initialize Firebase App
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific databaseId if provided in config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

/**
 * Validate connection to Firestore as mandated by Firebase Skill
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or database connecting...');
    }
    return false;
  }
}

// Collections references
const FORMS_COLLECTION = 'forms';
const RESPONSES_COLLECTION = 'responses';

/**
 * Subscribe to real-time form configuration changes from Firestore
 */
export function subscribeToFormConfig(
  formId: string,
  onUpdate: (config: FormConfig) => void,
  onError?: (err: Error) => void
) {
  const formDocRef = doc(db, FORMS_COLLECTION, formId);

  return onSnapshot(
    formDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as FormConfig;
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('Firestore form subscription notice:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save / Update Form Configuration to Firestore
 */
export async function saveFormConfigToFirestore(config: FormConfig): Promise<void> {
  try {
    const formDocRef = doc(db, FORMS_COLLECTION, config.id);
    await setDoc(
      formDocRef,
      {
        ...config,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving form to Firestore:', error);
    throw error;
  }
}

/**
 * Fetch Form Configuration once
 */
export async function fetchFormConfigFromFirestore(formId: string): Promise<FormConfig | null> {
  try {
    const formDocRef = doc(db, FORMS_COLLECTION, formId);
    const snap = await getDoc(formDocRef);
    if (snap.exists()) {
      return snap.data() as FormConfig;
    }
    return null;
  } catch (error) {
    console.error('Error fetching form config from Firestore:', error);
    return null;
  }
}

/**
 * Subscribe to real-time responses for a form from Firestore
 */
export function subscribeToResponses(
  formId: string,
  onUpdate: (responses: FormResponse[]) => void,
  onError?: (err: Error) => void
) {
  const responsesQuery = query(
    collection(db, RESPONSES_COLLECTION),
    where('formId', '==', formId)
  );

  return onSnapshot(
    responsesQuery,
    (snapshot) => {
      const items: FormResponse[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as FormResponse);
      });
      // Sort newest first
      items.sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      onUpdate(items);
    },
    (err) => {
      console.warn('Firestore responses subscription notice:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Submit / Save a response to Firestore
 */
export async function saveResponseToFirestore(response: FormResponse): Promise<void> {
  try {
    const responseDocRef = doc(db, RESPONSES_COLLECTION, response.id);
    await setDoc(responseDocRef, response);
  } catch (error) {
    console.error('Error saving response to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a single response from Firestore
 */
export async function deleteResponseFromFirestore(responseId: string): Promise<void> {
  try {
    const responseDocRef = doc(db, RESPONSES_COLLECTION, responseId);
    await deleteDoc(responseDocRef);
  } catch (error) {
    console.error('Error deleting response from Firestore:', error);
    throw error;
  }
}

/**
 * Clear all responses for a form in Firestore
 */
export async function clearAllResponsesFromFirestore(formId: string): Promise<void> {
  try {
    const responsesQuery = query(
      collection(db, RESPONSES_COLLECTION),
      where('formId', '==', formId)
    );
    const snapshot = await getDocs(responsesQuery);
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error('Error clearing responses in Firestore:', error);
    throw error;
  }
}

/**
 * Seed initial default configuration and responses to Firestore if empty
 */
export async function initializeFirestoreDatabase(
  defaultConfig: FormConfig,
  initialResponses: FormResponse[]
): Promise<void> {
  try {
    // 1. Check if form already exists in Firestore
    const formDocRef = doc(db, FORMS_COLLECTION, defaultConfig.id);
    const formSnap = await getDoc(formDocRef);
    if (!formSnap.exists()) {
      await setDoc(formDocRef, {
        ...defaultConfig,
        updatedAt: new Date().toISOString(),
      });
    }

    // 2. Check if responses exist
    const responsesQuery = query(
      collection(db, RESPONSES_COLLECTION),
      where('formId', '==', defaultConfig.id)
    );
    const respSnap = await getDocs(responsesQuery);
    if (respSnap.empty && initialResponses.length > 0) {
      const batch = writeBatch(db);
      initialResponses.forEach((resp) => {
        const ref = doc(db, RESPONSES_COLLECTION, resp.id);
        batch.set(ref, resp);
      });
      await batch.commit();
    }
  } catch (error) {
    console.warn('Initial Firestore database seeding notice:', error);
  }
}
