class Tournament {
    constructor(tokens) {
        this.tokens = tokens;
        this.tournamentData = {
            name: "",
            venue: "",
            totalTeams: 0,
            teams: [],
            eliminationPhases: []
        };
        this.errors = [];
        this.currentTokenIndex = 0;
    }

    parse() {
        try {
            this.parseTournamentSection();
            this.parseTeamsSection();
            this.parseEliminationSection();
            this.calculateStatistics();
            return {
                success: true,
                data: this.tournamentData, 
                errors: this.errors
            };
        } catch (error) {
            this.addError("Error de parseo", "Error interno: " + error.message, 0, 0);
            return {
                success: false,
                data: null, 
                errors: this.errors
            };
        }
    }

    getCurrentToken() {
        if (this.currentTokenIndex >= this.tokens.length) return null;
        return this.tokens[this.currentTokenIndex];
    }

    nextToken() {
        this.currentTokenIndex++;
    }

    expect(expectedType, expectedValue = null) {
        const token = this.getCurrentToken();
        if (!token) {
            throw new Error(`Se esperaba ${expectedType} pero se llegó al final del archivo.`);
        }

        if (token.tipo !== expectedType) {
            throw new Error(`Se esperaba '${expectedType}' pero se encontró '${token.tipo}' en línea ${token.linea}, columna ${token.columna}.`);
        }

        if (expectedValue && token.lexema !== expectedValue) {
            throw new Error(`Se esperaba '${expectedValue}' pero se encontró '${token.lexema}' en línea ${token.linea}, columna ${token.columna}.`);
        }

        this.nextToken();
        return token;
    }

    addError(type, description, line, column) {
        this.errors.push({
            numero: this.errors.length + 1,
            tipo: type,
            descripcion: description,
            linea: line,
            columna: column
        });
    }


    parseTournamentSection() {
        this.expect("PALABRA_RESERVADA", "TORNEO");
        this.expect("LLAVE_IZQ");

        while (true) {
            const token = this.getCurrentToken();
            if (!token || token.tipo === "LLAVE_DER") break;

            if (token.tipo === "PALABRA_RESERVADA") {
                const attrName = token.lexema;
                this.nextToken();
                this.expect("DOS_PUNTOS");

                if (attrName === "nombre") {
                    const nameToken = this.expect("CADENA");
                    this.tournamentData.name = nameToken.lexema;
                } else if (attrName === "equipos") {
                    const numToken = this.expect("NUMERO");
                    this.tournamentData.totalTeams = parseInt(numToken.lexema, 10);
                } else if (attrName === "sede") {
                    const sedeToken = this.expect("CADENA");
                    this.tournamentData.venue = sedeToken.lexema;
                } else {
                    this.addError("Atributo desconocido", `Atributo '${attrName}' no reconocido.`, token.linea, token.columna);
                }

                const next = this.getCurrentToken();
                if (next && next.tipo === "COMA") {
                    this.nextToken();
                }
            } else {
                this.nextToken(); 
            }
        }

        this.expect("LLAVE_DER");
    }

    parseTeamsSection() {
        this.expect("PALABRA_RESERVADA", "EQUIPOS");
        this.expect("LLAVE_IZQ");

        while (true) {
            const token = this.getCurrentToken();
            if (!token || token.tipo === "LLAVE_DER") break;

            if (token.tipo === "PALABRA_RESERVADA" && token.lexema === "equipo") {
                const team = this.parseTeam();
                if (team) {
                    this.tournamentData.teams.push(team);
                }
            } else {
                this.nextToken(); 
            }
        }

        this.expect("LLAVE_DER");
    }

    parseTeam() {
        try {
            this.expect("PALABRA_RESERVADA", "equipo");
            this.expect("DOS_PUNTOS");
            const nameToken = this.expect("CADENA");
            this.expect("CORCHETE_IZQ");

            const players = [];
            while (true) {
                const token = this.getCurrentToken();
                if (!token || token.tipo === "CORCHETE_DER") break;

                if (token.tipo === "PALABRA_RESERVADA" && token.lexema === "jugador") {
                    const player = this.parsePlayer();
                    if (player) players.push(player);
                }

                const next = this.getCurrentToken();
                if (next && next.tipo === "COMA") {
                    this.nextToken();
                } else {
                    break; 
                }
            }

            this.expect("CORCHETE_DER");
            return {
                name: nameToken.lexema,
                players: players,
                matchesPlayed: 0,
                matchesWon: 0,
                matchesLost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                reachedPhase: "Primera Ronda"
            };
        } catch (error) {
            return null;
        }
    }

    parsePlayer() {
        try {
            this.expect("PALABRA_RESERVADA", "jugador");
            this.expect("DOS_PUNTOS");
            const nameToken = this.expect("CADENA");
            this.expect("CORCHETE_IZQ");

            let position = "", number = 0, age = 0;

            while (true) {
                const token = this.getCurrentToken();
                if (!token || token.tipo === "CORCHETE_DER") break;

                if (token.tipo === "PALABRA_RESERVADA") {
                    const attr = token.lexema;
                    this.nextToken();
                    this.expect("DOS_PUNTOS");

                    if (attr === "posicion") {
                        const posToken = this.expect("CADENA");
                        position = posToken.lexema;
                    } else if (attr === "numero") {
                        const numToken = this.expect("NUMERO");
                        number = parseInt(numToken.lexema, 10);
                    } else if (attr === "edad") {
                        const ageToken = this.expect("NUMERO");
                        age = parseInt(ageToken.lexema, 10);
                    }
                }

                const next = this.getCurrentToken();
                if (next && next.tipo === "COMA") {
                    this.nextToken();
                } else {
                    break;
                }
            }

            this.expect("CORCHETE_DER");
            return {
                name: nameToken.lexema,
                position: position,
                number: number,
                age: age,
                goals: []
            };
        } catch (error) {
            return null;
        }
    }

    parseEliminationSection() {
        this.expect("PALABRA_RESERVADA", "ELIMINACION");
        this.expect("LLAVE_IZQ");

        while (true) {
            const token = this.getCurrentToken();
            if (!token || token.tipo === "LLAVE_DER") break;

            if (token.tipo === "PALABRA_RESERVADA") {
                const phaseName = token.lexema;
                this.nextToken();
                this.expect("DOS_PUNTOS");
                this.expect("CORCHETE_IZQ");

                const matches = [];
                while (true) {
                    const matchToken = this.getCurrentToken();
                    if (!matchToken || matchToken.tipo === "CORCHETE_DER") break;

                    if (matchToken.tipo === "PALABRA_RESERVADA" && matchToken.lexema === "partido") {
                        const match = this.parseMatch();
                        if (match) matches.push(match);
                    }

                    const next = this.getCurrentToken();
                    if (next && next.tipo === "COMA") {
                        this.nextToken();
                    } else {
                        break;
                    }
                }

                this.expect("CORCHETE_DER");
                this.tournamentData.eliminationPhases.push({
                    name: phaseName,
                    matches: matches
                });
            } else {
                this.nextToken();
            }
        }

        this.expect("LLAVE_DER");
    }

    parseMatch() {
        try {
            this.expect("PALABRA_RESERVADA", "partido");
            this.expect("DOS_PUNTOS");
            const team1Token = this.expect("CADENA");
            this.expect("PALABRA_RESERVADA", "vs");
            const team2Token = this.expect("CADENA");
            this.expect("CORCHETE_IZQ");

            let result = "0-0";
            let scorers = [];

            while (true) {
                const token = this.getCurrentToken();
                if (!token || token.tipo === "CORCHETE_DER") break;

                if (token.tipo === "PALABRA_RESERVADA") {
                    const attr = token.lexema;
                    this.nextToken();
                    this.expect("DOS_PUNTOS");

                    if (attr === "resultado") {
                        const resultToken = this.expect("CADENA");
                        result = resultToken.lexema;
                    } else if (attr === "goleadores") {
                        this.expect("CORCHETE_IZQ");
                        while (true) {
                            const scorerToken = this.getCurrentToken();
                            if (!scorerToken || scorerToken.tipo === "CORCHETE_DER") break;

                            if (scorerToken.tipo === "PALABRA_RESERVADA" && scorerToken.lexema === "goleador") {
                                const scorer = this.parseScorer();
                                if (scorer) scorers.push(scorer);
                            }

                            const next = this.getCurrentToken();
                            if (next && next.tipo === "COMA") {
                                this.nextToken();
                            } else {
                                break;
                            }
                        }
                        this.expect("CORCHETE_DER");
                    }
                }

                const next = this.getCurrentToken();
                if (next && next.tipo === "COMA") {
                    this.nextToken();
                } else {
                    break;
                }
            }

            this.expect("CORCHETE_DER");

            const [goals1, goals2] = result.split('-').map(g => parseInt(g) || 0);
            return {
                team1: team1Token.lexema,
                team2: team2Token.lexema,
                result: result,
                goalsTeam1: goals1,
                goalsTeam2: goals2,
                scorers: scorers,
                winner: this.determineWinner(team1Token.lexema, team2Token.lexema, goals1, goals2)
            };
        } catch (error) {
            return null;
        }
    }

    parseScorer() {
        try {
            this.expect("PALABRA_RESERVADA", "goleador");
            this.expect("DOS_PUNTOS");
            const nameToken = this.expect("CADENA");
            this.expect("CORCHETE_IZQ");
            this.expect("PALABRA_RESERVADA", "minuto");
            this.expect("DOS_PUNTOS");
            const minuteToken = this.expect("NUMERO");
            this.expect("CORCHETE_DER");
            return {
                name: nameToken.lexema,
                minute: parseInt(minuteToken.lexema, 10)
            };
        } catch (error) {
            return null;
        }
    }

    determineWinner(team1, team2, goals1, goals2) {
        if (goals1 > goals2) return team1;
        if (goals2 > goals1) return team2;
        return "Empate";
    }

    calculateStatistics() {
        // Reiniciar estadísticas
        this.tournamentData.teams.forEach(team => {
            team.matchesPlayed = 0;
            team.matchesWon = 0;
            team.matchesLost = 0;
            team.goalsFor = 0;
            team.goalsAgainst = 0;
        });

    
        this.tournamentData.eliminationPhases.forEach(phase => {
            phase.matches.forEach(match => {
                const team1 = this.tournamentData.teams.find(t => t.name === match.team1);
                const team2 = this.tournamentData.teams.find(t => t.name === match.team2);

                if (team1) {
                    team1.matchesPlayed++;
                    team1.goalsFor += match.goalsTeam1;
                    team1.goalsAgainst += match.goalsTeam2;
                    team1.reachedPhase = this.capitalize(phase.name);
                    if (match.winner === match.team1) team1.matchesWon++;
                    if (match.winner === match.team2) team1.matchesLost++;
                }

                if (team2) {
                    team2.matchesPlayed++;
                    team2.goalsFor += match.goalsTeam2; 
                    team2.goalsAgainst += match.goalsTeam1;
                    team2.reachedPhase = this.capitalize(phase.name);
                    if (match.winner === match.team2) team2.matchesWon++;
                    if (match.winner === match.team1) team2.matchesLost++;
                }

                match.scorers.forEach(scorer => {
                    for (const team of this.tournamentData.teams) {
                        const player = team.players.find(p => p.name === scorer.name);
                        if (player) {
                            player.goals.push(scorer.minute);
                            break;
                        }
                    }
                });
            });
        });
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    generateStandingsReport() {
        const sorted = [...this.tournamentData.teams].sort((a, b) => {
            if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
            return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
        });

        return sorted.map((team, index) => ({
            position: index + 1,
            team: team.name,
            matchesPlayed: team.matchesPlayed,
            matchesWon: team.matchesWon,
            matchesLost: team.matchesLost,
            goalsFor: team.goalsFor,
            goalsAgainst: team.goalsAgainst,
            goalDifference: team.goalsFor - team.goalsAgainst,
            reachedPhase: team.reachedPhase
        }));
    }

    generateTopScorersReport() {
        const allPlayers = [];
        this.tournamentData.teams.forEach(team => {
            team.players.forEach(player => {
                if (player.goals.length > 0) {
                    allPlayers.push({
                        name: player.name,
                        team: team.name,
                        goals: player.goals.length,
                        minutes: player.goals
                    });
                }
            });
        });

        const sorted = allPlayers.sort((a, b) => b.goals - a.goals);
        return sorted.map((scorer, index) => ({
            position: index + 1,
            player: scorer.name,
            team: scorer.team,
            goals: scorer.goals,
            minutes: scorer.minutes.join(", ") + "'"
        }));
    }

    generateGeneralInfoReport() {
        let totalAge = 0, totalPlayers = 0;
        this.tournamentData.teams.forEach(team => {
            team.players.forEach(player => {
                totalAge += player.age;
                totalPlayers++;
            });
        });

        const averageAge = totalPlayers > 0 ? (totalAge / totalPlayers).toFixed(2) : 0;
        const totalMatches = this.tournamentData.eliminationPhases.reduce((sum, phase) => sum + phase.matches.length, 0);
        const completedMatches = this.tournamentData.eliminationPhases.reduce((sum, phase) => {
            return sum + phase.matches.filter(m => m.result !== "0-0" && m.result !== "Pendiente").length;
        }, 0);
        const totalGoals = this.tournamentData.eliminationPhases.reduce((sum, phase) => {
            return sum + phase.matches.reduce((gsum, match) => gsum + match.goalsTeam1 + match.goalsTeam2, 0);
        }, 0);

        return {
            tournamentName: this.tournamentData.name,
            venue: this.tournamentData.venue,
            totalTeams: this.tournamentData.totalTeams,
            totalMatches: totalMatches,
            completedMatches: completedMatches,
            totalGoals: totalGoals,
            averageGoalsPerMatch: totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : 0,
            averagePlayerAge: averageAge,
            currentPhase: this.tournamentData.eliminationPhases.length > 0 ?
                this.tournamentData.eliminationPhases[this.tournamentData.eliminationPhases.length - 1].name : "N/A"
        };
    }
}