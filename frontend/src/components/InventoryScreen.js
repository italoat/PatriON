// frontend/src/components/InventoryScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import Navbar from './Navbar';
import './InventoryScreen.css';

Modal.setAppElement('#root');

const InventoryScreen = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editableData, setEditableData] = useState(null);

    useEffect(() => {
        setLoading(true);
        axios.get('http://localhost:5000/api/inventory')
            .then(response => setInventory(response.data))
            .catch(error => console.error("Erro ao buscar inventário:", error))
            .finally(() => setLoading(false));
    }, []);

    const openModal = (item) => {
        setSelectedItem(item);
        setEditableData({ ...item }); 
        setIsEditMode(false);
    };

    const closeModal = () => {
        setSelectedItem(null);
        setEditableData(null);
        setIsEditMode(false);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditableData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = useCallback((e) => {
        e.preventDefault();
        const patrimonioId = encodeURIComponent(selectedItem['N de Patrimonio']);

        axios.put(`http://localhost:5000/api/inventory/${patrimonioId}`, editableData)
            .then(response => {
                setInventory(prev => prev.map(item => 
                    item['N de Patrimonio'] === selectedItem['N de Patrimonio'] ? response.data.item : item
                ));
                alert('Item atualizado com sucesso!');
                closeModal();
            })
            .catch(error => {
                console.error("Erro ao atualizar o item:", error);
                alert('Falha ao salvar as alterações.');
            });
    }, [editableData, selectedItem]);

    const handleDelete = useCallback((itemToDelete) => {
        if (!window.confirm(`Tem certeza que deseja apagar o item "${itemToDelete['Descricao do Bem']}"?`)) return;
        const patrimonioId = encodeURIComponent(itemToDelete['N de Patrimonio']);
        axios.delete(`http://localhost:5000/api/inventory/${patrimonioId}`)
            .then(() => {
                setInventory(prev => prev.filter(item => item['N de Patrimonio'] !== itemToDelete['N de Patrimonio']));
                alert('Item apagado com sucesso!');
                closeModal();
            })
            .catch(error => alert('Falha ao apagar o item.'));
    }, []);

    if (loading) { return <div><Navbar /><p className="loading-message">Carregando inventário...</p></div>; }

    return (
        <div className="inventory-page">
            <Navbar />
            <main className="inventory-content">
                <h1 className="inventory-title">Inventário Geral</h1>
                <div className="table-container">
                    <table className="inventory-table">
                        <thead>
                            <tr><th>Nº Patrimônio</th><th>Descrição do Bem</th></tr>
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

            <Modal isOpen={!!selectedItem} onRequestClose={closeModal} className="modal-content" overlayClassName="modal-overlay">
                {selectedItem && (
                    <form onSubmit={handleUpdate}>
                        <button type="button" onClick={closeModal} className="modal-close-button">&times;</button>
                        <div className="modal-body">
                            <div className="modal-image">
                                <img src={selectedItem.Foto || `https://via.placeholder.com/300x250.png?text=Sem+Imagem`} alt={selectedItem['Descricao do Bem']} />
                            </div>
                            <div className="modal-details">
                                <h2>{isEditMode ? 'Editar Item' : 'Detalhes do Item'}</h2>
                                {isEditMode ? (
                                    <>
                                        <label>Descrição:</label>
                                        <input className="modal-input" type="text" name="Descricao do Bem" value={editableData['Descricao do Bem']} onChange={handleEditChange} />
                                        <label>Classificação:</label>
                                        <select className="modal-input" name="CLASSIFICACAO" value={editableData.CLASSIFICACAO} onChange={handleEditChange}>
                                            <option value="BOM">Bom</option><option value="OTIMO">Ótimo</option><option value="INSERVIVEL">Inservível</option><option value="OCIOSO">Ocioso</option>
                                        </select>
                                        <label>Observação:</label>
                                        <textarea className="modal-input" name="Observacao" value={editableData.Observacao} onChange={handleEditChange}></textarea>
                                    </>
                                ) : (
                                    <ul>
                                        <li><strong>Nº Patrimônio:</strong> {selectedItem['N de Patrimonio']}</li>
                                        <li><strong>Descrição:</strong> {selectedItem['Descricao do Bem']}</li>
                                        <li><strong>Classificação:</strong> {selectedItem.CLASSIFICACAO}</li>
                                        <li><strong>Setor:</strong> {selectedItem.Setor}</li>
                                        <li><strong>Observação:</strong> {selectedItem.Observacao}</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            {isEditMode ? (
                                <button type="submit" className="modal-save-button">Salvar Alterações</button>
                            ) : (
                                <button type="button" onClick={() => setIsEditMode(true)} className="modal-edit-button">Editar</button>
                            )}
                            <button type="button" onClick={() => handleDelete(selectedItem)} className="modal-delete-button">Apagar Item</button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default InventoryScreen;