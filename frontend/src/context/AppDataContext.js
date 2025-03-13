import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

// Create context
const AppDataContext = createContext();

// Context provider component
export const AppDataProvider = ({ children }) => {
  // State
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState({
    transactions: false,
    categories: false,
    importing: false,
  });
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(30, 'day'),
    endDate: dayjs(),
  });
  const [stats, setStats] = useState({
    byCategory: [],
    trends: { periods: [] },
  });

  // API base URLs
  const API_URL = '/api';

  // Fetch transactions
  const fetchTransactions = async (params = {}) => {
    setLoading((prev) => ({ ...prev, transactions: true }));
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/transactions/`, { params });
      setTransactions(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
      return [];
    } finally {
      setLoading((prev) => ({ ...prev, transactions: false }));
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    setLoading((prev) => ({ ...prev, categories: true }));
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/categories/`);
      setCategories(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch categories');
      console.error('Error fetching categories:', err);
      return [];
    } finally {
      setLoading((prev) => ({ ...prev, categories: false }));
    }
  };

  // Fetch statistics
  const fetchStats = async (startDate, endDate) => {
    setLoading((prev) => ({ ...prev, stats: true }));
    setError(null);
    
    try {
      // Fetch spending by category
      const byCategoryResponse = await axios.get(`${API_URL}/transactions/stats/by-category`, {
        params: { start_date: formatDate(startDate), end_date: formatDate(endDate) }
      });
      
      // Fetch trends
      const trendsResponse = await axios.get(`${API_URL}/transactions/stats/trends`);
      
      setStats({
        byCategory: byCategoryResponse.data,
        trends: trendsResponse.data,
      });
      
      return { byCategory: byCategoryResponse.data, trends: trendsResponse.data };
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch statistics');
      console.error('Error fetching statistics:', err);
      return { byCategory: [], trends: { periods: [] } };
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
    }
  };

  // Import transactions from file
  const importTransactions = async (file) => {
    setLoading((prev) => ({ ...prev, importing: true }));
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_URL}/imports/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Refresh transactions after import
      await fetchTransactions();
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to import transactions');
      console.error('Error importing transactions:', err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, importing: false }));
    }
  };

  // Create a new transaction
  const createTransaction = async (transactionData) => {
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/transactions/`, transactionData);
      
      // Refresh transactions
      await fetchTransactions();
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create transaction');
      console.error('Error creating transaction:', err);
      throw err;
    }
  };

  // Update a transaction
  const updateTransaction = async (id, transactionData) => {
    setError(null);
    
    try {
      const response = await axios.put(`${API_URL}/transactions/${id}`, transactionData);
      
      // Refresh transactions
      await fetchTransactions();
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update transaction');
      console.error('Error updating transaction:', err);
      throw err;
    }
  };

  // Delete a transaction
  const deleteTransaction = async (id) => {
    setError(null);
    
    try {
      await axios.delete(`${API_URL}/transactions/${id}`);
      
      // Refresh transactions
      await fetchTransactions();
      
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete transaction');
      console.error('Error deleting transaction:', err);
      throw err;
    }
  };

  // Create default categories if they don't exist
  const createDefaultCategories = async () => {
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/categories/create-defaults`);
      
      // Refresh categories
      await fetchCategories();
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create default categories');
      console.error('Error creating default categories:', err);
      throw err;
    }
  };

  // Helper function to format date for API
  const formatDate = (date) => {
    if (!date) return null;
    return date instanceof Date
      ? date.toISOString().split('T')[0]
      : date;
  };

  // Initialize data on component mount
  useEffect(() => {
    // Create default categories first, then fetch transactions and categories
    const initializeData = async () => {
      try {
        await createDefaultCategories();
        await Promise.all([
          fetchTransactions(),
          fetchCategories(),
        ]);
      } catch (err) {
        console.error('Error initializing data:', err);
      }
    };
    
    initializeData();
  }, []);

  // Update stats when date range changes
  useEffect(() => {
    fetchStats(dateRange.startDate, dateRange.endDate);
  }, [dateRange]);

  // Context value
  const value = {
    transactions,
    categories,
    loading,
    error,
    dateRange,
    stats,
    setDateRange,
    fetchTransactions,
    fetchCategories,
    fetchStats,
    importTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    formatDate,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

// Custom hook to use the AppData context
export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

export default AppDataContext;