// frontend/src/components/ForgotPasswordScreen.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './RegistrationScreen.css'; // Reutilizaremos o estilo da tela de registro

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        axios.post('https://patrion.onrender.com/api/forgot-password', { email })
            .then(response => {
                setIsError(false);
                setMessage(response.data.message);
            })
            .catch(error => {
                setIsError(true);
                setMessage('Ocorreu um erro. Tente novamente.');
                console.error("Erro ao solicitar redefinição de senha:", error);
            });
    };

    return (
        <div className="register-user-page">
            <main className="register-user-content">
                <div className="form-container">
                    <h1>Redefinir Senha</h1>
                    <p className="subtitle">Digite seu e-mail de login e enviaremos um link para você redefinir sua senha.</p>
                    
                    {!message ? (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>E-mail</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                />
                            </div>
                            <button type="submit" className="submit-button">Enviar Link de Redefinição</button>
                        </form>
                    ) : (
                        <p className={`form-message ${isError ? 'error' : 'success'}`}>{message}</p>
                    )}

                    <div className="back-to-login">
                        <Link to="/">Voltar para o Login</Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Adicione alguns estilos extras ao RegistrationScreen.css se desejar
// Por exemplo:
// .subtitle { text-align: center; margin-top: -1rem; margin-bottom: 1.5rem; color: #666; }
// .back-to-login { text-align: center; margin-top: 1.5rem; }

export default ForgotPasswordScreen;