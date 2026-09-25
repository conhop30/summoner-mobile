// The phone's storage: one IndexedDB database in the app's own WebView profile.
// Uninstalling the app or clearing its data deletes it, which is why the app nudges you to export.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Champion } from '../model/champion'

interface Schema extends DBSchema {
  champions: { key: string; value: Champion }
  meta: { key: string; value: unknown }
}

const NAME = 'summoner-mobile'
const VERSION = 1

let opened: Promise<IDBPDatabase<Schema>> | null = null

function db(): Promise<IDBPDatabase<Schema>> {
  opened ??= openDB<Schema>(NAME, VERSION, {
    upgrade(database) {
      database.createObjectStore('champions', { keyPath: 'id' })
      database.createObjectStore('meta')
    },
  })
  return opened
}

// For tests: forget the connection so the next call opens a fresh database.
export async function resetDbForTests(): Promise<void> {
  if (opened) (await opened).close()
  opened = null
  await new Promise<void>(resolve => {
    const request = indexedDB.deleteDatabase(NAME)
    request.onsuccess = request.onerror = request.onblocked = () => resolve()
  })
}

export async function getAllChampions(): Promise<Champion[]> {
  return (await db()).getAll('champions')
}

export async function putChampions(champions: Champion[]): Promise<void> {
  if (champions.length === 0) return
  const tx = (await db()).transaction('champions', 'readwrite')
  await Promise.all([...champions.map(c => tx.store.put(c)), tx.done])
}

export async function deleteChampion(id: string): Promise<void> {
  await (await db()).delete('champions', id)
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await (await db()).get('meta', key)) as T | undefined
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await (await db()).put('meta', value, key)
}
