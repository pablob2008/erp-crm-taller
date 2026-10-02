import * as facturas from "npm:facturas@0.20.0";

const cert = await Deno.readTextFile("arca_keys/homologacion.crt");
const key = await Deno.readTextFile("arca_keys/homologacion.key");

const client = facturas.createArcaClient({
  taxId: "20370443662",
  certificatePem: cert,
  privateKeyPem: key,
  environment: "test",
});

const todayStr = "2026-09-30";

function buildToPayload(documentType: number, documentNumber: string) {
  const docNumberInt = parseInt(documentNumber, 10) || 0;
  if (documentType === 80 && docNumberInt > 0) {
    return {
      condition: "responsable_inscripto",
      cuit: docNumberInt,
    };
  } else if (documentType === 96 && docNumberInt > 0) {
    return {
      condition: "consumidor_final",
      dni: docNumberInt,
    };
  } else {
    return {
      condition: "consumidor_final",
    };
  }
}

// Case 1: Generic customer with "0" or doc_tipo 96 and doc_nro "0"
const to1 = buildToPayload(96, "0");
console.log("To payload for (96, '0'):", to1);

const res1 = await client.issue({
  issuer: "monotributo",
  salesPoint: 4,
  to: to1,
  total: 100000,
  amounts: { net: 100000, vat: 0 },
});
console.log("Success Case 1! CAE:", res1.voucher.cae, "DocTipo:", res1.voucher.header.documentType, "DocNro:", res1.voucher.header.documentNumber);

// Case 2: Customer with real DNI
const to2 = buildToPayload(96, "35123456");
console.log("\nTo payload for (96, '35123456'):", to2);
const res2 = await client.issue({
  issuer: "monotributo",
  salesPoint: 4,
  to: to2,
  total: 150000,
  amounts: { net: 150000, vat: 0 },
});
console.log("Success Case 2! CAE:", res2.voucher.cae, "DocTipo:", res2.voucher.header.documentType, "DocNro:", res2.voucher.header.documentNumber);
