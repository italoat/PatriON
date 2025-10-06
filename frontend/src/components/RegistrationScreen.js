// frontend/src/components/RegistrationScreen.js

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from './Navbar';
import './RegistrationScreen.css';

Modal.setAppElement('#root');

const RegistrationScreen = () => {
    const location = useLocation();
    
    const initialFormState = {
        numeroPatrimonioAnterior: '',
        numeroPatrimonio: '',
        descricao: '',
        classificacao: 'BOM',
        setor: '',
        outraIdentificacao: '',
        observacao: '',
        valor: 0,
        entrada: new Date().toISOString().split('T')[0],
        taxaDepreciacao: 10
    };

    const [formData, setFormData] = useState(initialFormState);
    const [file, setFile] = useState(null);
    const [sectors, setSectors] = useState([]);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [qrCodeData, setQrCodeData] = useState(null);

    useEffect(() => {
        axios.get('https://patrion.onrender.com/api/sectors')
            .then(response => {
                setSectors(response.data);
                if (response.data.length > 0 && !formData.setor) {
                    setFormData(prevState => ({ ...prevState, setor: response.data[0]._id }));
                }
            })
            .catch(error => console.error("Erro ao buscar setores:", error));
    }, [formData.setor]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const patrimonioFromSearch = searchParams.get('patrimonio');
        if (patrimonioFromSearch) {
            setFormData(prevState => ({ ...prevState, numeroPatrimonio: patrimonioFromSearch }));
        }
    }, [location]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) : value;
        setFormData(prevState => ({ ...prevState, [name]: finalValue }));
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        const dataToSubmit = new FormData();
        for (const key in formData) {
            dataToSubmit.append(key, formData[key]);
        }
        if (file) {
            dataToSubmit.append('foto', file);
        }

        axios.post('https://patrion.onrender.com/api/inventory', dataToSubmit, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(response => {
            setIsError(false);
            setMessage('Item cadastrado com sucesso!');
            setQrCodeData(response.data.item);
            setFormData(initialFormState);
            setFile(null);
            if (document.getElementById('file-input')) {
                document.getElementById('file-input').value = '';
            }
        })
        .catch(error => {
            setIsError(true);
            const errorMessage = error.response?.data?.message || 'Falha ao cadastrar o item. Tente novamente.';
            setMessage(errorMessage);
            console.error('Erro ao cadastrar o item:', error);
        });
    };
    
    const handlePrintQr = () => {
        const qrCodeElement = document.getElementById('qr-code-to-print-cadastro');
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

    return (
        <div className="registration-page">
            <Navbar />
            <main className="registration-content">
                <div className="form-container">
                    <h1>Cadastro de Novo Item</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nº Patrimônio Anterior</label>
                                <input type="text" name="numeroPatrimonioAnterior" value={formData.numeroPatrimonioAnterior} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Nº Patrimônio</label>
                                <input type="text" name="numeroPatrimonio" value={formData.numeroPatrimonio} onChange={handleChange} required />
                            </div>
                            <div className="form-group full-width">
                                <label>Descrição do Bem</label>
                                <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Classificação</label>
                                <select name="classificacao" value={formData.classificacao} onChange={handleChange}>
                                    <option value="BOM">Bom</option>
                                    <option value="OTIMO">Ótimo</option>
                                    <option value="INSERVIVEL">Inservível</option>
                                    <option value="OCIOSO">Ocioso</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Setor</label>
                                <select name="setor" value={formData.setor} onChange={handleChange} required>
                                    <option value="" disabled>Selecione um setor</option>
                                    {sectors.map(sector => (
                                        <option key={sector._id} value={sector._id}>{sector.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Outra Identificação</label>
                                <input type="text" name="outraIdentificacao" value={formData.outraIdentificacao} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Data de Entrada</label>
                                <input type="date" name="entrada" value={formData.entrada} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Valor do Item (R$)</label>
                                <input type="number" name="valor" value={formData.valor} onChange={handleChange} step="0.01" min="0" required />
                            </div>
                            <div className="form-group">
                                <label>Taxa de Depreciação Anual (%)</label>
                                <input type="number" name="taxaDepreciacao" value={formData.taxaDepreciacao} onChange={handleChange} step="1" min="0" max="100" required placeholder="Ex: 10 para 10%" />
                            </div>
                            <div className="form-group">
                                <label>Foto do Equipamento</label>
                                <input type="file" id="file-input" name="foto" onChange={handleFileChange} />
                            </div>
                            <div className="form-group full-width">
                                <label>Observação</label>
                                <textarea name="observacao" value={formData.observacao} onChange={handleChange}></textarea>
                            </div>
                        </div>
                        <button type="submit" className="submit-button">Cadastrar Item</button>
                    </form>
                    {isError && message && <p className={`form-message ${isError ? 'error' : 'success'}`}>{message}</p>}
                </div>
            </main>

            <Modal isOpen={!!qrCodeData} onRequestClose={() => setQrCodeData(null)} className="qr-code-modal" overlayClassName="modal-overlay">
                {qrCodeData && (
                    <>
                        <div id="qr-code-to-print-cadastro">
                            <h2>{qrCodeData.descricao}</h2>
                            <p>Patrimônio: {qrCodeData.numeroPatrimonio}</p>
                            <div className="qr-code-container">
                                <QRCodeSVG 
                                    value={qrCodeData.numeroPatrimonio} 
                                    size={256}
                                    includeMargin={true}
                                />
                            </div>
                        </div>
                        <div className="qr-modal-buttons">
                            <button onClick={handlePrintQr} className="qr-print-button">Imprimir</button>
                            <button onClick={() => setQrCodeData(null)} className="modal-close-button-qr">Fechar</button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default RegistrationScreen;