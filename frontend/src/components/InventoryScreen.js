// frontend/src/components/InventoryScreen.js (VERSÃO FINAL, CORRIGIDA E COMPLETA)

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
    const [allSectors, setAllSectors] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/sectors')
            .then(response => { setAllSectors(response.data); })
            .catch(error => console.error("Erro ao buscar a lista de setores:", error));
    }, []);

    useEffect(() => {
        setLoading(true);
        axios.get('http://localhost:5000/api/inventory')
            .then(response => { setInventory(response.data); })
            .catch(error => { console.error("Erro ao buscar inventário:", error); })
            .finally(() => { setLoading(false); });
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

    const handleUpdate = useCallback(() => {
        const dataToUpdate = { ...editableData, setor: editableData.setor._id || editableData.setor };
        axios.put(`http://localhost:5000/api/inventory/${selectedItem._id}`, dataToUpdate)
            .then(response => {
                setInventory(prev => prev.map(item => item._id === selectedItem._id ? response.data.item : item));
                alert('Item atualizado com sucesso!');
                closeModal();
            })
            .catch(error => { console.error("Erro ao atualizar o item:", error); alert('Falha ao salvar as alterações.'); });
    }, [editableData, selectedItem]);

    const handleDelete = useCallback((itemToDelete) => {
        if (!window.confirm(`Tem certeza que deseja apagar o item "${itemToDelete.descricao}"?`)) return;
        axios.delete(`http://localhost:5000/api/inventory/${itemToDelete._id}`)
            .then(() => {
                setInventory(prev => prev.filter(item => item._id !== itemToDelete._id));
                alert('Item apagado com sucesso!');
                closeModal();
            })
            .catch(error => alert('Falha ao apagar o item.'));
    }, []);

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
                                <th>Setor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map(item => (
                                <tr key={item._id} onClick={() => openModal(item)}>
                                    <td>{item.numeroPatrimonio}</td>
                                    <td>{item.descricao}</td>
                                    <td>{item.setor ? item.setor.nome : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            <Modal isOpen={!!selectedItem} onRequestClose={closeModal} className="modal-content" overlayClassName="modal-overlay">
                {selectedItem && (
                    <div>
                        <button type="button" onClick={closeModal} className="modal-close-button">&times;</button>
                        <div className="modal-body">
                            <div className="modal-image">
                                <img src={selectedItem.foto || `https://via.placeholder.com/300x250.png?text=Sem+Imagem`} alt={selectedItem.descricao} />
                            </div>
                            <div className="modal-details">
                                <h2>{isEditMode ? 'Editar Item' : 'Detalhes do Item'}</h2>
                                {isEditMode ? (
                                    <>
                                        <label>Descrição:</label>
                                        <input className="modal-input" type="text" name="descricao" value={editableData.descricao} onChange={handleEditChange} required/>
                                        <label>Setor:</label>
                                        <select className="modal-input" name="setor" value={editableData.setor ? editableData.setor._id : ''} onChange={handleEditChange} required>
                                            <option value="" disabled>Selecione um setor</option>
                                            {allSectors.map(sector => ( <option key={sector._id} value={sector._id}>{sector.nome}</option> ))}
                                        </select>
                                        <label>Classificação:</label>
                                        <select className="modal-input" name="classificacao" value={editableData.classificacao} onChange={handleEditChange}>
                                            <option value="BOM">Bom</option> <option value="OTIMO">Ótimo</option> <option value="INSERVIVEL">Inservível</option> <option value="OCIOSO">Ocioso</option>
                                        </select>
                                        <label>Observação:</label>
                                        <textarea className="modal-input" name="observacao" value={editableData.observacao || ''} onChange={handleEditChange}></textarea>
                                    </>
                                ) : (
                                    <ul>
                                        <li><strong>Nº Patrimônio:</strong> {selectedItem.numeroPatrimonio}</li>
                                        <li><strong>Patrimônio Anterior:</strong> {selectedItem.numeroPatrimonioAnterior}</li>
                                        <li><strong>Descrição:</strong> {selectedItem.descricao}</li>
                                        <li><strong>Classificação:</strong> {selectedItem.classificacao}</li>
                                        {/* CORREÇÃO DO ERRO DE DIGITAÇÃO ESTÁ AQUI */}
                                        <li><strong>Setor:</strong> {selectedItem.setor ? selectedItem.setor.nome : 'N/A'}</li>
                                        <li><strong>Outra Identificação:</strong> {selectedItem.outraIdentificacao}</li>
                                        <li><strong>Observação:</strong> {selectedItem.observacao}</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            {isEditMode ? (
                                <button type="button" onClick={handleUpdate} className="modal-save-button">Salvar Alterações</button>
                            ) : (
                                <button type="button" onClick={() => setIsEditMode(true)} className="modal-edit-button">Editar</button>
                            )}
                            <button type="button" onClick={() => handleDelete(selectedItem)} className="modal-delete-button">Apagar Item</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default InventoryScreen;