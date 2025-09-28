// frontend/src/components/Navbar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import logo_barra from '../assets/logo-barra.png'; 

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
               <img src={logo_barra} alt="PatriOn Logo" className="logo_barra" />
            </div>
            <ul className="nav-links">
                <li><NavLink to="/home" className={({isActive}) => isActive ? "active-link" : ""}>Home</NavLink></li>
                <li><NavLink to="/dashboard" className={({isActive}) => isActive ? "active-link" : ""}>Dashboard</NavLink></li>
                <li><NavLink to="/cadastro" className={({isActive}) => isActive ? "active-link" : ""}>Cadastro</NavLink></li>
                <li><NavLink to="/inventario" className={({isActive}) => isActive ? "active-link" : ""}>Inventário</NavLink></li>
            </ul>
        </nav>
    );
};

export default Navbar;