import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Chip,
  Divider,
  Stack,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useAppData } from '../context/AppDataContext';

const CategoryDialog = ({ open, onClose, category, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    updateExisting: false,
  });
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'updateExisting' ? checked : value,
    }));
    
    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    onSave({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      updateExisting: formData.updateExisting,
    });
  };
  
  // Reset form when dialog opens with new data
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: category?.name || '',
        description: category?.description || '',
        updateExisting: false,
      });
      setErrors({});
    }
  }, [open, category]);
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {category ? 'Edit Category' : 'Add Category'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <TextField
              name="name"
              label="Category Name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
              autoFocus
            />
            
            <TextField
              name="description"
              label="Description (Optional)"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
            />
            
            {category && (
              <FormControlLabel
                control={
                  <Switch
                    name="updateExisting"
                    checked={formData.updateExisting}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography>Update existing transactions</Typography>
                    <Tooltip title="Apply this category change to all existing transactions that currently use this category">
                      <HelpIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Stack>
                }
              />
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteConfirmDialog = ({ open, onClose, category, onConfirm }) => {
  const [reassignTo, setReassignTo] = useState(null);
  const { categories } = useAppData();
  
  // Filter out the current category and get other available categories
  const availableCategories = categories.filter(
    (c) => c.id !== category?.id && !c.is_default
  );
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Category</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete <strong>{category?.name}</strong>?
          </Typography>
          
          <Typography variant="body2" color="error" paragraph>
            This action cannot be undone.
          </Typography>
          
          <Typography variant="body2" paragraph>
            If there are transactions with this category, you can reassign them to another category:
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Stack spacing={2}>
              <Button
                variant={reassignTo === null ? "contained" : "outlined"}
                color="primary"
                onClick={() => setReassignTo(null)}
                fullWidth
              >
                Leave transactions uncategorized
              </Button>
              
              {availableCategories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={reassignTo === cat.id ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => setReassignTo(cat.id)}
                  fullWidth
                >
                  Reassign to {cat.name}
                </Button>
              ))}
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={() => onConfirm(reassignTo)} 
          variant="contained" 
          color="error"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Categories = () => {
  const { categories, loading } = useAppData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setDialogOpen(true);
  };
  
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };
  
  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };
  
  const handleSaveCategory = (data) => {
    // TODO: Implement save logic with API call
    console.log('Save category:', data);
    setDialogOpen(false);
  };
  
  const handleConfirmDelete = (reassignToId) => {
    // TODO: Implement delete logic with API call
    console.log('Delete category:', selectedCategory?.id, 'Reassign to:', reassignToId);
    setDeleteDialogOpen(false);
  };
  
  // Group categories by default vs custom
  const defaultCategories = categories.filter((cat) => cat.is_default);
  const customCategories = categories.filter((cat) => !cat.is_default);
  
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Categories
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCategory}
        >
          Add Category
        </Button>
      </Stack>
      
      {loading.categories ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Default Categories */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Default Categories
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              These are system categories and cannot be deleted.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              {defaultCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="h6" component="div">
                          {category.name}
                        </Typography>
                        <Chip
                          label="Default"
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(26, 156, 176, 0.1)',
                            color: 'primary.main',
                          }}
                        />
                      </Stack>
                      
                      {category.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {category.description}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <IconButton
                        aria-label="edit"
                        size="small"
                        onClick={() => handleEditCategory(category)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
          
          {/* Custom Categories */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Custom Categories
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              These are your custom categories that you can edit or delete.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {customCategories.length > 0 ? (
              <Grid container spacing={2}>
                {customCategories.map((category) => (
                  <Grid item xs={12} sm={6} md={4} key={category.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {category.name}
                        </Typography>
                        
                        {category.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {category.description}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        <IconButton
                          aria-label="edit"
                          size="small"
                          onClick={() => handleEditCategory(category)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" paragraph>
                  You haven't created any custom categories yet.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddCategory}
                >
                  Add Category
                </Button>
              </Box>
            )}
          </Paper>
        </>
      )}
      
      {/* Category Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        category={selectedCategory}
        onSave={handleSaveCategory}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        category={selectedCategory}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default Categories;