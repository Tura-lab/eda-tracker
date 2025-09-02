# Financial Analysis Feature

## Overview
The analysis page provides comprehensive financial insights for users to track their expenses, lending, and borrowing patterns over time.

## Features

### 📊 Dashboard Overview
- **Total Expenses**: Sum of all expenses in the selected time period
- **Total Lending**: Sum of money lent to others
- **Total Borrowing**: Sum of money borrowed from others
- **Net Balance**: Difference between lending and borrowing (positive = net lender, negative = net borrower)

### 📈 Visual Charts
1. **Daily Expenses Chart**: Bar chart showing daily expense amounts
2. **Lending vs Borrowing Chart**: Comparison of total lending vs borrowing amounts
3. **Monthly Averages Chart**: Stacked bar chart showing monthly averages for expenses, lending, and borrowing
4. **Trend Analysis**: Text-based indicators showing whether values are increasing or decreasing

### 🗓️ Date Filtering
- **Quick Ranges**: 7 days, 30 days, 90 days
- **Custom Range**: Select specific start and end dates
- **Month Filter**: Filter data by specific month (YYYY-MM format)

### 🔄 Real-time Updates
- Automatic data refresh when filters change
- Manual refresh button
- Loading states and error handling

## Navigation
- **Desktop**: Navigation tabs in the header
- **Mobile**: Navigation buttons below the header
- Seamless switching between Dashboard and Analysis views

## API Endpoint
- **Route**: `/api/analysis`
- **Method**: GET
- **Parameters**:
  - `range`: Date range (7d, 30d, 90d)
  - `startDate`: Custom start date (YYYY-MM-DD)
  - `endDate`: Custom end date (YYYY-MM-DD)
  - `month`: Month filter (YYYY-MM)

## Data Structure
```typescript
interface AnalysisData {
  dailyExpenses: { date: string; amount: number }[]
  lendingData: { date: string; amount: number }[]
  borrowingData: { date: string; amount: number }[]
  monthlyAverages: { 
    month: string
    avgExpense: number
    avgLending: number
    avgBorrowing: number 
  }[]
  summary: {
    totalExpenses: number
    totalLending: number
    totalBorrowing: number
    netBalance: number
  }
}
```

## Technical Implementation
- **Frontend**: React with TypeScript, Tailwind CSS
- **State Management**: React hooks (useState, useEffect, useCallback)
- **Date Handling**: date-fns library for date manipulation
- **Responsive Design**: Mobile-first approach with responsive charts
- **Error Handling**: Comprehensive error states and user feedback

## Usage Examples

### Viewing Last 30 Days
1. Navigate to Analysis page
2. Select "Last 30 days" from date range dropdown
3. View charts and summary data

### Custom Date Range
1. Select "Custom range" from date range dropdown
2. Choose start and end dates
3. Data automatically refreshes

### Monthly Analysis
1. Use month picker to select specific month
2. View monthly averages and trends
3. Compare with other months

## Future Enhancements
- Export functionality (PDF, CSV)
- More chart types (pie charts, line charts)
- Advanced filtering (by category, person)
- Historical comparisons
- Budget tracking and alerts