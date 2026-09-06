import type { Routine, Settings } from './model';

export type StorageScope = 'real' | 'demo';

const DB_NAME = 'pad-light-choreographer';
const DB_VERSION = 1;

function databaseName(scope: StorageScope): string {
  return scope === 'demo' ? `demo:${DB_NAME}` : DB_NAME;
}

function openDb(scope: StorageScope = 'real'): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(scope), DB_VERSION);
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

export async function listRoutines(scope: StorageScope = 'real'): Promise<Routine[]> {
  const db = await openDb(scope);
  const result = await requestValue(db.transaction('routines').objectStore('routines').getAll() as IDBRequest<Routine[]>);
  db.close();
  return result.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveRoutine(routine: Routine, scope: StorageScope = 'real'): Promise<void> {
  const db = await openDb(scope);
  await requestValue(db.transaction('routines', 'readwrite').objectStore('routines').put(routine));
  db.close();
}

export async function deleteRoutine(id: string, scope: StorageScope = 'real'): Promise<void> {
  const db = await openDb(scope);
  await requestValue(db.transaction('routines', 'readwrite').objectStore('routines').delete(id));
  db.close();
}

export async function getSettings(scope: StorageScope = 'real'): Promise<Settings | undefined> {
  const db = await openDb(scope);
  const result = await requestValue(db.transaction('settings').objectStore('settings').get('main') as IDBRequest<Settings | undefined>);
  db.close();
  return result;
}

export async function saveSettings(settings: Settings, scope: StorageScope = 'real'): Promise<void> {
  const db = await openDb(scope);
  await requestValue(db.transaction('settings', 'readwrite').objectStore('settings').put(settings, 'main'));
  db.close();
}

export async function clearStorage(scope: StorageScope): Promise<void> {
  const db = await openDb(scope);
  const transaction = db.transaction(['routines', 'settings'], 'readwrite');
  await Promise.all([
    requestValue(transaction.objectStore('routines').clear()),
    requestValue(transaction.objectStore('settings').clear()),
  ]);
  db.close();
}
