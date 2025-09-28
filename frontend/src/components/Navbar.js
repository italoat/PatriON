// frontend/src/components/Navbar.js

import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Navbar.css';
import logo_barra from '../assets/logo-barra.png';

const Navbar = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        navigate('/');
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                // ==========================================================
                // MUDANÇA AQUI: Pegamos o 'name' direto do token
                const name = decodedToken.name;
                // ==========================================================
                setUserName(name);
            } catch (error) {
                console.error("Erro ao decodificar o token:", error);
                handleLogout();
            }
        }
    }, [handleLogout]);

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <img src={logo_barra} alt="PatriOn Logo" className="logo_barra" />
            </div>
            <div className="nav-links-container">
                <ul className="nav-links">
                    <li><NavLink to="/home" className={({isActive}) => isActive ? "active-link" : ""}>Home</NavLink></li>
                    <li><NavLink to="/dashboard" className={({isActive}) => isActive ? "active-link" : ""}>Dashboard</NavLink></li>
                    <li><NavLink to="/cadastro" className={({isActive}) => isActive ? "active-link" : ""}>Cadastro</NavLink></li>
                    <li><NavLink to="/inventario" className={({isActive}) => isActive ? "active-link" : ""}>Inventário</NavLink></li>
                </ul>
                <div className="user-section">
                    {userName && (
                        <span className="user-info">
                            {userName} - Conectado
                        </span>
                    )}
                    <button onClick={handleLogout} className="logout-button">
                        Sair
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;