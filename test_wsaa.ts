import Afip from "npm:@afipsdk/afip.js@1.2.3";

const cert = await Deno.readTextFile("arca_keys/homologacion.crt");
const key = await Deno.readTextFile("arca_keys/homologacion.key");

const afip = new Afip({
  CUIT: 20370443662,
  cert: cert,
  key: key,
  ta_folder: "./",
  res_folder: "./",
  production: false,
});

async function run() {
  try {
    const res = await afip.ElectronicBilling.getServerStatus();
    console.log(res);
  } catch (e) {
    console.error(e.message);
  }
}
run();
