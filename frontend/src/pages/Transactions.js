import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Divider,
  CircularProgress,
  Stack,
  Chip,
  Grid,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useAppData } from '../context/AppDataContext';
import TransactionForm from '../components/TransactionForm';
import TransactionCard from '../components/TransactionCard';
import { groupTransactionsByDate, formatDate } from '../utils/formatters';

const Transactions = () => {
  const {
    transactions,
    categories,
    loading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useAppData();

  // Form state
  const [openForm, setOpenForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;
  
  // Filtered transactions
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  
  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStartDate(null);
    setEndDate(null);
    setTypeFilter('all');
  };
  
  // Apply filters to transactions
  useEffect(() => {
    let filtered = [...transactions];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((transaction) =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((transaction) =>
        transaction.category_id === parseInt(categoryFilter)
      );
    }
    
    // Apply date filters
    if (startDate) {
      filtered = filtered.filter((transaction) =>
        new Date(transaction.date) >= startDate.toDate()
      );
    }
    
    if (endDate) {
      filtered = filtered.filter((transaction) =>
        new Date(transaction.date) <= endDate.toDate()
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      const isExpense = typeFilter === 'expense';
      filtered = filtered.filter((transaction) => transaction.is_expense === isExpense);
    }
    
    // Calculate total pages
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    
    // Update filtered transactions
    setFilteredTransactions(filtered);
    
    // Reset to first page when filters change
    setPage(1);
  }, [transactions, searchTerm, categoryFilter, startDate, endDate, typeFilter]);
  
  // Get current page of transactions
  const getCurrentPageItems = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  };
  
  // Group transactions by date
  const groupedTransactions = groupTransactionsByDate(getCurrentPageItems());
  
  // Transaction form handlers
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
  
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Transactions
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
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search transactions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="clear search"
                      onClick={() => setSearchTerm('')}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
              
              {(searchTerm || categoryFilter || startDate || endDate || typeFilter !== 'all') && (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleResetFilters}
                >
                  Clear Filters
                </Button>
              )}
            </Stack>
          </Grid>
          
          {showFilters && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="expense">Expenses</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: { 
                        fullWidth: true,
                        size: "small"
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: { 
                        fullWidth: true,
                        size: "small"
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {categoryFilter && (
                    <Chip
                      label={`Category: ${categories.find(c => c.id === parseInt(categoryFilter))?.name || 'Unknown'}`}
                      onDelete={() => setCategoryFilter('')}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  
                  {typeFilter !== 'all' && (
                    <Chip
                      label={`Type: ${typeFilter === 'expense' ? 'Expenses' : 'Income'}`}
                      onDelete={() => setTypeFilter('all')}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  
                  {startDate && (
                    <Chip
                      label={`From: ${formatDate(startDate.toDate())}`}
                      onDelete={() => setStartDate(null)}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  
                  {endDate && (
                    <Chip
                      label={`To: ${formatDate(endDate.toDate())}`}
                      onDelete={() => setEndDate(null)}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Stack>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      
      {/* Transactions list */}
      {loading.transactions ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredTransactions.length > 0 ? (
        <Box>
          {Object.keys(groupedTransactions).sort().reverse().map((date) => (
            <Box key={date} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {formatDate(date, 'long')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {groupedTransactions[date].map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                />
              ))}
            </Box>
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No transactions found
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            {searchTerm || categoryFilter || startDate || endDate || typeFilter !== 'all'
              ? 'Try adjusting your filters to see more results'
              : 'Get started by adding a transaction or importing your data'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddTransaction}
          >
            Add Transaction
          </Button>
        </Paper>
      )}
      
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

export default Transactions;