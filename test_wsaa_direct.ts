import * as crypto from "node:crypto";
import axios from "npm:axios";

async function run() {
  const cert = await Deno.readTextFile("arca_keys/homologacion.crt");
  const key = await Deno.readTextFile("arca_keys/homologacion.key");

  // Create TRA
  const generationTime = new Date(Date.now() - 600000).toISOString();
  const expirationTime = new Date(Date.now() + 600000).toISOString();
  const tra = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
<header>
<uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
<generationTime>${generationTime}</generationTime>
<expirationTime>${expirationTime}</expirationTime>
</header>
<service>wsfe</service>
</loginTicketRequest>`;

  console.log("TRA:", tra);
  // We need to sign this TRA. It's complex to do raw PKCS#7 in Deno without node-forge.
  // Instead, let's just patch afip.js locally to print the response body.
}
run();
