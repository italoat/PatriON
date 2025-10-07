// frontend/src/components/DashboardScreen.js (VERSÃO DARK MODE COM NOVO GRÁFICO)

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

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() { setSize([window.innerWidth, window.innerHeight]); }
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
    const { width } = useWindowSize();

    const barChartRef = useRef();
    const doughnutChartRef = useRef();
    const valueChartRef = useRef();
    const valueBySectorChartRef = useRef(); // Ref para o novo gráfico

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
        if (!chartFilter.type || !chartFilter.value) { setFilteredInventory(inventoryData); } 
        else { const filtered = inventoryData.filter(item => (item.setor && item.setor.nome.trim() === chartFilter.value) || (item[chartFilter.type] || '').trim() === chartFilter.value); setFilteredInventory(filtered); }
    }, [inventoryData, chartFilter]);

    const processDataForChart = (columnName) => filteredInventory.reduce((acc, item) => { const key = (item[columnName] || 'Não Definido').trim(); acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const calculateTotalValues = () => filteredInventory.reduce((totals, item) => { totals.totalValor += item.valor || 0; totals.totalValorAtual += item.valorAtual || 0; return totals; }, { totalValor: 0, totalValorAtual: 0 });
    
    // Nova função para calcular o valor por setor
    const calculateValueBySector = () => {
        return filteredInventory.reduce((acc, item) => {
            const sectorName = item.setor ? item.setor.nome.trim() : 'Sem Setor';
            acc[sectorName] = (acc[sectorName] || 0) + (item.valor || 0);
            return acc;
        }, {});
    };
    
    const totals = calculateTotalValues();
    const barChartProcessedData = processDataForChart('outraIdentificacao');
    const doughnutChartProcessedData = processDataForChart('classificacao');
    const valueBySectorProcessed = calculateValueBySector();
    
    const barChartData = { labels: Object.keys(barChartProcessedData), datasets: [{ label: 'Contagem', data: Object.values(barChartProcessedData), backgroundColor: 'rgba(153, 102, 255, 0.6)' }] };
    const doughnutChartData = { labels: Object.keys(doughnutChartProcessedData), datasets: [{ data: Object.values(doughnutChartProcessedData), backgroundColor: ['#4BC0C0', '#FF6384', '#FFCE56', '#9966FF', '#36A2EB', '#FF9F40', '#C9CBCF'] }] };
    const valueComparisonData = { labels: ['Valor Contábil Total', 'Valor Atual Total (Depreciado)'], datasets: [{ data: [totals.totalValor, totals.totalValorAtual], backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)'], borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'], borderWidth: 1 }] };
    
    // Novos dados para o gráfico de valor por setor
    const valueBySectorData = {
        labels: Object.keys(valueBySectorProcessed),
        datasets: [{
            label: 'Valor Contábil (R$)',
            data: Object.values(valueBySectorProcessed),
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
        }],
    };

    const handleChartClick = (event, ref, type) => {
        const element = getElementAtEvent(ref.current, event);
        if (element.length > 0) {
            const chartData = ref.current.data;
            const clickedLabel = chartData.labels[element[0].index];
            setChartFilter({ type: type, value: clickedLabel });
        }
    };
    
    const handleGeneratePdf = () => { /* (código existente, sem alterações) */ };

    // --- OPÇÕES DE ESTILO PARA OS GRÁFICOS NO TEMA ESCURO ---
    const chartDefaultOptions = {
        scales: {
            x: { ticks: { color: 'var(--secondary-text-color)' }, grid: { color: 'var(--border-color)' } },
            y: { ticks: { color: 'var(--secondary-text-color)' }, grid: { color: 'var(--border-color)' } }
        },
        plugins: {
            legend: { labels: { color: 'var(--primary-text-color)' } }
        }
    };
    
    const valueBySectorOptions = {
        ...chartDefaultOptions,
        indexAxis: 'y',
        responsive: true,
        plugins: {
            ...chartDefaultOptions.plugins,
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return formatCurrency(context.raw);
                    }
                }
            },
            datalabels: {
                display: width > 768,
                anchor: 'end',
                align: 'right',
                formatter: (value) => formatCurrency(value),
                color: 'var(--primary-text-color)',
                font: { weight: 'bold' }
            }
        },
        layout: { padding: { right: width > 768 ? 120 : 10 } }
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
                                <Bar ref={valueChartRef} data={valueComparisonData} options={{...chartDefaultOptions, layout: { padding: { top: 30 } }, plugins: {...chartDefaultOptions.plugins, legend: { display: false }, datalabels: { anchor: 'end', align: 'top', formatter: (value) => formatCurrency(value), color: 'var(--primary-text-color)', font: { weight: 'bold' } } } }} />
                            </div>
                            <div className="chart-card">
                                <h3>Bens por Classificação</h3>
                                <Doughnut ref={doughnutChartRef} data={doughnutChartData} onClick={(e) => handleChartClick(e, doughnutChartRef, 'classificacao')} options={{plugins: {...chartDefaultOptions.plugins, datalabels: { color: 'white', backgroundColor: (context) => context.dataset.backgroundColor[context.dataIndex], borderRadius: 4, padding: 6, font: { weight: 'bold' } } }}} />
                            </div>
                            <div className="chart-card span-two-columns">
                                <div className="dual-chart-container">
                                    <div className="chart-wrapper">
                                        <h3>Top Bens por Identificação</h3>
                                        <Bar ref={barChartRef} data={barChartData} onClick={(e) => handleChartClick(e, barChartRef, 'outraIdentificacao')} options={{...chartDefaultOptions, indexAxis: 'y', plugins: {...chartDefaultOptions.plugins, legend: {display: false}, datalabels: { display: false } }}} />
                                    </div>
                                    <div className="chart-wrapper">
                                        <h3>Valor Contábil por Setor</h3>
                                        <Bar ref={valueBySectorChartRef} data={valueBySectorData} options={valueBySectorOptions} />
                                    </div>
                                </div>
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