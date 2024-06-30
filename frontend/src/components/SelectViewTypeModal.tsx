import React from 'react';
import { Button } from './ui/button';

interface SelectViewTypeModalProps {
  onSelect: (viewType: 'compact' | 'detailed' | 'market') => void;
  onClose: () => void;
}

const SelectViewTypeModal: React.FC<SelectViewTypeModalProps> = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Select View Type</h2>
        <div className="space-y-2">
          <Button onClick={() => onSelect('compact')} className="w-full">Compact View</Button>
          <Button onClick={() => onSelect('detailed')} className="w-full">Detailed View</Button>
          <Button onClick={() => onSelect('market')} className="w-full">Market View</Button>
        </div>
        <Button onClick={onClose} className="mt-4 w-full">Cancel</Button>
      </div>
    </div>
  );
};

export default SelectViewTypeModal;