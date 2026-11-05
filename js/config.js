/**
 * CONFIGURACIÓN DEL SITIO
 * ------------------------------------------------------------------
 * Este es el ÚNICO lugar donde se edita la información de contacto.
 * Todos los enlaces, botones y textos de contacto de la página leen
 * de este objeto (index.html, privacidad.html y terminos.html).
 *
 * Los valores marcados como "PENDIENTE" son de ejemplo y deben
 * reemplazarse por los datos reales. Mientras un valor contenga la
 * palabra "PENDIENTE", su enlace queda desactivado automáticamente.
 */
window.SITE_CONFIG = {
  empresa: {
    nombre: "Ascenda", // PENDIENTE: confirmar nombre comercial
    eslogan: "Automatización online para negocios",
    // URL pública del sitio, sin barra final (se usa en SEO y JSON-LD)
    url: "https://ascenda-landing-phi.vercel.app",
    logo: "assets/logo.png"
  },

  contacto: {
    // Teléfono para llamadas, en formato internacional sin espacios (ej. "+18095551234")
    telefono: "PENDIENTE",
    // Cómo se muestra el teléfono en pantalla (ej. "+1 809 555 1234")
    telefonoVisible: "PENDIENTE",
    // WhatsApp: solo dígitos con código de país, sin "+" ni espacios (ej. "18095551234")
    whatsapp: "PENDIENTE",
    // Cómo se muestra el número de WhatsApp en pantalla
    whatsappVisible: "PENDIENTE",
    // Mensaje predefinido al abrir el chat de WhatsApp
    whatsappMensaje: "Hola, me interesa automatizar mi negocio. ¿Me pueden dar más información?",
    correo: "ascenda.rd@gmail.com",
    direccion: "PENDIENTE: calle, número, ciudad, país",
    // Enlace opcional a Google Maps (déjalo en "" si no aplica)
    mapaUrl: "",
    horario: "PENDIENTE: Lunes a viernes, 9:00 a 18:00"
  },

  // Deja en "" cualquier red que no uses y se ocultará automáticamente.
  redes: {
    facebook: "",
    instagram: "https://www.instagram.com/ascenda.do/",
    linkedin: "",
    tiktok: "",
    youtube: ""
  },

  citas: {
    /**
     * Agenda de demos (flujo "Ascenda · Citas" en n8n).
     * - horarios: URL que devuelve los horarios libres (GET).
     * - reservar: URL que crea la cita en Google Calendar (POST en JSON).
     * Si las dos se dejan vacías (""), la agenda muestra horarios de
     * ejemplo y la reserva es simulada (útil solo para pruebas).
     */
    horarios: "https://alanxd777l3.app.n8n.cloud/webhook/ascenda-citas-horarios",
    reservar: "https://alanxd777l3.app.n8n.cloud/webhook/ascenda-cita",
    // Solo para el modo simulado y para el texto de la zona horaria
    zonaHoraria: "America/Santo_Domingo",
    zonaVisible: "hora de República Dominicana",
    duracionMin: 30,
    horarioSimulado: { dias: [1, 2, 3, 4, 5], inicio: "09:00", fin: "18:00", diasAdelante: 14 }
  },

  producto: {
    /**
     * ASCENDA System, el sistema de facturación e inventario para
     * todo tipo de negocio que necesite facturar (sección "Sistema" de la página).
     * Cuando el sistema cambie, actualiza aquí la lista de módulos;
     * la página la vuelve a dibujar sola.
     * - demoUrl: enlace a una demo en línea. Vacío ("") = el botón se oculta.
     */
    nombre: "ASCENDA SYSTEM",
    descripcion: "Factura, controla tu inventario y lleva tus cuentas desde una sola pantalla. Funciona en tu computadora, sin depender de internet, y se comparte con las demás cajas de tu negocio.",
    diasPrueba: 30,
    precio: "a consultar",
    demoUrl: "https://ascenda-system-demo.vercel.app/demo",
    modulos: [
      "Facturación y cotizaciones, con lector de código de barras",
      "Inventario con alertas de stock bajo",
      "Clientes, proveedores y cuentas por cobrar y pagar",
      "Comprobantes fiscales (NCF) y facturación electrónica e-CF",
      "Contabilidad, gastos y nómina",
      "Reportes de ventas y ganancias",
      "Varias computadoras en red, con usuarios y permisos",
      "Respaldos automáticos todos los días"
    ]
  },

  formulario: {
    /**
     * Endpoint que recibe el formulario de contacto (POST en JSON).
     * Ejemplos:
     *   Formspree: "https://formspree.io/f/TU_ID"
     *   Webhook (Make, Zapier, n8n, etc.): "https://hook.tu-servicio.com/abc123"
     *   n8n de Ascenda (captacion/ascenda-captacion.n8n.json):
     *     "https://TU-INSTANCIA.app.n8n.cloud/webhook/ascenda-lead"
     *     (la "Production URL" del nodo "Formulario de la landing")
     *
     * Si se deja vacío (""), el formulario NO envía nada y muestra un
     * mensaje de éxito simulado (útil solo para pruebas).
     */
    endpoint: "https://alanxd777l3.app.n8n.cloud/webhook/ascenda-lead"
  }
};
