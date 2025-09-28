// frontend/src/components/LoginScreen.js
import React, { useState } from 'react';
import logo from '../assets/logo.png'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 1. IMPORTE O useNavigate
import './LoginScreen.css';
// Para os ícones, adicione o link do Font Awesome no seu public/index.html ou instale a biblioteca
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">


const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // 2. INICIE O HOOK

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
  console.log("Enviando para o backend:", { email, password });
        try {
            const response = await axios.post('http://localhost:5000/api/login', {
                email,
                password,
            });

            console.log('Login bem-sucedido:', response.data);
            
            // 3. NAVEGUE PARA A HOME APÓS O SUCESSO
            navigate('/home'); 

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Erro ao tentar fazer login. Tente novamente.';
            setError(errorMessage);
            console.error('Erro no login:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-content">
                    <img src={logo} alt="PatriOn Logo" className="login-logo" />
                    <p>Uma solução holística para Gestão de Patrimônio</p>

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="input-group">
                            <i className="fas fa-envelope"></i>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <i className="fas fa-lock"></i>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'Entrando...' : 'Login'}
                        </button>

                        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                        
                        <div className="options">
                            <label className="remember-me">
                                <input type="checkbox" />
                                Salvar Acesso
                            </label>
                            <a href="/esqueci-a-senha">Esqueceu sua senha?</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;