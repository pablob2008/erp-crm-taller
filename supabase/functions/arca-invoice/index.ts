import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import Afip from "npm:afip.js@0.7.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejo de peticiones preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { target_type, target_id, cbte_tipo, doc_tipo, doc_nro } = await req.json();

    if (!target_id || !target_type) {
      throw new Error("Faltan parA!metros obligatorios (target_type, target_id)");
    }

    // 1. Inicializar cliente de Supabase con permisos mA!ximos (Service Role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. AutenticaciA3n del usuario (Asegurarnos de que quien llama es un usuario vA!lido)
    const authHeader = req.headers.get('Authorization') ?? '';
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error("Usuario no autenticado");

    // 3. Obtener el perfil del usuario para saber su sucursal (branch_id)
    const { data: profile } = await supabase
      .from('users')
      .select('branch_id')
      .eq('id', user.id)
      .single();
    
    if (!profile?.branch_id) throw new Error("El usuario no tiene sucursal asignada");
    const branchId = profile.branch_id;

    // 4. Obtener la configuraciA3n de AFIP (CUIT, Punto de Venta) para esta sucursal
    // IMPORTANTE: DeberA!s tener una tabla 'arca_configs' o similar con estos datos.
    // AcA! usamos valores hardcodeados de ejemplo para la estructura.
    const cuit = 20111111112; // Reemplazar con query a la BD
    const puntoVenta = 1;     // Reemplazar con query a la BD
    const isProduction = false; // false = Entorno de Testing (HomologaciA3n AFIP)

    // 5. Descargar los certificados desde el Bucket seguro
    const { data: certBlob, error: certError } = await supabase.storage.from('arca_certs').download(`${branchId}/cert.crt`);
    const { data: keyBlob, error: keyError } = await supabase.storage.from('arca_certs').download(`${branchId}/private.key`);

    if (certError || keyError) {
      throw new Error("No se encontraron los certificados digitales para esta sucursal.");
    }

    const certString = await certBlob.text();
    const keyString = await keyBlob.text();

    // 6. Configurar la librerAa afip.js en modo Serverless (Edge Function)
    // Usamos el directorio /tmp porque es el Anico con permisos de escritura en la nube.
    const afip = new Afip({
      CUIT: cuit,
      cert: certString,
      key: keyString,
      ta_folder: '/tmp', // AFIP guardarA! sus tokens de sesiA3n temporalmente aquA-
      res_folder: '/tmp',
      production: isProduction
    });

    // 7. Calcular el Total a facturar leyendo desde la Base de Datos (Seguridad Anti-Fraude)
    let importeTotal = 0;
    if (target_type === 'work_order') {
      const { data: order } = await supabase.from('work_orders').select('total_amount').eq('id', target_id).single();
      if (!order) throw new Error("Orden de trabajo no encontrada");
      importeTotal = order.total_amount;
    } else if (target_type === 'cash_movement') {
      const { data: movement } = await supabase.from('cash_movements').select('amount').eq('id', target_id).single();
      if (!movement) throw new Error("Movimiento de caja no encontrado");
      importeTotal = Math.abs(movement.amount);
    }

    // 8. Solicitar a AFIP cuA!l es el Altimo comprobante emitido para este punto de venta
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(puntoVenta, cbte_tipo);
    const numeroFactura = lastVoucher + 1;

    // 9. Armar el payload para la factura (Factura B o C genA(c)rica)
    const date = new Date(Date.now() - ((new Date()).getTimezoneOffset() * 60000)).toISOString().split('T')[0].replace(/-/g, '');
    
    const data = {
      'CantReg': 1, // Cantidad de comprobantes
      'PtoVta': puntoVenta,
      'CbteTipo': cbte_tipo, 
      'Concepto': 2, // 1: Productos, 2: Servicios, 3: Productos y Servicios
      'DocTipo': doc_tipo, // 99 (Consumidor Final), 80 (CUIT)
      'DocNro': doc_nro,
      'CbteDesde': numeroFactura,
      'CbteHasta': numeroFactura,
      'CbteFch': parseInt(date),
      'ImpTotal': importeTotal,
      'ImpTotConc': 0, // No gravado
      'ImpNeto': importeTotal, // Depende de si sos Monotributo (es igual al total) o Responsable Inscripto.
      'ImpOpEx': 0,
      'ImpTrib': 0,
      'ImpIVA': 0,
      'FchServDesde': parseInt(date),
      'FchServHasta': parseInt(date),
      'FchVtoPago': parseInt(date),
      'MonId': 'PES', // Pesos Argentinos
      'MonCotiz': 1
    };

    // 10. A!Ejecutar la peticiA3n a AFIP! (Si falla, el cA3digo explota acA! y no guarda nada)
    console.log("Enviando comprobante a AFIP...", data);
    const resAfip = await afip.ElectronicBilling.createVoucher(data);

    // 11. AFIP aprobA3. Guardamos la factura en la base de datos (TransacciA3n atA3mica conceptual)
    const { data: invoiceDb, error: insertError } = await supabase
      .from('arca_invoices')
      .insert({
        branch_id: branchId,
        work_order_id: target_type === 'work_order' ? target_id : null,
        cash_movement_id: target_type === 'cash_movement' ? target_id : null,
        cae: resAfip.CAE,
        expiration_date: resAfip.CAEFchVto,
        voucher_number: numeroFactura,
        voucher_type: cbte_tipo,
        total_amount: importeTotal,
        resultado: 'A' // Aprobado
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error guardando en BD (pero AFIP ya aprobA3):", insertError);
      // En un entorno 100% robusto, si esto falla, habrAa que tener un mecanismo de contingencia
      // para no perder el CAE emitido.
    }

    // Respuesta exitosa al frontend
    return new Response(JSON.stringify({ 
      success: true, 
      cae: resAfip.CAE,
      cae_fch_vto: resAfip.CAEFchVto,
      numero_factura: numeroFactura,
      invoice: invoiceDb
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error en AFIP Edge Function:", error);
    
    // Devolver un 400 o 500 limpio al frontend con el mensaje exacto del error
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
