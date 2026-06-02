"use client";

const DB_NAME = "totum-agentes";
const DB_VERSION = 1;
const STORE_MESSAGES = "messages";

interface MessageRow {
  id: string;
  agentId: string;
  role: "user" | "agent";
  content: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        const store = db.createObjectStore(STORE_MESSAGES, { keyPath: "id" });
        store.createIndex("agentId", "agentId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

export async function saveMessage(msg: MessageRow): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MESSAGES, "readwrite");
    const store = tx.objectStore(STORE_MESSAGES);
    const req = store.put(msg);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getMessages(agentId: string): Promise<MessageRow[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MESSAGES, "readonly");
    const store = tx.objectStore(STORE_MESSAGES);
    const idx = store.index("agentId");
    const req = idx.getAll(agentId);
    req.onsuccess = () => {
      const rows: MessageRow[] = req.result || [];
      rows.sort((a, b) => a.timestamp - b.timestamp);
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearMessages(agentId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MESSAGES, "readwrite");
    const store = tx.objectStore(STORE_MESSAGES);
    const idx = store.index("agentId");
    const req = idx.openCursor(agentId);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export type { MessageRow };
