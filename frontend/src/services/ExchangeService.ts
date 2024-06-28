import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

class ExchangeService {
  private symbols: string[] = [];

  async fetchSymbols(): Promise<string[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/symbols`);
      this.symbols = response.data;
      return this.symbols;
    } catch (error) {
      console.error('Error fetching symbols:', error);
      return [];
    }
  }

  getSymbols(): string[] {
    return this.symbols;
  }
}

const exchangeService = new ExchangeService();
export default exchangeService;