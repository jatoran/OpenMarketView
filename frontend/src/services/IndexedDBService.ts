import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StockData, DailyDataPoint, FiveMinuteDataPoint } from './StockApiService';

interface ApiHistoryEntry {
  date: string;
  totalCalls: number;
  totalDuration: number;
  avgDuration: number;
  successCalls: number;
  failureCalls: number;
}

interface ApiCallDetail {
  id: string;
  date: string;
  time: string;
  type: string;
  duration: number;
  success: boolean;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
}

interface StockTrackerDB extends DBSchema {
  symbols: {
    key: string;
    value: StockData & { lastUpdated: string };
    indexes: { 'by-lastUpdated': string };
  };
  dailyData: {
    key: [string, string];
    value: DailyDataPoint & { symbol: string; date: string };
    indexes: { 'by-symbol': string; 'by-date': string };
  };
  fiveMinuteData: {
    key: [string, string];
    value: FiveMinuteDataPoint & { symbol: string };
    indexes: { 'by-symbol': string; 'by-DateTime': string };
  };
  apiHistory: {
    key: string;
    value: ApiHistoryEntry;
    indexes: { 'by-date': string };
  };
  apiCallDetails: {
    key: string;
    value: ApiCallDetail;
    indexes: { 'by-date': string };
  };
}

class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase<StockTrackerDB>> | null = null;

  private getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB<StockTrackerDB>('StockTrackerDB', 3, {
        upgrade(db, oldVersion, newVersion, transaction) {
          if (oldVersion < 1) {
            const symbolStore = db.createObjectStore('symbols', { keyPath: 'symbol' });
            symbolStore.createIndex('by-lastUpdated', 'lastUpdated');
            const dailyStore = db.createObjectStore('dailyData', { keyPath: ['symbol', 'date'] });
            dailyStore.createIndex('by-symbol', 'symbol');
            dailyStore.createIndex('by-date', 'date');
            const granularStore = db.createObjectStore('fiveMinuteData', { keyPath: ['symbol', 'DateTime'] });
            granularStore.createIndex('by-symbol', 'symbol');
            granularStore.createIndex('by-DateTime', 'DateTime');
          }
          if (oldVersion < 3) {
            if (!db.objectStoreNames.contains('apiHistory')) {
              const apiHistoryStore = db.createObjectStore('apiHistory', { keyPath: 'date' });
              apiHistoryStore.createIndex('by-date', 'date');
            }
            if (!db.objectStoreNames.contains('apiCallDetails')) {
              const apiCallDetailsStore = db.createObjectStore('apiCallDetails', { keyPath: 'id' });
              apiCallDetailsStore.createIndex('by-date', 'date');
            }
          }
        },
      });
    }
    return this.dbPromise;
  }

  private getTodayUTC(): string {
    const now = new Date();
    return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()).toISOString().split('T')[0];
  }
  

  async logApiCall(success: boolean, duration: number, type: string, requestData?: any, responseData?: any, errorMessage?: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(['apiHistory', 'apiCallDetails'], 'readwrite');
    const historyStore = tx.objectStore('apiHistory');
    const detailsStore = tx.objectStore('apiCallDetails');
    const today = this.getTodayUTC();
    const time = new Date().toISOString();
    const id = `${today}-${time}-${type}-${Math.random().toString(36).substr(2, 9)}`;

    const entry = await historyStore.get(today) || {
      date: today,
      totalCalls: 0,
      totalDuration: 0,
      avgDuration: 0,
      successCalls: 0,
      failureCalls: 0
    };

    // Update the entry
    entry.totalCalls += 1;
    entry.totalDuration += duration;
    entry.avgDuration = entry.totalDuration / entry.totalCalls;
    if (success) {
      entry.successCalls += 1;
    } else {
      entry.failureCalls += 1;
    }

    await historyStore.put(entry);

    const callDetail: ApiCallDetail = {
      id,
      date: today,
      time,
      type,
      duration,
      success,
      requestData,
      responseData,
      errorMessage
    };

    await historyStore.put(entry);
    await detailsStore.put(callDetail);
    await tx.done;
  }

  async getApiHistory(date: string): Promise<ApiHistoryEntry | undefined> {
    const db = await this.getDB();
    return db.get('apiHistory', date);
  }

  async getApiCallDetails(date: string): Promise<ApiCallDetail[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('apiCallDetails', 'by-date', IDBKeyRange.only(date));
  }

  async getSymbols(): Promise<StockData[]> {
    if (typeof window === 'undefined') return [];
    return (await this.getDB()).getAll('symbols');
  }

  async getSymbol(symbol: string): Promise<StockData | undefined> {
    if (typeof window === 'undefined') return undefined;
    return (await this.getDB()).get('symbols', symbol);
  }

  async addSymbol(symbolData: StockData): Promise<string> {
    if (typeof window === 'undefined') return '';
    console.log('Adding symbol data:', symbolData);

    if (!symbolData.symbol) {
      console.error('Invalid symbol data:', symbolData);
      throw new Error('Invalid symbol data. The "symbol" property is required.');
    }

    const db = await this.getDB();
    const tx = db.transaction('symbols', 'readwrite');
    const store = tx.objectStore('symbols');

    const existingData = await store.get(symbolData.symbol);
    const dataToStore = {
      ...symbolData,
      lastUpdated: new Date().toISOString()
    };

    if (existingData) {
      // Perform a differential update
      Object.keys(dataToStore).forEach(key => {
        if (key in existingData && JSON.stringify(dataToStore[key as keyof StockData]) !== JSON.stringify(existingData[key as keyof StockData])) {
          (existingData[key as keyof StockData] as any) = dataToStore[key as keyof StockData];
        }
      });
      await store.put(existingData);
    } else {
      await store.add(dataToStore);
    }

    await tx.done;
    return symbolData.symbol;
  }

  async getLastUpdatedTime(symbol: string): Promise<string | undefined> {
    if (typeof window === 'undefined') return undefined;
    const symbolData = await this.getSymbol(symbol);
    return symbolData?.lastUpdated;
  }

  async getDailyData(symbol: string, startDate?: string, endDate?: string): Promise<(DailyDataPoint & { symbol: string })[]> {
    if (typeof window === 'undefined') return [];
    const db = await this.getDB();
    const tx = db.transaction('dailyData', 'readonly');
    const index = tx.store.index('by-symbol');
    let cursor = await index.openCursor(IDBKeyRange.only(symbol));
    const results: (DailyDataPoint & { symbol: string })[] = [];

    while (cursor) {
      if ((!startDate || cursor.value.date >= startDate) && (!endDate || cursor.value.date <= endDate)) {
        results.push(cursor.value);
      }
      cursor = await cursor.continue();
    }

    return results;
  }

  async getLastStoredDailyDataDate(symbol: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const db = await this.getDB();
    const tx = db.transaction('dailyData', 'readonly');
    const index = tx.store.index('by-symbol');
    const cursor = await index.openCursor(IDBKeyRange.only(symbol), 'prev');
    return cursor ? cursor.value.date : null;
  }

  async getLastStoredFiveMinuteDataDateTime(symbol: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const db = await this.getDB();
    const tx = db.transaction('fiveMinuteData', 'readonly');
    const index = tx.store.index('by-symbol');
    const cursor = await index.openCursor(IDBKeyRange.only(symbol), 'prev');
    return cursor ? cursor.value.DateTime : null;
  }

  async addDailyData(symbol: string, dailyData: DailyDataPoint[]): Promise<void> {
    if (typeof window === 'undefined') return;

    const db = await this.getDB();
    const tx = db.transaction('dailyData', 'readwrite');
    const store = tx.objectStore('dailyData');

    for (const data of dailyData) {
      if (!data.Date || !symbol) {
        console.error('Invalid data for storing in dailyData:', { symbol, ...data });
        continue;
      }

      const formattedDate = new Date(data.Date).toISOString().split('T')[0];
      const existingEntry = await store.get([symbol, formattedDate]);

      if (!existingEntry) {
        const entryForIndexedDB: DailyDataPoint & { symbol: string; date: string } = {
          symbol,
          date: formattedDate,
          ...data
        };
        await store.add(entryForIndexedDB);
      } else {
        // Perform a differential update
        let hasChanges = false;
        Object.keys(data).forEach(key => {
          if (key in existingEntry && JSON.stringify(data[key as keyof DailyDataPoint]) !== JSON.stringify(existingEntry[key as keyof (DailyDataPoint & { symbol: string; date: string })])) {
            (existingEntry[key as keyof (DailyDataPoint & { symbol: string; date: string })] as any) = data[key as keyof DailyDataPoint];
            hasChanges = true;
          }
        });
        if (hasChanges) {
          await store.put(existingEntry);
        }
      }
    }

    await tx.done;
  }

  async addFiveMinuteData(symbol: string, fiveMinuteData: FiveMinuteDataPoint[]): Promise<void> {
    if (typeof window === 'undefined') return;
  
    const db = await this.getDB();
    const tx = db.transaction('fiveMinuteData', 'readwrite');
    const store = tx.objectStore('fiveMinuteData');
  
    for (const data of fiveMinuteData) {
      if (!data.DateTime || !symbol) {
        console.error('Invalid data for storing in fiveMinuteData:', { symbol, ...data });
        continue;
      }
  
      const existingEntry = await store.get([symbol, data.DateTime]);
  
      if (!existingEntry) {
        const entryForIndexedDB: FiveMinuteDataPoint & { symbol: string } = {
          symbol,
          ...data
        };
        await store.add(entryForIndexedDB);
      } else {
        // Perform a differential update
        let hasChanges = false;
        Object.keys(data).forEach(key => {
          if (key in existingEntry && JSON.stringify(data[key as keyof FiveMinuteDataPoint]) !== JSON.stringify(existingEntry[key as keyof (FiveMinuteDataPoint & { symbol: string })])) {
            (existingEntry[key as keyof (FiveMinuteDataPoint & { symbol: string })] as any) = data[key as keyof FiveMinuteDataPoint];
            hasChanges = true;
          }
        });
        if (hasChanges) {
          await store.put(existingEntry);
        }
      }
    }
  
    await tx.done;
  }

  
  
  async getTotalApiCalls(): Promise<{ today: number; lifetime: number; dateRange: { start: string; end: string } }> {
    const db = await this.getDB();
    const today = this.getTodayUTC();
    const apiHistoryStore = db.transaction('apiHistory', 'readonly').objectStore('apiHistory');

    const allEntries = await apiHistoryStore.getAll();
    const todayCalls = (await apiHistoryStore.get(today))?.totalCalls || 0;

    const lifetimeCalls = allEntries.reduce((total, entry) => total + entry.totalCalls, 0);
    const dateRange = {
      start: allEntries.length > 0 ? allEntries[0].date : today,
      end: allEntries.length > 0 ? allEntries[allEntries.length - 1].date : today
    };

    return {
      today: todayCalls,
      lifetime: lifetimeCalls,
      dateRange
    };
  }


  async getFiveMinuteData(symbol: string, startDateTime?: string, endDateTime?: string): Promise<(FiveMinuteDataPoint & { symbol: string })[]> {
    if (typeof window === 'undefined') return [];
    const db = await this.getDB();
    const tx = db.transaction('fiveMinuteData', 'readonly');
    const index = tx.store.index('by-symbol');
    let cursor = await index.openCursor(IDBKeyRange.only(symbol));
    const results: (FiveMinuteDataPoint & { symbol: string })[] = [];

    while (cursor) {
      if ((!startDateTime || cursor.value.DateTime >= startDateTime) && (!endDateTime || cursor.value.DateTime <= endDateTime)) {
        results.push(cursor.value);
      }
      cursor = await cursor.continue();
    }

    return results;
  }

  async clearAllData(): Promise<void> {
    if (typeof window === 'undefined') return;

    const db = await this.getDB();
    const tx = db.transaction(['symbols', 'dailyData', 'fiveMinuteData'], 'readwrite');

    await Promise.all([
      tx.objectStore('symbols').clear(),
      tx.objectStore('dailyData').clear(),
      tx.objectStore('fiveMinuteData').clear()
    ]);

    await tx.done;
  }
}

export default new IndexedDBService();