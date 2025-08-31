/**
 * Archivo para el uso de constantes, interfaces, enums, mapas, entre otros.
 * Cada estructura empieza con un prefijo en mayusculas especifico para identificarlos facilmente.
 * Ejemplo: interfaces(I), mapas(M), enums(E), entre otros */

const allColors = [
  'todos',
  'indefinido',
  'varios',
  'amarillo',
  'marron',
  'blanco',
  'dorado',
  'rosado',
  'verde',
  'rojo',
  'azul',
  'anaranjado',
  'negro'
];

const MCupcakeColor = {
  indefinido: allColors[1],
  varios: allColors[2],
  amarillo: allColors[3],
  marron: allColors[4],
  blanco: allColors[5],
  dorado: allColors[6],
  rosado: allColors[7],
  verde: allColors[8],
  rojo: allColors[9],
  azul: allColors[10],
  anaranjado: allColors[11],
  negro: allColors[12]
};

const MCupcakeFestivity = {
  ninguna: 1,
  'san valentin': 2,
  pascua: 3,
  navidad: 4,
  halloween: 5,
  desconocida: 6
};

const MCupcakeDifficulty = {
  baja: 1,
  facil: 2,
  media: 3,
  dificil: 4,
  alta: 5,
  desconocida: 6
};

module.exports = {
  allColors,
  MCupcakeColor,
  MCupcakeFestivity,
  MCupcakeDifficulty
};
