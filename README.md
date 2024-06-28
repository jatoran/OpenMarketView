

# OpenMarketView

## Intro
OpenMarketView is a **Stock Market List Viewer**.  It is free, self-hosted, open source, web-app, etc. etc.
It is designed to help users manage and analyze their stock portfolios and watchlists in separate tabs. It provides 5-minute and lifetime stock data, multiple viewing options, theme and UI customization, and various analysis metrics.


## What and Why
**Core Psychological & Emotional Hooks**
- Privacy - Your data does not leave your device.
- Create a 24/7 display of your Stock Portfolio or Watchlist
- Simulate Portfolios and their growth over time
- Self hosted
- Near real-time (5 minutes) and lifetime stock data
- No API account setup necessary, utilizes public API's
- Open Source and Free

**Purpose**
I made this as I was tired of having to log into my online accounts to view portfolios and track them, which led to finding stock viewers that I could have as an application on my own computer for "always on" functionality to put in the corner on one of my monitors.  I then found it was hard to find the specific features I wanted without having to pay to remove ads or enable functionality.  And I still disliked sharing my data to a platform I have no control of.  I then looked for a self hosted tracker, (great resource for this is the [awesomelists self-hosted](https://github.com/awesome-selfhosted/awesome-selfhosted) category), but either through overwhelm or lack of options I struck out finding a good repo or open source solution.  So:

**tldr;** I have built a self hosted and free web-application to have a stock viewer of your various portfolios or watchlists.

**Developers**
I have also tried to design and document in a manner that promotes extensibility, and I hope encourages other developers to extend to fit their own needs and add onto the project to extend its core with many other features that could enhance this even more. Refer to [Future Enhancements] for some ideas of features I just haven't had the free time to implement yet.



## Table of Contents

1. [[#Intro]]
2. [[#What and Why]]
   - [[#Core Psychological & Emotional Hooks]]
   - [[#Purpose]]
   - [[#Developers]]
3. [[#Core Features Overview]]
   - [[#Automatic Data Fetching, Refreshing, and Storage]]
   - [[#Stock Data Handling]]
   - [[#Customizeable Views for Multiple Portfolios or Watchlists]]
   - [[#State Management and Optimization]]
   - [[#Multiple Exchanges]]
   - [[#Customizable View Management]]
   - [[#Custom Themes & UI Customization]]
   - [[#Tabbed Interface]]
   - [[#Historical Graphing]]
   - [[#Enhanced Caching Mechanism]]
   - [[#Other Features]]
4. [[#Key Technologies and Tools]]
   - [[#Frontend]]
   - [[#Backend]]
5. [[#Documentation, Developers, Development, and Future Steps]]
   - [[#Viewing Historical Data]]
   - [[#Customizing Themes]]
   - [[#CSV Column Matching]]
6. [[#Technical Specifications]]
   - [[#Data]]
     - [[#Data Safety and Privacy]]
     - [[#Data Source]]
     - [[#Database (IndexedDB)]]
     - [[#Database Structure (IndexedDB)]]
7. [[#File Structure]]
8. [[#Subsystem Geography and Data Flow]]
   - [[#Core Application Subsystem]]
   - [[#View Subsystems]]
   - [[#UI Components Subsystem]]
   - [[#State Management Subsystem]]
   - [[#Data Management Subsystem]]
   - [[#Utilities Subsystem]]
   - [[#Styling Subsystem]]
   - [[#Page Subsystem]]
   - [[#Backend Subsystem]]


## Core Features Overview


#### Automatic Data Fetching, Refreshing, and Storage
- **API Interaction**: Fetches current and historical stock data from Yahoo Finance.
- **Database**: Uses IndexedDB and LocalStorage Browser Databases for local storage and offline capabilities.
- **Caching Mechanism**: Minimizes redundant API calls and optimizes data storage.
  - **Enhanced caching mechanism** in IndexedDBService.
  - **Optimized data fetching** with checks for existing data.
  - **Differential updates** to reduce unnecessary database writes.

#### Stock Data Handling
- Supports various stock types: equities, ETFs, and mutual funds.
- Dynamically determines and displays current prices.
- Implements data freshness checks.
  - **Market Status Handling**: Implements logic to determine market status based on data freshness and time, updating UI to display current market status (Open/Closed).

- **Stock Management**:
  - Add stocks with real-time validation and data pre-filling.
  - Edit existing stock entries (quantity and cost basis).
  - Remove stocks from the portfolio.
  - **Bulk stock addition** functionality.
  - **Bulk CSV Portfolio Importing**: Supports CSV import for portfolio management, including column matching (supports Fidelity Portfolio Export).

#### Customizeable Views for Multiple Portfolios or Watchlists
- **Compact View**: Concise table of stocks with essential information.
- **Detailed View**: Expanded breakdown of each stock with additional metrics.
- **News View**: Displays recent news articles related to selected stocks.
  - **News Integration**: Fetches stock-related news articles using NewsAPI.
- **Simulated Trading View**: Allows users to simulate stock performance.
  - **Simulated Trading View**: Currently disabled.

#### State Management and Optimization
- Dynamic data loading and UI updates.
- Optimistic UI updates for smoother user experience.
- Refresh optimization to minimize redundant data fetching.
  - **Refresh button**: Enhanced with feedback and cooldown period.
- **Error Handling and Performance**:
  - **Retry mechanism** with exponential backoff for API calls.
  - **Improved type safety and error handling** in database operations.
  - **Optimized database queries** and data retrieval methods.
  - **Historical data caching** to reduce API calls and improve performance.
  - **UseMemo and useCallback hooks**: Optimize rendering performance in components like `IndividualStockView`.

#### Multiple Exchanges
**U.S. Exchanges:**
- **NASDAQ:** AAPL (Apple), MSFT (Microsoft), AMZN (Amazon)
- **NYSE:** JPM (JPMorgan Chase), XOM (Exxon Mobil), KO (Coca-Cola)
- **NYSE American:** IPSC (iPower), MVIS (MicroVision), NAKD (Naked Brand Group)
**Other North American Markets:**
- **TSX:** RY (Royal Bank of Canada), TD (Toronto-Dominion Bank), SHOP (Shopify)
**European Exchanges:**
- **LSE:** HSBA (HSBC Holdings), RIO (Rio Tinto), VOD (Vodafone Group)
- **FRA:** DBK (Deutsche Bank), VOW3 (Volkswagen), BMW (BMW Group)
**Asian Markets:**
- **TYO:** 7203 (Toyota Motor Corp.), 9984 (SoftBank Group Corp.), 6501 (Hitachi Ltd.)
- **HKG:** 0700 (Tencent Holdings), 9988 (Alibaba Group), 0005 (HSBC Holdings)
**ETFs and Mutual Funds:**
- **SPY** (SPDR S&P 500 ETF), **IVV** (iShares Core S&P 500 ETF), **VTI** (Vanguard Total Stock Market ETF)

***Doesnt work with Cryptocurrencies.  ex. Bitcoin (BTC-USD) pulls up 0 value for the time being**

### Customizable View Management
- Switch between different views:
  - Compact Table.
  - Detailed Card View with single day graphs.
  - Single Stock View with Time Ranges.
- Column customization, sorting, and reordering.
- Manage different views and their tab titles. Close them without deleting them, or delete permanently in View Management.
- **Tabbed Interface**: Multiple views and tabs for different stock displays.

### Custom Themes & UI Customization
- The theme system is designed to be easily extendable with new color options or theme properties.
- Fully custom color theme creation.
- Default light and dark themes.
- Customizable refresh intervals.
- Font size adjustments.
- Stock spacing adjustments.

### Tabbed Interface
- Multiple views and tabs for different stock displays

### Custom Themes & UI Customization
- The theme system is designed to be easily extendable with new color options or theme properties.
- Fully custom color theme creation
- Default Light and dark themes
- Customizable refresh intervals
- Font size adjustments
- Stock spacing adjustments


### Historical Graphing
- Timeline graphs of price
- **LineChart Component**: Renders historical price charts using Recharts.

### Enhanced Caching Mechanism
The application implements a sophisticated caching system using IndexedDB, providing several benefits:

- **Technology**: IndexedDB is used as the local database, allowing for efficient storage and retrieval of large amounts of structured data, including JavaScript objects and files.

- **Implementation**: The `IndexedDBService.ts` manages all database operations, including storing and retrieving stock data, historical data, and user settings.

- **Benefits**:
  1. **Offline Capability**: Users can access previously fetched data even without an internet connection.
  2. **Reduced API Calls**: By storing and reusing data locally, the application significantly reduces the number of API calls, improving performance and reducing server load.
  3. **Faster Load Times**: Cached data can be retrieved much faster than making network requests, leading to improved application responsiveness.
  4. **Data Persistence**: User settings and stock data persist across sessions, providing a seamless user experience.
  5. **Bandwidth Savings**: By minimizing data transfer, the application conserves bandwidth, which is particularly beneficial for users on limited data plans.

- **Optimization Strategies**:
  1. **Differential Updates**: Only changed data is updated in the database, reducing write operations and improving efficiency.
  2. **Time-based Caching**: Data freshness is managed by storing timestamps, allowing the application to determine when to fetch new data versus using cached data.
  3. **Bulk Operations**: The system supports bulk addition and updating of stocks, optimizing database interactions for multiple entries.

### Other Features
- **Market Status**: Real-time market open/close indicator
- **Bulk CSV Portfolio Importing**: Can handle grabbing symbols, avg cost basis, and quantity from csv columns and bulk adding stocks from them.  Refer to the [CSV Column Matching] Section for additional info.  Currently by default supports Fidelity Portfolio Export





## Key Technologies and Tools

### Frontend
- **Purpose**: Provides the user interface for displaying stock information and manages state
- **Technology**: React, Next.js, TypeScript, TailwindCSS, IndexedDB
- **State Management**: React hooks and Context API
- **Data Optimization**: Efficient data fetching and storage strategies
- **Theme Management**: React Context and CSS variables for dynamic theme switching
- **IndividualStockView Component**: Manages the display of historical data for a single stock.
- **LineChart Component (from Recharts)**: Renders the historical price chart.
- **ThemeContext**: Provides theme-related state and functions to the application.
- **Settings Component**: Allows users to view, select, create, and edit themes.

**Styling and Theming**
- Utilizes TailwindCSS for responsive design
- Implements custom theme system with CSS variables
- Uses shadcn/ui components for consistent UI elements


### Backend
- **Purpose**: Serves as the API provider, fetching stock data from Yahoo Finance using the [yfinance](https://github.com/ranaroussi/yfinance) library
- **Technology**: Python with Flask, [yfinance](https://github.com/ranaroussi/yfinance), CORS


## Documentation, Developers, Development, and Future Steps

### Viewing Historical Data
- Navigate to the individual stock view for a specific stock.
- Use the time range buttons (1D, 5D, 1M, 3M, 6M, YTD, 1Y, 5Y, ALL) to adjust the displayed data range.
- Hover over the chart to see specific data points.

### Customizing Themes
- Access the Settings menu.
- Select a theme from the dropdown or create a new theme.
- Use the color pickers to adjust individual color values.
- Save changes to apply the new theme.


### CSV Column Matching
- For Bulk Uploading, we search for column header strings by hardcoding the strings into:
frontend/src/components/AddStockModal.tsx
``` const columnMap = {
   costBasis: findColumnName(fields, ["Average Cost Basis", "Cost Basis", "Avg Cost"]),
   quantity: findColumnName(fields, ["Quantity", "Count", "SharesCount", "Shares"]),
   symbol: findColumnName(fields, ["Symbol", "Abbreviation", "Stock Symbol", "Ticker"]),
 };```
```

### Historical Graphing
**Data Source**: 
   - Historical stock data is fetched from the backend API endpoint `/historical/<symbol>`.
   - The API returns two sets of data: daily data for long-term history and granular (5-minute interval) data for recent history.

**Data Processing**:
   - Raw data is processed in the `IndividualStockView` component.
   - Data is filtered based on the selected time range.

**Rendering**:
   - The processed data is passed to a `LineChart` component from the Recharts library for visualization.


Refer to the GraphDocumentation.md file in this repository for more information on the recharts Graphing implementation.

### Theme System

**Theme Context**:
   - A `ThemeContext` manages the global theme state.
   - It provides theme-related functions to the entire application.

**Theme Application**:
   - CSS variables are updated in the document root when a theme is applied.
   - Components use these CSS variables for styling.

**Theme Customization**:
   - Users can edit themes in the Settings component.
   - Modified themes are saved to local storage.

Refer to the ThemeDocumentation.md file in this repository for more information on themes.


## Technical Specifications


### Data
Local Data Management: `IndexedDBService.ts` manages all interactions with the IndexedDB database, providing methods for storing and retrieving stock data, user settings, and API statistics. `SettingsService.ts` interacts with local storage to persist user preferences.
**Associated Modules**
   - `IndexedDBService.ts`: Manages local database operations using IndexedDB
   - `SettingsService.ts`: Handles user preferences and settings storage

- **Differential Updates**: The system implements differential updates to minimize database writes. Only fields that have changed are updated, reducing the amount of data written to the database.
- **Type-safe Operations**: Type-safe operations are used to ensure that data is handled correctly, reducing the likelihood of runtime errors.
- **Efficient Data Retrieval**: The use of indexes allows for efficient data retrieval, supporting queries by symbol and date ranges. This enables fast access to historical and granular data without scanning the entire dataset.

#### Data Safety and Privacy
- Local Data Storage: All user data, including stock information and preferences, is stored locally on the user's device using IndexedDB and localStorage.
- Self-Hosting Option: Users self-host the application, giving them full control over their data and reducing exposure to external services.
- Transparent Code: As an open-source project, the code is available for review, allowing users to verify the application's behavior and potentially contribute to its security.
- Minimal Data Sharing: The application only communicates with the [yfinance](https://github.com/ranaroussi/yfinance
- ) API asking for data on stock tickers, minimizing data exposure to third parties.

#### Data Source
- The application uses the [yfinance](https://github.com/ranaroussi/yfinance) library, an open-source tool that provides a Python interface for retrieving financial data from Yahoo Finance.
- While [yfinance](https://github.com/ranaroussi/yfinance) accesses Yahoo Finance data, it's important to note that it's a third-party library and not officially affiliated with or supported by Yahoo.
- Users should be aware of and comply with Yahoo's terms of service when using data retrieved through this method.
 - [yfinance](https://github.com/ranaroussi/yfinance) is an unofficial wrapper for Yahoo Finance data. It's not officially supported by Yahoo, which means there's always a risk that the service could change or be discontinued without notice
##### Limits, Rate Limits
Yahoo Finance does implement rate limiting, though **the exact limits are not publicly disclosed**. 
The library's author suggests that usually up to 1000-2000 requests at a time haven't been problematic in their experienc
If you make too many requests in a short period, you may be temporarily blocked or have your IP address blacklisted
That said, I take measures to cache data and prevent unnecessary data fetching.
[yFinance](https://github.com/ranaroussi/yfinance) has no API sign up or key, it is tracked via IP address.

#### Database (IndexedDB)

##### Historical Data
**Daily Data**:
   - Format: `{ date: string, open: number, high: number, low: number, close: number, volume: number }`
   - Time Range: Maximum available historical data

**Granular Data**:
   - Format: `{ date: string, open: number, high: number, low: number, close: number, volume: number }`
   - Time Range: Last 3 days
   - Interval: 5 minutes

##### Theme Data
- Format: `{ name: string, colors: { [key: string]: { rgb: string, hex: string } } }`
- Stored in local storage under the key 'userSettings'

#### Database Structure (IndexedDB)
The database structure is designed to store stock data efficiently and provide quick access to various forms of stock-related information. Below is an elaborated structure for each table in the IndexedDB database:

1. **symbols**:
   - **Key**: `symbol` (string)
   - **Indexes**: `by-lastUpdated`
   - **Description**: This store holds basic information and metadata for each stock symbol. It includes the most recent data retrieved for the stock.
   - **Fields**:
     - `symbol`: The stock symbol (e.g., "AAPL")
     - `Date`: The date of the last data update
     - `currentPrice`: The current stock price
     - `dayChange`: The change in price since the previous day
     - `dayChangePercent`: The percentage change in price since the previous day
     - `previousClose`: The previous closing price
     - `fiftyTwoWeekHigh`: The highest price in the past 52 weeks
     - `fiftyTwoWeekLow`: The lowest price in the past 52 weeks
     - `marketCap`: The market capitalization of the company
     - `beta`: The stock's beta value
     - `name`: The company's name
     - `sector`: The sector in which the company operates
     - `lastUpdated`: Timestamp of the last data update
     - Additional fields for detailed stock information (e.g., `open`, `dayLow`, `dayHigh`, `dividendRate`, etc.)

2. **dailyData**:
   - **Key**: `[symbol, date]` (composite key)
   - **Indexes**: `by-symbol`, `by-date`
   - **Description**: This store holds historical daily stock data. Each entry represents the stock data for a specific day.
   - **Fields**:
     - `symbol`: The stock symbol
     - `date`: The date of the data entry
     - `open`: The opening price
     - `high`: The highest price of the day
     - `low`: The lowest price of the day
     - `close`: The closing price
     - `volume`: The volume of stocks traded

3. **fiveMinuteData**:
   - **Key**: `[symbol, DateTime]` (composite key)
   - **Indexes**: `by-symbol`, `by-DateTime`
   - **Description**: This store holds detailed, time-specific stock data with entries typically representing five-minute intervals.
   - **Fields**:
     - `symbol`: The stock symbol
     - `DateTime`: The date and time of the data entry
     - `open`: The opening price at the specific time interval
     - `high`: The highest price within the time interval
     - `low`: The lowest price within the time interval
     - `close`: The closing price at the end of the time interval
     - `volume`: The volume of stocks traded during the time interval

4. **apiHistory**:
   - **Key**: `date` (string)
   - **Indexes**: `by-date`
   - **Description**: This store tracks the number of API calls made on a daily basis along with performance metrics.
   - **Fields**:
     - `date`: The date of the API call record
     - `totalCalls`: Total number of API calls made
     - `totalDuration`: Total duration of all API calls
     - `avgDuration`: Average duration of the API calls
     - `successCalls`: Number of successful API calls
     - `failureCalls`: Number of failed API calls

5. **apiCallDetails**:
   - **Key**: `id` (string)
   - **Indexes**: `by-date`
   - **Description**: This store logs detailed information for each individual API call, useful for debugging and performance monitoring.
   - **Fields**:
     - `id`: Unique identifier for the API call
     - `date`: The date of the API call
     - `time`: The time of the API call
     - `type`: The type of API call (e.g., `fetchSingleStockData`)
     - `duration`: Duration of the API call in milliseconds
     - `success`: Whether the API call was successful
     - `requestData`: The request data sent in the API call
     - `responseData`: The response data received from the API call
     - `errorMessage`: Any error message received if the API call failed



## File Structure
### Key Directories
**Frontend**
  - `/components`: Contains reusable React components
  - `/lib`: Contains utility functions or helpers
  - `/pages`: Contains Next.js pages that map to routes
  - `/services`: Contains service files for API interactions and database management
  - `/contexts`: Contains React context files for global state management
  - `/styles`: Contains global and component-specific styles

**Backend**
- **Main File**: `app.py` - Defines the routes and logic for fetching stock data and historical information


### Structure Map
```
Stocks - React
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── ui
│   │   │   │   ├── input.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── scrollArea.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── slider.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   └── checkbox.tsx
│   │   │   ├── AddStockModal.tsx
│   │   │   ├── SelectViewTypeModal.tsx
│   │   │   ├── SimulatedTradingView.tsx
│   │   │   ├── IndividualStockView.tsx
│   │   │   ├── DetailedView.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── StockTracker.tsx
│   │   │   ├── NewsView.tsx
│   │   │   ├── EditStockModal.tsx
│   │   │   ├── CompactView.tsx
│   │   │   └── TabView.tsx
│   │   ├── contexts
│   │   │   ├── ThemeContext.tsx
│   │   │   └── APIStatisticsContext.tsx
│   │   ├── services
│   │   │   ├── ExchangeService.ts
│   │   │   ├── SettingsService.ts
│   │   │   ├── IndexedDBService.ts
│   │   │   └── StockApiService.ts
│   │   ├── styles
│   │   │   └── globals.css
│   │   ├── pages
│   │   │   ├── index.tsx
│   │   │   ├── _app.tsx
│   │   │   └── _document.tsx
│   │   ├── lib
│   │   │   └── utils.ts
│   │   └── types.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
└── backend
    └── app.py
```



## Subsystem Geography and Data Flow

#### Core Application Subsystem
The Core Application Subsystem, centered around `StockTracker.tsx`, manages the overall state and structure of the application. It utilizes React hooks like `useState`, `useCallback`, and `useEffect` to handle state management. This subsystem interacts with the Data Management Subsystem to fetch and update stock data, and with the View Subsystems to render the appropriate content. It also manages the application's layout, including the tabbed interface, and coordinates user interactions like adding new stocks or switching between views.
**Associated Modules**
1. `StockTracker.tsx`: Main component for overall state management and application structure
2. `TabView.tsx`: Manages tabbed interface and content rendering
3. `types.ts`: Defines TypeScript interfaces and types used throughout the application

#### View Subsystems
1. Stock Display Views: This subsystem includes `CompactView.tsx`, `DetailedView.tsx`, and `IndividualStockView.tsx`. These components receive stock data from the Core Application Subsystem and render it in different formats. They use React hooks and props to manage local state and receive data. The views interact with the UI Components Subsystem for rendering UI elements and the Data Management Subsystem for any data updates (e.g., editing stock entries).

**Associated Modules**
1. Stock Display Views
   - `CompactView.tsx`: Displays condensed table view of stocks
   - `DetailedView.tsx`: Shows detailed stock information in card layout
   - `IndividualStockView.tsx`: Provides in-depth view of a single stock with historical data

2. Auxiliary Views
   - `NewsView.tsx`: Displays news articles for selected stocks (currently disabled)
   - `SimulatedTradingView.tsx`: Basic implementation of stock performance simulation (currently disabled)

2. Auxiliary Views: While currently disabled, `NewsView.tsx` and `SimulatedTradingView.tsx` are designed to provide additional functionality. When active, they would interact with the Data Management Subsystem to fetch news data or perform simulations, respectively.

#### UI Components Subsystem
This subsystem consists of reusable UI components built with React and styled using Tailwind CSS. These components receive props from their parent components in the View Subsystems or Core Application Subsystem. They handle user interactions and emit events or state changes back to their parents. The modals (AddStockModal, EditStockModal, SelectViewTypeModal) manage their own local state and interact with the Data Management Subsystem for operations like adding or editing stocks.
**Associated Modules**
- UI components in the `ui` folder: `input.tsx`, `switch.tsx`, `select.tsx`, `scrollArea.tsx`, `button.tsx`, `slider.tsx`, `card.tsx`, `popover.tsx`, `label.tsx`, `checkbox.tsx`
- `AddStockModal.tsx`: Modal for adding new stocks (including bulk addition)
- `EditStockModal.tsx`: Modal for editing existing stock entries
- `SelectViewTypeModal.tsx`: Modal for selecting view types when creating new tabs

#### State Management Subsystem
1. Context Providers: `ThemeContext.tsx` and `APIStatisticsContext.tsx` use React's Context API to provide global state management for theming and API usage tracking. They interact with the Data Management Subsystem to persist settings and retrieve statistics.
**Associated Modules**
   - `ThemeContext.tsx`: Manages application theming
   - `APIStatisticsContext.tsx`: Tracks API usage statistics

2. Settings Management: The `Settings.tsx` component interacts with both Context Providers and the Data Management Subsystem to update and persist user preferences.
**Associated Modules**
   - `Settings.tsx`: Component for managing user settings and preferences


#### Data Management Subsystem
1. API Services: `StockApiService.ts` and `ExchangeService.ts` handle communication with the backend server (`app.py`). They use axios for HTTP requests and implement caching and retry mechanisms. These services interact with the IndexedDB Service for local data storage and retrieval.
**Associated Modules**
API Services
   - `StockApiService.ts`: Handles communication with the backend for stock data
   - `ExchangeService.ts`: Manages stock exchange related operations

2. Local Data Management: `IndexedDBService.ts` manages all interactions with the IndexedDB database, providing methods for storing and retrieving stock data, user settings, and API statistics. `SettingsService.ts` interacts with local storage to persist user preferences.
**Associated Modules**
   - `IndexedDBService.ts`: Manages local database operations using IndexedDB
   - `SettingsService.ts`: Handles user preferences and settings storage


#### Utilities Subsystem
The `utils.ts` file contains helper functions used across the application, particularly for styling with Tailwind CSS. These utilities are imported and used by various components throughout the application.
**Associated Modules**
- `utils.ts`: Contains utility functions used across the application


#### Styling Subsystem
This subsystem consists of `globals.css` for global styles and `tailwind.config.ts` for Tailwind CSS configuration. It interacts with the UI Components Subsystem and View Subsystems to provide consistent styling across the application.
**Associated Modules**
- `globals.css`: Global styles for the application
- `tailwind.config.ts`: Tailwind CSS configuration

#### Page Subsystem
The Page Subsystem, including `index.tsx`, `_app.tsx`, and `_document.tsx`, serves as the entry point for the Next.js application. It sets up the overall page structure, manages global styles, and initializes the Core Application Subsystem.
**Associated Modules**
- `index.tsx`: Main entry point for the application
- `_app.tsx`: Next.js custom App component
- `_document.tsx`: Next.js custom Document component

#### Backend Subsystem
The `app.py` Flask server handles requests from the frontend's API Services. It interacts with external data sources (e.g., Yahoo Finance API) to fetch stock data, processes this data, and sends it back to the frontend. It implements CORS for secure cross-origin requests and uses the [yfinance](https://github.com/ranaroussi/yfinance) library for stock data retrieval.
**Associated Modules**
- `app.py`: Flask server handling stock data retrieval and processing