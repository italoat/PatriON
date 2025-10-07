import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { QRCodeSVG } from 'qrcode.react';
import QrScanner from './QrScanner';
import './InventoryScreen.css';

Modal.setAppElement('#root');

const InventoryScreen = () => {
    const [inventory, setInventory] = useState([]);
    const [filteredInventory, setFilteredInventory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // 🔹 Carrega o inventário do localStorage
    useEffect(() => {
        const storedInventory = JSON.parse(localStorage.getItem('inventory')) || [];
        setInventory(storedInventory);
        setFilteredInventory(storedInventory);
    }, []);

    // 🔹 Atualiza o filtro de busca
    useEffect(() => {
        const results = inventory.filter(item =>
            item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.numeroPatrimonio.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredInventory(results);
    }, [searchTerm, inventory]);

    // 🔹 Editar item
    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    // 🔹 Salvar item editado
    const handleSave = () => {
        const updated = inventory.map(item =>
            item.numeroPatrimonio === selectedItem.numeroPatrimonio ? selectedItem : item
        );
        setInventory(updated);
        setFilteredInventory(updated);
        localStorage.setItem('inventory', JSON.stringify(updated));
        setIsModalOpen(false);
    };

    // 🔹 Excluir item
    const handleDelete = (numeroPatrimonio) => {
        const updated = inventory.filter(item => item.numeroPatrimonio !== numeroPatrimonio);
        setInventory(updated);
        setFilteredInventory(updated);
        localStorage.setItem('inventory', JSON.stringify(updated));
    };

    // 🔹 Exibir modal com QR Code
    const handleShowQr = (item) => {
        setSelectedItem(item);
        setIsQrModalOpen(true);
    };

    // ✅ Correção — função de impressão do QR Code
    const handlePrintQr = () => {
        if (!selectedItem) return;

        const qrSVG = document.querySelector('.qr-code-container svg');
        if (!qrSVG) return alert('QR Code não encontrado.');

        const svgData = new XMLSerializer().serializeToString(qrSVG);
        const svgBase64 = btoa(svgData);

        const qrHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;font-family:sans-serif;">
                <h2 style="color:black;">${selectedItem.descricao}</h2>
                <p style="color:black;">Patrimônio: ${selectedItem.numeroPatrimonio}</p>
                <div style="margin-top:20px;">
                    <img src="data:image/svg+xml;base64,${svgBase64}" 
                         alt="QR Code" 
                         style="width:250px;height:250px;" />
                </div>
            </div>
        `;

        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Imprimir QR Code</title></head><body>');
        printWindow.document.write(qrHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 400);
    };

    // 🔹 Sucesso no scanner
    const handleScanSuccess = (data) => {
        const foundItem = inventory.find(item => item.numeroPatrimonio === data);
        if (foundItem) {
            setSelectedItem(foundItem);
            setIsModalOpen(true);
        } else {
            alert('Item não encontrado.');
        }
        setIsScannerOpen(false);
    };

    return (
        <div className="inventory-page">
            <div className="inventory-content">
                <div className="inventory-header">
                    <h1>Inventário</h1>
                    <div className="inventory-actions">
                        <input
                            type="text"
                            placeholder="Buscar item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button onClick={() => setIsScannerOpen(true)}>
                            <i className="fas fa-qrcode"></i> Ler QR
                        </button>
                    </div>
                </div>

                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Nº Patrimônio</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory.map(item => (
                            <tr key={item.numeroPatrimonio}>
                                <td>{item.descricao}</td>
                                <td>{item.numeroPatrimonio}</td>
                                <td className="actions-cell">
                                    <button onClick={() => handleEdit(item)} title="Editar">
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button onClick={() => handleShowQr(item)} title="QR Code">
                                        <i className="fas fa-qrcode"></i>
                                    </button>
                                    <button onClick={() => handleDelete(item.numeroPatrimonio)} title="Excluir">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Modal de Edição --- */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                className="modal-content"
                overlayClassName="modal-overlay"
            >
                <h2>Editar Item</h2>
                {selectedItem && (
                    <>
                        <label>Descrição</label>
                        <input
                            type="text"
                            value={selectedItem.descricao}
                            onChange={(e) =>
                                setSelectedItem({ ...selectedItem, descricao: e.target.value })
                            }
                        />
                        <label>Nº Patrimônio</label>
                        <input type="text" value={selectedItem.numeroPatrimonio} disabled />
                        <button onClick={handleSave}>Salvar</button>
                    </>
                )}
            </Modal>

            {/* --- Modal do QR Code --- */}
            <Modal
                isOpen={isQrModalOpen}
                onRequestClose={() => setIsQrModalOpen(false)}
                className="modal-content"
                overlayClassName="modal-overlay"
            >
                <h2>QR Code do Item</h2>
                <div className="qr-code-container">
                    <QRCodeSVG value={selectedItem?.numeroPatrimonio || ''} size={250} />
                </div>
                <button onClick={handlePrintQr} className="print-qr-button">
                    <i className="fas fa-print"></i> Imprimir
                </button>
            </Modal>

            {/* --- Scanner de QR --- */}
            {isScannerOpen && (
                <QrScanner
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScanSuccess={handleScanSuccess}
                />
            )}
        </div>
    );
};

export default InventoryScreen;
