// frontend/src/components/Navbar.js
import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Navbar.css';
import logo_barra from '../assets/logo-barra.png';

const Navbar = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false); // Estado para o menu hambúrguer

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        navigate('/');
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUserName(decodedToken.name);
                setUserProfile(decodedToken.perfil);
            } catch (error) {
                console.error("Token inválido:", error);
                handleLogout();
            }
        }
    }, [handleLogout]);

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <img src={logo_barra} alt="PatriOn Logo" className="logo_barra" />
            </div>

            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                ☰
            </button>

            <div className={`nav-links-container ${menuOpen ? 'active' : ''}`}>
                <ul className="nav-links">
                    <li><NavLink to="/home" onClick={() => setMenuOpen(false)}>Home</NavLink></li>
                    <li><NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink></li>
                    <li><NavLink to="/inventario" onClick={() => setMenuOpen(false)}>Inventário</NavLink></li>
                    <li><NavLink to="/cadastro" onClick={() => setMenuOpen(false)}>Cadastrar Item</NavLink></li>
                    {userProfile === 1 && (
                        <li><NavLink to="/registrar-usuario" onClick={() => setMenuOpen(false)}>Registrar Usuário</NavLink></li>
                    )}
                </ul>
                <div className="user-section">
                    {userName && ( <span className="user-info">{userName} - Conectado</span> )}
                    <button onClick={handleLogout} className="logout-button">Sair</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;