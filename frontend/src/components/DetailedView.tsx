import React, { useState, useEffect, useCallback } from 'react';
import { StockData } from '../services/StockApiService';
import { Button } from './ui/button';
import { Trash2, Edit, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { UserSettings } from '../types';
import EditStockModal from './EditStockModal';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import IndexedDBService from '../services/IndexedDBService';

interface DetailedViewProps {
  stocks: StockData[];
  onRemoveStock: (symbol: string) => void;
  onEditStock: (updatedStock: StockData) => void;
  settings: UserSettings;
  onStockClick: (stock: StockData) => void;
}

const DetailedView: React.FC<DetailedViewProps> = ({
  stocks,
  onRemoveStock,
  onEditStock,
  settings,
  onStockClick
}) => {
  const [editingStock, setEditingStock] = useState<StockData | null>(null);
  const [removingStock, setRemovingStock] = useState<string | null>(null);
  const [fiveMinuteData, setFiveMinuteData] = useState<{ [key: string]: any[] }>({});

  const getCardClass = () => {
    switch (settings.stockSpacing) {
      case 'compact':
        return 'p-2';
      case 'relaxed':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  const handleRemoveClick = useCallback((symbol: string) => {
    if (removingStock === symbol) {
      onRemoveStock(symbol);
      setRemovingStock(null);
    } else {
      setRemovingStock(symbol);
    }
  }, [removingStock, onRemoveStock]);

  useEffect(() => {
    if (removingStock) {
      const timer = setTimeout(() => {
        setRemovingStock(null);
      }, 3000); // Reset after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [removingStock]);

  useEffect(() => {
    const fetchFiveMinuteData = async () => {
      const data: { [key: string]: any[] } = {};
      for (const stock of stocks) {
        const symbol = stock.symbol;
        const allData = await IndexedDBService.getFiveMinuteData(symbol);
        // console.log(`Fetched fiveMinuteData for ${symbol}:`, allData); // Add this line
        const lastDate = allData.length > 0 ? allData[allData.length - 1].DateTime.split('T')[0] : null;
        if (lastDate) {
          data[symbol] = allData.filter(d => d.DateTime.startsWith(lastDate));
          // console.log(`Filtered fiveMinuteData for ${symbol} on ${lastDate}:`, data[symbol]); // Add this line
        }
      }
      setFiveMinuteData(data);
    };
  
    fetchFiveMinuteData();
  }, [stocks]);

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12; // Convert 0 hour to 12
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes}${ampm}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const time = formatTime(label);
      const price = payload[0].value.toFixed(2);
  
      return (
        <div className="custom-tooltip" style={{ backgroundColor: 'rgba(var(--tooltip-bg), 0.8)', color: 'rgb(var(--tooltip-text))', padding: '2px 5px', fontSize: '12px' }}>
          <p className="label">{`${time}`}</p>
          <p className="price">{`$${price}`}</p>
        </div>
      );
    }
  
    return null;
  };
  
  

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stocks.map((stock) => {
        const costBasis = (stock.quantity || 0) * (stock.avgCostBasis || 0);
        const currentValue = (stock.quantity || 0) * stock.currentPrice;
        const valueChange = currentValue - costBasis;
        const valueChangePercent = ((valueChange / costBasis) * 100).toFixed(2);

         return (
          <Card key={stock.symbol} className={`bg-white dark:bg-card shadow rounded-lg ${getCardClass()}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground dark:text-detailedCardForeground">
                <button 
                  onClick={() => onStockClick(stock)}
                  className="text-blue-600 hover:underline"
                >
                  {stock.name} ({stock.symbol})
                </button>
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleRemoveClick(stock.symbol)}
                  variant="ghost"
                  size="sm"
                >
                  {removingStock === stock.symbol ? (
                    <Check className="h-4 w-4 text-red-500" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => setEditingStock(stock)}
                  variant="ghost"
                  size="sm"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            
            <CardContent>
  <p className="text-foreground dark:text-detailedCardForeground">Sector: {stock.sector}</p>
  <div className="mt-2 space-y-1 text-foreground dark:text-detailedCardForeground">
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={fiveMinuteData[stock.symbol]}>
        <Tooltip content={<CustomTooltip />} position={{ x: 0, y: 0 }} />
        <Line type="monotone" dataKey="Close" stroke="#8884d8" dot={false} isAnimationActive={false} />
        <XAxis dataKey="DateTime" hide />
        <YAxis domain={['auto', 'auto']} hide />
      </LineChart>
    </ResponsiveContainer>



              </div>
              <p className="text-foreground">Sector: {stock.sector}</p>
              <div className="mt-2 space-y-1">
                <p>Current Price: ${stock.currentPrice?.toFixed(2) ?? 'N/A'}</p>
                <p className={stock.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                  Day Change: {stock.dayChange?.toFixed(2) ?? 'N/A'} ({stock.dayChangePercent?.toFixed(2) ?? 'N/A'}%)
                </p>
                <p>Previous Close: ${stock.previousClose?.toFixed(2) ?? 'N/A'}</p>
                <p>52 Week High: ${stock.fiftyTwoWeekHigh?.toFixed(2) ?? 'N/A'}</p>
                <p>52 Week Low: ${stock.fiftyTwoWeekLow?.toFixed(2) ?? 'N/A'}</p>
                <p>Market Cap: ${(stock.marketCap / 1e9).toFixed(2) ?? 'N/A'}B</p>
                <p>Beta: {stock.beta?.toFixed(2) ?? 'N/A'}</p>
                <p>Volume: {stock.volume?.toLocaleString() ?? 'N/A'}</p>
                <p>P/E Ratio: {stock.peRatio?.toFixed(2) ?? 'N/A'}</p>
                <p>Quantity: {stock.quantity}</p>
                <p>Avg Cost Basis: ${stock.avgCostBasis?.toFixed(2) ?? 'N/A'}</p>
                <p>Cost Basis Total: ${costBasis?.toFixed(2) ?? 'N/A'}</p>
                <p>Current Value: ${currentValue?.toFixed(2) ?? 'N/A'}</p>
                <p className={valueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                  Value Change: ${valueChange?.toFixed(2) ?? 'N/A'} ({valueChangePercent}%)
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {editingStock && (
        <EditStockModal
          stock={editingStock}
          onEditStock={(updatedStock) => {
            onEditStock(updatedStock);
            setEditingStock(null);
          }}
          onClose={() => setEditingStock(null)}
        />
      )}
    </div>
  );
};

export default DetailedView;
