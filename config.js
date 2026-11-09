// Configuración del cotizador de cortinas roller. Se edita a mano.
window.APP_CONFIG = {
  tienda: 'Dilan Home',
  tiendaUrl: 'https://www.dilan.com.ar/',
  // WhatsApp que recibe las consultas: código de país + número, sin + ni espacios
  whatsapp: '5493751604665',
  // Precio al cliente = costo del proveedor x multiplicador (efectivo / transferencia)
  multEfectivo: 1.70,
  // Precio de lista (cuotas) = precio efectivo x este recargo
  recargoLista: 1.20,
  // Límites de medida que acepta el cotizador (cm)
  anchoMin: 30, anchoMax: 360,
  altoMin: 60,  altoMax: 300
};
