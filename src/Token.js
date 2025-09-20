class Token {
    constructor(tipo, lexema, linea, columna, descripcion = "") {
        this.tipo = tipo;
        this.lexema = lexema;
        this.linea = linea;
        this.columna = columna;
        this.descripcion = descripcion;
    }
}