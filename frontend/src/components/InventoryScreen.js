// frontend/src/components/InventoryScreen.js (VERSÃO FINAL COM BUSCA INTELIGENTE)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import Navbar from './Navbar';
import QrScanner from './QrScanner'; // Importa o componente de scanner
import './InventoryScreen.css';

Modal.setAppElement('#root');

// --- FUNÇÕES DE FORMATAÇÃO ---
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};

const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};


const InventoryScreen = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editableData, setEditableData] = useState(null);
    const [allSectors, setAllSectors] = useState([]);
    const [newFile, setNewFile] = useState(null);

    // --- Estados para a Busca Inteligente ---
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [searchPatrimonio, setSearchPatrimonio] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:5000/api/sectors').then(res => setAllSectors(res.data));
    }, []);

    const fetchInventory = useCallback(() => {
        setLoading(true);
        axios.get('http://localhost:5000/api/inventory')
            .then(res => setInventory(res.data))
            .catch(error => console.error("Erro ao buscar inventário:", error))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const openModal = (item) => {
        setSelectedItem(item);
        setEditableData({ ...item });
        setIsEditMode(false);
        setNewFile(null);
    };

    const closeModal = () => {
        setSelectedItem(null);
        setEditableData(null);
        setIsEditMode(false);
        setNewFile(null);
    };

    const handleEditChange = (e) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) : value;
        setEditableData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleFileChange = (e) => {
        setNewFile(e.target.files[0]);
    };

    const handleUpdate = useCallback(() => {
        const dataToSubmit = new FormData();
        Object.keys(editableData).forEach(key => {
            if (key === 'setor') {
                dataToSubmit.append('setor', editableData.setor._id || editableData.setor);
            } else if (key !== '_id' && key !== '__v' && key !== 'valorAtual') {
                dataToSubmit.append(key, editableData[key]);
            }
        });
        if (newFile) {
            dataToSubmit.append('foto', newFile);
        }

        axios.put(`http://localhost:5000/api/inventory/${selectedItem._id}`, dataToSubmit)
        .then(response => {
            setInventory(prev => prev.map(item => item._id === selectedItem._id ? response.data.item : item));
            alert('Item atualizado com sucesso!');
            closeModal();
        })
        .catch(error => { console.error("Erro ao atualizar o item:", error); alert('Falha ao salvar as alterações.'); });
    }, [editableData, selectedItem, newFile]);

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
    
    // --- Novas Funções para a Busca ---
    const handleSearch = () => {
        if (!searchPatrimonio) return;
        axios.get(`http://localhost:5000/api/inventory/by-patrimonio/${searchPatrimonio.trim()}`)
            .then(response => {
                setIsSearchModalOpen(false);
                setSearchPatrimonio('');
                openModal(response.data);
            })
            .catch(error => {
                if (error.response && error.response.status === 404) {
                    if (window.confirm(`Item com patrimônio "${searchPatrimonio}" não encontrado. Deseja cadastrá-lo agora?`)) {
                        navigate(`/cadastro?patrimonio=${searchPatrimonio}`);
                    }
                } else {
                    alert('Erro ao buscar o item.');
                }
            });
    };

    const handleScanSuccess = (decodedText) => {
        setSearchPatrimonio(decodedText);
        setIsScannerOpen(false);
    };


    if (loading) { return <div><Navbar /><p className="loading-message">Carregando...</p></div>; }

    return (
        <div className="inventory-page">
            <Navbar />
            <main className="inventory-content">
                <div className="inventory-header">
                    <h1 className="inventory-title">Inventário Geral</h1>
                    <button onClick={() => setIsSearchModalOpen(true)} className="search-button">
                        <i className="fas fa-search"></i> Buscar Item
                    </button>
                </div>
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
                            <div className="modal-image-container">
                                <div className="modal-image">
                                    <img src={newFile ? URL.createObjectURL(newFile) : (selectedItem.foto || `https://via.placeholder.com/354x472.png?text=Sem+Imagem`)} alt={selectedItem.descricao} />
                                </div>
                                {isEditMode && (
                                    <div className="form-group-grid image-upload-area">
                                        <label>Substituir Imagem:</label>
                                        <input className="modal-input" type="file" name="foto" onChange={handleFileChange} />
                                    </div>
                                )}
                            </div>
                            <div className="modal-details">
                                <h2>{isEditMode ? 'Editar Item' : 'Detalhes do Item'}</h2>
                                {isEditMode ? (
                                    <div className="edit-form-grid">
                                        <div className="form-group-grid">
                                            <label>Nº Patrimônio:</label>
                                            <input className="modal-input" type="text" name="numeroPatrimonio" value={editableData.numeroPatrimonio || ''} onChange={handleEditChange} required/>
                                        </div>
                                        <div className="form-group-grid">
                                            <label>Patrimônio Anterior:</label>
                                            <input className="modal-input" type="text" name="numeroPatrimonioAnterior" value={editableData.numeroPatrimonioAnterior || ''} onChange={handleEditChange} />
                                        </div>
                                        <div className="form-group-grid full-width-grid-item">
                                            <label>Descrição:</label>
                                            <input className="modal-input" type="text" name="descricao" value={editableData.descricao || ''} onChange={handleEditChange} required/>
                                        </div>
                                        <div className="form-group-grid">
                                            <label>Setor:</label>
                                            <select className="modal-input" name="setor" value={editableData.setor ? (editableData.setor._id || editableData.setor) : ''} onChange={handleEditChange} required>
                                                <option value="" disabled>Selecione</option>
                                                {allSectors.map(s => <option key={s._id} value={s._id}>{s.nome}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group-grid">
                                            <label>Classificação:</label>
                                            <select className="modal-input" name="classificacao" value={editableData.classificacao || 'BOM'} onChange={handleEditChange}>
                                                <option value="BOM">Bom</option> <option value="OTIMO">Ótimo</option> <option value="INSERVIVEL">Inservível</option> <option value="OCIOSO">Ocioso</option>
                                            </select>
                                        </div>
                                        <div className="form-group-grid">
                                            <label>Data de Entrada:</label>
                                            <input className="modal-input" type="date" name="entrada" value={formatDate(editableData.entrada)} onChange={handleEditChange} />
                                        </div>
                                        <div className="form-group-grid">
                                            <label>Valor Contábil (R$):</label>
                                            <input className="modal-input" type="number" name="valor" value={editableData.valor || 0} onChange={handleEditChange} step="0.01" min="0" />
                                        </div>
                                        <div className="form-group-grid">
                                            <label>Taxa de Depreciação (%):</label>
                                            <input className="modal-input" type="number" name="taxaDepreciacao" value={editableData.taxaDepreciacao || 0} onChange={handleEditChange} step="1" min="0" max="100" />
                                        </div>
                                        <div className="form-group-grid">
                                            <label>Outra Identificação:</label>
                                            <input className="modal-input" type="text" name="outraIdentificacao" value={editableData.outraIdentificacao || ''} onChange={handleEditChange} />
                                        </div>
                                        <div className="form-group-grid full-width-grid-item">
                                            <label>Observação:</label>
                                            <textarea className="modal-input" name="observacao" value={editableData.observacao || ''} onChange={handleEditChange}></textarea>
                                        </div>
                                    </div>
                                ) : (
                                    <ul>
                                        <li><strong>Nº Patrimônio:</strong> {selectedItem.numeroPatrimonio}</li>
                                        <li><strong>Patrimônio Anterior:</strong> {selectedItem.numeroPatrimonioAnterior}</li>
                                        <li><strong>Descrição:</strong> {selectedItem.descricao}</li>
                                        <li><strong>Classificação:</strong> {selectedItem.classificacao}</li>
                                        <li><strong>Setor:</strong> {selectedItem.setor ? selectedItem.setor.nome : 'N/A'}</li>
                                        <li><strong>Outra Identificação:</strong> {selectedItem.outraIdentificacao}</li>
                                        <li><strong>Data de Entrada:</strong> {formatDateForDisplay(selectedItem.entrada)}</li>
                                        <li><strong>Valor Contábil:</strong> {formatCurrency(selectedItem.valor)}</li>
                                        <li><strong>Taxa de Depreciação:</strong> {selectedItem.taxaDepreciacao}% a.a.</li>
                                        <li className="valor-atual"><strong>Valor Atual (Depreciado):</strong> {formatCurrency(selectedItem.valorAtual)}</li>
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
            
            <Modal isOpen={isSearchModalOpen} onRequestClose={() => setIsSearchModalOpen(false)} className="search-modal-content" overlayClassName="modal-overlay">
                <h2>Buscar Patrimônio</h2>
                <div className="search-input-group">
                    <input 
                        type="text" 
                        placeholder="Digite o Nº do Patrimônio"
                        value={searchPatrimonio}
                        onChange={(e) => setSearchPatrimonio(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={() => setIsScannerOpen(true)} className="qr-button" title="Ler QR Code">
                        <i className="fas fa-qrcode"></i>
                    </button>
                </div>
                <button onClick={handleSearch} className="search-modal-button">Buscar</button>
            </Modal>

            {isScannerOpen && (
                <QrScanner 
                    onScanSuccess={handleScanSuccess}
                    onScanError={(err) => { /* Silencia erros contínuos */ }}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}
        </div>
    );
};

export default InventoryScreen;