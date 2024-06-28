import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
  symbol: string;
}

interface NewsViewProps {
  initialSymbols: string[];
}

const NewsView: React.FC<NewsViewProps> = ({ initialSymbols }) => {
  const [symbols, setSymbols] = useState<string[]>(initialSymbols);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newSymbol, setNewSymbol] = useState('');

  useEffect(() => {
    fetchNews();
  }, [symbols]);

  const fetchNews = async () => {
    try {
      const response = await axios.get('http://localhost:5000/news', {
        params: { symbols: symbols.join(',') }
      });
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const addSymbol = () => {
    if (newSymbol && !symbols.includes(newSymbol)) {
      setSymbols([...symbols, newSymbol.toUpperCase()]);
      setNewSymbol('');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Latest News</h2>
      <div className="flex space-x-2">
        <Input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
          placeholder="Add stock symbol"
        />
        <Button onClick={addSymbol}>Add</Button>
      </div>
      <div className="space-y-4">
        {symbols.map((symbol) => (
          <div key={symbol} className="border-b pb-4">
            <h3 className="text-xl font-semibold">{symbol}</h3>
            {news
              .filter((item) => item.symbol === symbol)
              .map((item, index) => (
                <div key={index} className="mt-2">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(item.publishedAt).toLocaleString()} - {item.source.name}
                  </p>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Read more
                  </a>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsView;