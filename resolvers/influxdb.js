/*
 * Script para consultar InfluxDB (v2) e retornar todos os registros do bucket "ganso"
 * do último 1 hora (range start: -1h).
 *
 * Como usar:
 *   - Instale dependência: npm install @influxdata/influxdb-client
 *   - Exporte variáveis de ambiente:
 export INFLUX_TOKEN="seu_token_aqui"
 *       export INFLUX_ORG="sua_org_aqui"
 *   - Execute: node testing.js
 *
 * Alternativamente, passe token/org como argumentos:
 *   node testing.js --token=TOKEN --org=ORG
 */
import dotenv from 'dotenv';
import path from 'path';
import { InfluxDB } from '@influxdata/influxdb-client';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

let INFLUX_URL;
let TOKEN;
let ORG;
let BUCKET;
let client;
let queryApi;
let fluxQuery;

function authenticate() {
const argv = yargs(hideBin(process.argv))
  .option('token', { type: 'string', describe: 'InfluxDB token' })
  .option('org', { type: 'string', describe: 'InfluxDB org' })
  .option('bucket', { type: 'string', describe: 'InfluxDB bucket' })
  .option('url', { type: 'string', describe: 'InfluxDB URL (overrides INFLUX_URL env)' })
  .option('env', { type: 'string', describe: 'Path to .env file' })
  .help()
  .parse();

// Load environment variables from the specified .env file (if any) or from ./ .env
const envPath = argv.env ? path.resolve(process.cwd(), argv.env) : path.resolve(process.cwd(), '.env');
const dotenvResult = dotenv.config({ path: envPath });
if (dotenvResult.error) {
  if (dotenvResult.error && dotenvResult.error.code === 'ENOENT') {
    console.log(`.env file not found at ${envPath} (continuing with existing environment variables)`);
  } else {
    console.warn('Warning: could not load .env file:', dotenvResult.error.message || dotenvResult.error);
  }
} else {
  console.log(`Loaded environment variables from ${envPath}`);
}

INFLUX_URL = argv.url || process.env.INFLUX_URL || 'http://192.168.0.101:8886';
TOKEN = argv.token || process.env.INFLUXDB_TOKEN;
ORG = argv.org || process.env.INFLUXDB_ORG;
BUCKET = argv.bucket || process.env.INFLUX_BUCKET;

if (!TOKEN) {
  console.error('Erro: token InfluxDB não fornecido. Use INFLUX_TOKEN ou --token.')
  process.exit(1)
}
if (!ORG) {
  console.error('Erro: org InfluxDB não fornecida. Use INFLUX_ORG ou --org.')
  process.exit(1)
}
if (!BUCKET) {
  console.error('Erro: bucket InfluxDB não fornecido. Use INFLUX_BUCKET ou --bucket.')
  process.exit(1)
}

client = new InfluxDB({ url: INFLUX_URL, token: TOKEN })
queryApi = client.getQueryApi(ORG)

// Flux query: pega tudo do bucket "ganso" na última hora
fluxQuery = `from(bucket: "${BUCKET}") |> range(start: -1h)`
}
async function fetchLastHour() {
  try {
    authenticate();
    console.log(`Query API initialized for org ${ORG}`)

    console.log(`Conectando em ${INFLUX_URL} (org: ${ORG}), buscando dados do bucket '${BUCKET}' da última hora...`)

    const rows = await queryApi.collectRows(fluxQuery)

    if (!rows || rows.length === 0) {
      console.log('Nenhum dado encontrado no intervalo solicitado.')
      return
    }

    console.log(`Encontrados ${rows.length} registros. Exibindo os primeiros 50:`)
    const preview = rows.slice(0, 50)
    console.log(JSON.stringify(preview, null, 2))

    // Se quiser, pode salvar em arquivo ou processar / transformar os dados aqui.
  } catch (err) {
    console.error('Erro ao consultar InfluxDB:', err.message || err)
    process.exitCode = 2
  }
}

//fetchLastHour()

// Exportado para testes unitários caso necessário
//module.exports = { fetchLastHour, fluxQuery }
export default { fetchLastHour, fluxQuery };
