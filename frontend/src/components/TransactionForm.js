import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Stack,
  InputAdornment,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useAppData } from '../context/AppDataContext';

const TransactionForm = ({
  open,
  onClose,
  transaction = null,
  onSave,
}) => {
  const { categories } = useAppData();
  const [formData, setFormData] = useState({
    date: dayjs(),
    amount: '',
    description: '',
    category_id: '',
    is_expense: true,
  });
  const [errors, setErrors] = useState({});

  // When editing, populate form with transaction data
  useEffect(() => {
    if (transaction) {
      setFormData({
        date: dayjs(transaction.date),
        amount: Math.abs(transaction.amount).toString(),
        description: transaction.description,
        category_id: transaction.category_id || '',
        is_expense: transaction.is_expense,
      });
    } else {
      // Reset form for new transaction
      setFormData({
        date: dayjs(),
        amount: '',
        description: '',
        category_id: '',
        is_expense: true,
      });
    }
    setErrors({});
  }, [transaction, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for the field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      date,
    }));
    
    // Clear error for the date field
    if (errors.date) {
      setErrors((prev) => ({
        ...prev,
        date: null,
      }));
    }
  };

  const handleTypeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      is_expense: e.target.value === 'expense',
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    // Convert form data to API format
    const apiData = {
      date: formData.date.toISOString(),
      amount: formData.is_expense
        ? -Math.abs(parseFloat(formData.amount))
        : Math.abs(parseFloat(formData.amount)),
      description: formData.description.trim(),
      category_id: formData.category_id || null,
      is_expense: formData.is_expense,
    };
    
    onSave(apiData, transaction?.id);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {transaction ? 'Edit Transaction' : 'Add Transaction'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.date}
                    helperText={errors.date}
                  />
                )}
              />
            </LocalizationProvider>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                name="amount"
                label="Amount"
                value={formData.amount}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                error={!!errors.amount}
                helperText={errors.amount}
              />
              
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.is_expense ? 'expense' : 'income'}
                  onChange={handleTypeChange}
                  label="Type"
                >
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              error={!!errors.description}
              helperText={errors.description}
            />
            
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                label="Category"
              >
                <MenuItem value="">
                  <em>Uncategorized</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {Object.keys(errors).length > 0 && (
              <Typography color="error" variant="body2">
                Please fix the errors above before saving.
              </Typography>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionForm;