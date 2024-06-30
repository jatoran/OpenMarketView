from flask import Flask, jsonify, request # type: ignore
from flask_cors import CORS # type: ignore
import yfinance as yf # type: ignore
from datetime import datetime, timedelta
from newsapi import NewsApiClient # type: ignore
from dateutil.relativedelta import relativedelta

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# newsapi = NewsApiClient(api_key='your_aki_key_here')


# @app.route('/news')
# def get_news():
#     symbols = request.args.get('symbols', '').split(',')
#     all_news = []
#     for symbol in symbols:
#         if symbol:
#             try:
#                 stock = yf.Ticker(symbol)
#                 company_name = stock.info.get('longName', symbol)
#                 news = newsapi.get_everything(q=company_name,
#                                               language='en',
#                                               sort_by='publishedAt',
#                                               page_size=3)
#                 for article in news['articles']:
#                     article['symbol'] = symbol
#                 all_news.extend(news['articles'])
#             except Exception as e:
#                 print(f"Error fetching news for {symbol}: {str(e)}")
#     return jsonify(all_news)

@app.route('/stock/<symbol>')
def get_stock_data(symbol):
    stock = yf.Ticker(symbol)
    info = stock.info

    quote_type = info.get('quoteType', '').upper()

    if quote_type in ['ETF', 'MUTUALFUND']:
        history = stock.history(period="1mo")
        current_price = history['Close'].iloc[-1] if not history.empty else info.get('navPrice', 0)
    else:
        current_price = info.get('currentPrice', 0)

    data = {
        'symbol': symbol,
        'currentPrice': current_price,
        'dayChange': info.get('regularMarketChange', 0),
        'previousClose': info.get('previousClose', 0),
        'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh', 0),
        'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow', 0),
        'marketCap': info.get('marketCap', 0),
        'beta': info.get('beta', 0),
        'name': info.get('longName', ''),
        'sector': info.get('sector', ''),
        'lastUpdated': datetime.utcnow().isoformat(),
        'quoteType': quote_type
    }

    return jsonify(data)

@app.route('/historical/<symbol>')
def get_historical_data(symbol):
    stock = yf.Ticker(symbol)
    daily_data = stock.history(period="max")
    granular_data = stock.history(period="3d", interval="5m")

    formatted_daily = [
        {
            "date": index.strftime('%Y-%m-%d'),
            "open": row['Open'],
            "high": row['High'],
            "low": row['Low'],
            "close": row['Close'],
            "volume": row['Volume']
        }
        for index, row in daily_data.iterrows()
    ]

    formatted_granular = [
        {
            "date": index.strftime('%Y-%m-%d %H:%M:%S'),
            "open": row['Open'],
            "high": row['High'],
            "low": row['Low'],
            "close": row['Close'],
            "volume": row['Volume']
        }
        for index, row in granular_data.iterrows()
    ]

    return jsonify({
        "symbol": symbol,
        "daily_data": formatted_daily,
        "granular_data": formatted_granular
    })


@app.route('/granular/<symbol>')
def get_granular_data(symbol):
    stock = yf.Ticker(symbol)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=1)

    history = stock.history(interval="5m", start=start_date, end=end_date)
    granular_data = history.reset_index().to_dict(orient='records')

    formatted_data = [
        {
            'DateTime': record['Datetime'].isoformat(),
            'Open': record['Open'],
            'High': record['High'],
            'Low': record['Low'],
            'Close': record['Close'],
            'Volume': record['Volume']
        }
        for record in granular_data
    ]

    return jsonify(formatted_data)

@app.route('/market_overview')
def get_market_overview():
    indices = ['^GSPC', '^DJI', '^IXIC', '^RUT']  # S&P 500, Dow Jones, NASDAQ, Russell 2000
    data = {}
    
    for index in indices:
        ticker = yf.Ticker(index)
        info = ticker.info
        history = ticker.history(period="1d")
        
        data[index] = {
            'name': info.get('shortName', ''),
            'current': history['Close'].iloc[-1],
            'change': history['Close'].iloc[-1] - history['Open'].iloc[0],
            'changePercent': ((history['Close'].iloc[-1] - history['Open'].iloc[0]) / history['Open'].iloc[0]) * 100
        }
    
    return jsonify(data)


@app.route('/market_history')
def get_market_history():
    index = request.args.get('index', '^GSPC')  # Default to S&P 500
    period = request.args.get('period', '1y')
    
    end_date = datetime.now()
    if period == '1M':
        start_date = end_date - relativedelta(months=1)
    elif period == '3M':
        start_date = end_date - relativedelta(months=3)
    elif period == '6M':
        start_date = end_date - relativedelta(months=6)
    elif period == '1Y':
        start_date = end_date - relativedelta(years=1)
    elif period == '5Y':
        start_date = end_date - relativedelta(years=5)
    else:
        start_date = end_date - relativedelta(years=1)  # Default to 1 year

    ticker = yf.Ticker(index)
    history = ticker.history(start=start_date, end=end_date)
    
    data = [{
        'date': index.strftime('%Y-%m-%d'),
        'close': row['Close']
    } for index, row in history.iterrows()]
    
    return jsonify(data)


@app.route('/market_sectors')
def get_market_sectors():
    sectors = [
        'XLK', 'XLF', 'XLV', 'XLC', 'XLY', 'XLP', 'XLI', 'XLE', 'XLU', 'XLB', 'XLRE'
    ]
    data = {}
    
    for sector in sectors:
        ticker = yf.Ticker(sector)
        info = ticker.info
        history = ticker.history(period="1d")
        
        data[sector] = {
            'name': info.get('shortName', ''),
            'change': ((history['Close'].iloc[-1] - history['Open'].iloc[0]) / history['Open'].iloc[0]) * 100
        }
    
    return jsonify(data)

@app.route('/economic_indicators')
def get_economic_indicators():
    indicators = {
        '^TNX': '10-Year Treasury Yield',
        '^VIX': 'CBOE Volatility Index',
        'GC=F': 'Gold Futures',
        'CL=F': 'Crude Oil Futures',
        'EURUSD=X': 'EUR/USD',
        'DX-Y.NYB': 'U.S. Dollar Index',
        'ZB=F': '30-Year Treasury Bond Futures',
        'ES=F': 'S&P 500 Futures',
        'NQ=F': 'NASDAQ 100 Futures',
        'RTY=F': 'Russell 2000 Futures',
        'ZN=F': '10-Year Treasury Note Futures',
        'ZF=F': '5-Year Treasury Note Futures',
        'ZT=F': '2-Year Treasury Note Futures',
        'GBP=X': 'GBP/USD',
        'JPY=X': 'USD/JPY',
        'GBPEUR=X': 'GBP/EUR',
        'BTC-USD': 'Bitcoin/USD',
        'ETH-USD': 'Ethereum/USD',
    }
    data = {}
    
    for symbol, name in indicators.items():
        ticker = yf.Ticker(symbol)
        history = ticker.history(period="1d")
        
        if not history.empty:
            data[symbol] = {
                'name': name,
                'current': history['Close'].iloc[-1],
                'change': history['Close'].iloc[-1] - history['Open'].iloc[0],
                'changePercent': ((history['Close'].iloc[-1] - history['Open'].iloc[0]) / history['Open'].iloc[0]) * 100
            }
    
    return jsonify(data)

@app.route('/bitcoin')
def get_bitcoin_data():
    bitcoin = yf.Ticker('BTC-USD')
    history = bitcoin.history(period="1d")
    
    if not history.empty:
        data = {
            'name': 'Bitcoin',
            'current': history['Close'].iloc[-1],
            'change': history['Close'].iloc[-1] - history['Open'].iloc[0],
            'changePercent': ((history['Close'].iloc[-1] - history['Open'].iloc[0]) / history['Open'].iloc[0]) * 100
        }
    else:
        data = {
            'name': 'Bitcoin',
            'current': 0,
            'change': 0,
            'changePercent': 0
        }
    
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
