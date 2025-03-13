import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import ImportData from './pages/ImportData';
import Categories from './pages/Categories';
import Analysis from './pages/Analysis';
import Navigation from './components/Navigation';
import { AppDataProvider } from './context/AppDataContext';

function App() {
  return (
    <AppDataProvider>
      <Box sx={{ display: 'flex' }}>
        <Navigation />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, ml: { sm: 8 } }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/import" element={<ImportData />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/analysis" element={<Analysis />} />
          </Routes>
        </Box>
      </Box>
    </AppDataProvider>
  );
}

export default App;