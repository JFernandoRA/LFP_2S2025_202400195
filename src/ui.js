class UIManager {
    constructor() {
        this.fileContent = "";
        this.lexer = null;
        this.tournament = null;
        this.tournamentData = null;
        this.dotContent = "";

        // Referencias a elementos del DOM
        this.fileInput = document.getElementById('fileInput');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        this.downloadDotBtn = document.getElementById('downloadDotBtn');

        this.initEventListeners();
    }

    initEventListeners() {
        this.fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.fileContent = e.target.result;
                    this.analyzeBtn.disabled = false; 
                    console.log("Archivo cargado exitosamente.");
                };
                reader.onerror = () => {
                    alert("Error al leer el archivo.");
                };
                reader.readAsText(file);
            }
        });

        this.analyzeBtn.addEventListener('click', () => {
            this.analyzeFile();
        });

        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        this.downloadDotBtn.addEventListener('click', () => {
            this.downloadDotFile();
        });
    }

    switchTab(tabId) {
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabPanes.forEach(pane => pane.classList.remove('active'));

        // Agregar clase 'active' al botón y panel seleccionados
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }

    analyzeFile() {
        if (!this.fileContent) {
            alert("Por favor, carga un archivo primero.");
            return;
        }

        console.log("Iniciando análisis léxico...");

        try {
            this.lexer = new Lexer(this.fileContent);
            const tokens = this.lexer.analizar();

            const validTokens = tokens.filter(token => token.tipo !== "ERROR");
            const lexicalErrors = tokens.filter(token => token.tipo === "ERROR");

            this.displayTokens(validTokens);
            this.displayErrors(lexicalErrors);

            if (lexicalErrors.length > 0) {
                alert(`Se encontraron ${lexicalErrors.length} errores léxicos. Revise la pestaña 'Errores'.`);
                this.switchTab('errors');
                return;
            }

            console.log("Análisis léxico completado. Iniciando parseo...");
            this.tournament = new Tournament(validTokens);
            const parseResult = this.tournament.parse();

            if (!parseResult.success || (parseResult.errors && parseResult.errors.length > 0)) {
                alert("Se encontraron errores de sintaxis. Revise la consola.");
                console.error("Errores de parseo:", parseResult.errors);
                return;
            }

            this.tournament.calculateStatistics();
            this.tournamentData = this.tournament.tournamentData;

            this.displayStandings(this.tournament.generateStandingsReport());
            this.displayScorers(this.tournament.generateTopScorersReport());
            this.displayGeneralInfo(this.tournament.generateGeneralInfoReport());
            this.generateAndDisplayDot();
            this.downloadDotBtn.disabled = false;

            alert("Análisis completado con éxito");
            this.switchTab('standings');
        } catch (error) {
            console.error("Error fatal:", error);
            alert("Hubo un error inesperado. Por favor, revise la consola (F12).");
        }
    }

    displayTokens(tokens) {
        const tableBody = document.getElementById('tokensTableBody');
        tableBody.innerHTML = '';
        tokens.forEach((token, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.escapeHtml(token.lexema)}</td>
                <td>${token.tipo}</td>
                <td>${token.linea}</td>
                <td>${token.columna}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    displayErrors(errors) {
        const tableBody = document.getElementById('errorsTableBody');
        tableBody.innerHTML = '';
        if (errors.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">✅ No se encontraron errores léxicos.</td></tr>';
            return;
        }
        errors.forEach((error, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.escapeHtml(error.lexema)}</td>
                <td>${error.tipo}</td>
                <td>${error.descripcion}</td>
                <td>${error.linea}</td>
                <td>${error.columna}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    displayStandings(standings) {
        const tableBody = document.getElementById('standingsTableBody');
        tableBody.innerHTML = '';
        standings.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.position}</td>
                <td>${item.team}</td>
                <td>${item.matchesPlayed}</td>
                <td>${item.matchesWon}</td>
                <td>${item.matchesLost}</td>
                <td>${item.goalsFor}</td>
                <td>${item.goalsAgainst}</td>
                <td>${item.goalDifference}</td>
                <td>${item.reachedPhase}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    displayScorers(scorers) {
        const tableBody = document.getElementById('scorersTableBody');
        tableBody.innerHTML = '';
        scorers.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.position}</td>
                <td>${item.player}</td>
                <td>${item.team}</td>
                <td>${item.goals}</td>
                <td>${item.minutes}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    displayGeneralInfo(info) {
        const tableBody = document.getElementById('infoTableBody');
        tableBody.innerHTML = '';
        const infoMap = [
            { key: "Nombre del Torneo", value: info.tournamentName },
            { key: "Sede", value: info.venue || "No especificada" },
            { key: "Equipos Participantes", value: info.totalTeams },
            { key: "Total de Partidos", value: info.totalMatches },
            { key: "Partidos Completados", value: info.completedMatches },
            { key: "Total de Goles", value: info.totalGoals },
            { key: "Promedio Goles/Partido", value: info.averageGoalsPerMatch },
            { key: "Edad Promedio Jugadores", value: `${info.averagePlayerAge} años` },
            { key: "Fase Actual", value: info.currentPhase }
        ];
        infoMap.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${item.key}</td><td>${item.value}</td>`;
            tableBody.appendChild(row);
        });
    }

    generateAndDisplayDot() {
        if (!this.tournamentData) {
            console.warn("No hay datos de torneo para generar DOT.");
            return;
        }
        const dotGenerator = new GraphvizGenerator(this.tournamentData);
        this.dotContent = dotGenerator.generateDot();
        document.getElementById('dotContent').textContent = this.dotContent;
    }

    downloadDotFile() {
        if (!this.dotContent) {
            alert("No hay contenido DOT para descargar.");
            return;
        }
        const blob = new Blob([this.dotContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tournament_bracket.dot';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UIManager();
});