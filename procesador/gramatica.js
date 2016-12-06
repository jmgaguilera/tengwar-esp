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

var puntos = ['.', ';', ':', ','];
var espacios = [' ', '\t', '\r', '\n'];


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

Token.prototype.esApertura = function() {
  return this.tipo === "APERTURA_EXCL"     ||
         this.tipo === "APERTURA_INTERROG" ||
         this.tipo === "APERTURA_COMILLAS" ;
}

Token.prototype.esConsonante = function() {
  return this.tipo === 'CONSONANTE' ||
         this.tipo === 'Y_GRIEGA' ;
}

Token.prototype.esConsonanteNoMuda = function() {
  return (this.tipo === 'CONSONANTE' ||
         this.tipo === 'Y_GRIEGA') && ['H', 'h'].indexOf(this.texto) < 0 ;
}



// Analizador lexicográfico

function AnalizadorLex(entrada) {
  this.entrada = entrada;
  this.posicion = -1; // previo a la lectura de la entrada
  this.en_excl = 0;
  this.en_interrog = 0;
  this.en_comillas = 0;
}

AnalizadorLex.prototype.analizar = function() {

  var tokens = [];
  var token;

  do {
    token = this.nextToken();
    tokens.push(token);
  } while (token.tipo != 'EOF');

  return tokens;

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

  } else if (['ü', 'Ü'].indexOf(c) >= 0) {

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

  } else if ((c === '"' || c === "'") && !this.en_comillas) {

    token = new Token('APERTURA_COMILLAS', c);
    this.posicion += 1;
    this.en_comillas += 1;

  } else if ((c === '"' || c === "'") && this.en_comillas) {

    token = new Token('CIERRE_COMILLAS', c);
    this.posicion += 1;
    this.en_comillas -= 1;

  } else if (puntos.indexOf(c) >= 0) {

    token = new Token('PUNTUACION', c);
    this.posicion += 1;

  } else if ( espacios.indexOf(c) >= 0) {

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



// Tabla auxiliar para códigos de vocales

var vocal_a_tengwar_tehtar = {
  'A' : ['#','E','D','C','\\TTthreedots'],
  'a' : ['#','E','D','C','\\TTthreedots'],
  'E' : ['$','R','F','V','\\TTacute'],
  'e' : ['$','R','F','V','\\TTacute'],
  'I' : ['%','T','G','B','\\TTdot'],
  'i' : ['%','T','G','B','\\TTdot'],
  'O' : ['^','Y','H','N','\\TTrightcurl'],
  'o' : ['^','Y','H','N','\\TTrightcurl'],
  'U' : ['&','U','J','M','\\TTleftcurl'],
  'u' : ['&','U','J','M','\\TTleftcurl']
};

vocal_a_tengwar_tehtar.get_codigo = function(cod_tengwar, vocal) {
  // En función del carácter tengwar anterior se debe poner la vocal tehtar más o menos desplazada
  if ( ['\\Tando', '\\Tumbar', '\\Tungwe',
        '\\Tampa', '\\Tanca', '\\Tnuumen',
        '\\Tmalta', '\\Tnoldo', '\\Tlambe', '\\Talda',
        '\\Tando\\TTnasalizer', '\\Tumbar\\TTnasalizer'
       ].indexOf(cod_tengwar) >= 0 ) {

    return vocal_a_tengwar_tehtar[vocal][0];

  } else if (['\\Ttinco', '\\Tparma','\\Tcalma','\\Tquesse',
              '\\Thwesta', , '\\Troomen', '\\Tsilmenuquerna',
              '\\Tquesse\\Tlefthook', '\\Ttinco\\TTnasalizer',
              '\\Tparma\\TTnasalizer', '\\Tcalma\\TTnasalizer',
              '\\Tquesse\\TTnasalizer', '\\Tyanta', '\\Tvilya',  ' \\Tanna', '\\Tvala'
             ].indexOf(cod_tengwar) >= 0 ) {

    return vocal_a_tengwar_tehtar[vocal][1];

  } else if (['\\Tthuule', '\\Tformen', '\\Toore', '\\Ttelco',
             ].indexOf(cod_tengwar) >= 0) {

    return vocal_a_tengwar_tehtar[vocal][2];

  } else {

    return vocal_a_tengwar_tehtar[vocal][3];

  };
};


// Tabla auxiliar para diptongos

var acentos_diptongos = {
  '\\TTtwodotsbelow' : ['Ì','Ì','Î','Ï'],
  '\\TTtwodots' : ['Ô','Õ','Ö','×'],
  '\\TTtilde' : ['è','é','ê','ë'],
};

acentos_diptongos.get_codigo = function(cod_tengwar, acento) {
  // En función del carácter tengwar anterior se debe poner la vocal tehtar más o menos desplazada
  if ( ['\\Tando', '\\Tumbar', '\\Tungwe',
        '\\Tampa', '\\Tanca', '\\Tnuumen',
        '\\Tmalta', '\\Tnoldo', '\\Tlambe', '\\Talda',
        '\\Tando\\TTnasalizer', '\\Tumbar\\TTnasalizer',
       ].indexOf(cod_tengwar) >= 0 ) {

    return acentos_diptongos[acento][0];

  } else if (['\\Ttinco', '\\Tparma','\\Tcalma','\\Tquesse',
               '\\Toore', '\\Troomen', '\\Tsilmenuquerna',
              '\\Tquesse\\Tlefthook', '\\Ttinco\\TTnasalizer',
              '\\Tparma\\TTnasalizer', '\\Tcalma\\TTnasalizer',
              '\\Tquesse\\TTnasalizer', '\\Tyanta', '\\Tvilya',  ' \\Tanna', '\\Tvala'
             ].indexOf(cod_tengwar) >= 0 ) {

    return acentos_diptongos[acento][1];

  } else if (['\\Tthuule', '\\Tformen', '\\Thwesta',
             ].indexOf(cod_tengwar) >= 0) {

    return acentos_diptongos[acento][2];

  } else {

    return acentos_diptongos[acento][3];

  };
};


// Analizador sintáctico

// Una regla tiene dos partes, una que indica si es válida o no, y otra que realiza la transformación
function Regla(validador, transformador) {
  this.validador = validador;
  this.transformador = transformador;
}

Regla.prototype.esValida = function(tokens, tokens_consumidos) {
  return this.validador(tokens, tokens_consumidos);
}

Regla.prototype.transformar = function(tokens, tokens_consumidos, transformado, tipo_letra) {
  return this.transformador(tokens, tokens_consumidos, transformado, tipo_letra); // devuelve un objeto de tres elementos: el código en tengwar annatar, el código en tengwarscript para LaTeX, la lista de tokens restante.
}


// validador-transformador simple (mira solamente en el caracter que está en la posición actual).
function ReglaSimple(caracteres, resultado, tengwarscript, numConsume) {
  this.peso = numConsume;
  Regla.call(this,
        function(tokens, tokens_consumidos) {
          return (caracteres.indexOf(tokens[0].texto) >= 0);
        },
        function(tokens, tokens_consumidos) {

          var i = numConsume;
          while (i>0) {
            tokens_consumidos.push(tokens[0]);
            tokens.shift();
            i -= 1;
          }

          return {
              codigoAnnatar: resultado,
              codigoTengwarscript: tengwarscript,
              tokensRestantes: tokens,
              tokensConsumidos: tokens_consumidos
          }
        }
  );
}

ReglaSimple.prototype = Object.create(Regla.prototype);


// validador-transformador doble (mira en el caracter que está en la posición actual y en la siguiente).
function ReglaDoble(caracteres1, caracteres2, resultado, tengwarscript, numConsume, peso) {
  this.peso = peso || numConsume; // el peso lo hemos llamado consume
  Regla.call(this,
        function(tokens, tokens_consumidos) {
          return tokens.length >= 2 &&
                 (caracteres1.indexOf(tokens[0].texto) >= 0) &&
                 (caracteres2.indexOf(tokens[1].texto) >= 0) ;
        },
        function(tokens, tokens_consumidos) {

          var i = numConsume;
          while (i>0) {
            tokens_consumidos.push(tokens[0]);
            tokens.shift();
            i -= 1;
          }

          return {
              codigoAnnatar: resultado,
              codigoTengwarscript: tengwarscript,
              tokensRestantes: tokens,
              tokensConsumidos: tokens_consumidos
          }
        }
  );
}

ReglaDoble.prototype = Object.create(Regla.prototype);


// validador-transformador triple (mira en el caracter que está en la posición actual y en las dos siguientes).
function ReglaTriple(caracteres1, caracteres2, caracteres3, resultado, tengwarscript, numConsume) {
  this.peso = numConsume;
  Regla.call(this,
        function(tokens, tokens_consumidos) {
          return tokens.length >= 3 &&
                 (caracteres1.indexOf(tokens[0].texto) >= 0) &&
                 (caracteres2.indexOf(tokens[1].texto) >= 0) &&
                 (caracteres3.indexOf(tokens[2].texto) >= 0) ;
        },
        function(tokens, tokens_consumidos) {

          var i = numConsume;
          while (i>0) {
            tokens_consumidos.push(tokens[0]);
            tokens.shift();
            i -= 1;
          }

          return {
              codigoAnnatar: resultado,
              codigoTengwarscript: tengwarscript,
              tokensRestantes: tokens,
              tokensConsumidos: tokens_consumidos
          }
        }
  );
}

ReglaTriple.prototype = Object.create(Regla.prototype);

// validador-transformador y consonántica
function ReglaYConsonante() {
  this.peso = 1;
  Regla.call(this,
        function(tokens, tokens_consumidos) {
          return tokens.length >= 2 &&
                 (['Y', 'y'].indexOf(tokens[0].texto) >= 0) &&
                 tokens[1].esVocal() ;
        },
        function(tokens, tokens_consumidos) {
          tokens_consumidos.push(tokens[0]);
          tokens.shift();
          return {
              codigoAnnatar: 'f',
              codigoTengwarscript: '\\Tanca',
              tokensRestantes: tokens,
              tokensConsumidos: tokens_consumidos
          }
        }
  );
}

ReglaYConsonante.prototype = Object.create(Regla.prototype);

// validador-transformador y vocálica
function ReglaYVocal(param) {
  this.peso = 1;
  Regla.call(this,
        function(tokens, tokens_consumidos) {
          return tokens.length >= 2 &&
                 (['Y', 'y'].indexOf(tokens[0].texto) >= 0) &&
                 !tokens[1].esVocal() ;
        },
        function(tokens, tokens_consumidos, transformado, tipo_letra) {
          tokens_consumidos.push(tokens[0]);
          tokens.shift();
          if (param === "tehtar") {
            return {
                codigoAnnatar: '`<span class="'+tipo_letra+'">Û</span>',
                codigoTengwarscript: '\\Ttelco\\TTbreve',
                tokensRestantes: tokens,
                tokensConsumidos: tokens_consumidos
            }
          } else {
            return {
                codigoAnnatar: '~',
                codigoTengwarscript: '\\Taara',
                tokensRestantes: tokens,
                tokensConsumidos: tokens_consumidos
            }
          }
        }
  );
}

ReglaYVocal.prototype = Object.create(Regla.prototype);

// validador-transformador R de inicio de palabra
function ReglaRInicio() {
  this.peso = 2; // En realidad consume uno pero tiene que tener más peso ya que mira en el anterior (como si fuesen dos)
  Regla.call(this,
        function(tokens, tokens_consumidos) {
          return tokens.length >= 1 && tokens_consumidos.length >= 1 &&
                 (['R', 'r'].indexOf(tokens[0].texto) >= 0) &&
                 (espacios.indexOf(tokens_consumidos[tokens_consumidos.length-1].texto) >= 0 ||
                  tokens_consumidos[tokens_consumidos.length-1].tipo === 'IOF' ||
                  tokens_consumidos[tokens_consumidos.length-1].esApertura())  ;
        },
        function(tokens, tokens_consumidos) {
          tokens_consumidos.push(tokens[0]);
          tokens.shift(); // consume uno
          return {
              codigoAnnatar: '7',
              codigoTengwarscript: '\\Troomen',
              tokensRestantes: tokens,
              tokensConsumidos: tokens_consumidos
          }
        }
  );
}

ReglaRInicio.prototype = Object.create(Regla.prototype);

// validador-transformador de diptongos crecientes
function ReglaDiptCreciente(vocales) {
  this.tehtar = (vocales && vocales === 'tehtar');
  this.peso = 3; // En realidad consume uno o dos pero tiene más peso ya que mira en tres sitios (la anterior, current y posterior)
  Regla.call(this,
        function(tokens, tokens_consumidos) {
          return tokens.length >= 2 &&
                 (['I', 'i', 'u', 'U'].indexOf(tokens[0].texto) >= 0) &&
                  tokens[1].esVocal();
        },
        function(tokens, tokens_consumidos, transformado) {
          var cod_tengwarscript;
          var cod_annatar;
          var consumir_dos = true;

          if (tokens_consumidos[tokens_consumidos.length-1].esConsonante()) {

            cod_annatar = vocal_a_tengwar_tehtar.get_codigo(
                transformado[transformado.length-1].codigoTengwarscript,
                tokens[1].texto);

            if (this.tehtar) {
              if (['I', 'i'].indexOf(tokens[0].texto) >= 0) {
                  cod_annatar = acentos_diptongos.get_codigo(
                                  transformado[transformado.length-1].codigoTengwarscript,
                                  '\\TTtwodotsbelow')+cod_annatar;
                  cod_tengwarscript = '\\TTtwodotsbelow'+vocal_a_tengwar_tehtar[tokens[1].texto][4];
              } else { // letra 'u'
                  cod_annatar = acentos_diptongos.get_codigo(
                                  transformado[transformado.length-1].codigoTengwarscript,
                                  '\\TTtilde')+cod_annatar;
                  cod_tengwarscript = '\\TTtilde'+vocal_a_tengwar_tehtar[tokens[1].texto][4];;
              }
            } else {
                consumir_dos = false;
              if (['I', 'i'].indexOf(tokens[0].texto) >= 0) {
                  cod_annatar = acentos_diptongos.get_codigo(
                                  transformado[transformado.length-1].codigoTengwarscript,
                                  '\\TTtwodots');
                  cod_tengwarscript = '\TTtwodots';
              } else { // letra 'u'
                  cod_annatar = acentos_diptongos.get_codigo(
                                  transformado[transformado.length-1].codigoTengwarscript,
                                  '\\TTtilde');
                  cod_tengwarscript = '\\TTtilde';
              }
            }
          } else {
            if (this.tehtar) {
              if (['I', 'i'].indexOf(tokens[0].texto) >= 0) {
                  cod_annatar = 'h'+vocal_a_tengwar_tehtar[tokens[1].texto][1];;
                  cod_tengwarscript = '\\Tanna'+vocal_a_tengwar_tehtar[tokens[1].texto][4];;
              } else { // letra 'u'
                  cod_annatar = 'y'+vocal_a_tengwar_tehtar[tokens[1].texto][1];;
                  cod_tengwarscript = '\\Tvala'+vocal_a_tengwar_tehtar[tokens[1].texto][4];;
              }
            } else {
              consumir_dos = false;
              if (['I', 'i'].indexOf(tokens[0].texto) >= 0) {
                  cod_annatar = '~';
                  cod_tengwarscript = '\\Taara';
              } else { // letra 'u'
                  cod_annatar = '.';
                  cod_tengwarscript = '\\Tuure';
              }
            }
          }

          tokens_consumidos.push(tokens[0]);
          tokens.shift();
          if (consumir_dos) {
            tokens_consumidos.push(tokens[0]);
            tokens.shift(); // consume dos
          }
          return {
              codigoAnnatar: cod_annatar,
              codigoTengwarscript: cod_tengwarscript,
              tokensRestantes: tokens,
              tokensConsumidos: tokens_consumidos
          }
        }
  );
}

ReglaDiptCreciente.prototype = Object.create(Regla.prototype);


// validador-transformador de diptongos decrecientes
function ReglaDiptDecreciente(vocales) {
  this.tehtar = (vocales && vocales === 'tehtar');
  this.peso = 3; // En realidad consume uno pero tiene más peso ya que mira en tres sitios (la anterior, current y posterior)
  Regla.call(this,
        function(tokens, tokens_consumidos) {
          return tokens.length >= 3 &&
                 tokens[0].esVocal() &&
                ((['I', 'i', 'u', 'U'].indexOf(tokens[1].texto) >= 0) ||
                 ((['Y','y'].indexOf(tokens[1].texto) >= 0) && !tokens[2].esVocal())); // posible y griega vocálica
        },
        function(tokens, tokens_consumidos, transformado) {
          var cod_tengwarscript;
          var cod_annatar;

          if (this.tehtar) {
            if (['I','i','Y','y'].indexOf(tokens[1].texto) >= 1) {
              cod_annatar = 'l'+vocal_a_tengwar_tehtar.get_codigo('\\Tyanta', tokens[0].texto);
              cod_tengwarscript = '\\Tyanta'+vocal_a_tengwar_tehtar[tokens[0].texto][4];
            } else {  // letra U
              cod_annatar = '.'+vocal_a_tengwar_tehtar.get_codigo('\\Toore', tokens[0].texto);
              cod_tengwarscript = '\\Toore'+vocal_a_tengwar_tehtar[tokens[0].texto][4];
            }

          } else {

             if (['A','a'].indexOf(tokens[0].texto) >= 0) {
                 cod_annatar = 'n';
                 cod_tengwarscript = '\\Tvilya';
             } else if (['E','e'].indexOf(tokens[0].texto) >= 0) {
                 cod_annatar = 'l';
                 cod_tengwarscript = '\\Tyanta';
             } else if (['i','I'].indexOf(tokens[0].texto) >= 0) {
                 cod_annatar = '`';
                 cod_tengwarscript = '\\Ttelco';
             } else if (['O','o'].indexOf(tokens[0].texto) >= 0) {
                 cod_annatar = 'h';
                 cod_tengwarscript = '\\Tanna';
             } else if (['U','u'].indexOf(tokens[0].texto) >= 0) {
                 cod_annatar = 'y';
                 cod_tengwarscript = '\\Tvala';
             }

             if (['i','I','y','Y'].indexOf(tokens[1].texto) >= 0) {
               cod_annatar += acentos_diptongos.get_codigo(cod_tengwarscript,'\\TTtwodots');
               cod_tengwarscript += '\\TTtwodots';
             } else { // termina en U
               cod_annatar += acentos_diptongos.get_codigo(cod_tengwarscript,'\\TTtilde');
               cod_tengwarscript += '\\TTtilde';
             }
          }

          tokens_consumidos.push(tokens[0]);
          tokens.shift();
          tokens_consumidos.push(tokens[0]);
          tokens.shift(); // consume dos
          return {
              codigoAnnatar: cod_annatar,
              codigoTengwarscript: cod_tengwarscript,
              tokensRestantes: tokens,
              tokensConsumidos: tokens_consumidos
          }
        }
  );
}

ReglaDiptCreciente.prototype = Object.create(Regla.prototype);
ReglaDiptDecreciente.prototype = Object.create(Regla.prototype);

// validador-transformador de vocales tehtar


function ReglaVocal() {
  this.peso = 2; // En realidad consume uno pero tiene que tener más peso ya que mira en el anterior (como si fuesen dos)
  Regla.call(this,
        function(tokens, tokens_consumidos) {
          return tokens.length >= 1 &&
                 (['A', 'a', 'E', 'e', 'I', 'i', 'O', 'o', 'U', 'u'].indexOf(tokens[0].texto) >= 0);
        },
        function(tokens, tokens_consumidos, transformado) {
          var retorno = {
              codigoAnnatar: '',
              codigoTengwarscript: '',
              tokensRestantes: null,
              tokensConsumidos: null
          };
          if (!(tokens_consumidos.length >= 1 &&
                tokens_consumidos[tokens_consumidos.length-1].esConsonante())) {
            retorno.codigoTengwarscript += '\\Telco';
            retorno.codigoAnnatar += '`';
          };

          retorno.codigoTengwarscript += vocal_a_tengwar_tehtar[tokens[0].texto][4];

          // En función del carácter tengwar anterior se debe poner la vocal tehtar más o menos desplazada
          retorno.codigoAnnatar += vocal_a_tengwar_tehtar.get_codigo(
            transformado[transformado.length-1].codigoTengwarscript,
            tokens[0].texto);

          tokens_consumidos.push(tokens[0]);
          tokens.shift(); // consume uno


          retorno.tokensRestantes = tokens;
          retorno.tokensConsumidos = tokens_consumidos;


          return retorno;
        }
  );
}

ReglaVocal.prototype = Object.create(Regla.prototype);


// validador-transformador apertura de comillas
function ReglaComillaApertura() {
  this.peso = 1;
  Regla.call(this,
        function(tokens, tokens_consumidos) {
          return tokens.length >= 1 &&
                 tokens[0].tipo === 'APERTURA_COMILLAS' ;
        },
        function(tokens, tokens_consumidos) {
          var comilla = tokens[0].texto;
          tokens_consumidos.push(tokens[0]);
          tokens.shift(); // consume uno
          return {
              codigoAnnatar: (comilla==="'" ? '±' : '»'),
              codigoTengwarscript: (comilla==="'" ? '\\Tromanquoteleft' : '\\Tromandblquoteleft'),
              tokensRestantes: tokens,
              tokensConsumidos: tokens_consumidos
          }
        }
  );
}

ReglaComillaApertura.prototype = Object.create(Regla.prototype);

// validador-transformador cierre de comillas
function ReglaComillaCierre() {
  this.peso = 1;
  Regla.call(this,
        function(tokens, tokens_consumidos) {
          return tokens.length >= 1 &&
                 tokens[0].tipo === 'CIERRE_COMILLAS' ;
        },
        function(tokens, tokens_consumidos) {
          var comilla = tokens[0].texto;
          tokens_consumidos.push(tokens[0]);
          tokens.shift(); // consume uno
          return {
              codigoAnnatar: (comilla==="'" ? '²' : '«'),
              codigoTengwarscript: (comilla==="'" ? '\\Tromanquoteright' : '\\Tromandblquoteright'),
              tokensRestantes: tokens,
              tokensConsumidos: tokens_consumidos
          }
        }
  );
}

ReglaComillaCierre.prototype = Object.create(Regla.prototype);


// ********** REGLAS PLENAS **********************//
var reglas_plenas = [
  new ReglaSimple(['t', 'T'], '1', '\\Ttinco', 1),
  new ReglaSimple(['p', 'P'], 'q', '\\Tparma', 1),
  new ReglaDoble(['c', 'C'], ['h', 'H'], 'a', '\\Tcalma', 2),

  new ReglaDoble(['c', 'C'], ['A', 'a'], 'zn', '\\Tquesse\\Tvilya', 2),
  new ReglaDoble(['k', 'K'], ['A', 'a'], 'zn', '\\Tquesse\\Tvilya', 2),
  new ReglaDoble(['c', 'C'], ['O', 'o'], 'zh', '\\Tquesse\\Tanna', 2),
  new ReglaDoble(['k', 'K'], ['O', 'o'], 'zh', '\\Tquesse\\Tanna', 2),
  new ReglaDoble(['c', 'C'], ['U', 'u'], 'zy', '\\Tquesse\\Tvala', 2),
  new ReglaDoble(['k', 'K'], ['U', 'u'], 'zy', '\\Tquesse\\Tvala', 2),

  new ReglaDoble(['c', 'C'], ['Á', 'á'], 'zn;', '\\Tquesse\\Tvilya\\TTdoubler', 2),
  new ReglaDoble(['k', 'K'], ['Á', 'á'], 'zn;', '\\Tquesse\\Tvilya\\TTdoubler', 2),
  new ReglaDoble(['c', 'C'], ['Ó', 'ó'], 'zh;', '\\Tquesse\\Tanna\\TTdoubler', 2),
  new ReglaDoble(['k', 'K'], ['Ó', 'ó'], 'zh;', '\\Tquesse\\Tanna\\TTdoubler', 2),
  new ReglaDoble(['c', 'C'], ['Ú', 'ú'], 'zy;', '\\Tquesse\\Tvala\\TTdoubler', 2),
  new ReglaDoble(['k', 'K'], ['Ú', 'ú'], 'zy;', '\\Tquesse\\Tvala\\TTdoubler', 2),

  new ReglaSimple(['c', 'C'], 'z', '\\Tquesse', 1),

  new ReglaDoble(['k', 'K'], ['e', 'E'], 'zl', '\\Tquesse\\Tyanta', 2),
  new ReglaTriple(['q', 'Q'], ['u', 'U'], ['e', 'E'], 'zl', '\\Tquesse\\Tyanta', 3),

  new ReglaDoble(['k', 'K'], ['i', 'I'], 'z`', '\\Tquesse\\Ttelco', 2),
  new ReglaTriple(['q', 'Q'], ['u', 'U'], ['i', 'I'], 'z`', '\\Tquesse\\Ttelco', 3),

  new ReglaDoble(['k', 'K'], ['é', 'É'], 'zl;', '\\Tquesse\\Tyanta\\TTdoubler', 2),
  new ReglaTriple(['q', 'Q'], ['u', 'U'], ['é', 'É'], 'zl', '\\Tquesse\\Tyanta\\TTdoubler', 3),

  new ReglaDoble(['k', 'K'], ['í', 'Í'], 'z`;', '\\Tquesse\\Ttelco\\TTdoubler', 2),
  new ReglaTriple(['q', 'Q'], ['u', 'U'], ['í', 'Í'], 'z`;', '\\Tquesse\\Ttelco\\TTdoubler', 3),

  new ReglaSimple(['d', 'D'], '2', '\\Tando', 1),

  new ReglaSimple(['b', 'B', 'v', 'V', 'w', 'W'], 'w', '\\Tumbar', 1),

  new ReglaDoble(['g', 'G'], ['a', 'A'], 'xn', '\\Tungwe\\Tvilya', 2),
  new ReglaTriple(['g', 'G'], ['u','U'], ['e', 'E'], 'xl', '\\Tungwe\\Tyanta', 3),
  new ReglaTriple(['g', 'G'], ['u','U'], ['i', 'I'], 'x`', '\\Tungwe\\Ttelco', 3),
  new ReglaDoble(['g', 'G'], ['o', 'O'], 'xh', '\\Tungwe\\Tanna', 2),
  new ReglaDoble(['g', 'G'], ['u', 'U'], 'xy', '\\Tungwe\\Tvala', 2),

  new ReglaDoble(['g', 'G'], ['á', 'Á'], 'xn;', '\\Tungwe\\Tvilya\\TTdoubler', 2),
  new ReglaTriple(['g', 'G'], ['u','U'], ['é', 'É'], 'xl;', '\\Tungwe\\Tyanta\\TTdoubler', 3),
  new ReglaTriple(['g', 'G'], ['u','U'], ['í', 'Í'], 'x`;', '\\Tungwe\\Ttelco\\TTdoubler', 3),
  new ReglaDoble(['g', 'G'], ['ó', 'Ó'], 'xh;', '\\Tungwe\\Tanna\\TTdoubler', 2),
  new ReglaDoble(['g', 'G'], ['ú', 'Ú'], 'xy;', '\\Tungwe\\Tvala\\TTdoubler', 2),

  new ReglaTriple(['g', 'G'], ['ü','ü'], ['é', 'É'], 'xyl;', '\\Tungwe\\Tvala\\Tyanta\\TTdoubler', 3),
  new ReglaTriple(['g', 'G'], ['ü','Ü'], ['í', 'Í'], 'xy`;', '\\Tungwe\\Tvala\\Ttelco\\TTdoubler', 3),
  new ReglaTriple(['g', 'G'], ['ü','ü'], ['e', 'E'], 'xyl', '\\Tungwe\\Tvala\\Tyanta', 3),
  new ReglaTriple(['g', 'G'], ['ü','Ü'], ['i', 'I'], 'xy`', '\\Tungwe\\Tvala\\Ttelco', 3),
  new ReglaSimple(['g', 'G'], 'x', '\\Tungwe', 1),


  new ReglaSimple(['z', 'Z'], '3', '\\Tthuule', 1),

  new ReglaDoble(['c', 'C'], ['E', 'e'], '3l', '\\Tthuule\\Tyanta', 2),
  new ReglaDoble(['c', 'C'], ['I', 'i'], '3`', '\\Tthuule\\Ttelco', 2),

  new ReglaDoble(['c', 'C'], ['É', 'é'], '3l;', '\\Tthuule\\Tyanta\\TTdoubler', 2),
  new ReglaDoble(['c', 'C'], ['Í', 'í'], '3`;', '\\Tthuule\\Ttelco\\TTdoubler', 2),

  new ReglaSimple(['f', 'F'], 'e', '\\Tformen', 1),
  new ReglaSimple(['j', 'J'], 'c', '\\Thwesta', 1),

  new ReglaDoble(['G', 'g'], ['E', 'e'], 'cl', '\\Thwesta\\Tyanta', 2),
  new ReglaDoble(['G', 'g'], ['I', 'i'], 'c`', '\\Thwesta\\Ttelco', 2),
  new ReglaDoble(['G', 'g'], ['É', 'é'], 'cl;', '\\Thwesta\\Tyanta\\TTdoubler', 2),
  new ReglaDoble(['G', 'g'], ['Í', 'í'], 'c`;', '\\Thwesta\\Ttelco\\TTdoubler', 2),

  new ReglaDoble(['L', 'l'], ['L', 'l'], 'f', '\\Tanca', 2),

  new ReglaYConsonante(),
  new ReglaYVocal(),

  new ReglaSimple(['n', 'N'], '5', '\\Tnuumen', 1),
  new ReglaSimple(['m', 'M'], 't', '\\Tmalta', 1),
  new ReglaSimple(['ñ', 'Ñ'], 'g', '\\Tnoldo', 1),

  new ReglaSimple(['IOF'], '', '', 1),

  new ReglaRInicio(),
  new ReglaDoble(['R', 'r'], ['R', 'r'], '7', '\\TRoomen', 2),
  new ReglaSimple(['R', 'r'], '6', '\\Toore', 1),

  new ReglaSimple(['L', 'l'], 'j', '\\Tlambe', 1),

  new ReglaSimple(['S', 's'], '8', '\\Tsilme', 1),

  new ReglaSimple(['H', 'h'], '9', '\\Thyarmen', 1),

  new ReglaSimple(['X', 'x'], 'z|', '\\Tquesse\\Tlefthook', 1),

  new ReglaSimple(['A','a'],'n','\\Tvilya', 1),
  new ReglaSimple(['E','e'],'l','\\Tyanta', 1),
  new ReglaSimple(['I','i'],'`','\\Ttelco', 1),
  new ReglaSimple(['O','o'],'h','\\Tanna', 1),
  new ReglaSimple(['U','u'],'y','\\Tvala', 1),

  new ReglaSimple(['Á','á'],'n;','\\Tvilya\\TTdoubler', 1),
  new ReglaSimple(['É','é'],'l;','\\Tyanta\\TTdoubler', 1),
  new ReglaSimple(['Í','í'],'`;','\\Ttelco\\TTdoubler', 1),
  new ReglaSimple(['Ó','ó'],'h;','\\Tanna\\TTdoubler', 1),
  new ReglaSimple(['Ú','ú'],'y;','\\Tvala\\TTdoubler', 1),

  new ReglaSimple(['.', ';', ':'],'-','\\Tcolon', 1),
  new ReglaSimple([','],'=','\\Tcentereddot', 1),

  new ReglaSimple( ["¿", "¡"], '', '', 1),
  new ReglaSimple( ['?'], 'À', '\\Tquestion', 1),
  new ReglaSimple( ['!'], 'Á', '\\Texclamation', 1),

  new ReglaSimple(espacios, ' ', ' ', 1),

  new ReglaComillaApertura(),
  new ReglaComillaCierre()
  ];


// ********** REGLAS TEHTAR **********************//
var reglas_tehtar = [
  new ReglaSimple(['t', 'T'], '1', '\\Ttinco', 1),
  new ReglaSimple(['p', 'P'], 'q', '\\Tparma', 1),
  new ReglaDoble(['c', 'C'], ['h', 'H'], 'a', '\\Tcalma', 2),

  new ReglaDoble(['c', 'C'], ['A', 'a'], 'zE', '\\Tquesse\\TTthreedots', 2),
  new ReglaDoble(['k', 'K'], ['A', 'a'], 'zE', '\\Tquesse\\TTthreedots', 2),
  new ReglaDoble(['c', 'C'], ['O', 'o'], 'zY', '\\Tquesse\\TTrightcurl', 2),
  new ReglaDoble(['k', 'K'], ['O', 'o'], 'zY', '\\Tquesse\\TTrightcurl', 2),
  new ReglaDoble(['c', 'C'], ['U', 'u'], 'zU', '\\Tquesse\\TTleftcurl', 2),
  new ReglaDoble(['k', 'K'], ['U', 'u'], 'zU', '\\Tquesse\\TTleftcurl', 2),

  new ReglaDoble(['c', 'C'], ['Á', 'á'], 'z~C', '\\Tquesse\\Taara\\TTthreedots', 2),
  new ReglaDoble(['k', 'K'], ['Á', 'á'], 'z~C', '\\Tquesse\\Taara\\TTthreedots', 2),


  new ReglaDoble(['c', 'C'], ['Ó', 'ó'], 'z~N', '\\Tquesse\\Taara\\TTrightcurl', 2),
  new ReglaDoble(['k', 'K'], ['Ó', 'ó'], 'z~N', '\\Tquesse\\Taara\\TTrightcurl', 2),
  new ReglaDoble(['c', 'C'], ['Ú', 'ú'], 'z~M', '\\Tquesse\\Taara\\TTleftcurl', 2),
  new ReglaDoble(['k', 'K'], ['Ú', 'ú'], 'z~M', '\\Tquesse\\Taara\\TTleftcurl', 2),

  new ReglaSimple(['c', 'C'], 'z', '\\Tquesse', 1),

  new ReglaDoble(['k', 'K'], ['e', 'E'], 'zR', '\\Tquesse\\TTacute', 2),
  new ReglaTriple(['q', 'Q'], ['u', 'U'], ['e', 'E'], 'zR', '\\Tquesse\\TTacute', 3),

  new ReglaDoble(['k', 'K'], ['i', 'I'], 'zT', '\\Tquesse\\TTdot', 2),
  new ReglaTriple(['q', 'Q'], ['u', 'U'], ['i', 'I'], 'zT', '\\Tquesse\\TTdot', 3),

  new ReglaDoble(['k', 'K'], ['é', 'É'], 'z~V', '\\Tquesse\\Taara\\TTacute', 2),
  new ReglaTriple(['q', 'Q'], ['u', 'U'], ['é', 'É'], 'z~V', '\\Tquesse\\Taara\\TTacute', 3),

  new ReglaDoble(['k', 'K'], ['í', 'Í'], 'z~B', '\\Tquesse\\Taara\\TTdot', 2),
  new ReglaTriple(['q', 'Q'], ['u', 'U'], ['í', 'Í'], 'z~B', '\\Tquesse\\Taara\\TTdot', 3),

  new ReglaSimple(['d', 'D'], '2', '\\Tando', 1),

  new ReglaSimple(['b', 'B', 'v', 'V', 'w', 'W'], 'w', '\\Tumbar', 1),

  new ReglaDoble(['g', 'G'], ['a', 'A'], 'x#', '\\Tungwe\\TTthreedots', 2),
  new ReglaTriple(['g', 'G'], ['u','U'], ['e', 'E'], 'x$', '\\Tungwe\\TTacute', 3),
  new ReglaTriple(['g', 'G'], ['u','U'], ['i', 'I'], 'x%', '\\Tungwe\\TTdot', 3),
  new ReglaDoble(['g', 'G'], ['o', 'O'], 'x^', '\\Tungwe\\TTrightcurl', 2),
  new ReglaDoble(['g', 'G'], ['u', 'U'], 'x&', '\\Tungwe\\TTleftcurl', 2),

  new ReglaDoble(['g', 'G'], ['á', 'Á'], 'x~C', '\\Tungwe\\Taara\\TTthreedots', 2),
  new ReglaTriple(['g', 'G'], ['u','U'], ['é', 'É'], 'x~V', '\\Tungwe\\Taara\\TTacute', 3),
  new ReglaTriple(['g', 'G'], ['u','U'], ['í', 'Í'], 'x~B', '\\Tungwe\\Taara\\TTdot', 3),
  new ReglaDoble(['g', 'G'], ['ó', 'Ó'], 'x~N', '\\Tungwe\\Taara\\TTrightcurl', 2),
  new ReglaDoble(['g', 'G'], ['ú', 'Ú'], 'x~M', '\\Tungwe\\Taara\\TTleftcurl', 2),


  new ReglaTriple(['g', 'G'], ['ü','ü'], ['é', 'É'], 'x&~V', '\\Tungwe\\TTleftcurl\\Taara\\TTacute', 3),
  new ReglaTriple(['g', 'G'], ['ü','Ü'], ['í', 'Í'], 'x&~B', '\\Tungwe\\TTleftcurl\\Taara\\TTdot', 3),
  new ReglaTriple(['g', 'G'], ['ü','ü'], ['e', 'E'], 'x&~V', '\\Tungwe\\TTleftcurl\\Taara\\TTacute', 3),
  new ReglaTriple(['g', 'G'], ['ü','Ü'], ['i', 'I'], 'x&~B', '\\Tungwe\\TTleftcurl\\Taara\\TTdot', 3),
  new ReglaSimple(['g', 'G'], 'x', '\\Tungwe', 1),


  new ReglaSimple(['z', 'Z'], '3', '\\Tthuule', 1),


  new ReglaDoble(['c', 'C'], ['E', 'e'], '3F', '\\Tthuule\\TTacute', 2),
  new ReglaDoble(['c', 'C'], ['I', 'i'], '3G', '\\Tthuule\\TTdot', 2),

  new ReglaDoble(['c', 'C'], ['É', 'é'], '3~V;', '\\Tthuule\\Taara\\TTacute', 2),
  new ReglaDoble(['c', 'C'], ['Í', 'í'], '3~B;', '\\Tthuule\\Taara\\TTdot', 2),

  new ReglaSimple(['f', 'F'], 'e', '\\Tformen', 1),
  new ReglaSimple(['j', 'J'], 'c', '\\Thwesta', 1),

  new ReglaDoble(['G', 'g'], ['E', 'e'], 'cR', '\\Thwesta\\TTacute', 2),
  new ReglaDoble(['G', 'g'], ['I', 'i'], 'cT', '\\Thwesta\\TTdot', 2),
  new ReglaDoble(['G', 'g'], ['É', 'é'], 'c~V', '\\Thwesta\\Taara\\TTacute', 2),
  new ReglaDoble(['G', 'g'], ['Í', 'í'], 'c~B', '\\Thwesta\\Taara\\TTdot', 2),

  new ReglaDoble(['L', 'l'], ['L', 'l'], 'f', '\\Tanca', 2),

  new ReglaYConsonante(),
  new ReglaYVocal('tehtar'),

  new ReglaSimple(['n', 'N'], '5', '\\Tnuumen', 1),
  new ReglaSimple(['m', 'M'], 't', '\\Tmalta', 1),
  new ReglaSimple(['ñ', 'Ñ'], 'g', '\\Tnoldo', 1),

  new ReglaSimple(['IOF'], '', '', 1),

  new ReglaRInicio(),
  new ReglaDoble(['R', 'r'], ['R', 'r'], '7', '\\TRoomen', 2),
  new ReglaSimple(['R', 'r'], '6', '\\Toore', 1),

  new ReglaSimple(['L', 'l'], 'j', '\\Tlambe', 1),

  new ReglaSimple(['S', 's'], '8', '\\Tsilme', 1),
  // Si viene un acento se usa la silmenuquerna, aunque no consumo la vocal
  new ReglaDoble(['S', 's'], ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'],
                 'i', '\\Tsilmenuquerna', 1, 2),

  new ReglaSimple(['H', 'h'], '9', '\\Thyarmen', 1),

  new ReglaSimple(['X', 'x'], 'z|', '\\Tquesse\\Tlefthook', 1),

  new ReglaVocal(), // el símbolo de la vocal varía si tiene o no consonante delante, y la posición también varía en función del ancho de la consonante

  new ReglaSimple(['Á','á'],'~C','\\Taara\\TTthreedots', 1),
  new ReglaSimple(['É','é'],'~V','\\Taara\\TTacute', 1),
  new ReglaSimple(['Í','í'],'~B','\\Taara\\TTdot', 1),
  new ReglaSimple(['Ó','ó'],'~N','\\Taara\TTrightcurl', 1),
  new ReglaSimple(['Ú','ú'],'~M','\\Taara\\TTleftcurl', 1),

  new ReglaSimple(['.', ';', ':'],'-','\\Tcolon', 1),
  new ReglaSimple([','],'=','\\Tcentereddot', 1),

  new ReglaSimple( ["¿", "¡"], '', '', 1),
  new ReglaSimple( ['?'], 'À', '\\Tquestion', 1),
  new ReglaSimple( ['!'], 'Á', '\\Texclamation', 1),

  new ReglaSimple(espacios, ' ', ' ', 1),

  new ReglaComillaApertura(),
  new ReglaComillaCierre()
];


var reglas_grupo = [
  new ReglaDoble(['n', 'N'], ['t', 'T'], '1[', '\\Ttinco\\TTnasalizer', 2),
  new ReglaDoble(['m', 'M'], ['p', 'P'], 'q[', '\\Tparma\\TTnasalizer', 2),
  new ReglaTriple(['n', 'N'], ['c', 'C'], ['h','H'], 'a[', '\\Tcalma\\TTnasalizer', 3),
  new ReglaDoble(['n', 'N'],['k','K'], 'z[', '\\Tquesse\\TTnasalizer', 2),
  new ReglaDoble(['n', 'N'],['d','D'], '2{', '\\Tando\\TTnasalizer', 2),
  new ReglaDoble(['m', 'M'],['b','B'], 'w{', '\\Tumbar\\TTnasalizer', 2),
  // Esta es más compleja si hay que distinguir hwesta de ungwe (al finalizar el análisis
  // basta con sustituir en la traducción "5x" por "x{" y '\\nuumen\\Tungwe' por '\\Tungwe\\TTnasalizer'
  // ['n', 'N'],['g','G'], 'x{', '\\Tungwe\\TTnasalizer'

];

var separadores_palabra = espacios.concat(puntos).concat(['!', '?', '"', "'", 'EOF']);
var reglas_s = [
  new ReglaDoble(['s', 'S'], separadores_palabra,
                '_', '\\Trighthook', 1, 2),
];


var reglas_dipt_crec_tehtar = [
    new ReglaDiptCreciente("tehtar"),
  ];

var reglas_dipt_crec_plenas = [
    new ReglaDiptCreciente("plenas"),
  ];

var reglas_dipt_decr_tehtar = [
    new ReglaDiptDecreciente("tehtar"),
  ];

var reglas_dipt_decr_plenas = [
    new ReglaDiptDecreciente("plenas"),
  ];


var reglas;

function AnalizadorSintactico(texto, opciones){
  this.texto = texto;
  this.opciones = opciones;

  if (opciones && opciones.vocales && opciones.vocales === "tehtar") {
    reglas = reglas_tehtar;
    if (opciones.abreviar_dipt_crec && opciones.abreviar_dipt_crec === "Si") {
      reglas = reglas.concat(reglas_dipt_crec_tehtar);
    }
    if (opciones.abreviar_dipt_decr && opciones.abreviar_dipt_decr === "Si") {
      reglas = reglas.concat(reglas_dipt_decr_tehtar);
    }
  } else {
    reglas = reglas_plenas;
    if (opciones.abreviar_dipt_crec && opciones.abreviar_dipt_crec === "Si") {
      reglas = reglas.concat(reglas_dipt_crec_plenas);
    }
    if (opciones.abreviar_dipt_decr && opciones.abreviar_dipt_decr === "Si") {
      reglas = reglas.concat(reglas_dipt_decr_plenas);
    }
  }

  if (opciones && opciones.abreviar_nasal_oclusiva &&
      opciones.abreviar_nasal_oclusiva === "Si") {
    reglas = reglas.concat(reglas_grupo);
  }


  if (opciones && opciones.abreviar_s_final &&
      opciones.abreviar_s_final === "Si") {
    reglas = reglas.concat(reglas_s);
  }


  this.tokens = new AnalizadorLex(texto).analizar();
  this.tokens_consumidos = [];
  this.transformado = [];

}

AnalizadorSintactico.prototype.analizar = function(tipo_letra) {
  do {
    var t = this.analizarSiguiente(tipo_letra);
    this.transformado.push(t);
  } while (this.tokens[0].tipo !== 'EOF');

  return this.transformado;
}

AnalizadorSintactico.prototype.analizarSiguiente = function(tipo_letra) {
  var t_c = this.tokens_consumidos;
  var t = this.tokens;
  var reglas_validas = reglas.filter(
    function(regla) {
      return regla.esValida(t, t_c);
    }
  );
  if (reglas_validas.length === 1) {
    return reglas_validas[0].transformar(t, t_c, this.transformado, tipo_letra);
  } else if (reglas_validas.length > 1) {

    var ind_regla = -1; // Indice de la regla a aplicar
    var num_regla = 0; // Número de reglas de la misma prioridad a la regla a aplicar (no debe haber más de una)
    var peso_regla = -1;
    for (var i = 0; i< reglas_validas.length; i++) {
      if (peso_regla < reglas_validas[i].peso) {
        num_regla = 1;
        ind_regla = i;
        peso_regla = reglas_validas[i].peso;
      } else if (peso_regla === reglas_validas[i].peso) {
        num_regla += 1;
      }
    }
    if (num_regla > 1) {
      throw new Error("La entrada es ambigua (varias reglas posibles). Tokens restantes: " + t.toString());
    } else {
      return reglas_validas[ind_regla].transformar(t, t_c, this.transformado, tipo_letra);
    }
  } else {
    throw new Error("No se puede reconocer esta sentencia. Tokens restantes: " + t.toString());
  }
}

AnalizadorSintactico.prototype.getAnnatar = function() {
 var texto = this.transformado.map(
    function(t) {return t.codigoAnnatar;}
  ).join('');

  if (this.opciones.abreviar_nasal_oclusiva === "Si") {
    texto = texto.replace('5x','x{')
  }

  return texto;
}

AnalizadorSintactico.prototype.getTengwarscript = function() {
  var texto = this.transformado.map(
    function(t) {return t.codigoTengwarscript;}
  ).join('');

  if (this.opciones.abreviar_nasal_oclusiva === "Si") {
    texto = texto.replace('\\Tnuumen\\Tungwe','\\Tungwe\\TTnasalizer')
  }
  return texto;

}

//TODO: Prueba interna de las reglas
/*
var prueba = new AnalizadorLex('Qui');

prueba.nextToken();

var tokens = [prueba.nextToken(), prueba.nextToken(), prueba.nextToken()];

tokens

var regla = reglas[18];

regla

console.log(regla.esValida(tokens));

var resultado = regla.transformar(tokens);
resultado

var prueba = new AnalizadorSintactico('acné');
prueba.analizar('t');
console.log(prueba.getAnnatar());
console.log(prueba.getTengwarscript());
*/

