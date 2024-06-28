import React, { createContext, useContext, useState, useEffect } from 'react';
import IndexedDBService from '../services/IndexedDBService';

interface APIStatistics {
  today: number;
  lifetime: number;
  dateRange: { start: string; end: string };
}

interface APIStatisticsContextType {
  statistics: APIStatistics | null;
  refreshStatistics: () => Promise<void>;
}

const APIStatisticsContext = createContext<APIStatisticsContextType | undefined>(undefined);

export const useAPIStatistics = () => {
  const context = useContext(APIStatisticsContext);
  if (context === undefined) {
    throw new Error('useAPIStatistics must be used within an APIStatisticsProvider');
  }
  return context;
};

export const APIStatisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [statistics, setStatistics] = useState<APIStatistics | null>(null);

  const refreshStatistics = async () => {
    const stats = await IndexedDBService.getTotalApiCalls();
    setStatistics(stats);
  };

  useEffect(() => {
    refreshStatistics();
    const intervalId = setInterval(refreshStatistics, 60000); // Refresh every minute
    return () => clearInterval(intervalId);
  }, []);

  return (
    <APIStatisticsContext.Provider value={{ statistics, refreshStatistics }}>
      {children}
    </APIStatisticsContext.Provider>
  );
};