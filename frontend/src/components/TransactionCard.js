import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Stack,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { formatCurrency, formatDate } from '../utils/formatters';

const getCategoryColor = (categoryName) => {
  const colorMap = {
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
  
  return colorMap[categoryName] || '#A9B6C0';
};

const TransactionCard = ({
  transaction,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const {
    date,
    amount,
    description,
    category,
    is_expense: isExpense,
  } = transaction;
  
  const categoryName = category?.name || 'Uncategorized';
  const categoryColor = getCategoryColor(categoryName);
  
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        }
      }}
    >
      <CardContent>
        <Stack 
          direction={compact ? "row" : { xs: "column", sm: "row" }} 
          justifyContent="space-between"
          alignItems={compact ? "center" : { xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {formatDate(date)}
            </Typography>
            <Typography variant={compact ? "body1" : "h6"} component="div" sx={{ my: 0.5 }}>
              {description}
            </Typography>
            <Chip
              label={categoryName}
              size="small"
              sx={{
                backgroundColor: `${categoryColor}20`, // 20% opacity
                color: categoryColor,
                fontWeight: 600,
                mt: compact ? 0 : 1,
              }}
            />
          </Box>
          
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography 
              variant={compact ? "h6" : "h5"} 
              component="div"
              sx={{
                color: isExpense ? 'error.main' : 'success.main',
                fontWeight: 600,
              }}
            >
              {formatCurrency(amount)}
            </Typography>
            
            {!compact && (
              <Box>
                <IconButton 
                  aria-label="edit" 
                  size="small" 
                  onClick={() => onEdit(transaction)}
                  sx={{ color: 'primary.main' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  aria-label="delete" 
                  size="small" 
                  onClick={() => onDelete(transaction)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TransactionCard;