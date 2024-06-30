import axios from 'axios';
import IndexedDBService from './IndexedDBService';

const API_BASE_URL = 'http://localhost:5000';  // Assuming your Flask app runs on port 5000
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export interface StockData {
  Date: string;
  symbol: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  previousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap: number;
  beta: number;
  name: string;
  sector: string;
  lastUpdated?: string;
  quantity?: number;
  avgCostBasis?: number;
  volume?: number;
  peRatio?: number;
  averageVolume10days?: number;
  totalAssets?: number;
  marketStatus?: 'Open' | 'Closed';
  open?: number;
  dayLow?: number;
  dayHigh?: number;
  dividendRate?: number;
  dividendYield?: number;
  payoutRatio?: number;
  forwardPE?: number;
  profitMargins?: number;
  enterpriseValue?: number;
  priceToSalesTrailing12Months?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  sharesOutstanding?: number;
  sharesShort?: number;
  shortRatio?: number;
  bookValue?: number;
  priceToBook?: number;
  totalCash?: number;
  totalDebt?: number;
  revenue?: number;
  revenuePerShare?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  operatingCashflow?: number;
  freeCashflow?: number;
  grossMargins?: number;
  ebitdaMargins?: number;
  operatingMargins?: number;
  recommendationMean?: number;
  numberOfAnalystOpinions?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  targetMeanPrice?: number;
  targetMedianPrice?: number;
  currency?: string;
}

export interface DailyDataPoint {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export interface FiveMinuteDataPoint {
  DateTime: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export interface MarketOverview {
  [key: string]: {
    name: string;
    current: number;
    change: number;
    changePercent: number;
  };
}

export interface MarketHistory {
  date: string;
  close: number;
}

export interface MarketSector {
  name: string;
  change: number;
}

export interface EconomicIndicator {
  name: string;
  current: number;
  change: number;
  changePercent: number;
}

export interface Bitcoin {
  name: string;
  current: number;
  change: number;
  changePercent: number;
}

interface FetchResult {
  stockData: StockData[];
  fetchedSymbols: string[];
}

class StockApiService {
  private marketStatus: 'Open' | 'Closed' | 'Unknown' = 'Unknown';
  private historicalDataCache: { [symbol: string]: { data: any, timestamp: number } } = {};


  constructor() {
    this.updateMarketStatus().then(() => {
      console.log("Initial market status fetched");
    });
  }

  private async retryFetch<T>(fetchFunction: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
      return await fetchFunction();
    } catch (error) {
      if (retries > 0 && axios.isAxiosError(error)) {
        console.log(`Retrying... Attempts left: ${retries - 1}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.retryFetch(fetchFunction, retries - 1);
      }
      throw error;
    }
  }

  async validateStock(symbol: string): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}`);
      return response.status === 200;
    } catch (error) {
      console.error(`Error validating stock ${symbol}:`, error);
      return false;
    }
  }

  
  private async updateMarketStatus() {
    try {
      const status = await this.fetchMarketStatus();
      this.marketStatus = status;
      localStorage.setItem('marketStatus', status);
      console.log(`Market Status Updated: ${status}`);
    } catch (error) {
      console.error('Failed to fetch market status:', error);
      this.marketStatus = 'Unknown';
      localStorage.setItem('marketStatus', 'Unknown');
    }
  }

  async fetchHistoricalData(symbol: string): Promise<{ dailyData: any[], granularData: any[] }> {
    // console.log(`[StockApiService] Fetch request for symbol: ${symbol}`);
    
    const cacheEntry = this.historicalDataCache[symbol];
    const cacheExpiration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (cacheEntry && (Date.now() - cacheEntry.timestamp < cacheExpiration)) {
      console.log(`[StockApiService] Using cached data for ${symbol}`);
      return cacheEntry.data;
    }

    console.log(`[StockApiService] Making API call for ${symbol}`);

    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_BASE_URL}/historical/${symbol}`);
      const { daily_data, granular_data } = response.data;

      const result = {
        dailyData: daily_data,
        granularData: granular_data
      };

      // Cache the result
      this.historicalDataCache[symbol] = { data: result, timestamp: Date.now() };

      const duration = Date.now() - startTime;
      await this.logApiCall(true, duration, 'fetchHistoricalData', { symbol }, response.data);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (isError(error)) {
        await this.logApiCall(false, duration, 'fetchHistoricalData', { symbol }, null, error.message);
        console.error(`Error fetching historical data for ${symbol}:`, error.message);
      } else {
        await this.logApiCall(false, duration, 'fetchHistoricalData', { symbol }, null, 'Unknown error');
        console.error(`Error fetching historical data for ${symbol}: Unknown error`);
      }
      throw error;
    }
  }


  private async fetchMarketStatus(): Promise<'Open' | 'Closed'> {
    const now = new Date();
    const day = now.getUTCDay(); // Use UTC to avoid time zone issues
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
  
    if (day >= 1 && day <= 5 && 
        ((hour === 13 && minute >= 30) || (hour > 13 && hour < 20) || (hour === 20 && minute === 0))) {
      return 'Open';
    }
    return 'Closed';
  }

  public getMarketStatus(): 'Open' | 'Closed' | 'Unknown' {
    return this.marketStatus;
  }

  private async logApiCall(success: boolean, duration: number, type: string, requestData?: any, responseData?: any, errorMessage?: string): Promise<void> {
    console.log(`API Call - Type: ${type}, Success: ${success}, Duration: ${duration}ms,  Error: ${errorMessage || 'None'}`);
    await IndexedDBService.logApiCall(success, duration, type, requestData, responseData, errorMessage);
  }

  private shouldFetchData(lastUpdated: string | null): boolean {
    if (!lastUpdated) {
      console.log('No last updated timestamp, fetching data.');
      return true;
    }
    const now = new Date();
    const lastUpdateTime = new Date(lastUpdated);
    const refreshInterval = 5 * 60 * 1000; // Define your refresh interval here
    const timeDifference = now.getTime() - lastUpdateTime.getTime();
    // console.log(`Time since last update: ${timeDifference}ms, Refresh interval: ${refreshInterval}ms`);
    return timeDifference > refreshInterval;
  }

  async fetchStockData(symbols: string[]): Promise<FetchResult> {
    const stockData: StockData[] = [];
    const fetchedSymbols: string[] = [];
  
    for (const symbol of symbols) {
      const lastUpdated = await IndexedDBService.getLastUpdatedTime(symbol);
  
      // Check if data is not fresh or symbol is not in the database
      const needsFetch = !lastUpdated || this.shouldFetchData(lastUpdated);
  
      // if (this.marketStatus === 'Open'){
      //   console.log ("flipping market status for testing");
      //   this.marketStatus = 'Closed';
      // }
      if (!needsFetch && this.marketStatus === 'Closed') {
        console.log(`Market is closed and data is fresh. Skipping fetch for ${symbol}`);
        const cachedData = await IndexedDBService.getSymbol(symbol);
        if (cachedData) {
          stockData.push(cachedData);
        }
        continue;
      }
  
      try {
        console.log(`Fetching new data for ${symbol}`);
        const data = await this.retryFetch(() => this.fetchSingleStockData(symbol));
        stockData.push(data);
        await IndexedDBService.addSymbol(data);
        fetchedSymbols.push(symbol);
  
        const lastDailyUpdate = await IndexedDBService.getLastStoredDailyDataDate(symbol);
        const today = new Date().toISOString().split('T')[0];
        if (!lastDailyUpdate || lastDailyUpdate !== today) {
          await this.fetchDailyData(symbol);
        }
  
        const lastFiveMinuteUpdate = await IndexedDBService.getLastStoredFiveMinuteDataDateTime(symbol);
        if (!lastFiveMinuteUpdate || this.shouldFetchData(lastFiveMinuteUpdate)) {
          await this.fetchFiveMinuteData(symbol);
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${symbol} after multiple retries:`, error);
      }
    }
  
    return { stockData, fetchedSymbols };
  }
  
  

  private async fetchSingleStockData(symbol: string): Promise<StockData> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}`);
      const apiData = response.data;
      console.log(`Data for ${symbol}:`, apiData);

      const { currentPrice = 0, previousClose = 0, Date: date, symbol: sym, fiftyTwoWeekHigh, fiftyTwoWeekLow, marketCap, beta, name, sector, volume, trailingPE, averageVolume10days, totalAssets, open, dayLow, dayHigh, dividendRate, dividendYield, payoutRatio, forwardPE, profitMargins, enterpriseValue, priceToSalesTrailing12Months, fiftyDayAverage, twoHundredDayAverage, sharesOutstanding, sharesShort, shortRatio, bookValue, priceToBook, totalCash, totalDebt, totalRevenue, revenuePerShare, returnOnAssets, returnOnEquity, operatingCashflow, freeCashflow, grossMargins, ebitdaMargins, operatingMargins, recommendationMean, numberOfAnalystOpinions, targetHighPrice, targetLowPrice, targetMeanPrice, targetMedianPrice, currency, lastUpdated } = apiData;

      const dayChange = currentPrice - previousClose;
      const dayChangePercent = previousClose ? (dayChange / previousClose) * 100 : 0;

      const stockData: StockData = {
        Date: date || new Date().toISOString().split('T')[0],
        symbol: sym,
        currentPrice,
        dayChange,
        dayChangePercent,
        previousClose,
        fiftyTwoWeekHigh,
        fiftyTwoWeekLow,
        marketCap,
        beta,
        name,
        sector,
        volume,
        peRatio: trailingPE,
        averageVolume10days,
        totalAssets,
        lastUpdated: lastUpdated || new Date().toISOString(),
        open,
        dayLow,
        dayHigh,
        dividendRate,
        dividendYield,
        payoutRatio,
        forwardPE,
        profitMargins,
        enterpriseValue,
        priceToSalesTrailing12Months,
        fiftyDayAverage,
        twoHundredDayAverage,
        sharesOutstanding,
        sharesShort,
        shortRatio,
        bookValue,
        priceToBook,
        totalCash,
        totalDebt,
        revenue: totalRevenue,
        revenuePerShare,
        returnOnAssets,
        returnOnEquity,
        operatingCashflow,
        freeCashflow,
        grossMargins,
        ebitdaMargins,
        operatingMargins,
        recommendationMean,
        numberOfAnalystOpinions,
        targetHighPrice,
        targetLowPrice,
        targetMeanPrice,
        targetMedianPrice,
        currency
      };

      stockData.marketStatus = this.determineMarketStatus(stockData);

      const duration = Date.now() - startTime;
      await this.logApiCall(true, duration, 'fetchSingleStockData', { symbol }, apiData);

      return stockData;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (isError(error)) {
        await this.logApiCall(false, duration, 'fetchSingleStockData', { symbol }, null, error.message);
        console.error(`Error fetching data for ${symbol}:`, error.message);
      } else {
        await this.logApiCall(false, duration, 'fetchSingleStockData', { symbol }, null, 'Unknown error');
        console.error(`Error fetching data for ${symbol}: Unknown error`);
      }
      throw error;
    }
  }

  private determineMarketStatus(stockData: StockData): 'Open' | 'Closed' {
    const now = new Date();
    
    if (stockData.lastUpdated) {
      const lastUpdated = new Date(stockData.lastUpdated);
      const timeSinceUpdate = now.getTime() - lastUpdated.getTime();
      
      // If the data is less than 10 minutes old, consider the market open
      if (timeSinceUpdate < 10 * 60 * 1000) {
        console.log('Market determined to be open based on recent data');
        return 'Open';
      }
    }

    // Check if it's a weekday
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Assuming Eastern Time (ET) for simplicity
    // NYSE is open from Monday (1) through Friday (5), 9:30 AM to 4:00 PM ET
    if (day >= 1 && day <= 5 && 
        ((hour === 9 && minute >= 30) || (hour > 9 && hour < 16) || (hour === 16 && minute === 0))) {
      console.log('Market determined to be open based on current time');
      return 'Open';
    }
    console.log('Market determined to be closed');
    return 'Closed';
  }

  async fetchDailyData(symbol: string): Promise<DailyDataPoint[]> {
    const startTime = Date.now();
    try {
      const lastStoredDate = await IndexedDBService.getLastStoredDailyDataDate(symbol);
      const today = new Date().toISOString().split('T')[0];
      console.log(`Last stored daily data date for ${symbol}: ${lastStoredDate}`);

      if (lastStoredDate !== today) {
        console.log(`Fetching daily data for ${symbol} from ${lastStoredDate}`);
        const response = await axios.get(`${API_BASE_URL}/historical/${symbol}`, {
          params: { since: lastStoredDate }
        });
        const newData = response.data;

        if (newData.length > 0) {
          await IndexedDBService.addDailyData(symbol, newData);
        }

        const duration = Date.now() - startTime;
        await this.logApiCall(true, duration, 'fetchDailyData', { symbol, since: lastStoredDate }, newData);

        return newData;
      }
      console.log(`Daily data for ${symbol} is up-to-date`);
      const duration = Date.now() - startTime;
      await this.logApiCall(true, duration, 'fetchDailyData', { symbol, since: lastStoredDate }, []);

      return [];
    } catch (error) {
      const duration = Date.now() - startTime;
      if (isError(error)) {
        await this.logApiCall(false, duration, 'fetchDailyData', { symbol }, null, error.message);
        console.error(`Error fetching daily data for ${symbol}:`, error.message);
      } else {
        await this.logApiCall(false, duration, 'fetchDailyData', { symbol }, null, 'Unknown error');
        console.error(`Error fetching daily data for ${symbol}: Unknown error`);
      }
      throw error;
    }
  }

  async fetchFiveMinuteData(symbol: string): Promise<FiveMinuteDataPoint[]> {
    const startTime = Date.now();
    try {
      const lastStoredDateTime = await IndexedDBService.getLastStoredFiveMinuteDataDateTime(symbol);
      console.log(`Last stored five-minute data dateTime for ${symbol}: ${lastStoredDateTime}`);

      if (this.shouldFetchData(lastStoredDateTime)) {
        console.log(`Fetching five-minute data for ${symbol} from ${lastStoredDateTime}`);
        const response = await axios.get(`${API_BASE_URL}/granular/${symbol}`, {
          params: { since: lastStoredDateTime }
        });
        const newData = response.data;

        if (newData.length > 0) {
          await IndexedDBService.addFiveMinuteData(symbol, newData);
        }

        const duration = Date.now() - startTime;
        await this.logApiCall(true, duration, 'fetchFiveMinuteData', { symbol, since: lastStoredDateTime }, newData);

        return newData;
      }
      console.log(`Five-minute data for ${symbol} is up-to-date`);
      const duration = Date.now() - startTime;
      await this.logApiCall(true, duration, 'fetchFiveMinuteData', { symbol, since: lastStoredDateTime }, []);

      return [];
    } catch (error) {
      const duration = Date.now() - startTime;
      if (isError(error)) {
        await this.logApiCall(false, duration, 'fetchFiveMinuteData', { symbol }, null, error.message);
        console.error(`Error fetching five-minute data for ${symbol}:`, error.message);
      } else {
        await this.logApiCall(false, duration, 'fetchFiveMinuteData', { symbol }, null, 'Unknown error');
        console.error(`Error fetching five-minute data for ${symbol}: Unknown error`);
      }
      throw error;
    }
  }

  async fetchMarketOverview(): Promise<MarketOverview> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_BASE_URL}/market_overview`);
      const duration = Date.now() - startTime;
      await this.logApiCall(true, duration, 'fetchMarketOverview', {}, response.data);
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (isError(error)) {
        await this.logApiCall(false, duration, 'fetchMarketOverview', {}, null, error.message);
        console.error('Error fetching market overview:', error.message);
      } else {
        await this.logApiCall(false, duration, 'fetchMarketOverview', {}, null, 'Unknown error');
        console.error('Error fetching market overview: Unknown error');
      }
      throw error;
    }
  }

  async fetchMarketHistory(index: string, period: string): Promise<MarketHistory[]> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_BASE_URL}/market_history`, {
        params: { index, period }
      });
      const duration = Date.now() - startTime;
      await this.logApiCall(true, duration, 'fetchMarketHistory', { index, period }, response.data);
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (isError(error)) {
        await this.logApiCall(false, duration, 'fetchMarketHistory', { index, period }, null, error.message);
        console.error('Error fetching market history:', error.message);
      } else {
        await this.logApiCall(false, duration, 'fetchMarketHistory', { index, period }, null, 'Unknown error');
        console.error('Error fetching market history: Unknown error');
      }
      throw error;
    }
  }

  async fetchMarketSectors(): Promise<{ [key: string]: MarketSector }> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_BASE_URL}/market_sectors`);
      const duration = Date.now() - startTime;
      await this.logApiCall(true, duration, 'fetchMarketSectors', {}, response.data);
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (isError(error)) {
        await this.logApiCall(false, duration, 'fetchMarketSectors', {}, null, error.message);
        console.error('Error fetching market sectors:', error.message);
      } else {
        await this.logApiCall(false, duration, 'fetchMarketSectors', {}, null, 'Unknown error');
        console.error('Error fetching market sectors: Unknown error');
      }
      throw error;
    }
  }

  async fetchEconomicIndicators(): Promise<{ [key: string]: EconomicIndicator }> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_BASE_URL}/economic_indicators`);
      const duration = Date.now() - startTime;
      await this.logApiCall(true, duration, 'fetchEconomicIndicators', {}, response.data);
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (isError(error)) {
        await this.logApiCall(false, duration, 'fetchEconomicIndicators', {}, null, error.message);
        console.error('Error fetching economic indicators:', error.message);
      } else {
        await this.logApiCall(false, duration, 'fetchEconomicIndicators', {}, null, 'Unknown error');
        console.error('Error fetching economic indicators: Unknown error');
      }
      throw error;
    }
  }

  async fetchBitcoinData(): Promise<Bitcoin> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_BASE_URL}/bitcoin`);
      const duration = Date.now() - startTime;
      await this.logApiCall(true, duration, 'fetchBitcoinData', {}, response.data);
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (isError(error)) {
        await this.logApiCall(false, duration, 'fetchBitcoinData', {}, null, error.message);
        console.error('Error fetching Bitcoin data:', error.message);
      } else {
        await this.logApiCall(false, duration, 'fetchBitcoinData', {}, null, 'Unknown error');
        console.error('Error fetching Bitcoin data: Unknown error');
      }
      throw error;
    }
  }
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export default new StockApiService();