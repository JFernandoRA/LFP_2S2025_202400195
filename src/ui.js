class UIManager {
    constructor() {
        this.fileContent = "";
        this.lexer = null;
        this.tournament = null;
        this.tournamentData = null;
        this.dotContent = "";
        this.tokens = [];
        this.errors = [];

        // Referencias a elementos del DOM
        this.fileInput = document.getElementById('fileInput');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.generateTokensBtn = document.getElementById('generateTokensBtn');
        this.generateErrorsBtn = document.getElementById('generateErrorsBtn');
        this.generateStandingsBtn = document.getElementById('generateStandingsBtn');
        this.generateScorersBtn = document.getElementById('generateScorersBtn');
        this.generateInfoBtn = document.getElementById('generateInfoBtn');
        this.generateDotBtn = document.getElementById('generateDotBtn');
        this.successMessage = document.getElementById('successMessage');
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

        this.generateTokensBtn.addEventListener('click', () => {
            this.generateTokensReport();
        });
        this.generateErrorsBtn.addEventListener('click', () => {
            this.generateErrorsReport();
        });
        this.generateStandingsBtn.addEventListener('click', () => {
            this.generateStandingsReport();
        });
        this.generateScorersBtn.addEventListener('click', () => {
            this.generateScorersReport();
        });
        this.generateInfoBtn.addEventListener('click', () => {
            this.generateGeneralInfoReport();
        });
        this.generateDotBtn.addEventListener('click', () => {
            this.downloadDotFile();
        });
    }

    analyzeFile() {
        if (!this.fileContent) {
            alert("Por favor, carga un archivo primero.");
            return;
        }

        console.log("Iniciando análisis léxico...");

        try {
            this.tokens = [];
            this.errors = [];
            this.tournament = null;
            this.tournamentData = null;
            this.lexer = new Lexer(this.fileContent);
            const tokens = this.lexer.analizar();

            this.tokens = tokens.filter(token => token.tipo !== "ERROR");
            this.errors = tokens.filter(token => token.tipo === "ERROR");
            console.log("Análisis léxico completado. Iniciando parseo semántico...");
            this.tournament = new Tournament(this.tokens);
            const parseResult = this.tournament.parse();

            if (parseResult.success && (!parseResult.errors || parseResult.errors.length === 0)) {
                this.tournament.calculateStatistics();
                this.tournamentData = this.tournament.tournamentData;
                alert("Análisis completado con éxito!");
            } else {
                if (parseResult.errors && parseResult.errors.length > 0) {
                    console.error("Errores de parseo:", parseResult.errors);
                }
                alert("El archivo tiene errores de sintaxis, pero puedes generar los reportes disponibles.");
            }

            this.enableAllReportButtons();
            this.successMessage.style.display = "block";

        } catch (error) {
            console.error("Error fatal durante el análisis:", error);
            alert("Hubo un error inesperado. Por favor, revise la consola (F12).");
        }
    }

    enableAllReportButtons() {
        this.generateTokensBtn.disabled = false;
        this.generateErrorsBtn.disabled = false;
        this.generateStandingsBtn.disabled = false;
        this.generateScorersBtn.disabled = false;
        this.generateInfoBtn.disabled = false;
        this.generateDotBtn.disabled = false;
    }


    generateTokensReport() {
        if (this.tokens.length === 0) {
            alert("No hay tokens para generar el reporte.");
            return;
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Tokens - TourneyJS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #4a6fa5; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #4a6fa5; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Reporte de Tokens Reconocidos</h1>
    <table>
        <thead>
            <tr>
                <th>No.</th>
                <th>Lexema</th>
                <th>Tipo</th>
                <th>Línea</th>
                <th>Columna</th>
            </tr>
        </thead>
        <tbody>
            ${this.tokens.map((token, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${this.escapeHtml(token.lexema)}</td>
                <td>${token.tipo}</td>
                <td>${token.linea}</td>
                <td>${token.columna}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

        this.downloadFile("tokens_report.html", htmlContent);
    }

    generateErrorsReport() {
        if (this.errors.length === 0) {
            alert("No se encontraron errores léxicos.");
            return;
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Errores - TourneyJS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #dc3545; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #dc3545; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Reporte de Errores Léxicos</h1>
    <table>
        <thead>
            <tr>
                <th>No.</th>
                <th>Lexema</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Línea</th>
                <th>Columna</th>
            </tr>
        </thead>
        <tbody>
            ${this.errors.map((error, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${this.escapeHtml(error.lexema)}</td>
                <td>${error.tipo}</td>
                <td>${error.descripcion}</td>
                <td>${error.linea}</td>
                <td>${error.columna}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

    this.downloadFile("errors_report.html", htmlContent);
    }

    generateStandingsReport() {
        if (!this.tournamentData) {
            alert("No hay datos válidos para generar el reporte de posiciones. El archivo puede tener errores de sintaxis.");
            return;
        }

        try {
            const standings = this.tournament.generateStandingsReport();

            const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Tabla de Posiciones - TourneyJS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #28a745; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #28a745; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Tabla de Posiciones</h1>
    <table>
        <thead>
            <tr>
                <th>Pos.</th>
                <th>Equipo</th>
                <th>PJ</th>
                <th>PG</th>
                <th>PP</th>
                <th>GF</th>
                <th>GC</th>
                <th>Dif.</th>
                <th>Fase</th>
            </tr>
        </thead>
        <tbody>
            ${standings.map(item => `
            <tr>
                <td>${item.position}</td>
                <td>${item.team}</td>
                <td>${item.matchesPlayed}</td>
                <td>${item.matchesWon}</td>
                <td>${item.matchesLost}</td>
                <td>${item.goalsFor}</td>
                <td>${item.goalsAgainst}</td>
                <td>${item.goalDifference}</td>
                <td>${item.reachedPhase}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

            this.downloadFile("standings_report.html", htmlContent);
        } catch (error) {
            console.error("Error al generar el reporte de posiciones:", error);
            alert("Error al generar el reporte de posiciones.");
        }
    }

    generateScorersReport() {
        if (!this.tournamentData) {
            alert("No hay datos válidos para generar el reporte de goleadores. El archivo puede tener errores de sintaxis.");
            return;
        }

        try {
            const scorers = this.tournament.generateTopScorersReport();

            const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Lista de Goleadores - TourneyJS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #ffc107; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #ffc107; color: #212529; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Lista de Goleadores</h1>
    <table>
        <thead>
            <tr>
                <th>Pos.</th>
                <th>Jugador</th>
                <th>Equipo</th>
                <th>Goles</th>
                <th>Minutos</th>
            </tr>
        </thead>
        <tbody>
            ${scorers.map(item => `
            <tr>
                <td>${item.position}</td>
                <td>${item.player}</td>
                <td>${item.team}</td>
                <td>${item.goals}</td>
                <td>${item.minutes}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

            this.downloadFile("scorers_report.html", htmlContent);
        } catch (error) {
            console.error("Error al generar el reporte de goleadores:", error);
            alert("Error al generar el reporte de goleadores.");
        }
    }

    generateGeneralInfoReport() {
        if (!this.tournamentData) {
            alert("No hay datos válidos para generar el reporte de información general. El archivo puede tener errores de sintaxis.");
            return;
        }

        try {
            const info = this.tournament.generateGeneralInfoReport();

            const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Información General - TourneyJS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #17a2b8; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #17a2b8; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Información General del Torneo</h1>
    <table>
        <thead>
            <tr>
                <th>Estadística</th>
                <th>Valor</th>
            </tr>
        </thead>
        <tbody>
            <tr><td>Nombre del Torneo</td><td>${info.tournamentName}</td></tr>
            <tr><td>Sede</td><td>${info.venue || "No especificada"}</td></tr>
            <tr><td>Equipos Participantes</td><td>${info.totalTeams}</td></tr>
            <tr><td>Total de Partidos</td><td>${info.totalMatches}</td></tr>
            <tr><td>Partidos Completados</td><td>${info.completedMatches}</td></tr>
            <tr><td>Total de Goles</td><td>${info.totalGoals}</td></tr>
            <tr><td>Promedio Goles/Partido</td><td>${info.averageGoalsPerMatch}</td></tr>
            <tr><td>Edad Promedio Jugadores</td><td>${info.averagePlayerAge} años</td></tr>
            <tr><td>Fase Actual</td><td>${info.currentPhase}</td></tr>
        </tbody>
    </table>
</body>
</html>`;

            this.downloadFile("info_report.html", htmlContent);
        } catch (error) {
            console.error("Error al generar el reporte de información general:", error);
            alert("Error al generar el reporte de información general.");
        }
    }

    downloadDotFile() {
        if (!this.tournamentData) {
            alert("No hay datos válidos para generar el archivo DOT. El archivo puede tener errores de sintaxis.");
            return;
        }

        try {
            const dotGenerator = new GraphvizGenerator(this.tournamentData);
            const dotContent = dotGenerator.generateDot();

            this.downloadFile("tournament_bracket.dot", dotContent);
        } catch (error) {
            console.error("Error al generar el archivo DOT:", error);
            alert("Error al generar el archivo DOT.");
        }
    }

    downloadDotFile() {
        if (!this.tournamentData) {
            alert("No hay datos válidos para generar el archivo DOT. El archivo puede tener errores de sintaxis.");
            return;
        }

        try {
            const dotGenerator = new GraphvizGenerator(this.tournamentData);
            const dotContent = dotGenerator.generateDot();

            const blob = new Blob([dotContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tournament_bracket.dot';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al generar el archivo DOT:", error);
            alert("Error al generar el archivo DOT. Por favor, revise la consola (F12).");
        }
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