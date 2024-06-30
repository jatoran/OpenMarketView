import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StockData } from '../services/StockApiService';
import StockApiService from '../services/StockApiService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

interface IndividualStockViewProps {
  stock: StockData;
}

const IndividualStockView: React.FC<IndividualStockViewProps> = ({ stock }) => {
  const costBasis = (stock.quantity || 0) * (stock.avgCostBasis || 0);
  const currentValue = (stock.quantity || 0) * stock.currentPrice;
  const valueChange = currentValue - costBasis;
  const valueChangePercent = ((valueChange / costBasis) * 100).toFixed(2);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<string>('1M');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const loadingSymbolRef = useRef<string | null>(null);
  const { theme, customThemes } = useTheme();
  const currentTheme = customThemes[theme];
  const chartLineColor = currentTheme.colors.chartLine.hex;
  const chartTextColor = currentTheme.colors.chartText.hex;
  const chartTimeSelectorColor = currentTheme.colors.chartTimeSelector.hex;

//   console.log(`[IndividualStockView] Rendering for symbol: ${stock.symbol}`);

  const fetchData = useCallback(async () => {
    if (loadingSymbolRef.current === stock.symbol) {
    //   console.log(`[IndividualStockView] Already loading data for ${stock.symbol}`);
      return;
    }

    console.log(`[IndividualStockView] Fetching data for ${stock.symbol}`);
    loadingSymbolRef.current = stock.symbol;
    setIsLoading(true);

    try {
      const data = await StockApiService.fetchHistoricalData(stock.symbol);
      console.log(`[IndividualStockView] Data fetched for ${stock.symbol}`);
      setHistoricalData(data.dailyData);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setIsLoading(false);
      loadingSymbolRef.current = null;
    }
  }, [stock.symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterDataByTimeRange = (data: any[], range: string) => {
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case '1D': startDate.setDate(now.getDate() - 1); break;
      case '5D': startDate.setDate(now.getDate() - 5); break;
      case '1M': startDate.setMonth(now.getMonth() - 1); break;
      case '3M': startDate.setMonth(now.getMonth() - 3); break;
      case '6M': startDate.setMonth(now.getMonth() - 6); break;
      case 'YTD': startDate = new Date(now.getFullYear(), 0, 1); break;
      case '1Y': startDate.setFullYear(now.getFullYear() - 1); break;
      case '5Y': startDate.setFullYear(now.getFullYear() - 5); break;
      default: return data;
    }
    return data.filter((item: any) => new Date(item.date) >= startDate);
  };

  const chartData = filterDataByTimeRange(historicalData, timeRange);

  const formatCurrency = (value: number | undefined) => 
    value !== undefined ? `$${value.toFixed(2)}` : 'N/A';

  const formatPercent = (value: number | undefined) => 
    value !== undefined ? `${value.toFixed(2)}%` : 'N/A';

  const formatNumber = (value: number | undefined) => 
    value !== undefined ? value.toLocaleString() : 'N/A';

  

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-3xl font-bold">{stock.name} ({stock.symbol})</h2>
      <p className="text-xl">Sector: {stock.sector || 'N/A'}</p>

      {/* GRAPH */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Historical Price Chart</h3>
        <div className="flex space-x-2">
          {['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'ALL'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 rounded ${
                timeRange === range 
                  ? `bg-chart-time-selector text-white` 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
              style={{
                backgroundColor: timeRange === range ? chartTimeSelectorColor : undefined,
                color: timeRange === range ? 'white' : undefined,
              }}
            >
              {range}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={400}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading chart data...</p>
            </div>
          ) : (
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: chartTextColor }}
                tickFormatter={(tick) => {
                  const date = new Date(tick);
                  if (chartData.length > 365) {
                    return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
                  }
                  return date.toLocaleDateString();
                }}
                interval="preserveStartEnd"
                tickCount={4}
              />
              <YAxis domain={['auto', 'auto']} tick={{ fill: chartTextColor }} />
              <Tooltip 
                formatter={(value: any) => `$${Number(value).toFixed(2)}`} 
                contentStyle={{ 
                  backgroundColor: 'rgb(var(--popover))', 
                  color: 'rgb(var(--popover-foreground))' 
                }} 
              />
              <Line type="monotone" dataKey="close" stroke={chartLineColor} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Price Information</h3>
          <p>Current Price: {formatCurrency(stock.currentPrice)}</p>
          <p className={stock.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}>
            Day Change: {formatCurrency(stock.dayChange)} ({formatPercent(stock.dayChangePercent)})
          </p>
          <p>Previous Close: {formatCurrency(stock.previousClose)}</p>
          <p>Open: {formatCurrency(stock.open)}</p>
          <p>Day Low: {formatCurrency(stock.dayLow)}</p>
          <p>Day High: {formatCurrency(stock.dayHigh)}</p>
          <p>52 Week Low: {formatCurrency(stock.fiftyTwoWeekLow)}</p>
          <p>52 Week High: {formatCurrency(stock.fiftyTwoWeekHigh)}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Volume and Averages</h3>
          <p>Volume: {formatNumber(stock.volume)}</p>
          <p>Average Volume (10 days): {formatNumber(stock.averageVolume10days)}</p>
          <p>50 Day Average: {formatCurrency(stock.fiftyDayAverage)}</p>
          <p>200 Day Average: {formatCurrency(stock.twoHundredDayAverage)}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Company Metrics</h3>
          <p>Market Cap: {formatCurrency(stock.marketCap)}</p>
          <p>Enterprise Value: {formatCurrency(stock.enterpriseValue)}</p>
          <p>Beta: {stock.beta?.toFixed(2) || 'N/A'}</p>
          <p>P/E Ratio: {stock.peRatio?.toFixed(2) || 'N/A'}</p>
          <p>Forward P/E: {stock.forwardPE?.toFixed(2) || 'N/A'}</p>
          <p>Price to Sales (TTM): {stock.priceToSalesTrailing12Months?.toFixed(2) || 'N/A'}</p>
          <p>Price to Book: {stock.priceToBook?.toFixed(2) || 'N/A'}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Dividends</h3>
          <p>Dividend Rate: {formatCurrency(stock.dividendRate)}</p>
          <p>Dividend Yield: {formatPercent(stock.dividendYield)}</p>
          <p>Payout Ratio: {formatPercent(stock.payoutRatio)}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Financial Metrics</h3>
          <p>Total Cash: {formatCurrency(stock.totalCash)}</p>
          <p>Total Debt: {formatCurrency(stock.totalDebt)}</p>
          <p>Revenue: {formatCurrency(stock.revenue)}</p>
          <p>Revenue Per Share: {formatCurrency(stock.revenuePerShare)}</p>
          <p>Profit Margins: {formatPercent(stock.profitMargins)}</p>
          <p>Operating Margins: {formatPercent(stock.operatingMargins)}</p>
          <p>Gross Margins: {formatPercent(stock.grossMargins)}</p>
          <p>EBITDA Margins: {formatPercent(stock.ebitdaMargins)}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Returns and Cash Flow</h3>
          <p>Return on Assets: {formatPercent(stock.returnOnAssets)}</p>
          <p>Return on Equity: {formatPercent(stock.returnOnEquity)}</p>
          <p>Operating Cash Flow: {formatCurrency(stock.operatingCashflow)}</p>
          <p>Free Cash Flow: {formatCurrency(stock.freeCashflow)}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Shares Information</h3>
          <p>Shares Outstanding: {formatNumber(stock.sharesOutstanding)}</p>
          <p>Shares Short: {formatNumber(stock.sharesShort)}</p>
          <p>Short Ratio: {stock.shortRatio?.toFixed(2) || 'N/A'}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Analyst Recommendations</h3>
          <p>Recommendation Mean: {stock.recommendationMean?.toFixed(2) || 'N/A'}</p>
          <p>Number of Analyst Opinions: {formatNumber(stock.numberOfAnalystOpinions)}</p>
          <p>Target High Price: {formatCurrency(stock.targetHighPrice)}</p>
          <p>Target Low Price: {formatCurrency(stock.targetLowPrice)}</p>
          <p>Target Mean Price: {formatCurrency(stock.targetMeanPrice)}</p>
          <p>Target Median Price: {formatCurrency(stock.targetMedianPrice)}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Your Position</h3>
          <p>Quantity: {formatNumber(stock.quantity)}</p>
          <p>Average Cost Basis: {formatCurrency(stock.avgCostBasis)}</p>
          <p>Total Cost Basis: {formatCurrency(costBasis)}</p>
          <p>Current Value: {formatCurrency(currentValue)}</p>
          <p className={valueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
            Total Value Change: {formatCurrency(valueChange)} ({valueChangePercent}%)
          </p>
        </div>
      </div>
      
      <div className="mt-4">
        <p>Last Updated: {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleString() : 'N/A'}</p>
        <p>Currency: {stock.currency || 'N/A'}</p>
      </div>
    </div>
  );
};

export default IndividualStockView;