'use strict';

// Token

var TipoToken = [
  'VOCAL_SIN_ACENTO',
  'VOCAL_CON_ACENTO',
  'VOCAL_CON_DIERESIS',
  'Y_GRIEGA',
  'CONSONANTE',
  'APERTURA_EXCL',
  'CIERRE_EXCL',
  'APERTURA_INTERROG',
  'CIERRE_INTERROG',
  'APERTURA_COMILLAS',
  'CIERRE_COMILLAS',
  'PUNTUACION',
  'ESPACIO',
  'EOF',        // FIN DE FICHERO
  'IOF'         // INICIO DE FICHERO

]

function Token(tipo, texto) {
  this.tipo = tipo;
  this.texto = texto;
}

Token.prototype.toString = function() {
  return '<'+this.texto+', ' + this.tipo + '>'
}


Token.prototype.esVocal = function() {
  return this.tipo === "VOCAL_SIN_ACENTO" ||
         this.tipo === "VOCAL_CON_ACENTO" ||
         this.tipo === "VOCAL_CON_DIERESIS" ;
}




// Analizador lexicográfico

function AnalizadorLex(entrada) {
  this.entrada = entrada;
  this.posicion = -1; // previo a la lectura de la entrada
  this.en_excl = 0;
  this.en_interrog = 0;
  this.en_comillas = 0;
}

AnalizadorLex.prototype.nextToken = function() {
  var token;
  if (this.posicion === -1) {
    token = new Token('IOF', 'IOF');
    this.posicion += 1;
  } else if (this.posicion >= this.entrada.length) {

    token = new Token('EOF', 'EOF');

    if (this.en_interrog) {
      throw new Error("Se ha alcanzado el final de la entrada con una interrogación abierta");
    }

    if (this.en_excl) {
      throw new Error("Se ha alcanzado el final de la entrada con una exclamación abierta");
    }

    if (this.en_comillas) {
      throw new Error("Se ha alcanzado el final de la entrada con una comilla abierta");
    }


  } else {
    var c = this.entrada[this.posicion];
    token = this.obtenerToken(c);
  }
  return token;
}

AnalizadorLex.prototype.obtenerToken = function(c) {
  var token;

  if (['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'].indexOf(c)>=0) {

    token = new Token('VOCAL_SIN_ACENTO', c);
    this.posicion += 1;

  } else if (['á','é','í','ó','ú','Á','É','Í','Ó','Ú'].indexOf(c)>=0) {

    token = new Token('VOCAL_CON_ACENTO', c);
    this.posicion += 1;

  } else if (['ü̈́', 'Ü'].indexOf(c) >= 0) {

    token = new Token('VOCAL_CON_DIERESIS', c);
    this.posicion += 1;

  } else if (['y', 'Y'].indexOf(c) >=0) {

    token = new Token('Y_GRIEGA', c);
    this.posicion += 1;

  } else if (['b' , 'B' , 'c' , 'C' , 'd' , 'D' , 'f' , 'F' , 'g' , 'G' ,
								  'h' , 'H' , 'j' , 'J' , 'k' , 'K' , 'l' , 'L' , 'm' , 'M' ,
								  'n' , 'N' , 'ñ' , 'Ñ' , 'p' , 'P' , 'q' , 'Q' , 'r' , 'R' ,
								  's' , 'S' , 't' , 'T' , 'v' , 'V' , 'w' , 'W' , 'x' , 'X' ,
								 'z' , 'Z'].indexOf(c) >= 0) {

    token = new Token('CONSONANTE', c);
    this.posicion += 1;

  } else if (c === '¡') {

    token = new Token('APERTURA_EXCL', c);
    this.posicion += 1;
    this.en_excl += 1;

  } else if (c === '¿') {

    token = new Token('APERTURA_INTERROG', c);
    this.posicion += 1;
    this.en_interrog += 1;

  } else if (c === '!') {

    if (!this.en_excl) {
      throw new Error("Cierre de exclamación sin apertura. Posición:"+this.posicion);
    }

    token = new Token('CIERRE_EXCL', c);
    this.posicion += 1;
    this.en_excl -= 1;

  } else if (c === '?') {

    if (!this.en_interrog) {
      throw new Error("Cierre de interrogación sin apertura. Posición:"+this.posicion);
    }

    token = new Token('CIERRE_INTERROG', c);
    this.posicion += 1;
    this.en_interrog -= 1;

  } else if (c === '"' && !this.en_comillas) {

    token = new Token('APERTURA_COMILLAS', c);
    this.posicion += 1;
    this.en_comillas += 1;

  } else if (c === '"' && this.en_comillas) {

    token = new Token('CIERRE_COMILLAS', c);
    this.posicion += 1;
    this.en_comillas -= 1;

  } else if (['.', ';', ':', ','].indexOf(c) >= 0) {

    token = new Token('PUNTUACION', c);
    this.posicion += 1;

  } else if ( [' ', '\t', '\r', '\n'].indexOf(c) >= 0) {

    while (this.posicion+1 < this.entrada.length &&
           [' ', '\t', '\r', '\n'].indexOf(this.entrada[this.posicion+1]) >= 0) {
      this.posicion += 1;
    }

    token = new Token('ESPACIO', ' ');
    this.posicion += 1;


  } else {

    throw new Error("Token desconocido: '"+c+ "'. Posición:"+this.posicion);

  }
  return token;
}

