// frontend/src/components/DashboardScreen.js (VERSÃO FINAL E COMPLETA)

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './DashboardScreen.css';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Doughnut, getElementAtEvent } from 'react-chartjs-2';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);

const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Hook customizado para observar o tamanho da janela
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

const DashboardScreen = () => {
    const [sectors, setSectors] = useState([]);
    const [selectedSectorId, setSelectedSectorId] = useState('Todos');
    const [inventoryData, setInventoryData] = useState([]);
    const [filteredInventory, setFilteredInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartFilter, setChartFilter] = useState({ type: null, value: null });
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    // Usa o hook para obter a largura da tela
    const { width } = useWindowSize();

    const barChartRef = useRef();
    const doughnutChartRef = useRef();
    const valueChartRef = useRef();

    useEffect(() => {
        axios.get(`https://patrion.onrender.com/api/sectors`)
            .then(response => setSectors(response.data))
            .catch(error => console.error("Erro ao buscar setores:", error));
    }, []);

    useEffect(() => {
        setLoading(true);
        const url = `https://patrion.onrender.com/api/inventory?setorId=${selectedSectorId}`;
        axios.get(url)
            .then(response => { setInventoryData(response.data); })
            .catch(error => { console.error("Erro ao buscar dados do inventário:", error); })
            .finally(() => { setLoading(false); });
    }, [selectedSectorId]);

    useEffect(() => {
        if (!chartFilter.type || !chartFilter.value) {
            setFilteredInventory(inventoryData);
        } else {
            const filtered = inventoryData.filter(item => (item[chartFilter.type] || '').trim() === chartFilter.value);
            setFilteredInventory(filtered);
        }
    }, [inventoryData, chartFilter]);

    const processDataForChart = (columnName) => {
        return filteredInventory.reduce((acc, item) => {
            const key = (item[columnName] || 'Não Definido').trim();
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    };
    
    const calculateTotalValues = () => {
        return filteredInventory.reduce((totals, item) => {
            totals.totalValor += item.valor || 0;
            totals.totalValorAtual += item.valorAtual || 0;
            return totals;
        }, { totalValor: 0, totalValorAtual: 0 });
    };
    
    const totals = calculateTotalValues();

    const barChartData = {
        labels: Object.keys(processDataForChart('outraIdentificacao')),
        datasets: [{
            label: 'Contagem',
            data: Object.values(processDataForChart('outraIdentificacao')),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
        }],
    };
    
    const doughnutChartData = {
        labels: Object.keys(processDataForChart('classificacao')),
        datasets: [{
            data: Object.values(processDataForChart('classificacao')),
            backgroundColor: ['#4BC0C0', '#FF6384', '#FFCE56', '#9966FF', '#36A2EB', '#FF9F40', '#C9CBCF'],
        }],
    };
    
    const valueComparisonData = {
        labels: ['Valor Contábil Total', 'Valor Atual Total (Depreciado)'],
        datasets: [{
            data: [totals.totalValor, totals.totalValorAtual],
            backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)'],
            borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'],
            borderWidth: 1,
        }]
    };

    const handleBarChartClick = (event) => {
        const element = getElementAtEvent(barChartRef.current, event);
        if (element.length > 0) {
            const clickedLabel = barChartData.labels[element[0].index];
            setChartFilter({ type: 'outraIdentificacao', value: clickedLabel });
        }
    };
    
    const handleDoughnutChartClick = (event) => {
        const element = getElementAtEvent(doughnutChartRef.current, event);
        if (element.length > 0) {
            const clickedLabel = doughnutChartData.labels[element[0].index];
            setChartFilter({ type: 'classificacao', value: clickedLabel });
        }
    };

    const handleGeneratePdf = () => {
        setIsGeneratingPdf(true);
        const reportElement = document.getElementById('dashboard-report');
        const titleElement = reportElement.querySelector('.dashboard-title');
        const originalTitle = titleElement.innerText;
        titleElement.innerText = 'Relatório de Patrimônio';
        document.body.classList.add('pdf-generating');
        
        html2canvas(reportElement, { useCORS: true, scale: 1.5 })
            .then(canvas => {
                titleElement.innerText = originalTitle;
                document.body.classList.remove('pdf-generating');
                const imgData = canvas.toDataURL('image/jpeg', 0.7);
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const totalPdfHeight = canvasHeight * pdfWidth / canvasWidth;
                let position = 0;
                let heightLeft = totalPdfHeight;
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight, undefined, 'FAST');
                heightLeft -= pdfHeight;
                while (heightLeft > 0) {
                    position = -heightLeft;
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight, undefined, 'FAST');
                    heightLeft -= pdfHeight;
                }
                pdf.save('relatorio-patrimonio.pdf');
                setIsGeneratingPdf(false);
            })
            .catch(err => {
                titleElement.innerText = originalTitle;
                document.body.classList.remove('pdf-generating');
                setIsGeneratingPdf(false);
                alert("Ocorreu um erro ao gerar o PDF.");
            });
    };

    // Cria as opções do gráfico de forma condicional, baseada na largura da tela
    const topBensChartOptions = {
        responsive: true,
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
            datalabels: {
                display: width > 768, // true se for desktop, false se for mobile
                anchor: 'end',
                align: 'right',
                offset: 8,
                color: 'white',
                backgroundColor: (context) => context.dataset.backgroundColor,
                borderRadius: 4,
                padding: 4,
                font: { weight: 'bold' }
            }
        },
        layout: {
            padding: {
                right: width > 768 ? 80 : 10
            }
        }
    };

    return (
        <div className="dashboard-page">
            <Navbar />
            <main className="dashboard-content">
                <div className="header-actions">
                    <div className="filter-container">
                        <label htmlFor="sector-filter">Filtrar por Setor:</label>
                        <select id="sector-filter" value={selectedSectorId} onChange={(e) => { setSelectedSectorId(e.target.value); setChartFilter({ type: null, value: null }); }}>
                            <option value="Todos">Todos os Setores</option>
                            {sectors.map(sector => <option key={sector._id} value={sector._id}>{sector.nome}</option>)}
                        </select>
                    </div>
                    <button onClick={handleGeneratePdf} disabled={isGeneratingPdf} className="pdf-button">
                        {isGeneratingPdf ? 'Gerando...' : 'Gerar Relatório PDF'}
                    </button>
                </div>

                {loading ? <p className="loading-message">Carregando...</p> : (
                    <div id="dashboard-report">
                        <h1 className="dashboard-title">Dashboard de Patrimônio</h1>
                        <div className="charts-grid">
                            <div className="chart-card">
                                <h3>Valor Contábil vs. Valor Atual</h3>
                                <Bar 
                                    ref={valueChartRef} 
                                    data={valueComparisonData}
                                    options={{
                                        layout: { padding: { top: 30 } },
                                        plugins: {
                                            legend: { display: false },
                                            datalabels: {
                                                anchor: 'end',
                                                align: 'top',
                                                formatter: (value) => formatCurrency(value),
                                                color: '#444',
                                                font: { weight: 'bold' }
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div className="chart-card">
                                <h3>Bens por Classificação</h3>
                                <Doughnut 
                                    ref={doughnutChartRef} 
                                    data={doughnutChartData} 
                                    onClick={handleDoughnutChartClick}
                                    options={{
                                        plugins: {
                                            datalabels: {
                                                color: 'white',
                                                backgroundColor: (context) => context.dataset.backgroundColor[context.dataIndex],
                                                borderRadius: 4,
                                                padding: 6,
                                                font: { weight: 'bold' }
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div className="chart-card full-width-chart">
                                <h3>Top Bens por Identificação</h3>
                                <Bar 
                                    ref={barChartRef} 
                                    data={barChartData} 
                                    onClick={handleBarChartClick} 
                                    options={topBensChartOptions} 
                                />
                            </div>
                        </div>
                        <div className="table-section">
                            <div className="table-header">
                                <h2>Itens Exibidos {chartFilter.value ? `(Filtro: ${chartFilter.value})` : '(Todos)'}</h2>
                                {chartFilter.value && ( <button onClick={() => setChartFilter({ type: null, value: null })} className="clear-filter-button">Limpar Filtro</button> )}
                            </div>
                            <div className="table-container">
                                <table className="inventory-table">
                                    <thead>
                                        <tr>
                                            <th>Nº Patrimônio</th>
                                            <th>Descrição</th>
                                            <th>Setor</th>
                                            <th>Outra Identificação</th>
                                            <th>Valor Contábil</th>
                                            <th>Valor Depreciado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInventory.map(item => (
                                            <tr key={item._id}>
                                                <td>{item.numeroPatrimonio}</td>
                                                <td>{item.descricao}</td>
                                                <td>{item.setor ? item.setor.nome : 'N/A'}</td>
                                                <td>{item.outraIdentificacao}</td>
                                                <td>{formatCurrency(item.valor)}</td>
                                                <td>{formatCurrency(item.valorAtual)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardScreen;