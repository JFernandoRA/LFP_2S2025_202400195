class Lexer {
    constructor(texto) {
        this.texto = texto || "";
        this.pos = 0;
        this.linea = 1;
        this.columna = 1;
        this.tokens = [];
    }

    analizar() {
        while (this.pos < this.texto.length) {
            const char = this.texto[this.pos];

            if (char === '\n') {
                this.linea++;
                this.columna = 1;
                this.pos++;
                continue;
            }

            if (char === ' ' || char === '\t' || char === '\r') {
                this.columna++;
                this.pos++;
                continue;
            }

            if (this.esSimbolo(char)) {
                this.tokens.push(new Token(this.obtenerTipoSimbolo(char), char, this.linea, this.columna));
                this.columna++;
                this.pos++;
                continue;
            }

            if (char === '"') {
                this.procesarCadena();
                continue;
            }

            if (this.esDigito(char)) {
                this.procesarNumero();
                continue;
            }

            if (this.esLetra(char)) {
                this.procesarPalabra();
                continue;
            }

            this.tokens.push(new Token("ERROR", char, this.linea, this.columna, "Carácter no reconocido"));
            this.columna++;
            this.pos++;
        }

        return this.tokens;
    }

    procesarCadena() {
        let buffer = "";
        const inicioColumna = this.columna;
        const inicioLinea = this.linea;

        this.pos++; 
        this.columna++;

        while (this.pos < this.texto.length && this.texto[this.pos] !== '"') {
            const char = this.texto[this.pos];
            if (char === '\n') {
                this.linea++;
                this.columna = 1;
            } else {
                this.columna++;
            }
            buffer += char;
            this.pos++;
        }

        if (this.pos >= this.texto.length) {
            this.tokens.push(new Token("ERROR", buffer, inicioLinea, inicioColumna, "Cadena no cerrada"));
        } else {
            this.tokens.push(new Token("CADENA", buffer, inicioLinea, inicioColumna));
            this.pos++; 
            this.columna++;
        }
    }

    procesarNumero() {
        let buffer = "";
        const inicioColumna = this.columna;

        while (this.pos < this.texto.length && this.esDigito(this.texto[this.pos])) {
            buffer += this.texto[this.pos];
            this.columna++;
            this.pos++;
        }

        this.tokens.push(new Token("NUMERO", buffer, this.linea, inicioColumna));
    }

    procesarPalabra() {
        let buffer = "";
        const inicioColumna = this.columna;

        while (this.pos < this.texto.length && (this.esLetra(this.texto[this.pos]) || this.esDigito(this.texto[this.pos]))) {
            buffer += this.texto[this.pos];
            this.columna++;
            this.pos++;
        }

        const tipo = this.esPalabraClave(buffer) ? "PALABRA_RESERVADA" : "IDENTIFICADOR";
        this.tokens.push(new Token(tipo, buffer, this.linea, inicioColumna));
    }

    esSimbolo(char) {
        return "{}[]:,".includes(char);
    }

    obtenerTipoSimbolo(char) {
        switch (char) {
            case '{': return "LLAVE_IZQ";
            case '}': return "LLAVE_DER";
            case '[': return "CORCHETE_IZQ";
            case ']': return "CORCHETE_DER";
            case ':': return "DOS_PUNTOS";
            case ',': return "COMA";
            default: return "SIMBOLO_DESCONOCIDO";
        }
    }

    esDigito(char) {
        return char >= '0' && char <= '9';
    }

    esLetra(char) {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
    }

    esPalabraClave(palabra) {
        const palabrasClave = [
            "TORNEO", "EQUIPOS", "equipo", "jugador", "ELIMINACION", "partido",
            "goleador", "nombre", "equipos", "posicion", "numero", "edad",
            "resultado", "goleadores", "minuto", "sede", "vs", "final", "cuartos", "semifinal"
        ];
        for (let i = 0; i < palabrasClave.length; i++) {
            if (palabra === palabrasClave[i]) {
                return true;
            }
        }
        return false;
    }
}