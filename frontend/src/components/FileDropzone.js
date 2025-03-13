import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

const FileDropzone = ({ onFileUpload, loading, acceptedFileTypes = '.csv,.pdf' }) => {
  const [error, setError] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    
    // Check file type
    const fileExt = file.name.split('.').pop().toLowerCase();
    const acceptedExts = acceptedFileTypes
      .split(',')
      .map(type => type.replace('.', '').trim());
    
    if (!acceptedExts.includes(fileExt)) {
      setError(`File type not supported. Please upload ${acceptedFileTypes}`);
      return;
    }
    
    // Reset error
    setError(null);
    
    // Call the onFileUpload function passed from parent
    onFileUpload(file);
  }, [onFileUpload, acceptedFileTypes]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: 1,
  });

  return (
    <Paper 
      elevation={0}
      {...getRootProps()}
      className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
      sx={{
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive 
          ? 'rgba(58, 227, 116, 0.1)'
          : isDragReject
            ? 'rgba(232, 58, 58, 0.1)'
            : 'rgba(26, 156, 176, 0.05)',
        border: '2px dashed',
        borderColor: isDragActive 
          ? 'success.main'
          : isDragReject
            ? 'error.main'
            : 'primary.main',
        borderRadius: 2,
        transition: 'all 0.3s ease',
      }}
    >
      <input {...getInputProps()} />
      
      <Box display="flex" flexDirection="column" alignItems="center">
        {loading ? (
          <CircularProgress size={48} color="primary" sx={{ mb: 2 }} />
        ) : (
          <UploadIcon 
            sx={{ 
              fontSize: 48, 
              mb: 2, 
              color: isDragActive ? 'success.main' : 'primary.main' 
            }} 
          />
        )}
        
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? 'Drop the file here'
            : 'Drag & drop a file here'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {`or click to select (${acceptedFileTypes})`}
        </Typography>
        
        <Button
          variant="outlined"
          color="primary"
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? 'Uploading...' : 'Select File'}
        </Button>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
      </Box>
    </Paper>
  );
};

export default FileDropzone;