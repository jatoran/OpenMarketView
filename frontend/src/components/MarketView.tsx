import React, { useState, useEffect } from 'react';
import StockApiService, { MarketOverview, MarketHistory, MarketSector, EconomicIndicator, Bitcoin } from '../services/StockApiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ViewSettings {
  selectedIndex: string;
  timeRange: string;
  showSectors: boolean;
  showEconomicIndicators: boolean;
  chartType: 'line' | 'bar';
}

const MarketView: React.FC = () => {
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [marketHistory, setMarketHistory] = useState<MarketHistory[]>([]);
  const [marketSectors, setMarketSectors] = useState<{ [key: string]: MarketSector }>({});
  const [economicIndicators, setEconomicIndicators] = useState<{ [key: string]: EconomicIndicator }>({});
  const [bitcoin, setBitcoin] = useState<Bitcoin | null>(null);
  const { theme, customThemes } = useTheme();
  const currentTheme = customThemes[theme];
  const chartLineColor = currentTheme.colors.chartLine.hex;
  const chartTextColor = currentTheme.colors.chartText.hex;

  const [viewSettings, setViewSettings] = useState<ViewSettings>(() => {
    const savedSettings = localStorage.getItem('marketViewSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      selectedIndex: '^GSPC',
      timeRange: '1Y',
      showSectors: true,
      showEconomicIndicators: true,
      chartType: 'line'
    };
  });

  useEffect(() => {
    localStorage.setItem('marketViewSettings', JSON.stringify(viewSettings));
  }, [viewSettings]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const overviewData = await StockApiService.fetchMarketOverview();
        setMarketOverview(overviewData);

        const historyData = await StockApiService.fetchMarketHistory(viewSettings.selectedIndex, viewSettings.timeRange);
        setMarketHistory(historyData);

        const sectorsData = await StockApiService.fetchMarketSectors();
        setMarketSectors(sectorsData);

        const indicatorsData = await StockApiService.fetchEconomicIndicators();
        setEconomicIndicators(indicatorsData);

        const bitcoinData = await StockApiService.fetchBitcoinData();
        setBitcoin(bitcoinData);
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    fetchMarketData();
  }, [viewSettings.selectedIndex, viewSettings.timeRange]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
  };

  const handleSettingChange = (setting: keyof ViewSettings, value: any) => {
    setViewSettings(prev => ({ ...prev, [setting]: value }));
  };

  const renderMarketOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {marketOverview && Object.entries(marketOverview).map(([symbol, data]) => (
        <Card key={symbol}>
          <CardHeader>
            <CardTitle>{data.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(data.current)}</p>
            <p className={data.change >= 0 ? 'text-green-600' : 'text-red-600'}>
              {data.change >= 0 ? '+' : ''}{formatNumber(data.change)} ({formatNumber(data.changePercent)}%)
            </p>
          </CardContent>
        </Card>
      ))}
      {bitcoin && (
        <Card>
          <CardHeader>
            <CardTitle>{bitcoin.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(bitcoin.current)}</p>
            <p className={bitcoin.change >= 0 ? 'text-green-600' : 'text-red-600'}>
              {bitcoin.change >= 0 ? '+' : ''}{formatNumber(bitcoin.change)} ({formatNumber(bitcoin.changePercent)}%)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderMarketHistory = () => {
    const ChartComponent = viewSettings.chartType === 'line' ? LineChart : BarChart;

    return (
      <Card>
        <CardHeader>
          <CardTitle>{marketOverview?.[viewSettings.selectedIndex]?.name || 'Market'} - {viewSettings.timeRange} Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ChartComponent data={marketHistory}>
              <XAxis dataKey="date" stroke={chartTextColor} />
              <YAxis stroke={chartTextColor} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(var(--popover))',
                  color: 'rgb(var(--popover-foreground))'
                }}
              />
              {viewSettings.chartType === 'line' ? (
                <Line type="monotone" dataKey="close" stroke={chartLineColor} />
              ) : (
                <Bar dataKey="close" fill={chartLineColor} />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderSectorPerformance = () => (
    <Card>
      <CardHeader>
        <CardTitle>Sector Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            layout="vertical"
            data={Object.entries(marketSectors).map(([symbol, data]) => ({ name: data.name, change: data.change }))}
          >
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{
                backgroundColor: 'rgb(var(--popover))',
                color: 'rgb(var(--popover-foreground))'
              }}
            />
            <Bar dataKey="change" fill={chartLineColor}>
              <LabelList dataKey="change" position="right" formatter={(value: number) => `${value.toFixed(2)}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderEconomicIndicators = () => (
    <Card>
      <CardHeader>
        <CardTitle>Economic Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(economicIndicators).map(([symbol, data]) => (
            <div key={symbol} className="flex flex-col">
              <span className="font-bold">{data.name}</span>
              <span>{formatNumber(data.current)}</span>
              <span className={data.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                {data.change >= 0 ? '+' : ''}{formatNumber(data.change)} ({formatNumber(data.changePercent)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Market Overview</h1>

      {renderMarketOverview()}

      <div className="flex space-x-4 items-center">
        <Select value={viewSettings.selectedIndex} onValueChange={(value) => handleSettingChange('selectedIndex', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Index" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="^GSPC">S&P 500</SelectItem>
            <SelectItem value="^DJI">Dow Jones</SelectItem>
            <SelectItem value="^IXIC">NASDAQ</SelectItem>
            <SelectItem value="^RUT">Russell 2000</SelectItem>
          </SelectContent>
        </Select>
        <Select value={viewSettings.timeRange} onValueChange={(value) => handleSettingChange('timeRange', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1M">1 Month</SelectItem>
            <SelectItem value="3M">3 Months</SelectItem>
            <SelectItem value="6M">6 Months</SelectItem>
            <SelectItem value="1Y">1 Year</SelectItem>
            <SelectItem value="5Y">5 Years</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Switch
            id="chart-type"
            checked={viewSettings.chartType === 'line'}
            onCheckedChange={(checked) => handleSettingChange('chartType', checked ? 'line' : 'bar')}
          />
          <Label htmlFor="chart-type">Line Chart</Label>
        </div>
      </div>

      {renderMarketHistory()}

      {viewSettings.showSectors && renderSectorPerformance()}

      {viewSettings.showEconomicIndicators && renderEconomicIndicators()}

      <Card>
        <CardHeader>
          <CardTitle>View Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-sectors"
                checked={viewSettings.showSectors}
                onCheckedChange={(checked) => handleSettingChange('showSectors', checked)}
              />
              <Label htmlFor="show-sectors">Show Sectors</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-economic-indicators"
                checked={viewSettings.showEconomicIndicators}
                onCheckedChange={(checked) => handleSettingChange('showEconomicIndicators', checked)}
              />
              <Label htmlFor="show-economic-indicators">Show Economic Indicators</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketView;