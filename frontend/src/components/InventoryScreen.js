// frontend/src/components/InventoryScreen.js (VERSÃO FINAL E COMPLETA)

import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import Navbar from './Navbar';
import QrScanner from './QrScanner';
import { QRCodeSVG } from 'qrcode.react';
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

// --- HOOK PARA OBSERVAR O TAMANHO DA JANELA ---
function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return { width: size[0], height: size[1] };
}

const InventoryScreen = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editableData, setEditableData] = useState(null);
    const [allSectors, setAllSectors] = useState([]);
    const [newFile, setNewFile] = useState(null);
    
    // Estados para a Busca, QR Code e Histórico
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [searchPatrimonio, setSearchPatrimonio] = useState('');
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const navigate = useNavigate();
    
    const { width } = useWindowSize();
    const isMobile = width <= 768;
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

    useEffect(() => {
        axios.get('https://patrion.onrender.com/api/sectors').then(res => setAllSectors(res.data));
    }, []);

    const fetchInventory = useCallback(() => {
        setLoading(true);
        axios.get('https://patrion.onrender.com/api/inventory')
            .then(res => setInventory(res.data))
            .catch(error => console.error("Erro ao buscar inventário:", error))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const openModal = (item) => {
        setSelectedItem(item);
        // CORREÇÃO: Ao abrir, já preparamos o editableData com o setor como um ID
        setEditableData({ ...item, setor: item.setor ? item.setor._id : '' }); 
        setIsEditMode(false);
        setNewFile(null);
    };

    const closeModal = () => {
        setSelectedItem(null);
        setEditableData(null);
        setIsEditMode(false);
        setNewFile(null);
        setIsQrModalOpen(false);
        setIsHistoryModalOpen(false);
        setIsImageViewerOpen(false);
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
            // Agora podemos enviar todos os campos diretamente, pois 'setor' já é um ID
            if (key !== '_id' && key !== '__v' && key !== 'valorAtual') {
                dataToSubmit.append(key, editableData[key]);
            }
        });
        if (newFile) { dataToSubmit.append('foto', newFile); }

        axios.put(`https://patrion.onrender.com/api/inventory/${selectedItem._id}`, dataToSubmit, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(response => {
            fetchInventory(); // Recarrega toda a lista para garantir consistência total
            alert('Item atualizado com sucesso!');
            closeModal();
        })
        .catch(error => { console.error("Erro ao atualizar o item:", error); alert('Falha ao salvar as alterações.'); });
    }, [editableData, selectedItem, newFile, fetchInventory]);


    const handleDelete = useCallback((itemToDelete) => {
        if (!window.confirm(`Tem certeza que deseja apagar o item "${itemToDelete.descricao}"?`)) return;
        axios.delete(`https://patrion.onrender.com/api/inventory/${itemToDelete._id}`)
            .then(() => {
                fetchInventory();
                alert('Item apagado com sucesso!');
                closeModal();
            })
            .catch(error => alert('Falha ao apagar o item.'));
    }, [fetchInventory]);

    const handleSearch = () => {
        if (!searchPatrimonio) return;
        axios.get(`https://patrion.onrender.com/api/inventory/by-patrimonio/${searchPatrimonio.trim()}`)
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

    const handlePrintQr = () => {
        const qrCodeElement = document.getElementById('qr-code-to-print');
        if (qrCodeElement) {
            const printableContent = qrCodeElement.cloneNode(true);
            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<html><head><title>Imprimir QR Code</title>');
            printWindow.document.write('<style>body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; font-family: sans-serif; } svg { width: 80%; height: auto; } h2, p { color: black; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.body.appendChild(printableContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
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
                            {!isMobile && (
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
                            )}
                            <div className="modal-details">
                                <div className="modal-details-header">
                                    <h2>{isEditMode ? 'Editar Item' : 'Detalhes do Item'}</h2>
                                    {!isEditMode && isMobile && selectedItem.foto && (
                                        <button type="button" className="view-image-button" onClick={() => setIsImageViewerOpen(true)}>
                                            <i className="fas fa-image"></i> Ver Imagem
                                        </button>
                                    )}
                                </div>
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
                                            {/* CORREÇÃO: O valor do select agora é sempre o ID do setor */}
                                            <select className="modal-input" name="setor" value={editableData.setor} onChange={handleEditChange} required>
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
                                        {isMobile && (
                                            <div className="form-group-grid full-width-grid-item">
                                                <label>Substituir Imagem:</label>
                                                <input className="modal-input" type="file" name="foto" onChange={handleFileChange} />
                                            </div>
                                        )}
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
                            <div className="footer-left">
                                {!isEditMode && (
                                    <>
                                        <button type="button" onClick={() => setIsQrModalOpen(true)} className="qr-generate-button">
                                            <i className="fas fa-qrcode"></i> Gerar QR Code
                                        </button>
                                        <button type="button" onClick={() => setIsHistoryModalOpen(true)} className="history-button">
                                            <i className="fas fa-history"></i> Histórico
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="footer-right">
                                {isEditMode ? (
                                    <button type="button" onClick={handleUpdate} className="modal-save-button">Salvar</button>
                                ) : (
                                    <button type="button" onClick={() => setIsEditMode(true)} className="modal-edit-button">Editar</button>
                                )}
                                <button type="button" onClick={() => handleDelete(selectedItem)} className="modal-delete-button">Apagar</button>
                            </div>
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
                    onScanError={(err) => {}}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}

            <Modal isOpen={isQrModalOpen} onRequestClose={() => setIsQrModalOpen(false)} className="qr-code-modal" overlayClassName="modal-overlay">
                {selectedItem && (
                    <>
                        <div id="qr-code-to-print">
                            <h2>{selectedItem.descricao}</h2>
                            <p>Patrimônio: {selectedItem.numeroPatrimonio}</p>
                            <div className="qr-code-container">
                                <QRCodeSVG 
                                    value={selectedItem.numeroPatrimonio} 
                                    size={256}
                                    includeMargin={true}
                                />
                            </div>
                        </div>
                        <div className="qr-modal-buttons">
                            <button onClick={handlePrintQr} className="qr-print-button">Imprimir</button>
                            <button onClick={() => setIsQrModalOpen(false)} className="modal-close-button-qr">Fechar</button>
                        </div>
                    </>
                )}
            </Modal>

            <Modal isOpen={isImageViewerOpen} onRequestClose={() => setIsImageViewerOpen(false)} className="image-viewer-modal" overlayClassName="modal-overlay">
                {selectedItem && (
                    <>
                        <img src={selectedItem.foto} alt={selectedItem.descricao} />
                        <button onClick={() => setIsImageViewerOpen(false)}>Fechar</button>
                    </>
                )}
            </Modal>

            <Modal isOpen={isHistoryModalOpen} onRequestClose={() => setIsHistoryModalOpen(false)} className="history-modal-content" overlayClassName="modal-overlay">
                {selectedItem && (
                    <>
                        <button type="button" onClick={() => setIsHistoryModalOpen(false)} className="modal-close-button">&times;</button>
                        <h2>Histórico de Setores do Item</h2>
                        <p>{selectedItem.descricao}</p>
                        <div className="history-table-container">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Setor</th>
                                        <th>Data da Mudança</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedItem.historicoSetores && selectedItem.historicoSetores.map((hist, index) => (
                                        <tr key={index}>
                                            <td>{hist.setor ? hist.setor.nome : 'Setor Deletado'}</td>
                                            <td>{formatDateForDisplay(hist.dataMudanca)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default InventoryScreen;

