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
import { FormConfig, FormResponse, Employee } from '../types';
import { DEFAULT_EMPLOYEES } from '../data/defaultEmployees';

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
const EMPLOYEES_COLLECTION = 'employees';

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

    // 3. Check and seed default employees if collection is empty
    const empSnap = await getDocs(collection(db, EMPLOYEES_COLLECTION));
    if (empSnap.empty) {
      const batch = writeBatch(db);
      DEFAULT_EMPLOYEES.forEach((emp) => {
        const ref = doc(db, EMPLOYEES_COLLECTION, emp.id);
        batch.set(ref, emp);
      });
      await batch.commit();
      try {
        localStorage.setItem('app_master_employees', JSON.stringify(DEFAULT_EMPLOYEES));
      } catch (_) {}
    }
  } catch (error) {
    console.warn('Initial Firestore database seeding notice:', error);
  }
}

/**
 * Subscribe to real-time changes in the master employee directory
 */
export function subscribeToEmployees(
  onUpdate: (employees: Employee[]) => void,
  onError?: (err: Error) => void
) {
  const employeesCol = collection(db, EMPLOYEES_COLLECTION);
  return onSnapshot(
    employeesCol,
    (snapshot) => {
      const employees: Employee[] = [];
      snapshot.forEach((d) => {
        employees.push(d.data() as Employee);
      });
      try {
        localStorage.setItem('app_master_employees', JSON.stringify(employees));
      } catch (_) {}
      onUpdate(employees);
    },
    (err) => {
      console.warn('Firestore employee subscription fallback:', err);
      // Fallback to local cache
      try {
        const local = localStorage.getItem('app_master_employees');
        if (local) {
          onUpdate(JSON.parse(local));
          return;
        }
      } catch (_) {}
      onUpdate(DEFAULT_EMPLOYEES);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch all employees from Firestore (with localStorage fallback)
 */
export async function getEmployees(): Promise<Employee[]> {
  try {
    const snapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));
    if (!snapshot.empty) {
      const list: Employee[] = [];
      snapshot.forEach((d) => list.push(d.data() as Employee));
      try {
        localStorage.setItem('app_master_employees', JSON.stringify(list));
      } catch (_) {}
      return list;
    }
  } catch (err) {
    console.warn('Error fetching employees from Firestore, using fallback:', err);
  }

  // Fallback to localStorage or defaults
  try {
    const cached = localStorage.getItem('app_master_employees');
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  return DEFAULT_EMPLOYEES;
}

/**
 * Find an employee by NIP (cleans spacing and non-digit characters for matching)
 */
export async function findEmployeeByNip(rawNip: string): Promise<Employee | null> {
  const cleanNip = rawNip.replace(/[^0-9]/g, '').trim();
  if (!cleanNip) return null;

  // 1. Check local cache first for instant response
  try {
    const cached = localStorage.getItem('app_master_employees');
    if (cached) {
      const list: Employee[] = JSON.parse(cached);
      const match = list.find((e) => e.nip.replace(/[^0-9]/g, '') === cleanNip);
      if (match) return match;
    }
  } catch (_) {}

  // 2. Query Firestore by ID (doc ID is often NIP) or by nip field
  try {
    const docRef = doc(db, EMPLOYEES_COLLECTION, cleanNip);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Employee;
    }

    const q = query(
      collection(db, EMPLOYEES_COLLECTION),
      where('nip', '==', cleanNip)
    );
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      return qSnap.docs[0].data() as Employee;
    }
  } catch (err) {
    console.warn('Firestore employee search error:', err);
  }

  // 3. Fallback to default employees
  const defaultMatch = DEFAULT_EMPLOYEES.find(
    (e) => e.nip.replace(/[^0-9]/g, '') === cleanNip
  );
  return defaultMatch || null;
}

/**
 * Save or update a single employee
 */
export async function saveEmployee(employee: Employee): Promise<void> {
  const cleanNip = employee.nip.replace(/[^0-9]/g, '').trim();
  const id = employee.id || cleanNip;
  const data: Employee = {
    ...employee,
    id,
    nip: cleanNip,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, EMPLOYEES_COLLECTION, id), data);
  } catch (err) {
    console.warn('Could not save employee to Firestore, saving locally:', err);
  }

  // Always update local cache
  try {
    const cached = localStorage.getItem('app_master_employees');
    let list: Employee[] = cached ? JSON.parse(cached) : [...DEFAULT_EMPLOYEES];
    const idx = list.findIndex((e) => e.id === id || e.nip === cleanNip);
    if (idx >= 0) {
      list[idx] = data;
    } else {
      list.push(data);
    }
    localStorage.setItem('app_master_employees', JSON.stringify(list));
  } catch (_) {}
}

/**
 * Save multiple employees in batch (from Excel / CSV upload)
 */
export async function saveBatchEmployees(employees: Employee[]): Promise<number> {
  if (!employees.length) return 0;

  let savedCount = 0;
  try {
    // Firestore writeBatch max is 500 ops per batch
    const chunks: Employee[][] = [];
    for (let i = 0; i < employees.length; i += 400) {
      chunks.push(employees.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((emp) => {
        const cleanNip = emp.nip.replace(/[^0-9]/g, '').trim();
        const id = emp.id || cleanNip;
        const ref = doc(db, EMPLOYEES_COLLECTION, id);
        batch.set(ref, {
          ...emp,
          id,
          nip: cleanNip,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      savedCount += chunk.length;
    }
  } catch (err) {
    console.warn('Batch Firestore save notice, updating local storage:', err);
  }

  // Update local cache as well
  try {
    const cached = localStorage.getItem('app_master_employees');
    let list: Employee[] = cached ? JSON.parse(cached) : [];
    employees.forEach((emp) => {
      const cleanNip = emp.nip.replace(/[^0-9]/g, '').trim();
      const id = emp.id || cleanNip;
      const idx = list.findIndex((e) => e.id === id || e.nip === cleanNip);
      if (idx >= 0) {
        list[idx] = { ...emp, id, nip: cleanNip };
      } else {
        list.push({ ...emp, id, nip: cleanNip });
      }
    });
    localStorage.setItem('app_master_employees', JSON.stringify(list));
    if (savedCount === 0) savedCount = employees.length;
  } catch (_) {}

  return savedCount;
}

/**
 * Delete an employee by ID
 */
export async function deleteEmployee(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, EMPLOYEES_COLLECTION, id));
  } catch (err) {
    console.warn('Could not delete employee from Firestore:', err);
  }

  // Update local cache
  try {
    const cached = localStorage.getItem('app_master_employees');
    if (cached) {
      let list: Employee[] = JSON.parse(cached);
      list = list.filter((e) => e.id !== id && e.nip !== id);
      localStorage.setItem('app_master_employees', JSON.stringify(list));
    }
  } catch (_) {}
}
