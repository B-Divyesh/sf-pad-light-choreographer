import type { Routine, Settings } from './model';

const DB_NAME = 'pad-light-choreographer';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('routines')) db.createObjectStore('routines', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listRoutines(): Promise<Routine[]> {
  const db = await openDb();
  const result = await requestValue(db.transaction('routines').objectStore('routines').getAll() as IDBRequest<Routine[]>);
  db.close();
  return result.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveRoutine(routine: Routine): Promise<void> {
  const db = await openDb();
  await requestValue(db.transaction('routines', 'readwrite').objectStore('routines').put(routine));
  db.close();
}

export async function deleteRoutine(id: string): Promise<void> {
  const db = await openDb();
  await requestValue(db.transaction('routines', 'readwrite').objectStore('routines').delete(id));
  db.close();
}

export async function getSettings(): Promise<Settings | undefined> {
  const db = await openDb();
  const result = await requestValue(db.transaction('settings').objectStore('settings').get('main') as IDBRequest<Settings | undefined>);
  db.close();
  return result;
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await openDb();
  await requestValue(db.transaction('settings', 'readwrite').objectStore('settings').put(settings, 'main'));
  db.close();
}
