import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Paper,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { useAppData } from '../context/AppDataContext';
import TransactionCard from '../components/TransactionCard';
import TransactionForm from '../components/TransactionForm';
import { formatCurrency, calculateTotals } from '../utils/formatters';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
  const {
    transactions,
    loading,
    stats,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useAppData();
  
  const [openForm, setOpenForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [totals, setTotals] = useState({ income: 0, expenses: 0, balance: 0 });
  
  // Calculate totals when transactions change
  useEffect(() => {
    setTotals(calculateTotals(transactions));
  }, [transactions]);
  
  const handleAddTransaction = () => {
    setEditTransaction(null);
    setOpenForm(true);
  };
  
  const handleEditTransaction = (transaction) => {
    setEditTransaction(transaction);
    setOpenForm(true);
  };
  
  const handleSaveTransaction = async (data, id) => {
    try {
      if (id) {
        await updateTransaction(id, data);
      } else {
        await createTransaction(data);
      }
      setOpenForm(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };
  
  const handleDeleteTransaction = async (transaction) => {
    if (window.confirm(`Are you sure you want to delete this transaction: ${transaction.description}?`)) {
      try {
        await deleteTransaction(transaction.id);
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    const categoryData = stats.byCategory || [];
    const labels = categoryData.map((item) => item.category_name);
    const values = categoryData.map((item) => item.total);
    
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
  
  // Prepare trend chart data
  const prepareTrendData = () => {
    const periods = stats.trends?.periods || [];
    
    return {
      labels: periods.map(period => 
        new Date(period.start_date).toLocaleDateString('en-US', { month: 'short' })
      ),
      datasets: [
        {
          label: 'Spending',
          data: periods.map(period => period.total),
          backgroundColor: '#1A9CB0',
        },
      ],
    };
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
  };
  
  // Bar chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          },
        },
      },
    },
  };
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Summary section */}
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1" gutterBottom>
              Dashboard
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddTransaction}
            >
              Add Transaction
            </Button>
          </Stack>
        </Grid>
        
        {/* Financial summary cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Income
              </Typography>
              <Typography variant="h4" component="div" color="success.main" sx={{ fontWeight: 600 }}>
                {formatCurrency(totals.income)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Expenses
              </Typography>
              <Typography variant="h4" component="div" color="error.main" sx={{ fontWeight: 600 }}>
                {formatCurrency(totals.expenses)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Balance
              </Typography>
              <Typography 
                variant="h4" 
                component="div" 
                color={totals.balance >= 0 ? 'success.main' : 'error.main'} 
                sx={{ fontWeight: 600 }}
              >
                {formatCurrency(totals.balance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Charts section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Spending by Category
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                {loading.stats ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : stats.byCategory?.length > 0 ? (
                  <Doughnut data={prepareChartData()} options={chartOptions} />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      No data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Spending
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                {loading.stats ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : stats.trends?.periods?.length > 0 ? (
                  <Bar data={prepareTrendData()} options={barChartOptions} />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      No data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent transactions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {loading.transactions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : transactions.length > 0 ? (
              <Box>
                {transactions.slice(0, 5).map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                  />
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    href="/transactions"
                  >
                    View All Transactions
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" gutterBottom>
                  No transactions yet
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddTransaction}
                  sx={{ mt: 2 }}
                >
                  Add Transaction
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Transaction form dialog */}
      <TransactionForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        transaction={editTransaction}
        onSave={handleSaveTransaction}
      />
    </Box>
  );
};

export default Dashboard;