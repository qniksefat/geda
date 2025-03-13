import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement,
  Title,
} from 'chart.js';
import dayjs from 'dayjs';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useAppData } from '../context/AppDataContext';
import { formatCurrency } from '../utils/formatters';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement,
  Title
);

const Analysis = () => {
  const { transactions, stats, loading, dateRange, setDateRange } = useAppData();
  const [periodType, setPeriodType] = useState('month');
  const [tabValue, setTabValue] = useState(0);
  
  // Process spending by category data for chart
  const prepareCategoryData = () => {
    const categoryData = stats.byCategory || [];
    const sortedData = [...categoryData].sort((a, b) => b.total - a.total);
    
    const labels = sortedData.map((item) => item.category_name);
    const values = sortedData.map((item) => item.total);
    
    // Generate colors based on category
    const categoryColors = {
      'Food & Dining': '#FF7F50', // Coral
      'Shopping': '#FFD166', // Soft Yellow
      'Housing': '#6A0572', // Deep Purple
      'Transportation': '#1A9CB0', // Teal Blue
      'Entertainment': '#7B68EE', // Royal Purple
      'Health & Fitness': '#3AE374', // Mint Green
      'Personal Care': '#FF6B6B', // Light Red
      'Education': '#4ECDC4', // Turquoise
      'Gifts & Donations': '#FF71CE', // Pink
      'Bills & Utilities': '#7A8C98', // Slate Gray
      'Travel': '#A06CD5', // Lavender
      'Income': '#3AE374', // Mint Green
      'Transfer': '#7A8C98', // Slate Gray
      'Uncategorized': '#A9B6C0', // Light Gray
    };
    
    const colors = labels.map((label) => categoryColors[label] || '#A9B6C0');
    
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => color + '80'), // 50% opacity
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Process trend data for chart
  const prepareTrendData = () => {
    const periods = stats.trends?.periods || [];
    
    const reversedPeriods = [...periods].reverse();
    
    return {
      labels: reversedPeriods.map(period => 
        dayjs(period.start_date).format('MMM YYYY')
      ),
      datasets: [
        {
          label: 'Spending',
          data: reversedPeriods.map(period => period.total),
          backgroundColor: '#1A9CB0',
          borderColor: '#1A9CB0',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
        },
      ],
    };
  };
  
  // Chart options
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    cutout: '70%',
  };
  
  // Line chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Monthly Spending Trend',
        font: {
          size: 16,
        },
        padding: {
          bottom: 30,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw || 0;
            return `${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };
  
  // Handler for period change
  const handlePeriodChange = (event) => {
    setPeriodType(event.target.value);
    
    // Update date range based on period type
    const endDate = dayjs();
    let startDate;
    
    switch (event.target.value) {
      case 'week':
        startDate = endDate.subtract(7, 'day');
        break;
      case 'month':
        startDate = endDate.subtract(1, 'month');
        break;
      case 'quarter':
        startDate = endDate.subtract(3, 'month');
        break;
      case 'year':
        startDate = endDate.subtract(1, 'year');
        break;
      default:
        startDate = endDate.subtract(1, 'month');
    }
    
    setDateRange({
      startDate,
      endDate,
    });
  };
  
  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Calculate total spending
  const totalSpending = (stats.byCategory || []).reduce(
    (sum, category) => sum + (category.total || 0),
    0
  );
  
  // Get top spending categories
  const topCategories = [...(stats.byCategory || [])]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Spending Analysis
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={periodType}
                onChange={handlePeriodChange}
                label="Time Period"
              >
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
                <MenuItem value="quarter">Last 3 Months</MenuItem>
                <MenuItem value="year">Last 12 Months</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                slotProps={{
                  textField: { 
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                slotProps={{
                  textField: { 
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Overview" />
          <Tab label="Category Breakdown" />
          <Tab label="Spending Trends" />
        </Tabs>
      </Box>
      
      {/* Tab Content */}
      <Box role="tabpanel" hidden={tabValue !== 0}>
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Total Spending Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Total Spending
                  </Typography>
                  
                  <Typography variant="h3" component="div" color="error.main" sx={{ mb: 2, fontWeight: 600 }}>
                    {formatCurrency(totalSpending)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {`for ${periodType === 'week' ? '7 days' 
                      : periodType === 'month' ? '30 days' 
                      : periodType === 'quarter' ? '3 months' 
                      : '12 months'}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Top Categories Card */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Spending Categories
                  </Typography>
                  
                  {loading.stats ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : topCategories.length > 0 ? (
                    <List>
                      {topCategories.map((category, index) => (
                        <ListItem key={category.category_id || index} divider={index < topCategories.length - 1}>
                          <ListItemText
                            primary={category.category_name}
                            secondary={`${Math.round((category.total / totalSpending) * 100)}% of total spending`}
                          />
                          <Typography variant="h6" color="error.main" sx={{ fontWeight: 600 }}>
                            {formatCurrency(category.total)}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No spending data available for this period
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Monthly Trend Chart */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Spending Trend
                  </Typography>
                  
                  <Box sx={{ height: 300, mt: 2 }}>
                    {loading.stats ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                      </Box>
                    ) : stats.trends?.periods?.length > 0 ? (
                      <Line data={prepareTrendData()} options={lineOptions} />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography variant="body1" color="text.secondary">
                          No trend data available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
      
      <Box role="tabpanel" hidden={tabValue !== 1}>
        {tabValue === 1 && (
          <Grid container spacing={3}>
            {/* Category Breakdown Chart */}
            <Grid item xs={12} md={7}>
              <Card sx={{ height: 500 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Spending by Category
                  </Typography>
                  
                  <Box sx={{ height: 400, mt: 2 }}>
                    {loading.stats ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                      </Box>
                    ) : stats.byCategory?.length > 0 ? (
                      <Doughnut data={prepareCategoryData()} options={doughnutOptions} />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography variant="body1" color="text.secondary">
                          No category data available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Category List */}
            <Grid item xs={12} md={5}>
              <Card sx={{ height: 500, overflow: 'auto' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Category Breakdown
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {loading.stats ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : stats.byCategory?.length > 0 ? (
                    <List sx={{ pt: 0 }}>
                      {[...(stats.byCategory || [])]
                        .sort((a, b) => b.total - a.total)
                        .map((category, index) => (
                          <ListItem key={category.category_id || index} divider={index < stats.byCategory.length - 1}>
                            <ListItemText
                              primary={category.category_name}
                              secondary={`${Math.round((category.total / totalSpending) * 100)}%`}
                            />
                            <Typography color="error.main" sx={{ fontWeight: 600 }}>
                              {formatCurrency(category.total)}
                            </Typography>
                          </ListItem>
                        ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No spending data available for this period
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
      
      <Box role="tabpanel" hidden={tabValue !== 2}>
        {tabValue === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Spending Trend
              </Typography>
              
              <Box sx={{ height: 500, mt: 2 }}>
                {loading.stats ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : stats.trends?.periods?.length > 0 ? (
                  <Line data={prepareTrendData()} options={{
                    ...lineOptions,
                    maintainAspectRatio: false,
                    scales: {
                      ...lineOptions.scales,
                      y: {
                        ...lineOptions.scales.y,
                        ticks: {
                          ...lineOptions.scales.y.ticks,
                          font: {
                            size: 14,
                          },
                        },
                      },
                      x: {
                        ...lineOptions.scales.x,
                        ticks: {
                          font: {
                            size: 14,
                          },
                        },
                      },
                    },
                  }} />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      No trend data available
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {stats.trends?.periods?.length > 0 && (
                <Stack spacing={2} sx={{ mt: 3 }}>
                  <Typography variant="h6">Monthly Analysis</Typography>
                  <Divider />
                  
                  <Grid container spacing={2}>
                    {stats.trends.periods.slice(0, 3).map((period, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              {new Date(period.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </Typography>
                            
                            <Typography variant="h5" color="error.main" sx={{ mb: 2, fontWeight: 600 }}>
                              {formatCurrency(period.total)}
                            </Typography>
                            
                            <Typography variant="subtitle2" gutterBottom>
                              Top Categories:
                            </Typography>
                            
                            <List dense>
                              {period.top_categories.map((cat, catIndex) => (
                                <ListItem key={catIndex} disablePadding>
                                  <ListItemText
                                    primary={`${cat.name}: ${formatCurrency(cat.total)}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default Analysis;