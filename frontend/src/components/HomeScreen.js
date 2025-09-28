// frontend/src/components/HomeScreen.js
import React from 'react';
import Navbar from './Navbar'; // Importa a barra de navegação
import './HomeScreen.css';


const HomeScreen = () => {
    return (
        <div className="home-container">
            <Navbar />
            <main className="content">
                <h1>Bem-vindo ao Sistema de Gestão de Patrimônio</h1>
                <p>Nosso sistema foi desenvolvido para oferecer à 
                Prefeitura um controle completo do patrimônio, desde o cadastro de bens móveis e imóveis até o acompanhamento de manutenções, movimentações e baixas.
                </p><p>Com ele, sua gestão ganha:</p>


<p>Agilidade no acesso às informações.</p>

<p>Segurança no armazenamento e monitoramento de dados.</p>

<p>Transparência na utilização dos recursos públicos.</p>

<p>Eficiência nos processos administrativos.</p>
            </main>
        </div>
    );
};

export default HomeScreen;