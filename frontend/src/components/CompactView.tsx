import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTable, useSortBy, Column, SortingRule, UseSortByState, HeaderGroup } from 'react-table';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Trash2, Edit, ArrowUp, ArrowDown, Settings, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scrollArea';
import { StockData } from '../services/StockApiService';
import { UserSettings } from '../types';
import EditStockModal from './EditStockModal';


interface CompactViewProps {
  stocks: StockData[];
  onRemoveStock: (symbol: string) => void;
  onEditStock: (updatedStock: StockData) => void;
  settings: UserSettings;
  tabId: string;
  onStockClick: (stock: StockData) => void;
}

interface ColumnState {
  order: string[];
  widths: { [key: string]: number };
  sorting: SortingRule<StockData>[];
}

// Define default columns
const DEFAULT_COLUMNS = [
  'actions',
  'symbol',
  'currentPrice',
  'dayChange',
  'quantity',
  'currentValue',
  'dayValueChange'
];

// Custom hook for managing table data and state
const useTableData = (stocks: StockData[], tabId: string, defaultColumns: Column<StockData>[]) => {
  const [columnState, setColumnState] = useState<ColumnState>(() => {
    const savedState = localStorage.getItem(`columnState_${tabId}`);
    return savedState ? JSON.parse(savedState) : {
      order: [],
      widths: {},
      sorting: []
    };
  });

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`visibleColumns_${tabId}`);
    return saved ? new Set(JSON.parse(saved)) : new Set(DEFAULT_COLUMNS);
  });


  useEffect(() => {
    localStorage.setItem(`columnState_${tabId}`, JSON.stringify(columnState));
  }, [columnState, tabId]);

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      localStorage.setItem(`visibleColumns_${tabId}`, JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, [tabId]);

  return { columnState, setColumnState, visibleColumns, toggleColumnVisibility };
};

// Column definitions
const useColumnDefinitions = (
  handleRemoveClick: (symbol: string) => void,
  setEditingStock: React.Dispatch<React.SetStateAction<StockData | null>>,
  onStockClick: (stock: StockData) => void,
  removingStock: string | null
): Column<StockData>[] => {
  return useMemo(() => [
    {
      Header: 'Actions',
      id: 'actions',
      width: 80,
      disableResizing: true,
      disableSortBy: true,
      Cell: ({ row }: { row: { original: StockData } }) => (
        <div className="flex items-center justify-center space-x-1">
          <Button
            onClick={() => handleRemoveClick(row.original.symbol)}
            variant="ghost"
            size="sm"
            className="p-1"
          >
            {removingStock === row.original.symbol ? (
              <Check className="h-3 w-3 text-red-500" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            onClick={() => setEditingStock(row.original)}
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    { 
      Header: 'Symbol', 
      accessor: 'symbol', 
      id: 'symbol', 
      width: 80,
      Cell: ({ value, row }: { value: string; row: { original: StockData } }) => (
        <button 
          onClick={() => onStockClick(row.original)}
          className="text-blue-600 hover:underline"
        >
          {value}
        </button>
      )
    },
    { Header: 'Last Price', accessor: 'currentPrice', id: 'currentPrice', width: 80,
      Cell: ({ value }: { value: number }) => `$${value.toFixed(2)}` },
    { 
      Header: 'Prev Close',
      id: 'previousClose',
      accessor: 'previousClose', width: 80,
      Cell: ({ value }: { value: number }) => `$${value.toFixed(2)}` 
    },
    { Header: 'Day Price Change', accessor: 'dayChange', id: 'dayChange', width: 120,
      Cell: ({ value, row }: { value: number; row: { original: StockData } }) => (
        <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
          {value.toFixed(2)} ({row.original.dayChangePercent.toFixed(2)}%)
        </span>
      ),
      sortType: (rowA: { original: StockData }, rowB: { original: StockData }) => rowA.original.dayChange - rowB.original.dayChange,
    },
    { Header: 'Quantity', accessor: 'quantity', id: 'quantity', width: 80 },
    { Header: 'Avg Cost', accessor: 'avgCostBasis', id: 'avgCostBasis', width: 100,
      Cell: ({ value }: { value: number | undefined }) => value ? `$${value.toFixed(2)}` : 'N/A' },
    { 
      Header: 'Cost Basis',
      id: 'costBasis',
      width: 120,
      accessor: (row: StockData) => (row.quantity || 0) * (row.avgCostBasis || 0),
      Cell: ({ value }: { value: number }) => `$${value.toFixed(2)}`
    },
    { 
      Header: 'Current Value',
      id: 'currentValue',
      width: 120,
      accessor: (row: StockData) => (row.quantity || 0) * row.currentPrice,
      Cell: ({ value }: { value: number }) => `$${value.toFixed(2)}`
    },
    { 
      Header: 'Total Value Change',
      id: 'valueChange',
      width: 120,
      accessor: (row: StockData) => {
        const costBasis = (row.quantity || 0) * (row.avgCostBasis || 0);
        const currentValue = (row.quantity || 0) * row.currentPrice;
        return currentValue - costBasis;
      },
      Cell: ({ value }: { value: number }) => (
        <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
          {value < 0 ? `-$${Math.abs(value).toFixed(2)}` : `$${value.toFixed(2)}`}
        </span>
      ),
      sortType: (rowA: { original: StockData }, rowB: { original: StockData }) => {
        const valueA = (rowA.original.quantity || 0) * rowA.original.currentPrice - (rowA.original.quantity || 0) * (rowA.original.avgCostBasis || 0);
        const valueB = (rowB.original.quantity || 0) * rowB.original.currentPrice - (rowB.original.quantity || 0) * (rowB.original.avgCostBasis || 0);
        return valueA - valueB;
      }
    },
    { 
      Header: 'Day Value Change',
      id: 'dayValueChange',
      accessor: (row: StockData) => {
        const dayChange = row.dayChange || 0;
        const quantity = row.quantity || 0;
        return dayChange * quantity;
      },
      Cell: ({ value }: { value: number }) => (
        <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
          {value < 0 ? `-$${Math.abs(value).toFixed(2)}` : `$${value.toFixed(2)}`}
        </span>
      ),
      width: 150,
      sortType: (rowA: { original: StockData }, rowB: { original: StockData }) => {
        const valueA = (rowA.original.dayChange || 0) * (rowA.original.quantity || 0);
        const valueB = (rowB.original.dayChange || 0) * (rowB.original.quantity || 0);
        return valueA - valueB;
      }
    },
  ], [handleRemoveClick, setEditingStock, onStockClick]);
};



// Component for draggable header cell
const DraggableHeaderCell: React.FC<{
  column: HeaderGroup<StockData>;
  index: number;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
  startResizing: (e: React.MouseEvent, columnId: string) => void;
}> = ({ column, index, moveColumn, startResizing }) => {
  const [, drag, preview] = useDrag({
    type: 'COLUMN',
    item: { index, id: column.id },
  });
  
  const [, drop] = useDrop({
    accept: 'COLUMN',
    hover(item: { index: number; id: string }) {
      if (item.index !== index) {
        moveColumn(item.index, index);
        item.index = index;
      }
    },
  });

  const ref = useRef<HTMLTableHeaderCellElement>(null);
  drag(drop(ref));
  preview(ref);

  if (!column.id) {
    console.warn('Column without id detected:', column);
    return null;
  }

  // Separate key from the rest of the props
  const { key, ...rest } = column.getHeaderProps((column as any).getSortByToggleProps());

  return (
    <th
      key={column.id}
      {...rest}
      ref={ref}
      className="px-4 py-2 text-left text-muted-foreground relative cursor-move"
      style={{ width: column.width }}
    >
      {column.render('Header')}
      <span>
        {(column as any).isSorted
          ? (column as any).isSortedDesc
            ? <ArrowDown className="h-4 w-4 inline-block ml-1" />
            : <ArrowUp className="h-4 w-4 inline-block ml-1" />
          : ''}
      </span>
      {!(column as any).disableResizing && (
        <div
          className="resizer"
          onMouseDown={(e) => startResizing(e, column.id!)}
        />
      )}
    </th>
  );
};


// Component for totals row
const TotalsRow: React.FC<{ columns: Column<StockData>[]; stocks: StockData[]; columnWidths: { [key: string]: number } }> = ({ columns, stocks, columnWidths }) => {
  const totalsData = useMemo(() => {
    const initialTotals = {
      costBasis: 0,
      currentValue: 0,
      valueChange: 0,
      dayValueChange: 0,
    };

    const totals = stocks.reduce((acc, stock) => {
      const costBasis = (stock.quantity || 0) * (stock.avgCostBasis || 0);
      const currentValue = (stock.quantity || 0) * stock.currentPrice;
      const valueChange = currentValue - costBasis;
      const dayValueChange = (stock.dayChange || 0) * (stock.quantity || 0);

      return {
        costBasis: acc.costBasis + costBasis,
        currentValue: acc.currentValue + currentValue,
        valueChange: acc.valueChange + valueChange,
        dayValueChange: acc.dayValueChange + dayValueChange,
      };
    }, initialTotals);

    const valueChangePercent = totals.costBasis !== 0 
      ? (totals.valueChange / totals.costBasis) * 100 
      : 0;

    const dayValueChangePercent = totals.currentValue !== 0 
      ? (totals.dayValueChange / (totals.currentValue - totals.dayValueChange)) * 100 
      : 0;

    
    // Calculate the average of avgCostBasis
    // totals.avgCostBasis = totals.avgCostBasis / stocks.length;

    return {
      ...totals,
      valueChangePercent,
      dayValueChangePercent,
    };
  }, [stocks]);

  return (
    <tr className="border-t font-semibold">
      {columns.map(column => {
        if (column.id === 'actions') {
          return <td key={column.id} className="px-4 py-2 text-left">Totals</td>;
        }
        if (typeof column.id === 'string') {
          const value = totalsData[column.id as keyof typeof totalsData];
          if (value !== undefined) {
            let content: React.ReactNode;
            switch (column.id) {
              case 'valueChange':
                content = (
                  <span className={totalsData.valueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {totalsData.valueChange < 0 ? `-$${Math.abs(totalsData.valueChange).toFixed(2)}` : `$${totalsData.valueChange.toFixed(2)}`} ({totalsData.valueChangePercent.toFixed(2)}%)
                  </span>
                );
                break;
              case 'dayValueChange':
                content = (
                  <span className={totalsData.dayValueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {totalsData.dayValueChange < 0 ? `-$${Math.abs(totalsData.dayValueChange).toFixed(2)}` : `$${totalsData.dayValueChange.toFixed(2)}`} ({totalsData.dayValueChangePercent.toFixed(2)}%)
                  </span>
                );
                break;
              default:
                content = typeof value === 'number' ? `$${value.toFixed(2)}` : value;
            }
            return (
              <td
                key={column.id}
                className="px-4 py-2 text-left"
                style={{ width: columnWidths[column.id] || column.width }}
              >
                {content}
              </td>
            );
          }
        }
        return <td key={column.id} className="px-4 py-2 text-left"></td>;
      })}
    </tr>
  );
};

// Main CompactView component
const CompactView: React.FC<CompactViewProps> = ({ 
  stocks, 
  onRemoveStock, 
  onEditStock,
  settings,
  tabId,
  onStockClick
}) => {

  const [editingStock, setEditingStock] = useState<StockData | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [removingStock, setRemovingStock] = useState<string | null>(null);
  
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

  
  const defaultColumns = useColumnDefinitions(
    handleRemoveClick,
    setEditingStock,
    onStockClick,
    removingStock
  );

  const { columnState, setColumnState, visibleColumns, toggleColumnVisibility } = useTableData(stocks, tabId, defaultColumns);

  const columns = useMemo(() => {
    if (columnState.order.length === 0) {
      return defaultColumns.filter(col => visibleColumns.has(col.id!));
    }
    const uniqueOrder = Array.from(new Set(columnState.order));
    return uniqueOrder
      .map(columnId => defaultColumns.find(col => col.id === columnId))
      .filter((col): col is Column<StockData> => col !== undefined && visibleColumns.has(col.id!));
  }, [defaultColumns, columnState.order, visibleColumns]);

  const data = useMemo(() => stocks, [stocks]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
  } = useTable<StockData>(
    {
      columns,
      data,
      initialState: { sortBy: columnState.sorting } as any,
    },
    useSortBy
  );

  const currentSortBy = (state as UseSortByState<StockData>).sortBy;

  useEffect(() => {
    setColumnState(prev => ({
      ...prev,
      sorting: currentSortBy as SortingRule<StockData>[],
    }));
  }, [currentSortBy, setColumnState]);

  const startResizing = useCallback((e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.pageX;
    const startWidth = columnState.widths[columnId] || (columns.find(c => c.id === columnId || c.accessor === columnId)?.width as number);

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(startWidth + (e.pageX - startX), 30);
      setColumnState(prev => ({
        ...prev,
        widths: { ...prev.widths, [columnId]: newWidth }
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnState.widths, columns, setColumnState]);

  const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
    setColumnState(prevState => {
      const dragColumn = columns[dragIndex];
      let newOrder = prevState.order.length > 0 ? [...prevState.order] : columns.map(col => col.id!);
      
      newOrder = newOrder.filter(id => id !== dragColumn.id);
      newOrder.splice(hoverIndex, 0, dragColumn.id!);
      
      const allColumnIds = new Set(columns.map(col => col.id!));
      newOrder = Array.from(new Set(newOrder.concat(Array.from(allColumnIds))));
      
      return { ...prevState, order: newOrder };
    });
  }, [columns, setColumnState]);

  const ColumnManager: React.FC = () => {
    const handleCheckboxChange = useCallback((columnId: string) => {
      toggleColumnVisibility(columnId);
      // We're not closing the popover here
    }, [toggleColumnVisibility]);

    return (
      <Popover 
        open={isColumnManagerOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Only allow the popover to close when explicitly set to false
            setIsColumnManagerOpen(false);
          }
        }}
      >
       <PopoverTrigger asChild>
    <Button 
      variant="outline" 
      size="sm" 
      className="ml-2"
      onClick={() => setIsColumnManagerOpen(!isColumnManagerOpen)}
    >
      <Settings className="h-4 w-4 mr-2" />
      Manage Columns
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-56 bg-popover text-popover-foreground border border-border shadow-md">
  <ScrollArea className="h-[300px] pr-4">
            {defaultColumns.map(column => (
              <div key={column.id} className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id={`column-${column.id}`}
                  checked={visibleColumns.has(column.id!)}
                  onCheckedChange={() => handleCheckboxChange(column.id!)}
                />
                <label
                  htmlFor={`column-${column.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {column.Header as string}
                </label>
              </div>
            ))}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Stocks</h2>
        <ColumnManager />
      </div>
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full bg-card text-card-foreground" ref={tableRef}>
          <thead>
            {headerGroups.map((headerGroup) => {
              const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
              return (
                <tr key={key} {...restHeaderGroupProps}>
                  {headerGroup.headers.map((column, index) => (
                    <DraggableHeaderCell 
                      key={column.id} 
                      column={column} 
                      index={index}
                      moveColumn={moveColumn}
                      startResizing={startResizing}
                    />
                  ))}
                </tr>
              );
            })}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row);
              const { key, ...restRowProps } = row.getRowProps();
              return (
                <tr key={key} {...restRowProps} className="border-b border-border">
                  {row.cells.map(cell => {
                    const { key, ...restCellProps } = cell.getCellProps();
                    return (
                      <td
                        key={cell.column.id}
                        {...restCellProps}
                        className={`px-4 py-2 ${cell.column.id === 'actions' ? 'actions-cell' : ''}`}
                        style={{ width: columnState.widths[cell.column.id] || cell.column.width }}
                      >
                        {cell.render('Cell')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <TotalsRow columns={columns} stocks={stocks} columnWidths={columnState.widths} />
          </tbody>
        </table>
        </div>
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
    </DndProvider>
  );
};

  
  
  export default CompactView;