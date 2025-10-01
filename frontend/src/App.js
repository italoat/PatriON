// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importe seus componentes de tela
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import DashboardScreen from './components/DashboardScreen';
import InventoryScreen from './components/InventoryScreen'; 
import RegistrationScreen from './components/RegistrationScreen';
import RegisterUserScreen from './components/RegisterUserScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen'; 

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
          {/* Rota para a página de Cadastro */}
        <Route path="/cadastro" element={<RegistrationScreen />} />
          {/* 2. ADICIONE A ROTA PARA O REGISTRO DE USUÁRIO */}
        <Route path="/registrar-usuario" element={<RegisterUserScreen />} />
          {/* 2. ADICIONE A ROTA PARA "ESQUECI MINHA SENHA" */}
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          {/* 2. ADICIONE A ROTA PARA REDEFINIR A SENHA (com o token) */}
        <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />

        {/* Adicione outras rotas aqui conforme for criando as telas */}
        {/* Exemplo: <Route path="/dashboard" element={<DashboardScreen />} /> */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;