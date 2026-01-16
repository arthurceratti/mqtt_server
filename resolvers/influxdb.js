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
TOKEN = argv.token || process.env.INFLUX_TOKEN || process.env.INFLUXDB_TOKEN;
ORG = argv.org || process.env.INFLUX_ORG || process.env.INFLUXDB_ORG;
BUCKET = argv.bucket || process.env.INFLUX_BUCKET;

if (!TOKEN) {
  throw new Error('Erro: token InfluxDB não fornecido. Use INFLUX_TOKEN ou --token.');
}
if (!ORG) {
  throw new Error('Erro: org InfluxDB não fornecida. Use INFLUX_ORG ou --org.');
}
if (!BUCKET) {
  throw new Error('Erro: bucket InfluxDB não fornecido. Use INFLUX_BUCKET ou --bucket.');
}

client = new InfluxDB({ url: INFLUX_URL, token: TOKEN })
queryApi = client.getQueryApi(ORG)
console.log(`Query API: ${queryApi}`)
}

function filterReceivedData(data, filterKey) {
  // filterKey may be a substring (eg 'temp' or 'humid' or '_temperatura')
  const key = (filterKey || '').toString().replace(/^_+/, '').toLowerCase();
  const filtered = (data || []).filter(item => {
    const m = (item._measurement || item.measurement || '').toString().toLowerCase();
    return key ? m.includes(key) : false;
  }).map(r => [r._time || r.time, (r._value !== undefined ? r._value : r.value)]);
  // debug
  // console.log(`Filtered data (${filterKey}):`, filtered)
  return filtered;
}

function formatRangeArg(v) {
  // If v is a relative duration like '-1h', return as-is (no quotes).
  if (!v) return undefined;
  const s = String(v).trim();
  if (/^-\d+[smhdw]$/i.test(s)) return s; // -1h, -30m
  // If it parses as a date, use time(v: "...")
  const parsed = Date.parse(s);
  if (!isNaN(parsed)) return `time(v: "${s}")`;
  // Otherwise return the string as-is (caller may construct correct literal)
  return s;
}

async function fetchLastHour({ start, stop } = {}) {
  try {
    authenticate();
    // Build range() args using helper to support relative durations or ISO timestamps
    const startArg = formatRangeArg(start) || '-1h';
    const stopArg = formatRangeArg(stop);
    // Flux query: pega tudo do bucket na faixa desejada
    fluxQuery = `from(bucket: "${BUCKET}") |> range(start: ${startArg}${stopArg ? `, stop: ${stopArg}` : ''})`

    console.log(`Query API initialized for org ${ORG}`)

    console.log(`Conectando em ${INFLUX_URL} (org: ${ORG}), buscando dados do bucket '${BUCKET}' com range start=${start} stop=${stop}...`)

    const rows = await queryApi.collectRows(fluxQuery)

    if (!rows || rows.length === 0) {
      console.log('Nenhum dado encontrado no intervalo solicitado.')
      return { rows: [], arrayOfTemperature: [['time', 'temperature']], arrayOfHumidity: [['time', 'humidity']], fluxQuery }
    }

    //console.log(`Encontrados ${rows.length} registros. Exibindo os primeiros 2:`)
    const preview = rows.slice(0, 2)
    //console.log(JSON.stringify(preview, null, 2))

    // populate arrays by splitting rows by _measurement (supports english and portuguese keys)
    const arrayOfTemperature = filterReceivedData(rows, 'temp')
    const arrayOfHumidity = [...filterReceivedData(rows, 'humid'), ...filterReceivedData(rows, 'umid')]

    // add header rows indicating column names
    arrayOfTemperature.unshift(['time', 'temperature'])
    arrayOfHumidity.unshift(['time', 'humidity'])

    console.log(`Temperatura: ${arrayOfTemperature.length} pontos, Umidade: ${arrayOfHumidity.length} pontos.`)
    console.log(`Temperatura exemplos:`, arrayOfTemperature.slice(0,5))
    console.log(`Umidade exemplos:`, arrayOfHumidity.slice(0,5))
    // Se quiser, pode salvar em arquivo ou processar / transformar os dados aqui.
    return { rows, arrayOfTemperature, arrayOfHumidity, fluxQuery };
  } catch (err) {
    console.error('Erro ao consultar InfluxDB:', err.message || err)
    throw err;
  }
}



//fetchLastHour()

// Exportado para testes unitários caso necessário
//module.exports = { fetchLastHour, fluxQuery }
export default { fetchLastHour, fluxQuery };
