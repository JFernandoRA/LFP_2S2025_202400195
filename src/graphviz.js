class GraphvizGenerator {
    constructor(tournamentData) {
        this.data = tournamentData;
    }

    generateDot() {
        let dot = `
digraph Tournament {
    rankdir=TB;
    node [shape=box style=filled fontname="Arial"];
    
    torneo [label="${this.escape(this.data.name)}\\n${this.escape(this.data.venue || "")}", shape=ellipse, style=filled, fillcolor=yellow];
`;

        this.data.eliminationPhases.forEach((phase, phaseIndex) => {
            dot += `
    subgraph cluster_${phaseIndex} {
        label="${this.escape(this.capitalize(phase.name))}";
        style=filled;
        color=${this.getPhaseColor(phase.name)};
`;

            phase.matches.forEach((match, matchIndex) => {
                const nodeId = `match_${phaseIndex}_${matchIndex}`;
                const goals1 = match.goalsTeam1 !== undefined ? match.goalsTeam1 : 0;
                const goals2 = match.goalsTeam2 !== undefined ? match.goalsTeam2 : 0;
                const team1 = `${this.escape(match.team1)} ${goals1}`;
                const team2 = `${this.escape(match.team2)} ${goals2}`;
                const winner = match.winner;

                let fillColor = "white";
                if (winner === match.team1) fillColor = "lightgreen";
                else if (winner === match.team2) fillColor = "lightcoral";

                dot += `        ${nodeId} [label="${team1}\\n${team2}", fillcolor=${fillColor}];\n`;
            });

            dot += "    }\n";
        });

        this.data.eliminationPhases.forEach((phase, phaseIndex) => {
            phase.matches.forEach((match, matchIndex) => {
                const nodeId = `match_${phaseIndex}_${matchIndex}`;

                if (phaseIndex === 0) {
                    dot += `    torneo -> ${nodeId};\n`;
                }

                if (match.winner) {
                    const nextPhase = this.data.eliminationPhases[phaseIndex + 1];
                    if (nextPhase) {
                        const nextMatch = nextPhase.matches.find(m =>
                            m.team1 === match.winner || m.team2 === match.winner
                        );
                        if (nextMatch) {
                            const nextIndex = nextPhase.matches.indexOf(nextMatch);
                            const nextNodeId = `match_${phaseIndex + 1}_${nextIndex}`;
                            dot += `    ${nodeId} -> ${nextNodeId};\n`;
                        }
                    }
                }
            });
        });

        dot += "}\n";
        return dot;
    }

    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    getPhaseColor(phaseName) {
        const name = phaseName.toLowerCase();
        if (name.includes("cuartos")) return "lightgrey";
        if (name.includes("semi")) return "lightblue";
        if (name.includes("final")) return "yellow";
        return "white";
    }

    escape(text) {
        return text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }
}
