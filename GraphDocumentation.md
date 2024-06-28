# Historical Graph System Documentation

## Overview

The historical graph system is an integrated feature within the stock tracker application that provides visual representation of a stock's price history. It allows users to view historical price trends for individual stocks over various time ranges.

## Architecture and Data Flow

1. **Data Source**: 
   - Historical stock data is fetched from the backend API endpoint `/historical/<symbol>`.
   - The API returns two sets of data: daily data for long-term history and granular (5-minute interval) data for recent history.

2. **Data Fetching and Caching**:
   - `StockApiService` handles API calls and implements a caching mechanism.
   - Historical data is cached for 24 hours to reduce API calls.

3. **Data Processing**:
   - Raw data is processed in the `IndividualStockView` component.
   - Data is filtered based on the selected time range.

4. **Rendering**:
   - The processed data is passed to a `LineChart` component from the Recharts library for visualization.

## Key Components

1. **StockApiService**:
   - Method: `fetchHistoricalData(symbol: string)`
   - Responsible for API calls and data caching.

2. **IndividualStockView Component**:
   - Manages the state of historical data and time range selection.
   - Processes raw data for chart rendering.

3. **LineChart Component (from Recharts)**:
   - Renders the actual chart based on processed data.

## Usage

1. **Viewing Historical Data**:
   - Navigate to the individual stock view for a specific stock.
   - The chart automatically loads with a default time range (e.g., 1 month).

2. **Changing Time Range**:
   - Use the time range buttons (1D, 5D, 1M, 3M, 6M, YTD, 1Y, 5Y, ALL) to adjust the displayed data range.

3. **Interactivity**:
   - Hover over the chart to see specific data points.
   - (If implemented) Use zoom and pan features for detailed exploration.

## Data Specifications

1. **Daily Data**:
   - Format: `{ date: string, open: number, high: number, low: number, close: number, volume: number }`
   - Time Range: Maximum available historical data

2. **Granular Data**:
   - Format: `{ date: string, open: number, high: number, low: number, close: number, volume: number }`
   - Time Range: Last 3 days
   - Interval: 5 minutes

## Performance Considerations

1. **Caching**:
   - Historical data is cached for 24 hours to reduce API load.
   - Implement proper cache invalidation strategies for data accuracy.

2. **Lazy Loading**:
   - Historical data is fetched only when the individual stock view is opened.

3. **Render Optimization**:
   - Use of `React.memo` and `useMemo` to prevent unnecessary re-renders.

## Customization and Extensibility

1. **Chart Customization**:
   - Recharts library allows extensive customization of chart appearance.
   - Styles can be adjusted in the `LineChart` component props.

2. **Additional Indicators**:
   - The system is designed to allow easy addition of technical indicators in the future.
   - Implement new data processing functions and add corresponding UI elements.

## Error Handling

1. **API Errors**:
   - Errors during data fetching are caught and logged.
   - Implement user-friendly error messages for common scenarios.

2. **Data Validation**:
   - Ensure robust checking of API response data before processing.

## Future Enhancements

1. **Multiple Chart Types**: Add support for candlestick charts, area charts, etc.
2. **Technical Indicators**: Integrate moving averages, RSI, and other technical analysis tools.
3. **Comparison Feature**: Allow comparison of multiple stocks on the same chart.
4. **Custom Date Ranges**: Implement a date picker for user-defined time ranges.

## Maintenance

1. **API Changes**:
   - Monitor for any changes in the backend API structure.
   - Update `StockApiService` and data processing logic accordingly.

2. **Library Updates**:
   - Keep Recharts and other dependencies up to date.
   - Test thoroughly after any major library updates.