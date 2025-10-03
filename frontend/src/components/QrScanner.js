// frontend/src/components/QrScanner.js
import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './QrScanner.css';

const QrScanner = ({ onScanSuccess, onScanError, onClose }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            'qr-reader', 
            {
                qrbox: {
                    width: 250,
                    height: 250,
                },
                fps: 10,
            },
            false // verbose
        );

        function success(result) {
            scanner.clear();
            onScanSuccess(result);
        }

        function error(err) {
            // onScanError(err); // Descomente se quiser feedback contínuo de erros
        }

        scanner.render(success, error);

        // Função de limpeza para parar a câmera quando o componente for desmontado
        return () => {
            scanner.clear().catch(error => {
                console.error("Falha ao limpar o scanner.", error);
            });
        };
    }, [onScanSuccess, onScanError]);

    return (
        <div className="qr-scanner-overlay">
            <div className="qr-scanner-modal">
                <div id="qr-reader"></div>
                <button onClick={onClose} className="qr-close-button">Cancelar</button>
            </div>
        </div>
    );
};

export default QrScanner;