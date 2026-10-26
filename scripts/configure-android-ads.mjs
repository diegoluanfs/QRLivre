/**
 * Acrescenta a identificação exigida pelo Google Mobile Ads ao projeto criado pelo Capacitor.
 * Idempotente: pode ser executado após cada `cap sync` sem duplicar tags.
 * Só depende de bibliotecas nativas do Node.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base = process.cwd();
const manifestPath = resolve(base, 'android/app/src/main/AndroidManifest.xml');
const stringsPath = resolve(base, 'android/app/src/main/res/values/strings.xml');

function loadDotEnv(file) {
  if (!existsSync(file)) return {};
  const vars = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, '');
    vars[match[1]] = value;
  }
  return vars;
}

const env = {
  ...loadDotEnv(resolve(base, '.env')),
  ...loadDotEnv(resolve(base, '.env.production')),
  ...loadDotEnv(resolve(base, '.env.local')),
  ...loadDotEnv(resolve(base, '.env.production.local')),
  ...process.env,
};

if (!existsSync(manifestPath) || !existsSync(stringsPath)) {
  console.error('Projeto Android não encontrado. Rode npm run android:init primeiro.');
  process.exit(1);
}

const mode = env.VITE_ADMOB_MODE === 'live' ? 'live' : 'test';
const enabled = (env.VITE_ADMOB_ENABLED ?? 'true') === 'true';
const googleTestAppId = 'ca-app-pub-3940256099942544~3347511713';
const appId = mode === 'test' ? googleTestAppId : env.VITE_ADMOB_ANDROID_APP_ID;
const unitId = env.VITE_ADMOB_ANDROID_BANNER_ID;

if (enabled && !/^ca-app-pub-\d{16}~\d+$/.test(appId || '')) {
  console.error('VITE_ADMOB_ANDROID_APP_ID inválido: informe o ID DO APP (com ~), não o do banner.');
  process.exit(1);
}
if (enabled && mode === 'live' && !/^ca-app-pub-\d{16}\/\d+$/.test(unitId || '')) {
  console.error('VITE_ADMOB_ANDROID_BANNER_ID inválido: informe o ID DO BANNER (com /).');
  process.exit(1);
}

if (!enabled) {
  console.log('AdMob desativado: não será solicitado banner na aplicação.');
  process.exit(0);
}

let manifest = readFileSync(manifestPath, 'utf8');
const meta = '<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id" />';
const oldMeta = /<meta-data\s+android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"[^>]*\/>/;
if (oldMeta.test(manifest)) manifest = manifest.replace(oldMeta, meta);
else manifest = manifest.replace(/(<application\b[^>]*>)/, `$1\n        ${meta}`);
if (!manifest.includes('android:name="com.google.android.gms.permission.AD_ID"')) {
  manifest = manifest.replace(/(<manifest\b[^>]*>)/, '$1\n    <uses-permission android:name="com.google.android.gms.permission.AD_ID" />');
}
writeFileSync(manifestPath, manifest);

let strings = readFileSync(stringsPath, 'utf8');
const line = `<string name="admob_app_id">${appId}</string>`;
const oldLine = /<string\s+name="admob_app_id"[^>]*>[^<]*<\/string>/;
if (oldLine.test(strings)) strings = strings.replace(oldLine, line);
else strings = strings.replace('</resources>', `    ${line}\n</resources>`);
writeFileSync(stringsPath, strings);

console.log(`AdMob Android configurado (${mode === 'test' ? 'ID oficial de TESTE' : 'ID de PRODUÇÃO'}).`);
console.log('Manifest: APPLICATION_ID, permissão AD_ID.');
