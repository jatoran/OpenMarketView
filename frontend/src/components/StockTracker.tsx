import React, { useState, useCallback, useEffect } from 'react';
import TabView from './TabView';
import Settings from './Settings';
import { Button } from './ui/button';
import { StockData } from '../services/StockApiService';
import { TabData, UserSettings, UserLayout } from '../types';
import { loadSettings, saveSettings } from '../services/SettingsService';
import StockApiService from '../services/StockApiService';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Settings as SettingsIcon } from 'lucide-react';
import { APIStatisticsProvider } from '../contexts/APIStatisticsContext';

// Custom hooks

const useTabManagement = () => {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  useEffect(() => {
    loadSavedLayout();
  }, []);

  const loadSavedLayout = () => {
    const savedLayout = localStorage.getItem('userLayout');
    if (savedLayout) {
      const { tabs: savedTabs, activeTabId: savedActiveTabId } = JSON.parse(savedLayout) as UserLayout;
      // Ensure all saved tabs have the isActive property
      const updatedTabs = savedTabs.map(tab => ({
        ...tab,
        isActive: tab.isActive !== undefined ? tab.isActive : true
      }));
      setTabs(updatedTabs);
      setActiveTabId(savedActiveTabId);
    } else {
      const defaultTab: TabData = {
        id: '1',
        title: 'Default View',
        stocks: [],
        viewType: 'market',
        isActive: true  // Add this line
      };
      setTabs([defaultTab]);
      setActiveTabId(defaultTab.id);
    }
  };

  const saveLayout = useCallback(
    debounce((currentTabs: TabData[], currentActiveTabId: string) => {
      const userLayout: UserLayout = { 
        tabs: currentTabs,
        activeTabId: currentActiveTabId
      };
      localStorage.setItem('userLayout', JSON.stringify(userLayout));
      // console.log('Layout saved:', userLayout);
    }, 300),
    []
  );

  useEffect(() => {
    saveLayout(tabs, activeTabId);
  }, [tabs, activeTabId, saveLayout]);

  return { tabs, setTabs, activeTabId, setActiveTabId };
};

const useMarketStatus = () => {
  const [marketStatus, setMarketStatus] = useState<'Open' | 'Closed' | 'Unknown'>('Unknown');

  const updateMarketStatus = useCallback(() => {
    const status = StockApiService.getMarketStatus();
    setMarketStatus(status);
  }, []);

  useEffect(() => {
    const savedStatus = localStorage.getItem('marketStatus') as 'Open' | 'Closed' | 'Unknown' || 'Unknown';
    setMarketStatus(savedStatus);
    updateMarketStatus();
    const intervalId = setInterval(updateMarketStatus, 60000);
    return () => clearInterval(intervalId);
  }, [updateMarketStatus]);

  return marketStatus;
};



const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return { settings, setSettings, isSettingsOpen, setIsSettingsOpen, handleUpdateSettings };
};

const useStockData = (activeTabId: string, settings: UserSettings) => {
  const [loading, setLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const fetchAndStoreStockData = useCallback(async (tabId: string) => {
    if (loading) return; // Prevent concurrent fetches
    setLoading(true);
    try {
      const savedLayout = localStorage.getItem('userLayout');
      if (savedLayout) {
        const layout = JSON.parse(savedLayout) as UserLayout;
        const tabToUpdate = layout.tabs.find(tab => tab.id === tabId);
        if (tabToUpdate) {
          const symbols = tabToUpdate.stocks.map(stock => stock.symbol);
          const { stockData, fetchedSymbols } = await StockApiService.fetchStockData(symbols);
          
          const updatedStocks = tabToUpdate.stocks.map(stock => {
            const updatedStock = stockData.find(s => s.symbol === stock.symbol);
            return updatedStock ? { ...updatedStock, quantity: stock.quantity, avgCostBasis: stock.avgCostBasis } : stock;
          });
  
          const updatedTabs = layout.tabs.map(tab =>
            tab.id === tabId ? { ...tab, stocks: updatedStocks } : tab
          );
  
          localStorage.setItem('userLayout', JSON.stringify({ ...layout, tabs: updatedTabs }));
  
          if (fetchedSymbols.length > 0) {
            setLastRefreshTime(new Date());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // console.log(`useStockData useEffect triggered for tabId: ${activeTabId}`); // New log
    if (activeTabId) {
      // Fetch immediately when the tab becomes active
      fetchAndStoreStockData(activeTabId); 

      const intervalId = setInterval(() => {
        console.log(`Interval triggered for tabId: ${activeTabId}`); // New log
        fetchAndStoreStockData(activeTabId);
      }, settings.refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [activeTabId, settings.refreshInterval, fetchAndStoreStockData]); // Include fetchAndStoreStockData in the dependency array

  return { loading, setLoading, lastRefreshTime, fetchAndStoreStockData };
};

// Helper function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Header component
const Header: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => (
  <div className="flex justify-between items-center mb-4">
    <h1 className="text-2xl font-bold">OpenMarketView</h1>
    <Button onClick={onOpenSettings}>
      <SettingsIcon className="mr-2 h-4 w-4" />
      Settings
    </Button>
  </div>
);

// Main component
const StockTracker: React.FC = () => {
  const { tabs, setTabs, activeTabId, setActiveTabId } = useTabManagement();
  const marketStatus = useMarketStatus();
  const { settings, isSettingsOpen, setIsSettingsOpen, handleUpdateSettings } = useSettings();
  const { loading, setLoading, lastRefreshTime, fetchAndStoreStockData } = useStockData(activeTabId, settings);

  const handleUpdateTabs = useCallback((updatedTabs: TabData[]) => {
    setTabs(updatedTabs);
  }, [setTabs]);

  const handleCloseTab = (tabId: string) => {
    setTabs(prevTabs => prevTabs.map(tab => 
      tab.id === tabId ? { ...tab, isActive: false } : tab
    ));
    
    // If the closed tab was active, set a new active tab
    if (activeTabId === tabId) {
      const nextActiveTab = tabs.find(tab => tab.id !== tabId && tab.isActive);
      if (nextActiveTab) {
        setActiveTabId(nextActiveTab.id);
      }
    }
  };

  return (
    <ThemeProvider initialSettings={settings}>
      <APIStatisticsProvider>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto p-4" style={{ fontSize: `${settings.fontSize}px` }}>
            <Header onOpenSettings={() => setIsSettingsOpen(true)} />
            <TabView
              tabs={tabs}
              activeTabId={activeTabId}
              setActiveTabId={setActiveTabId}
              onUpdateTabs={handleUpdateTabs}
              onRefresh={fetchAndStoreStockData}
              loading={loading}
              setLoading={setLoading}
              marketStatus={marketStatus}
              settings={settings}
              onCloseTab={handleCloseTab}
            />
            <Settings
              tabs={tabs}
              onUpdateTabs={handleUpdateTabs}
              onUpdateSettings={handleUpdateSettings}
              currentSettings={settings}
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        </div>
      </APIStatisticsProvider>
    </ThemeProvider>
  );
};


export default StockTracker;