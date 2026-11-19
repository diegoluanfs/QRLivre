import { spawnSync } from 'node:child_process';
// Keep the existing production mode/.env files, but never inject the web review tag into the AAB.
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Execute npm run build:android.');
const result = spawnSync(process.execPath, [npmCli, 'run', 'build'], {
  stdio: 'inherit', env: { ...process.env, QRLIVRE_BUILD_TARGET: 'android', QRLIVRE_ADSENSE_REVIEW: 'false' },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
