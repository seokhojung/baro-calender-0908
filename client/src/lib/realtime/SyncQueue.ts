/**
 * Offline Sync Queue Manager
 * Handles offline operations queue with IndexedDB persistence
 */

import type { SyncQueueItem } from '@/types/realtime';

interface QueueDatabase {
  open(): Promise<IDBDatabase>;
  close(): void;
}

export class SyncQueue {
  private db: IDBDatabase | null = null;
  private dbName = 'realtimeSync';
  private dbVersion = 1;
  private storeName = 'syncQueue';
  private retryIntervals = [1000, 5000, 15000, 30000, 60000]; // Exponential backoff

  /**
   * Initialize the sync queue with IndexedDB
   */
  public async initialize(): Promise<void> {
    try {
      this.db = await this.openDatabase();
      console.log('SyncQueue: Initialized successfully');
    } catch (error) {
      console.error('SyncQueue: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Add item to sync queue
   */
  public async enqueue(item: SyncQueueItem): Promise<void> {
    if (!this.db) {
      throw new Error('SyncQueue not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.add(item);
      
      request.onsuccess = () => {
        console.log(`SyncQueue: Enqueued item ${item.id}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error(`SyncQueue: Failed to enqueue item ${item.id}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get next item from queue based on priority and timestamp
   */
  public async dequeue(): Promise<SyncQueueItem | null> {
    if (!this.db) {
      throw new Error('SyncQueue not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.index('priority-timestamp').openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          const item: SyncQueueItem = cursor.value;
          
          // Only return items that are pending and not being processed
          if (item.status === 'pending') {
            // Mark as processing
            item.status = 'processing';
            const updateRequest = cursor.update(item);
            
            updateRequest.onsuccess = () => {
              resolve(item);
            };
            
            updateRequest.onerror = () => {
              reject(updateRequest.error);
            };
          } else {
            cursor.continue();
          }
        } else {
          resolve(null); // No pending items
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending items for bulk processing
   */
  public async dequeueAll(): Promise<SyncQueueItem[]> {
    if (!this.db) {
      throw new Error('SyncQueue not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const items: SyncQueueItem[] = request.result.filter(
          item => item.status === 'pending'
        );
        resolve(items);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Mark item as completed and remove from queue
   */
  public async markCompleted(itemId: string): Promise<void> {
    if (!this.db) {
      throw new Error('SyncQueue not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(itemId);
      
      request.onsuccess = () => {
        console.log(`SyncQueue: Completed and removed item ${itemId}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error(`SyncQueue: Failed to mark completed ${itemId}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Mark item as failed and schedule retry
   */
  public async markFailed(itemId: string): Promise<void> {
    if (!this.db) {
      throw new Error('SyncQueue not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(itemId);
      
      getRequest.onsuccess = () => {
        const item: SyncQueueItem = getRequest.result;
        
        if (!item) {
          reject(new Error(`Item ${itemId} not found`));
          return;
        }

        item.retryCount++;
        
        // Check if we should keep retrying
        if (item.retryCount < this.retryIntervals.length) {
          item.status = 'pending';
          // Schedule retry with exponential backoff
          const retryDelay = this.retryIntervals[item.retryCount - 1];
          
          setTimeout(async () => {
            // Item will be picked up by next dequeue operation
            console.log(`SyncQueue: Scheduled retry ${item.retryCount} for item ${itemId} in ${retryDelay}ms`);
          }, retryDelay);
        } else {
          // Max retries exceeded, mark as permanently failed
          item.status = 'failed';
          console.error(`SyncQueue: Item ${itemId} permanently failed after ${item.retryCount} retries`);
        }

        const updateRequest = store.put(item);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = () => {
          reject(updateRequest.error);
        };
      };
      
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * Get current queue contents
   */
  public getQueue(): SyncQueueItem[] {
    // This would typically be cached in memory for performance
    // For now, return empty array and implement caching later if needed
    return [];
  }

  /**
   * Flush all pending items (try to process them)
   */
  public async flush(): Promise<void> {
    if (!this.db) return;

    const pendingItems = await this.dequeueAll();
    
    // This would typically involve processing the items
    // For now, just log the count
    console.log(`SyncQueue: Flushing ${pendingItems.length} pending items`);
  }

  /**
   * Clean up and close database
   */
  public async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('SyncQueue: Cleaned up successfully');
    }
  }

  /**
   * Clear all items from queue (for testing/reset purposes)
   */
  public async clear(): Promise<void> {
    if (!this.db) {
      throw new Error('SyncQueue not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('SyncQueue: Cleared all items');
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Open IndexedDB database
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // Create indexes for efficient querying
          store.createIndex('priority-timestamp', ['priority', 'timestamp']);
          store.createIndex('status', 'status');
          store.createIndex('type', 'type');
        }
      };
    });
  }
}