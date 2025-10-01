// frontend/src/components/RegisterUserScreen.js

import React, { useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './RegisterUserScreen.css'; // Usaremos um CSS similar ao de Cadastro de Itens

const RegisterUserScreen = () => {
    const initialFormState = {
        nome: '',
        Login: '',
        senha: '',
        perfil: '2' // Inicia com o perfil 'Usuário' selecionado
    };

    const [formData, setFormData] = useState(initialFormState);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        
        // No futuro, protegeremos esta rota. Por enquanto, ela está aberta para criação.
        // A 'senha' é enviada como texto puro, o backend irá hasheá-la.
        const dataToSubmit = {
            ...formData,
            senhaPura: formData.senha // Enviamos como 'senhaPura' se o backend esperar assim
        };

        axios.post('http://localhost:5000/api/users', dataToSubmit)
            .then(response => {
                setIsError(false);
                setMessage(response.data.message);
                setFormData(initialFormState); // Limpa o formulário
            })
            .catch(error => {
                setIsError(true);
                if (error.response && error.response.data) {
                    setMessage(error.response.data.message);
                } else {
                    setMessage('Erro ao conectar com o servidor.');
                }
            });
    };

    return (
        <div className="register-user-page">
            <Navbar />
            <main className="register-user-content">
                <div className="form-container">
                    <h1>Registrar Novo Usuário</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nome Completo</label>
                            <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Login (E-mail)</label>
                            <input type="email" name="Login" value={formData.Login} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Senha</label>
                            <input type="password" name="senha" value={formData.senha} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Perfil de Acesso</label>
                            <select name="perfil" value={formData.perfil} onChange={handleChange}>
                                <option value="2">Usuário</option>
                                <option value="1">Administrador</option>
                            </select>
                        </div>
                        <button type="submit" className="submit-button">Registrar Usuário</button>
                    </form>
                    {message && <p className={`form-message ${isError ? 'error' : 'success'}`}>{message}</p>}
                </div>
            </main>
        </div>
    );
};

export default RegisterUserScreen;