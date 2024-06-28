import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { StockData } from '../services/StockApiService';

interface SimulatedTradingViewProps {
  stocks: StockData[];
}

const SimulatedTradingView: React.FC<SimulatedTradingViewProps> = ({ stocks }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [simulatedStocks, setSimulatedStocks] = useState<StockData[]>([]);

  const runSimulation = () => {
    // This is a placeholder for the actual simulation logic
    // You would typically fetch historical data for the given date range
    // and calculate the simulated performance
    const simulated = stocks.map(stock => ({
      ...stock,
      currentPrice: stock.currentPrice * (1 + Math.random() * 0.2 - 0.1),  // Random price change ±10%
    }));
    setSimulatedStocks(simulated);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Simulated Trading</h2>
      <div className="flex space-x-4">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
        />
        <Button onClick={runSimulation}>Run Simulation</Button>
      </div>
      {simulatedStocks.length > 0 && (
        <table className="w-full">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Original Price</th>
              <th>Simulated Price</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {simulatedStocks.map(stock => (
              <tr key={stock.symbol}>
                <td>{stock.symbol}</td>
                <td>${stock.avgCostBasis?.toFixed(2)}</td>
                <td>${stock.currentPrice.toFixed(2)}</td>
                <td className={stock.currentPrice > (stock.avgCostBasis || 0) ? 'text-green-600' : 'text-red-600'}>
                  {(((stock.currentPrice - (stock.avgCostBasis || 0)) / (stock.avgCostBasis || 1)) * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SimulatedTradingView;