// frontend/src/components/ResetPasswordScreen.js

import React, { useState } from 'react';
// A palavra 'Link' foi removida da importação abaixo
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegistrationScreen.css'; // Reutiliza o estilo

const ResetPasswordScreen = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        if (password !== confirmPassword) {
            setIsError(true);
            setMessage('As senhas não coincidem.');
            return;
        }

        axios.post(`${process.env.REACT_APP_API_URL}/api/reset-password/${token}`, { password })
            .then(response => {
                setIsError(false);
                setMessage(response.data.message + " Você será redirecionado para o login em 5 segundos.");
                setTimeout(() => {
                    navigate('/'); // Redireciona para a tela de login
                }, 5000);
            })
            .catch(error => {
                setIsError(true);
                setMessage(error.response?.data?.message || 'Ocorreu um erro.');
            });
    };

    return (
        <div className="register-user-page">
            <main className="register-user-content">
                <div className="form-container">
                    <h1>Crie sua Nova Senha</h1>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nova Senha</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                placeholder="Digite sua nova senha"
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirmar Nova Senha</label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                required 
                                placeholder="Confirme sua nova senha"
                            />
                        </div>
                        <button type="submit" className="submit-button">Salvar Nova Senha</button>
                    </form>

                    {message && <p className={`form-message ${isError ? 'error' : 'success'}`}>{message}</p>}
                </div>
            </main>
        </div>
    );
};

export default ResetPasswordScreen;