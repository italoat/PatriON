// frontend/src/components/LoginScreen.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './LoginScreen.css';
import logo from '../assets/logo.png'; 

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`https://patrion.onrender.com/api/login`, {
                email,
                password,
            });

            localStorage.setItem('authToken', response.data.token);
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
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'Entrando...' : 'Login'}
                        </button>

                        {error && <p className="login-error-message">{error}</p>}
                        
                        <div className="options">
                            <label className="remember-me">
                                <input type="checkbox" />
                                Salvar Acesso
                            </label>
                            <Link to="/forgot-password">Esqueceu sua senha?</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;