// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importe seus componentes de tela
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import DashboardScreen from './components/DashboardScreen';
import InventoryScreen from './components/InventoryScreen'; 


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota para a página de Login (página inicial) */}
        <Route path="/" element={<LoginScreen />} />

        {/* Rota para a página de Home (após o login) */}
        <Route path="/home" element={<HomeScreen />} />

            {/* Rota para a página de DASHBOARD */}
        <Route path="/dashboard" element={<DashboardScreen />} />

          {/* Rota para a página de Inventário */}
        <Route path="/inventario" element={<InventoryScreen />} />

        {/* Adicione outras rotas aqui conforme for criando as telas */}
        {/* Exemplo: <Route path="/dashboard" element={<DashboardScreen />} /> */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;