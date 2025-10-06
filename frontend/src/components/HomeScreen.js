// frontend/src/components/HomeScreen.js

import React from 'react';
import Navbar from './Navbar';
import './HomeScreen.css';

const HomeScreen = () => {
    return (
        <div className="home-container">
            <Navbar />
            <main className="content">
                <h1>Bem-vindo ao Sistema PatriOn</h1>
                <p>Selecione uma opção no menu acima para começar a gerenciar o patrimônio.</p>
            </main>
        </div>
    );
};

export default HomeScreen;