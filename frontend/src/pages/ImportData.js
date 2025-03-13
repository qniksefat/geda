import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Alert,
  AlertTitle,
  CircularProgress,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  Chip,
  Card,
  CardContent,
  Stack,
  Grid,
} from '@mui/material';
import { useAppData } from '../context/AppDataContext';
import FileDropzone from '../components/FileDropzone';
import { formatDate, formatCurrency } from '../utils/formatters';

const ImportData = () => {
  const { loading, importTransactions } = useAppData();
  const [importSuccess, setImportSuccess] = useState(null);
  const [importedTransactions, setImportedTransactions] = useState([]);
  const [alert, setAlert] = useState({
    open: false,
    severity: 'info',
    message: '',
  });

  const handleFileUpload = async (file) => {
    try {
      // Reset state
      setImportSuccess(null);
      setImportedTransactions([]);
      
      // Import the file
      const result = await importTransactions(file);
      
      // Update state with results
      setImportSuccess(true);
      setImportedTransactions(result);
      
      // Show success message
      setAlert({
        open: true,
        severity: 'success',
        message: `Successfully imported ${result.length} transactions`,
      });
    } catch (error) {
      console.error('Error importing file:', error);
      
      // Show error message
      setImportSuccess(false);
      setAlert({
        open: true,
        severity: 'error',
        message: 'Failed to import file. Please try again.',
      });
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Import Data
      </Typography>
      <Typography variant="body1" paragraph>
        Upload your transaction data from CSV files or PDF statements. Supported formats include
        files from CIBC, RBC, Amex, WealthSimple, and other major banks.
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload Transaction File
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Drag and drop a CSV or PDF file, or click to select one from your computer.
          </Typography>
          
          <FileDropzone
            onFileUpload={handleFileUpload}
            loading={loading.importing}
            acceptedFileTypes=".csv,.pdf"
          />
          
          {loading.importing && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">Processing file...</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {importSuccess === true && importedTransactions.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body1" gutterBottom>
              Successfully imported {importedTransactions.length} transactions
            </Typography>
            
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Sample of imported transactions:
            </Typography>
            
            <List>
              {importedTransactions.slice(0, 5).map((transaction, index) => (
                <ListItem
                  key={index}
                  divider={index < Math.min(4, importedTransactions.length - 1)}
                  sx={{ px: 0 }}
                >
                  <Grid container alignItems="center">
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(transaction.date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={7}>
                      <ListItemText
                        primary={transaction.description}
                        secondary={
                          <Chip
                            label={transaction.category?.name || 'Uncategorized'}
                            size="small"
                            sx={{
                              mt: 0.5,
                              backgroundColor: 'rgba(26, 156, 176, 0.1)',
                              color: 'primary.main',
                            }}
                          />
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography
                        align="right"
                        sx={{
                          color: transaction.amount < 0 ? 'error.main' : 'success.main',
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </Grid>
                  </Grid>
                </ListItem>
              ))}
              
              {importedTransactions.length > 5 && (
                <ListItem sx={{ px: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    ...and {importedTransactions.length - 5} more transactions
                  </Typography>
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          How to Import Data
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Stack spacing={2}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Supported File Formats</AlertTitle>
            The app currently supports CSV files and PDF statements from major banks including CIBC, RBC, Amex, and WealthSimple.
          </Alert>
          
          <Typography variant="subtitle1">Steps to Import:</Typography>
          <ol>
            <Typography component="li" variant="body1">
              Download your transaction history as a CSV file from your bank's website
            </Typography>
            <Typography component="li" variant="body1">
              Drag and drop the file into the upload area above, or click to select it
            </Typography>
            <Typography component="li" variant="body1">
              Review the imported transactions for accuracy
            </Typography>
            <Typography component="li" variant="body1">
              Your transactions will be automatically categorized based on their descriptions
            </Typography>
          </ol>
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Tips:</Typography>
          <Typography variant="body2">
            • For best results with PDFs, ensure they are not password-protected
          </Typography>
          <Typography variant="body2">
            • The system will automatically detect and ignore duplicates
          </Typography>
          <Typography variant="body2">
            • You can manually edit categories after import if needed
          </Typography>
        </Stack>
      </Paper>
      
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity} variant="filled">
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ImportData;