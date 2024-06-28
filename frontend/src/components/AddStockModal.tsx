import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { StockData } from '../services/StockApiService';
import StockApiService from '../services/StockApiService';
import { Plus, X } from 'lucide-react';
import Papa from 'papaparse';
import { ParseResult, parse } from 'papaparse';

interface AddStockModalProps {
  onAddStocks: (stocks: StockData[]) => void;
  onClose: () => void;
  existingSymbols: string[];
}

interface StockEntry {
  symbol: string;
  quantity: string;
  avgCostBasis: string;
  info: Partial<StockData> | null;
}

const AddStockModal: React.FC<AddStockModalProps> = ({ onAddStocks, onClose, existingSymbols }) => {
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([{ symbol: '', quantity: '', avgCostBasis: '', info: null }]);
  const [error, setError] = useState<string>('');
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [duplicateError, setDuplicateError] = useState<string>('');
  const [debouncedSymbol, setDebouncedSymbol] = useState<string>('');
  const [tempStockData, setTempStockData] = useState<{ [key: string]: StockData | null }>({});

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const fetchStockInfo = useCallback(async (symbol: string, index: number) => {
    if (symbol.length >= 1 && !existingSymbols.includes(symbol)) {
      if (tempStockData[symbol]) {
        setStockEntries(entries =>
          entries.map((entry, i) =>
            i === index ? { ...entry, info: tempStockData[symbol] } : entry
          )
        );
      } else {
        try {
          const { stockData } = await StockApiService.fetchStockData([symbol]);
          if (stockData.length > 0) {
            setTempStockData(prev => ({ ...prev, [symbol]: stockData[0] }));
            setStockEntries(entries =>
              entries.map((entry, i) =>
                i === index ? { ...entry, info: stockData[0] } : entry
              )
            );
          } else {
            setStockEntries(entries =>
              entries.map((entry, i) =>
                i === index ? { ...entry, info: null } : entry
              )
            );
          }
        } catch (error) {
          console.error('Error fetching stock info:', error);
          setStockEntries(entries =>
            entries.map((entry, i) =>
              i === index ? { ...entry, info: null } : entry
            )
          );
        }
      }
    }
  }, [existingSymbols, tempStockData]);
  

  const handleInputChange = (index: number, field: keyof StockEntry, value: string) => {
    const updatedEntries = stockEntries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    setStockEntries(updatedEntries);
  
    if (field === 'symbol') {
      const symbol = value.toUpperCase();
  
      if (existingSymbols.includes(symbol) || stockEntries.some((entry, i) => i !== index && entry.symbol === symbol)) {
        setDuplicateError(`${symbol} is already in your portfolio`);
      } else {
        setDuplicateError('');
        setDebouncedSymbol(symbol);
      }
    }
  };
  
  

  useEffect(() => {
    const handler = setTimeout(() => {
      stockEntries.forEach((entry, index) => {
        if (entry.symbol.length >= 1) {
          fetchStockInfo(entry.symbol, index);
        }
      });
    }, 500); // 500ms delay

    return () => clearTimeout(handler);
  }, [debouncedSymbol, fetchStockInfo, stockEntries]);

  const addStockEntry = () => {
    setStockEntries([...stockEntries, { symbol: '', quantity: '', avgCostBasis: '', info: null }]);
    setDuplicateError('');
  };

  const removeStockEntry = (index: number) => {
    setStockEntries(stockEntries.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validStocks = stockEntries.filter(entry =>
      entry.info && entry.quantity && entry.avgCostBasis && !existingSymbols.includes(entry.symbol)
    );
    if (validStocks.length === 0) {
      setError('Please enter valid stock information');
      return;
    }
    const newStocks: StockData[] = validStocks.map(entry => ({
      ...(entry.info as StockData),
      quantity: Number(entry.quantity),
      avgCostBasis: Number(entry.avgCostBasis),
    }));
    onAddStocks(newStocks);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      parse<Record<string, string>>(file, {
        header: true,
        complete: (results: ParseResult<Record<string, string>>) => {
          const fields = results.meta.fields as string[];
          const columnMap = {
            costBasis: findColumnName(fields, ["Average Cost Basis", "Cost Basis", "Avg Cost"]),
            quantity: findColumnName(fields, ["Quantity", "Count", "SharesCount", "Shares"]),
            symbol: findColumnName(fields, ["Symbol", "Abbreviation", "Stock Symbol", "Ticker"]),
          };

          const stocks = results.data.map(row => {
            const symbol = columnMap.symbol ? row[columnMap.symbol]?.trim() ?? undefined : undefined;
            const quantity = columnMap.quantity ? parseFloat(row[columnMap.quantity]?.replace(/,/g, '').trim()) : undefined;
            const avgCostBasis = columnMap.costBasis ? parseCostBasis(row[columnMap.costBasis]) : undefined;

            return {
              symbol: symbol,
              quantity: quantity ? quantity.toString() : undefined,
              avgCostBasis: avgCostBasis ? avgCostBasis.toString() : undefined,
              info: null,
            };
          }).filter(stock => stock.symbol && stock.quantity && stock.avgCostBasis);

          setStockEntries(stocks as StockEntry[]);
        },
      });
    }
  };

  const findColumnName = (fields: string[], possibleNames: string[]): string | null => {
    return fields.find(field => possibleNames.includes(field)) || null;
  };

  const parseCostBasis = (value: string): number | undefined => {
    if (!value) return undefined;
    const cleanedValue = value.replace(/^\$/, '').trim();
    return parseFloat(cleanedValue);
  };

  return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white dark:bg-card p-4 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
    <h2 className="text-lg font-bold mb-4 text-foreground dark:text-detailedCardForeground">Add New Stocks</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <input type="file" accept=".csv" onChange={handleFileUpload} />
          </div>
          {stockEntries.map((entry, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex items-center space-x-2 w-2/3">
                <Input
                  type="text"
                  value={entry.symbol}
                  onChange={(e) => handleInputChange(index, 'symbol', e.target.value.toUpperCase())}
                  placeholder="Symbol"
                  required
                  ref={index === 0 ? firstInputRef : null}
                  className="w-1/3"
                />
                <Input
                  type="number"
                  value={entry.quantity}
                  onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                  placeholder="Quantity"
                  required
                  className="w-1/3"
                />
                <Input
                  type="number"
                  value={entry.avgCostBasis}
                  onChange={(e) => handleInputChange(index, 'avgCostBasis', e.target.value)}
                  placeholder="Avg Cost"
                  required
                  className="w-1/3"
                />
                {index > 0 && (
                  <Button type="button" onClick={() => removeStockEntry(index)} variant="ghost" className="p-2">
                    <X size={20} />
                  </Button>
                )}
              </div>
              <div className="w-1/3 h-10 flex items-center">
                {entry.info && (
                  <div className="text-sm">
                    <p className="font-semibold">{entry.info.name}</p>
                    <p>Current Price: ${entry.info.currentPrice?.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          <Button type="button" onClick={addStockEntry} variant="outline" className="w-full">
            <Plus size={20} className="mr-2" /> Add Another Stock
          </Button>
          {error && <p className="text-red-500 dark:text-red-300">{error}</p>}
          {duplicateError && <p className="text-yellow-500 dark:text-yellow-300">{duplicateError}</p>}

          <div className="flex justify-end space-x-2">
            <Button type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Stocks</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockModal;