// Configuration
const CONFIG = {
    GOOGLE_SHEETS_API_KEY: '', // Will be loaded from environment or public API
    SPREADSHEET_ID: '1DHY3yb-yq1Liq7OU8A-90J_82YbT_rpG7ZYIwKD2tMQ',
    EVENTS_SPREADSHEET_ID: '1xZ61dtzhYiAxR3yC4q662r4NPOSrjWEYPDpMMpDYU70',
    SHEETS: {
        GENERAL_SUMMARY: 'RESUMO GERAL',
        DIVISIONS_SUMMARY: 'RESUMO DAS DIVISÕES',
        DIVISIONS_HISTORY: 'HISTÓRICO DAS DIVISÕES',
        FRIENDLIES_STATS: 'ESTATÍSTICAS DE AMISTOSOS (GERAL)',
        INTERNAL_RANKING: 'RANKING DE AMISTOSOS INTERNOS',
        EXTERNAL_RANKING: 'RANKING DE AMISTOSOS EXTERNOS',
        VALYRIAN_ASCENT: 'I VALYRIAN ASCENT (2ª DIVISÃO)',
        COMBAT_CHAMPIONSHIP: 'CAMPEONATO DE COMBATE (3ª DIVISÃO)'
    }
};

// Global variables
let currentSection = 'home';
let navOpen = false;
let particlesAnimation;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeParticles();
    setupEventListeners();
    
    // Show splash screen initially
    showSplashScreen();
    
    // Auto-refresh data every 30 seconds
    setInterval(() => {
        if (!document.getElementById('splash-screen').classList.contains('active')) {
            loadAllData();
        }
    }, 30000);
});

// Splash Screen Functions
function showSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    
    splashScreen.classList.add('active');
    mainContent.classList.remove('active');
    
    // Disable scroll on body
    document.body.style.overflow = 'hidden';
}

function enterKingdom() {
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    
    splashScreen.classList.remove('active');
    mainContent.classList.add('active');
    
    // Enable scroll on body
    document.body.style.overflow = 'auto';
    
    // Load initial data
    loadAllData();
}

// Particle System
function initializeParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = Math.random() * 0.5 + 0.5;
            this.size = Math.random() * 3 + 1;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.color = `rgba(128, 128, 128, ${this.opacity})`;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            // Reset particle if it goes off screen
            if (this.y > canvas.height) {
                this.y = -10;
                this.x = Math.random() * canvas.width;
            }
            
            if (this.x < 0 || this.x > canvas.width) {
                this.vx = -this.vx;
            }
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Create particles
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        particlesAnimation = requestAnimationFrame(animate);
    }
    
    animate();
}

// Navigation Functions
function toggleNav() {
    navOpen = !navOpen;
    const navItems = document.getElementById('nav-items');
    
    if (navOpen) {
        navItems.classList.add('active');
    } else {
        navItems.classList.remove('active');
    }
}

function navigateToSection(sectionId) {
    // Hide current section
    const currentSectionElement = document.getElementById(currentSection);
    if (currentSectionElement) {
        currentSectionElement.classList.remove('active');
    }
    
    // Show new section
    const newSectionElement = document.getElementById(sectionId);
    if (newSectionElement) {
        setTimeout(() => {
            newSectionElement.classList.add('active');
        }, 100);
    }
    
    currentSection = sectionId;
    
    // Close navigation
    navOpen = false;
    document.getElementById('nav-items').classList.remove('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event Listeners
function setupEventListeners() {
    // Close navigation when clicking outside
    document.addEventListener('click', function(e) {
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu.contains(e.target) && navOpen) {
            toggleNav();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        // Reinitialize particles if needed
        if (particlesAnimation) {
            cancelAnimationFrame(particlesAnimation);
            initializeParticles();
        }
    });
}

// FAQ Functions
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Toggle current item
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Data Loading Functions
async function loadAllData() {
    try {
        await Promise.all([
            loadGeneralStats(),
            loadDivisionsData(),
            loadFriendliesStats(),
            loadRankings(),
            loadEvents()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
        showErrorMessage('Erro ao carregar dados. Verifique sua conexão.');
    }
}

async function fetchGoogleSheetData(spreadsheetId, sheetName, gid = null) {
    try {
        let url;
        if (gid) {
            // Use gid for specific sheet tab
            url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
        } else {
            // Fallback to sheet name
            url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        }
        
        console.log(`Fetching data from: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error(`Error fetching data from sheet ${sheetName}:`, error);
        throw error;
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            // Simple CSV parsing with proper quote handling
            const values = line.split(',').map(value => {
                // Remove outer quotes and decode HTML entities
                let cleanValue = value.replace(/^"(.*)"$/, '$1').trim();
                // Handle common HTML entities
                cleanValue = cleanValue.replace(/&quot;/g, '"');
                cleanValue = cleanValue.replace(/&#39;/g, "'");
                cleanValue = cleanValue.replace(/&amp;/g, '&');
                return cleanValue;
            });
            result.push(values);
        }
    }
    
    return result;
}

function formatPercentage(value) {
    if (!value || value === 'N/A' || value === '-' || value === '#DIV/0!') {
        return '0,00%';
    }
    
    // Clean the value and extract the number
    let cleanValue = String(value).replace(/['"]/g, '').trim();
    
    // Extract just the number part (remove % if present)
    const numericValue = cleanValue.replace('%', '').replace(',', '.');
    
    const numValue = parseFloat(numericValue);
    if (isNaN(numValue)) {
        return '0,00%';
    }
    
    // Format to 2 decimal places with comma and % sign
    return `${numValue.toFixed(2).replace('.', ',')}%`;
}

async function loadGeneralStats() {
    try {
        const data = await fetchGoogleSheetData(CONFIG.SPREADSHEET_ID, CONFIG.SHEETS.GENERAL_SUMMARY);
        
        if (data.length > 1) {
            // Assuming the data structure has specific cells for each stat
            updateGeneralStatsDisplay({
                currentTrophies: data[1][0] || 'N/A',
                lastMonthTrophies: data[1][1] || 'N/A',
                trophyIncrease: data[1][2] || 'N/A',
                trophyGrowth: data[1][3] || 'N/A'
            });
        }
    } catch (error) {
        console.error('Error loading general stats:', error);
        updateGeneralStatsDisplay({
            currentTrophies: 'Erro',
            lastMonthTrophies: 'Erro',
            trophyIncrease: 'Erro',
            trophyGrowth: 'Erro'
        });
    }
}

function updateGeneralStatsDisplay(stats) {
    document.getElementById('current-trophies').textContent = stats.currentTrophies;
    document.getElementById('last-month-trophies').textContent = stats.lastMonthTrophies;
    document.getElementById('trophy-increase').textContent = stats.trophyIncrease;
    document.getElementById('trophy-growth').textContent = stats.trophyGrowth;
}

async function loadDivisionsData() {
    try {
        const data = await fetchGoogleSheetData(CONFIG.SPREADSHEET_ID, CONFIG.SHEETS.DIVISIONS_SUMMARY);
        const historyData = await fetchGoogleSheetData(CONFIG.SPREADSHEET_ID, CONFIG.SHEETS.DIVISIONS_HISTORY);
        
        displayDivisionsData(data, historyData);
    } catch (error) {
        console.error('Error loading divisions data:', error);
        document.getElementById('divisions-grid').innerHTML = '<div class="error">Erro ao carregar dados das divisões</div>';
    }
}

function displayDivisionsData(data, historyData) {
    const container = document.getElementById('divisions-grid');
    container.innerHTML = '';
    
    if (data.length <= 1) {
        container.innerHTML = '<div class="error">Nenhum dado de divisão encontrado</div>';
        return;
    }
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length >= 5) {
            const divisionCard = createDivisionCard({
                name: row[0] || 'Divisão',
                currentTrophies: row[1] || '0',
                lastMonthTrophies: row[2] || '0',
                absoluteGrowth: row[3] || '0',
                percentageGrowth: formatPercentage(row[4] || '0')
            });
            container.appendChild(divisionCard);
        }
    }
}

function createDivisionCard(division) {
    const card = document.createElement('div');
    card.className = 'division-card';
    
    card.innerHTML = `
        <div class="division-header">
            <h3 class="division-name">${division.name}</h3>
        </div>
        <div class="division-stats">
            <div class="stat-item">
                <span class="stat-label">Troféus atuais:</span>
                <span class="stat-value yellow">${division.currentTrophies}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Troféus anteriores:</span>
                <span class="stat-value green">${division.lastMonthTrophies}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Crescimento:</span>
                <span class="stat-value">${division.absoluteGrowth}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Percentual:</span>
                <span class="stat-value">${division.percentageGrowth}</span>
            </div>
        </div>
        <div class="chart-container">
            <canvas id="chart-${division.name.replace(/\s+/g, '-').toLowerCase()}"></canvas>
        </div>
    `;
    
    return card;
}

async function loadFriendliesStats() {
    try {
        // Use the correct GID for ESTATÍSTICAS DE AMISTOSOS (GERAL) - gid=1495936206
        const data = await fetchGoogleSheetData(CONFIG.SPREADSHEET_ID, CONFIG.SHEETS.FRIENDLIES_STATS, '1495936206');
        
        console.log('Friendlies data structure:', data); // Debug log
        
        // Find the "Geral" row 
        let geralRow = null;
        for (let i = 0; i < data.length; i++) {
            if (data[i] && data[i][0]) {
                // Look for row that contains "Geral" in first column
                if (data[i][0].toString().toLowerCase().includes('geral')) {
                    geralRow = data[i];
                    console.log('Found Geral row:', geralRow); // Debug log
                    break;
                }
            }
        }
        
        // If not found by "Geral", look for the last row with numeric data (totals)
        if (!geralRow) {
            for (let i = data.length - 1; i >= 0; i--) {
                if (data[i] && data[i].length >= 6 && data[i][1] && !isNaN(parseFloat(data[i][1]))) {
                    geralRow = data[i];
                    console.log('Found totals row at index:', i, geralRow); // Debug log
                    break;
                }
            }
        }
        
        if (geralRow && geralRow.length >= 6) {
            // Based on the actual spreadsheet structure from the image:
            // Column B: Duração Total, C: Entradas Totais, D: Vitórias Externas, E: Derrotas Externas, F: Total de Amistosos, G: Porcentagem de Vitória
            updateFriendliesStatsDisplay({
                totalDuration: geralRow[1] || 'N/A', // Duração Total (column B)
                totalFriendlies: geralRow[5] || 'N/A', // Total de Amistosos (column F)
                playerEntries: geralRow[2] || 'N/A', // Entradas Totais (column C)
                externalFriendlies: geralRow[5] || 'N/A', // Amistosos externos realizados (use total amistosos)
                externalWins: geralRow[3] || 'N/A', // Vitórias Externas (column D)
                externalWinRate: formatPercentage(geralRow[6] || '0') // Porcentagem de Vitória (column G)
            });
        } else {
            // Fallback: show loading state
            updateFriendliesStatsDisplay({
                totalDuration: 'Carregando...',
                totalFriendlies: 'Carregando...',
                playerEntries: 'Carregando...',
                externalFriendlies: 'Carregando...',
                externalWins: 'Carregando...',
                externalWinRate: 'Carregando...'
            });
        }
    } catch (error) {
        console.error('Error loading friendlies stats:', error);
        updateFriendliesStatsDisplay({
            totalDuration: 'Erro',
            totalFriendlies: 'Erro',
            playerEntries: 'Erro',
            externalFriendlies: 'Erro',
            externalWins: 'Erro',
            externalWinRate: 'Erro'
        });
    }
}

function updateFriendliesStatsDisplay(stats) {
    document.getElementById('total-duration').textContent = stats.totalDuration;
    document.getElementById('total-friendlies').textContent = stats.totalFriendlies;
    document.getElementById('player-entries').textContent = stats.playerEntries;
    document.getElementById('external-friendlies').textContent = stats.externalFriendlies;
    document.getElementById('external-wins').textContent = stats.externalWins;
    document.getElementById('external-win-rate').textContent = stats.externalWinRate;
}

async function loadRankings() {
    try {
        const [internalData, externalData] = await Promise.all([
            fetchGoogleSheetData(CONFIG.SPREADSHEET_ID, CONFIG.SHEETS.INTERNAL_RANKING, '976364986'), // Internal ranking GID
            fetchGoogleSheetData(CONFIG.SPREADSHEET_ID, CONFIG.SHEETS.EXTERNAL_RANKING, '1220359607') // External ranking GID
        ]);
        
        displayInternalRanking(internalData);
        displayExternalRanking(externalData);
    } catch (error) {
        console.error('Error loading rankings:', error);
        document.getElementById('internal-ranking-table').querySelector('tbody').innerHTML = 
            '<tr><td colspan="5">Erro ao carregar ranking interno</td></tr>';
        document.getElementById('external-ranking-table').querySelector('tbody').innerHTML = 
            '<tr><td colspan="7">Erro ao carregar ranking externo</td></tr>';
    }
}

function displayInternalRanking(data) {
    const tbody = document.getElementById('internal-ranking-table').querySelector('tbody');
    tbody.innerHTML = '';
    
    if (data.length <= 1) {
        tbody.innerHTML = '<tr><td colspan="5">Nenhum dado encontrado</td></tr>';
        return;
    }
    
    let allPlayers = [];
    
    // Find and skip header rows, process only player data
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row && row.length >= 5) {
            // Skip header rows and empty rows
            const playerName = row[0] ? row[0].toString().trim() : '';
            const division = row[1] ? row[1].toString().trim() : '';
            
            // Skip if it's a header row, empty, or contains dropdown markers
            if (playerName && division && 
                !playerName.toLowerCase().includes('jogador') &&
                !playerName.toLowerCase().includes('nome') &&
                !division.toLowerCase().includes('divisão') &&
                !division.includes('▼') &&
                playerName !== 'N/A' &&
                playerName !== '-' &&
                division !== '-') {
                
                allPlayers.push(row);
            }
        }
    }
    
    // Display first 20 players
    const playersToShow = allPlayers.slice(0, 20);
    playersToShow.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row[0]}</td>
            <td>${row[1]}</td>
            <td>${row[2] || '0'}</td>
            <td>${row[3] || '0'}</td>
            <td>${formatPercentage(row[4] || '0')}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add "Load More" button if there are more players
    if (allPlayers.length > 20) {
        const loadMoreRow = document.createElement('tr');
        loadMoreRow.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 1rem;">
                <button class="load-more-btn" onclick="loadMoreInternalPlayers(${JSON.stringify(allPlayers).replace(/"/g, '&quot;')})">
                    Carregar mais jogadores (${allPlayers.length - 20} restantes)
                </button>
            </td>
        `;
        tbody.appendChild(loadMoreRow);
    }
    
    if (playersToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Nenhum jogador encontrado</td></tr>';
    }
}

function displayExternalRanking(data) {
    const tbody = document.getElementById('external-ranking-table').querySelector('tbody');
    tbody.innerHTML = '';
    
    console.log('External ranking data:', data); // Debug log
    
    if (data.length <= 1) {
        tbody.innerHTML = '<tr><td colspan="7">Nenhum dado encontrado</td></tr>';
        return;
    }
    
    let allPlayers = [];
    
    // Find and skip header rows, process only player data
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row && row.length >= 7) {
            // Skip header rows and empty rows
            const playerName = row[2] ? row[2].toString().trim() : '';
            const division = row[3] ? row[3].toString().trim() : '';
            
            // More specific filtering for external ranking
            if (playerName && division && 
                playerName.toLowerCase() !== 'jogador' &&
                !playerName.toLowerCase().includes('ranking') &&
                !division.toLowerCase().includes('divisão') &&
                !division.includes('▼') &&
                playerName !== 'N/A' &&
                playerName !== '-' &&
                division !== '-' &&
                playerName.length > 2 &&
                division.toLowerCase().includes('league')) { // Only include league divisions
                
                console.log('Found external player:', playerName, division); // Debug log
                allPlayers.push(row);
            }
        }
    }
    
    // Display first 20 players
    const playersToShow = allPlayers.slice(0, 20);
    playersToShow.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row[2] || 'N/A'}</td>
            <td>${row[3] || 'N/A'}</td>
            <td>${row[4] || 'Sem time'}</td>
            <td>${row[5] || '0'}</td>
            <td>${row[6] || '0'}</td>
            <td>${row[7] || '0'}</td>
            <td>${formatPercentage(row[8] || '0')}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add "Load More" button if there are more players
    if (allPlayers.length > 20) {
        const loadMoreRow = document.createElement('tr');
        loadMoreRow.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 1rem;">
                <button class="load-more-btn" onclick="loadMoreExternalPlayers(${JSON.stringify(allPlayers).replace(/"/g, '&quot;')})">
                    Carregar mais jogadores (${allPlayers.length - 20} restantes)
                </button>
            </td>
        `;
        tbody.appendChild(loadMoreRow);
    }
    
    if (playersToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Nenhum jogador encontrado</td></tr>';
    }
}

async function loadEvents() {
    const container = document.getElementById('events-container');
    container.innerHTML = '<div class="loading">Carregando eventos...</div>';
    
    try {
        const [valyrianData, combatData] = await Promise.all([
            fetchGoogleSheetData(CONFIG.EVENTS_SPREADSHEET_ID, CONFIG.SHEETS.VALYRIAN_ASCENT),
            fetchGoogleSheetData(CONFIG.EVENTS_SPREADSHEET_ID, CONFIG.SHEETS.COMBAT_CHAMPIONSHIP)
        ]);
        
        displayEvents(valyrianData, combatData);
    } catch (error) {
        console.error('Error loading events:', error);
        container.innerHTML = '<div class="error">Erro ao carregar eventos</div>';
    }
}

function displayEvents(valyrianData, combatData) {
    const container = document.getElementById('events-container');
    container.innerHTML = '';
    
    // Valyrian Ascent Event
    if (valyrianData.length > 1) {
        const valyrianCard = createEventCard('I Valyrian Ascent (2ª Divisão)', valyrianData, ['Jogador', 'Total']);
        container.appendChild(valyrianCard);
    }
    
    // Combat Championship Event
    if (combatData.length > 1) {
        const combatCard = createEventCard('Campeonato de Combate (3ª Divisão)', combatData, 
            ['Jogador', 'Pontuação Total']);
        container.appendChild(combatCard);
    }
    
    if (container.children.length === 0) {
        container.innerHTML = '<div class="error">Nenhum evento encontrado</div>';
    }
}

function createEventCard(title, data, headers) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    console.log(`Event data for ${title}:`, data); // Debug log
    
    let tableHTML = `
        <h3 class="event-title">${title}</h3>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Skip header row and limit to top 10
    for (let i = 1; i < data.length && i <= 11; i++) {
        const row = data[i];
        if (row.length > 0 && row[0] && row[0].toString().trim() !== '') {
            tableHTML += '<tr>';
            if (headers.length === 2) {
                // Para eventos: mostrar jogador (coluna A) e pontuação total 
                // Valyrian Ascent: usar coluna Q (índice 16)
                // Combat Championship: usar coluna E (índice 4)
                const isValyrian = title && title.includes('Valyrian');
                const scoreColumn = isValyrian ? 16 : 4;
                tableHTML += `<td>${row[0] || 'N/A'}</td>`;
                tableHTML += `<td>${row[scoreColumn] || 'N/A'}</td>`;
            } else {
                // Para outros casos: mostrar todas as colunas
                for (let j = 0; j < headers.length; j++) {
                    tableHTML += `<td>${row[j] || 'N/A'}</td>`;
                }
            }
            tableHTML += '</tr>';
        }
    }
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    card.innerHTML = tableHTML;
    return card;
}

// Utility Functions
function showErrorMessage(message) {
    // Create a temporary error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-red);
        color: white;
        padding: 1rem;
        border-radius: 5px;
        z-index: 1000;
        max-width: 300px;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Initialize charts (placeholder function for future implementation)
function initializeCharts() {
    // Chart.js implementation would go here
    // This is a placeholder for future chart implementation
}

// Load more players functions
function loadMoreInternalPlayers(allPlayers) {
    const tbody = document.getElementById('internal-ranking-table').querySelector('tbody');
    
    // Remove the load more button
    const loadMoreRow = tbody.querySelector('tr:last-child');
    if (loadMoreRow && loadMoreRow.querySelector('.load-more-btn')) {
        loadMoreRow.remove();
    }
    
    // Add all remaining players
    const remainingPlayers = allPlayers.slice(20);
    remainingPlayers.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row[0]}</td>
            <td>${row[1]}</td>
            <td>${row[2] || '0'}</td>
            <td>${row[3] || '0'}</td>
            <td>${formatPercentage(row[4] || '0')}</td>
        `;
        tbody.appendChild(tr);
    });
}

function loadMoreExternalPlayers(allPlayers) {
    const tbody = document.getElementById('external-ranking-table').querySelector('tbody');
    
    // Remove the load more button
    const loadMoreRow = tbody.querySelector('tr:last-child');
    if (loadMoreRow && loadMoreRow.querySelector('.load-more-btn')) {
        loadMoreRow.remove();
    }
    
    // Add all remaining players
    const remainingPlayers = allPlayers.slice(20);
    remainingPlayers.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row[2] || 'N/A'}</td>
            <td>${row[3] || 'N/A'}</td>
            <td>${row[4] || 'Sem time'}</td>
            <td>${row[5] || '0'}</td>
            <td>${row[6] || '0'}</td>
            <td>${row[7] || '0'}</td>
            <td>${formatPercentage(row[8] || '0')}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Export functions for global access
window.enterKingdom = enterKingdom;
window.toggleNav = toggleNav;
window.navigateToSection = navigateToSection;
window.toggleFAQ = toggleFAQ;
window.loadMoreInternalPlayers = loadMoreInternalPlayers;
window.loadMoreExternalPlayers = loadMoreExternalPlayers;
