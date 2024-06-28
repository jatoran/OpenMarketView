import React, { createContext, useContext, useState, useEffect } from 'react';
import StockApiService from '../services/StockApiService';
import { StockData } from '../services/StockApiService';

interface GlobalState {
  stockData: { [symbol: string]: StockData };
  fetchStockData: (symbols: string[]) => Promise<void>;
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stockData, setStockData] = useState<{ [symbol: string]: StockData }>({});

  const fetchStockData = async (symbols: string[]) => {
    const { stockData: freshData } = await StockApiService.fetchStockData(symbols);
    setStockData(prevData => ({
      ...prevData,
      ...Object.fromEntries(freshData.map(stock => [stock.symbol, stock]))
    }));
  };

  useEffect(() => {
    // Optionally implement periodic background refresh here
  }, []);

  return (
    <GlobalStateContext.Provider value={{ stockData, fetchStockData }}>
      {children}
    </GlobalStateContext.Provider>
  );
};
