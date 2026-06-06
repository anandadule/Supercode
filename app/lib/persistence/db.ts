import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import type { AppVersion, AppVersionStore, Snapshot, SnapshotEntry } from './types';
import type { FileMap } from '~/lib/stores/files';

export interface IChatMetadata {
  gitUrl: string;
  gitBranch?: string;
  netlifySiteId?: string;
}

const logger = createScopedLogger('ChatHistory');

// this is used at the top level and never rejects
export async function openDatabase(): Promise<IDBDatabase | undefined> {
  if (typeof indexedDB === 'undefined') {
    console.error('indexedDB is not available in this environment.');
    return undefined;
  }

  return new Promise((resolve) => {
    const request = indexedDB.open('boltHistory', 4);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('chats')) {
          const store = db.createObjectStore('chats', { keyPath: 'id' });
          store.createIndex('id', 'id', { unique: true });
          store.createIndex('urlId', 'urlId', { unique: true });
        }
      }

      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('snapshots')) {
          db.createObjectStore('snapshots', { keyPath: 'chatId' });
        }
      }

      if (oldVersion < 3) {
        // Migrate from single snapshot per chat to timeline
        if (!db.objectStoreNames.contains('snapshotTimelines')) {
          db.createObjectStore('snapshotTimelines', { keyPath: 'chatId' });
        }

        // Copy existing snapshots into the new timeline store
        if (db.objectStoreNames.contains('snapshots')) {
          const tx = (event.target as IDBOpenDBRequest).transaction;
          const oldStore = tx?.objectStore('snapshots');

          if (oldStore) {
            oldStore.getAll().onsuccess = (e: Event) => {
              const snapshots = (e.target as IDBRequest).result;
              const newStore = tx?.objectStore('snapshotTimelines');

              if (newStore && snapshots) {
                snapshots.forEach((item: { chatId: string; snapshot: Snapshot }) => {
                  if (item?.chatId && item?.snapshot) {
                    newStore.put({
                      chatId: item.chatId,
                      entries: [
                        {
                          id: item.snapshot.chatIndex || 'v0',
                          chatIndex: item.snapshot.chatIndex || '',
                          timestamp: new Date().toISOString(),
                          bookmarked: false,
                          files: item.snapshot.files,
                          summary: item.snapshot.summary,
                        },
                      ],
                    });
                  }
                });
              }
            };
          }
        }
      }

      if (oldVersion < 4) {
        if (!db.objectStoreNames.contains('appVersions')) {
          db.createObjectStore('appVersions', { keyPath: 'chatId' });
        }
      }
    };

    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      resolve(undefined);
      logger.error((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getAll(db: IDBDatabase): Promise<ChatHistoryItem[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as ChatHistoryItem[]);
    request.onerror = () => reject(request.error);
  });
}

export async function setMessages(
  db: IDBDatabase,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
  metadata?: IChatMetadata,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');

    if (timestamp && isNaN(Date.parse(timestamp))) {
      reject(new Error('Invalid timestamp'));
      return;
    }

    const request = store.put({
      id,
      messages,
      urlId,
      description,
      timestamp: timestamp ?? new Date().toISOString(),
      metadata,
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMessages(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return (await getMessagesById(db, id)) || (await getMessagesByUrlId(db, id));
}

export async function getMessagesByUrlId(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const index = store.index('urlId');
    const request = index.get(id);

    request.onsuccess = () => resolve(request.result as ChatHistoryItem);
    request.onerror = () => reject(request.error);
  });
}

export async function getMessagesById(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as ChatHistoryItem);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteById(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chats', 'snapshots', 'snapshotTimelines'], 'readwrite');
    const chatStore = transaction.objectStore('chats');
    const snapshotStore = transaction.objectStore('snapshots');
    const timelineStore = transaction.objectStore('snapshotTimelines');

    const deleteChatRequest = chatStore.delete(id);
    const deleteSnapshotRequest = snapshotStore.delete(id);
    const deleteTimelineRequest = timelineStore.delete(id);

    let chatDeleted = false;
    let snapshotDeleted = false;
    let timelineDeleted = false;

    const checkCompletion = () => {
      if (chatDeleted && snapshotDeleted && timelineDeleted) {
        resolve(undefined);
      }
    };

    deleteChatRequest.onsuccess = () => {
      chatDeleted = true;
      checkCompletion();
    };
    deleteChatRequest.onerror = () => reject(deleteChatRequest.error);

    deleteSnapshotRequest.onsuccess = () => {
      snapshotDeleted = true;
      checkCompletion();
    };

    deleteSnapshotRequest.onerror = (event) => {
      if ((event.target as IDBRequest).error?.name === 'NotFoundError') {
        snapshotDeleted = true;
        checkCompletion();
      } else {
        reject(deleteSnapshotRequest.error);
      }
    };

    deleteTimelineRequest.onsuccess = () => {
      timelineDeleted = true;
      checkCompletion();
    };

    deleteTimelineRequest.onerror = (event) => {
      if ((event.target as IDBRequest).error?.name === 'NotFoundError') {
        timelineDeleted = true;
        checkCompletion();
      } else {
        reject(deleteTimelineRequest.error);
      }
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getNextId(db: IDBDatabase): Promise<string> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.getAllKeys();

    request.onsuccess = () => {
      const highestId = request.result.reduce((cur, acc) => Math.max(+cur, +acc), 0);
      resolve(String(+highestId + 1));
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getUrlId(db: IDBDatabase, id: string): Promise<string> {
  const idList = await getUrlIds(db);

  if (!idList.includes(id)) {
    return id;
  } else {
    let i = 2;

    while (idList.includes(`${id}-${i}`)) {
      i++;
    }

    return `${id}-${i}`;
  }
}

async function getUrlIds(db: IDBDatabase): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const idList: string[] = [];

    const request = store.openCursor();

    request.onsuccess = (event: Event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        idList.push(cursor.value.urlId);
        cursor.continue();
      } else {
        resolve(idList);
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function forkChat(db: IDBDatabase, chatId: string, messageId: string): Promise<string> {
  const chat = await getMessages(db, chatId);

  if (!chat) {
    throw new Error('Chat not found');
  }

  // Find the index of the message to fork at
  const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);

  if (messageIndex === -1) {
    throw new Error('Message not found');
  }

  // Get messages up to and including the selected message
  const messages = chat.messages.slice(0, messageIndex + 1);

  return createChatFromMessages(db, chat.description ? `${chat.description} (fork)` : 'Forked chat', messages);
}

export async function duplicateChat(db: IDBDatabase, id: string): Promise<string> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  return createChatFromMessages(db, `${chat.description || 'Chat'} (copy)`, chat.messages);
}

export async function createChatFromMessages(
  db: IDBDatabase,
  description: string,
  messages: Message[],
  metadata?: IChatMetadata,
): Promise<string> {
  const newId = await getNextId(db);
  const newUrlId = await getUrlId(db, newId); // Get a new urlId for the duplicated chat

  await setMessages(
    db,
    newId,
    messages,
    newUrlId, // Use the new urlId
    description,
    undefined, // Use the current timestamp
    metadata,
  );

  return newUrlId; // Return the urlId instead of id for navigation
}

export async function updateChatDescription(db: IDBDatabase, id: string, description: string): Promise<void> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  if (!description.trim()) {
    throw new Error('Description cannot be empty');
  }

  await setMessages(db, id, chat.messages, chat.urlId, description, chat.timestamp, chat.metadata);
}

/**
 * Toggle the `starred` flag on a chat. Used by the "Starred" sidebar filter.
 */
export async function setChatStarred(db: IDBDatabase, id: string, starred: boolean): Promise<void> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  /*
   * The chats object store has keyPath 'id' but no enforced schema, so we can
   * write any subset of fields by putting a partial object. We re-stamp
   * timestamp on un-star to keep "Recently viewed" honest, but preserve it
   * on star so starring a project doesn't bump it to the top of the list.
   */
  const tx = db.transaction('chats', 'readwrite');
  const store = tx.objectStore('chats');
  const getReq = store.get(id);

  await new Promise<void>((resolve, reject) => {
    getReq.onsuccess = () => {
      const existing = getReq.result as ChatHistoryItem | undefined;

      if (!existing) {
        reject(new Error('Chat not found'));
        return;
      }

      const putReq = store.put({ ...existing, starred, timestamp: existing.timestamp ?? chat.timestamp });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function updateChatMetadata(
  db: IDBDatabase,
  id: string,
  metadata: IChatMetadata | undefined,
): Promise<void> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  await setMessages(db, id, chat.messages, chat.urlId, chat.description, chat.timestamp, metadata);
}

export async function getSnapshot(db: IDBDatabase, chatId: string): Promise<Snapshot | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('snapshots', 'readonly');
    const store = transaction.objectStore('snapshots');
    const request = store.get(chatId);

    request.onsuccess = () => resolve(request.result?.snapshot as Snapshot | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function setSnapshot(db: IDBDatabase, chatId: string, snapshot: Snapshot): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('snapshots', 'readwrite');
    const store = transaction.objectStore('snapshots');
    const request = store.put({ chatId, snapshot });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSnapshotTimeline(db: IDBDatabase, chatId: string): Promise<SnapshotEntry[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('snapshotTimelines', 'readonly');
    const store = transaction.objectStore('snapshotTimelines');
    const request = store.get(chatId);

    request.onsuccess = () =>
      resolve((request.result as { chatId: string; entries: SnapshotEntry[] } | undefined)?.entries || []);
    request.onerror = () => reject(request.error);
  });
}

export async function addSnapshotEntry(db: IDBDatabase, chatId: string, entry: SnapshotEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('snapshotTimelines', 'readwrite');
    const store = transaction.objectStore('snapshotTimelines');

    const getRequest = store.get(chatId);

    getRequest.onsuccess = () => {
      const existing = getRequest.result as { chatId: string; entries: SnapshotEntry[] } | undefined;
      const entries = existing?.entries || [];

      // Keep max 50 entries per chat
      entries.unshift(entry);

      if (entries.length > 50) {
        entries.pop();
      }

      const putRequest = store.put({ chatId, entries });
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function updateSnapshotEntry(
  db: IDBDatabase,
  chatId: string,
  entryId: string,
  updates: Partial<Pick<SnapshotEntry, 'label' | 'bookmarked'>>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('snapshotTimelines', 'readwrite');
    const store = transaction.objectStore('snapshotTimelines');

    const getRequest = store.get(chatId);

    getRequest.onsuccess = () => {
      const existing = getRequest.result as { chatId: string; entries: SnapshotEntry[] } | undefined;

      if (!existing) {
        resolve();
        return;
      }

      const entries = existing.entries.map((e) => (e.id === entryId ? { ...e, ...updates } : e));

      const putRequest = store.put({ chatId, entries });
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteSnapshotEntry(db: IDBDatabase, chatId: string, entryId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('snapshotTimelines', 'readwrite');
    const store = transaction.objectStore('snapshotTimelines');

    const getRequest = store.get(chatId);

    getRequest.onsuccess = () => {
      const existing = getRequest.result as { chatId: string; entries: SnapshotEntry[] } | undefined;

      if (!existing) {
        resolve();
        return;
      }

      const entries = existing.entries.filter((e) => e.id !== entryId);
      const putRequest = store.put({ chatId, entries });
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function clearSnapshotTimeline(db: IDBDatabase, chatId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('snapshotTimelines', 'readwrite');
    const store = transaction.objectStore('snapshotTimelines');
    const request = store.delete(chatId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

const MAX_VERSIONS = 30;

export async function getAppVersions(db: IDBDatabase, chatId: string): Promise<AppVersion[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('appVersions', 'readonly');
    const store = transaction.objectStore('appVersions');
    const request = store.get(chatId);

    request.onsuccess = () => resolve((request.result as AppVersionStore | undefined)?.versions || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAppVersion(
  db: IDBDatabase,
  chatId: string,
  label: string,
  files: FileMap,
  description?: string,
): Promise<AppVersion> {
  const existing = await getAppVersions(db, chatId);
  const version = existing.length > 0 ? Math.max(...existing.map((v) => v.version)) + 1 : 1;

  const newVersion: AppVersion = {
    id: `v${version}`,
    chatId,
    version,
    label,
    description,
    timestamp: new Date().toISOString(),
    files,
  };

  existing.push(newVersion);
  existing.sort((a, b) => b.version - a.version);

  // Prune to max 30
  if (existing.length > MAX_VERSIONS) {
    existing.splice(MAX_VERSIONS);
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('appVersions', 'readwrite');
    const store = transaction.objectStore('appVersions');
    const request = store.put({ chatId, versions: existing });

    request.onsuccess = () => resolve(newVersion);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAppVersion(db: IDBDatabase, chatId: string, versionId: string): Promise<void> {
  const versions = await getAppVersions(db, chatId);
  const filtered = versions.filter((v) => v.id !== versionId);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('appVersions', 'readwrite');
    const store = transaction.objectStore('appVersions');
    const request = store.put({ chatId, versions: filtered });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAppVersions(db: IDBDatabase, chatId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('appVersions', 'readwrite');
    const store = transaction.objectStore('appVersions');
    const request = store.delete(chatId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSnapshot(db: IDBDatabase, chatId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('snapshots', 'readwrite');
    const store = transaction.objectStore('snapshots');
    const request = store.delete(chatId);

    request.onsuccess = () => resolve();

    request.onerror = (event) => {
      if ((event.target as IDBRequest).error?.name === 'NotFoundError') {
        resolve();
      } else {
        reject(request.error);
      }
    };
  });
}
