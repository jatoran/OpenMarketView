import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { StockData } from '../services/StockApiService';

interface EditStockModalProps {
  stock: StockData;
  onEditStock: (updatedStock: StockData) => void;
  onClose: () => void;
}

const EditStockModal: React.FC<EditStockModalProps> = ({ stock, onEditStock, onClose }) => {
  const [quantity, setQuantity] = useState(stock.quantity?.toString() || '');
  const [avgCostBasis, setAvgCostBasis] = useState(stock.avgCostBasis?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStock: StockData = {
      ...stock,
      quantity: Number(quantity),
      avgCostBasis: Number(avgCostBasis),
    };
    onEditStock(updatedStock);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Edit Stock: {stock.symbol}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            required
          />
          <Input
            type="number"
            value={avgCostBasis}
            onChange={(e) => setAvgCostBasis(e.target.value)}
            placeholder="Average Cost Basis"
            required
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStockModal;