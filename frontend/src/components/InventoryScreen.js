// frontend/src/components/InventoryScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import Navbar from './Navbar';
import './InventoryScreen.css';

// Configuração inicial para o Modal, importante para acessibilidade
Modal.setAppElement('#root');

const InventoryScreen = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null); // Guarda o item clicado

    // Busca os dados do inventário quando o componente é montado
    useEffect(() => {
        axios.get('http://localhost:5000/api/inventory')
            .then(response => {
                setInventory(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar inventário:", error);
                setLoading(false);
            });
    }, []);

    // Funções para controlar o modal
    const openModal = (item) => {
        setSelectedItem(item);
    };

    const closeModal = () => {
        setSelectedItem(null);
    };

    // Função para apagar o item
    const handleDelete = useCallback((itemToDelete) => {
        // Pede confirmação ao usuário
        if (!window.confirm(`Tem certeza que deseja apagar o item "${itemToDelete['Descricao do Bem']}"?`)) {
            return;
        }

        // Codifica o ID do patrimônio para ser seguro na URL
        const patrimonioId = encodeURIComponent(itemToDelete['N de Patrimonio']);

        axios.delete(`http://localhost:5000/api/inventory/${patrimonioId}`)
            .then(response => {
                // Atualiza a lista na tela sem precisar recarregar a página
                setInventory(currentInventory => 
                    currentInventory.filter(item => item['N de Patrimonio'] !== itemToDelete['N de Patrimonio'])
                );
                alert('Item apagado com sucesso!');
                closeModal(); // Fecha o modal
            })
            .catch(error => {
                console.error("Erro ao apagar o item:", error.response || error);
                alert('Falha ao apagar o item. Verifique o console para mais detalhes.');
            });
    }, []); // useCallback para otimização

    if (loading) {
        return <div><Navbar /><p className="loading-message">Carregando inventário...</p></div>;
    }

    return (
        <div className="inventory-page">
            <Navbar />
            <main className="inventory-content">
                <h1 className="inventory-title">Inventário Geral</h1>
                <div className="table-container">
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>Nº Patrimônio</th>
                                <th>Descrição do Bem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((item, index) => (
                                <tr key={`${item['N de Patrimonio']}-${index}`} onClick={() => openModal(item)}>
                                    <td>{item['N de Patrimonio']}</td>
                                    <td>{item['Descricao do Bem']}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* O Modal/Popup */}
            <Modal
                isOpen={!!selectedItem}
                onRequestClose={closeModal}
                className="modal-content"
                overlayClassName="modal-overlay"
            >
                {selectedItem && (
                    <>
                        <button onClick={closeModal} className="modal-close-button">&times;</button>
                        <div className="modal-body">
                            <div className="modal-image">
                                <img 
                                    src={selectedItem.Foto || `https://via.placeholder.com/300x250.png?text=Sem+Imagem`} 
                                    alt={selectedItem['Descricao do Bem']} 
                                />
                            </div>
                            <div className="modal-details">
                                <h2>Detalhes do Item</h2>
                                <ul>
                                    <li><strong>Nº Patrimônio:</strong> {selectedItem['N de Patrimonio']}</li>
                                    <li><strong>Patrimônio Anterior:</strong> {selectedItem['N Patrimonio Anterior']}</li>
                                    <li><strong>Descrição:</strong> {selectedItem['Descricao do Bem']}</li>
                                    <li><strong>Classificação:</strong> {selectedItem.CLASSIFICACAO}</li>
                                    <li><strong>Setor:</strong> {selectedItem.Setor}</li>
                                    <li><strong>Outra Identificação:</strong> {selectedItem['Outra Identificacao']}</li>
                                    <li><strong>Observação:</strong> {selectedItem.Observacao}</li>
                                </ul>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => handleDelete(selectedItem)} className="modal-delete-button">
                                Apagar Item
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default InventoryScreen;