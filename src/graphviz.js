class GraphvizGenerator {
    constructor(tournamentData) {
        this.tournamentData = tournamentData;
    }

    generateDot() {
        let dot = 'digraph Tournament {\n';
        dot += '    rankdir=TB;\n';
        dot += '    node [shape=box, style=filled, color=lightblue];\n';
        dot += '    edge [color=black];\n\n';

        this.tournamentData.eliminationPhases.forEach((phase, phaseIndex) => {
            phase.matches.forEach((match, matchIndex) => {
                const matchId = `match_${phaseIndex}_${matchIndex}`;
                const label = `${this.capitalize(phase.name)}: ${match.team1} vs ${match.team2}\\nResultado: ${match.result}`;
                dot += `    ${matchId} [label="${this.escape(label)}"];\n`;
            });
        });

        dot += '\n    // Conexiones (opcional, para torneos con múltiples fases)\n';
        dot += '}\n';
        return dot;
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escape(str) {
        return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }
}