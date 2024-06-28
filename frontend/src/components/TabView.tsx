
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react'; // Import Check and X icons
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { debounce } from 'lodash';
import { Button } from './ui/button';
import { Input } from './ui/input';
import CompactView from './CompactView';
import DetailedView from './DetailedView';
import AddStockModal from './AddStockModal';
import { StockData } from '../services/StockApiService';
import StockApiService from '../services/StockApiService';
import { TabData, UserLayout, UserSettings } from '../types';
import { List, Grid } from 'lucide-react';
import SelectViewTypeModal from './SelectViewTypeModal';
// import NewsView from './NewsView';
// import SimulatedTradingView from './SimulatedTradingView';
import IndividualStockView from './IndividualStockView';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface TabViewProps {
  tabs: TabData[];
  activeTabId: string;
  setActiveTabId: React.Dispatch<React.SetStateAction<string>>;
  onUpdateTabs: (updatedTabs: TabData[]) => void;
  onRefresh: (tabId: string) => Promise<void>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  marketStatus: 'Open' | 'Closed' | 'Unknown';
  settings: UserSettings;
  onCloseTab: (tabId: string) => void; // New prop
}

const TabView: React.FC<TabViewProps> = React.memo(({
  tabs,
  activeTabId,
  setActiveTabId,
  onUpdateTabs,
  onRefresh,
  loading,
  setLoading,
  marketStatus,
  settings,
  onCloseTab,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabTitle, setEditingTabTitle] = useState<string>('');
  const [isAddingStock, setIsAddingStock] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isRefreshDisabled, setIsRefreshDisabled] = useState(false);
  const [isSelectingViewType, setIsSelectingViewType] = useState(false);
  const [closingTabId, setClosingTabId] = useState<string | null>(null);

  useEffect(() => {
    // console.log(`TabView useEffect triggered for activeTabId: ${activeTabId}`); // New log
    if (activeTabId) {
      handleRefresh();
    }
  }, [activeTabId]); 

  const addNewTab = () => {
    setIsSelectingViewType(true);
  };

  const handleStockClick = (stock: StockData) => {
    const newTab: TabData = {
      id: Date.now().toString(),
      title: `${stock.symbol}`,
      stocks: [stock],
      viewType: 'individual',
      isActive: true
    };
    onUpdateTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  // const handleSelectViewType = (viewType: 'compact' | 'detailed' | 'news' | 'simulated') => {
    const handleSelectViewType = (viewType: 'compact' | 'detailed') => {
    const newTab: TabData = {
      id: Date.now().toString(),
      title: `New ${viewType.charAt(0).toUpperCase() + viewType.slice(1)} Tab`,
      stocks: [],
      viewType: viewType,
      isActive: true  // Add this line
    };
    onUpdateTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setIsSelectingViewType(false);
  };

  const closeTab = (tabId: string) => {
    if (closingTabId === tabId) {
      onCloseTab(tabId);
      setClosingTabId(null);
    } else {
      setClosingTabId(tabId);
    }
  };

  const cancelCloseTab = () => {
    setClosingTabId(null);
  };


  const moveTab = (dragIndex: number, hoverIndex: number) => {
    const draggedTab = tabs[dragIndex];
    const updatedTabs = [...tabs];
    updatedTabs.splice(dragIndex, 1);
    updatedTabs.splice(hoverIndex, 0, draggedTab);
    onUpdateTabs(updatedTabs);
  };
  
  const DraggableTab: React.FC<{ tab: TabData; index: number; active: boolean }> = ({ tab, index, active }) => {
  
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [, drop] = useDrop({
    accept: 'TAB',
    hover(item: { index: number; id: string }) {
      if (item.index !== index) {
        moveTab(item.index, index);
        item.index = index;
      }
    },
  });

  const [, drag] = useDrag({
    type: 'TAB',
    item: { index, id: tab.id },
  });

  drag(drop(ref));

  useEffect(() => {
    if (editingTabId === tab.id && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingTabId]);

  return (
    <div
      ref={ref}
      key={tab.id}
      className={`px-4 py-2 cursor-pointer whitespace-nowrap flex items-center ${
        closingTabId === tab.id
          ? 'tab-close-confirm'
          : active
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground'
      }`}
      onClick={() => closingTabId !== tab.id && setActiveTabId(tab.id)}
      style={{ height: '40px' }}
    >
      {closingTabId === tab.id ? (
        <>
          <AlertTriangle size={16} className="mr-2 tab-close-confirm-text" />
          <span className="tab-close-confirm-text">Close?</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            className="ml-2 tab-close-confirm-button confirm"
            title="Confirm close"
          >
            <Check size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              cancelCloseTab();
            }}
            className="ml-2 tab-close-confirm-button cancel"
            title="Cancel close"
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <>
          <span onDoubleClick={() => startEditingTab(tab.id, tab.title)}>{tab.title}</span>
          {tab.viewType !== 'individual' && (
            <button className="ml-2" onClick={() => toggleViewType(tab.id)}>
              {tab.viewType === 'compact' ? <Grid size={16} /> : <List size={16} />}
            </button>
          )}
          <button
            className="ml-2 tab-close-button"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            title="Close tab"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
};
  
  const toggleViewType = (tabId: string) => {
    const updatedTabs = tabs.map(tab => 
      tab.id === tabId 
        ? {
            ...tab,
            viewType: tab.viewType === 'compact' ? 'detailed' : 'compact'
          } as TabData  // Explicitly cast the new object as TabData
        : tab
    );
    onUpdateTabs(updatedTabs);
  };

  const handleAddStock = async (newStock: StockData) => {
    try {
      const { stockData } = await StockApiService.fetchStockData([newStock.symbol]);
      if (stockData.length > 0) {
        const updatedStock = { 
          ...stockData[0], 
          quantity: newStock.quantity, 
          avgCostBasis: newStock.avgCostBasis 
        };
        const updatedTabs = tabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, stocks: [...tab.stocks, updatedStock] }
            : tab
        );
        onUpdateTabs(updatedTabs);
      }
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
    }
  };

  const handleAddStocks = async (newStocks: StockData[]) => {
    try {
      const symbols = newStocks.map(stock => stock.symbol);
      const { stockData } = await StockApiService.fetchStockData(symbols);
      
      const updatedStocks = newStocks.map(newStock => {
        const fetchedStock = stockData.find(s => s.symbol === newStock.symbol);
        return fetchedStock 
          ? { ...fetchedStock, quantity: newStock.quantity, avgCostBasis: newStock.avgCostBasis }
          : newStock;
      });
  
      const updatedTabs = tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, stocks: [...tab.stocks, ...updatedStocks] }
          : tab
      );
      onUpdateTabs(updatedTabs);
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
    }
  };

  const startEditingTab = (tabId: string, currentTitle: string) => {
    setEditingTabId(tabId);
    setEditingTabTitle(currentTitle);
  };

  const finishEditingTab = () => {
    if (editingTabId) {
      const updatedTabs = tabs.map(tab =>
        tab.id === editingTabId ? { ...tab, title: editingTabTitle } : tab
      );
      onUpdateTabs(updatedTabs);
      setEditingTabId(null);
    }
  };

  const handleEditStock = (updatedStock: StockData) => {
    const updatedTabs = tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, stocks: tab.stocks.map(stock => 
            stock.symbol === updatedStock.symbol ? updatedStock : stock
          )}
        : tab
    );
    onUpdateTabs(updatedTabs);
  };

  const handleRefresh = useCallback(debounce(async () => {
    if (loading || isRefreshDisabled) return;
    setLoading(true);
    setIsRefreshDisabled(true);
    try {
      await onRefresh(activeTabId);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshDisabled(false), 5000); // Enable refresh after 5 seconds
    }
  }, 300), [loading, isRefreshDisabled, onRefresh, activeTabId]);

  const getStockSpacingClass = () => {
    switch (settings.stockSpacing) {
      case 'compact':
        return 'space-y-1';
      case 'relaxed':
        return 'space-y-4';
      default:
        return 'space-y-2';
    }
  };

  
  const removeStock = (tabId: string, stockSymbol: string) => {
    // if (confirm(`Are you sure you want to remove ${stockSymbol}?`)) {
      const updatedTabs = tabs.map(tab => 
        tab.id === tabId
          ? { ...tab, stocks: tab.stocks.filter(stock => stock.symbol !== stockSymbol) }
          : tab
      );
      onUpdateTabs(updatedTabs);
    // }
  };

  const getMarketStatusColor = () => {
    switch (marketStatus) {
      case 'Open':
        return 'text-green-500';
      case 'Closed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="bg-card text-card-foreground">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Empty Title for now.  Keeps the refresh and market status stuff to the right. */}
          <CardTitle className="text-2xl font-bold"></CardTitle> 
          <div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={loading || isRefreshDisabled}>
              {loading ? 'Updating...' : 'Refresh'}
            </Button>
            <span className={`text-sm ${getMarketStatusColor()}`}>
              Market: {marketStatus}
            </span>
            {lastRefreshTime && (
              <span className="text-sm text-muted-foreground">
                Last fetched: {lastRefreshTime.toLocaleTimeString()}
              </span>
            )}
            {!loading && !lastRefreshTime && (
              <span className="text-sm text-muted-foreground">
                Using cached data
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
        <div className="flex border-b mb-4 overflow-x-auto">
          {tabs.filter(tab => tab.isActive).map((tab, index) => (
            <DraggableTab
              key={tab.id}
              tab={tab}
              index={index}
              active={activeTabId === tab.id}
            />
          ))}
          <Button onClick={addNewTab} className="ml-2">+</Button>
        </div>
        {tabs.map(tab => (
            tab.id === activeTabId && (
              <div key={tab.id} className={getStockSpacingClass()}>
                {tab.viewType === 'compact' && (
                  <CompactView 
                    stocks={tab.stocks} 
                    onRemoveStock={(symbol) => removeStock(tab.id, symbol)}
                    onEditStock={handleEditStock}
                    settings={settings}
                    tabId={tab.id}
                    onStockClick={handleStockClick}
                  />
                )}
                {tab.viewType === 'detailed' && (
                  <DetailedView 
                    stocks={tab.stocks}
                    onRemoveStock={(symbol) => removeStock(tab.id, symbol)}
                    onEditStock={handleEditStock}
                    settings={settings}
                    onStockClick={handleStockClick}
                  />
                )}
                {/* {tab.viewType === 'news' && (
                  <NewsView initialSymbols={tab.stocks.map(stock => stock.symbol)} />
                )}
                {tab.viewType === 'simulated' && (
                  <SimulatedTradingView stocks={tab.stocks} />
                )} */}
                {tab.viewType === 'individual' && tab.stocks.length > 0 && (
                  <IndividualStockView stock={tab.stocks[0]} />
                )}
                {tab.viewType !== 'individual' && (
                  <Button onClick={() => setIsAddingStock(true)} className="mt-4">
                    Add Stock
                  </Button>
                )}
              </div>
            )
          ))}
          {isSelectingViewType && (
            <SelectViewTypeModal
              onSelect={handleSelectViewType}
              onClose={() => setIsSelectingViewType(false)}
            />
          )}
          {isAddingStock && (
            <AddStockModal
              onAddStocks={handleAddStocks}
              onClose={() => setIsAddingStock(false)}
              existingSymbols={tabs.find(tab => tab.id === activeTabId)?.stocks.map(stock => stock.symbol) || []}
            />
          )}
        </CardContent>
      </Card>
    </DndProvider>
  );
});
 

export default TabView;

