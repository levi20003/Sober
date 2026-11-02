// Kiadási folyamat (audit SEC-02, SEC-03, SEC-04): az APK csak zöld build ÉS zöld emulátoros próba után, egy külön,
// jóváhagyáshoz köthető (environment: release) jobban kerülhet ki; írási jog csak ennek a jobnak van.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CI = readFileSync('.github/workflows/android.yml', 'utf8');
/** Egy job szövege a workflow-ban (a következő, 2 szóközzel behúzott job-kulcsig). */
function job(name) {
  const start = CI.indexOf(`\n  ${name}:\n`);
  assert.ok(start >= 0, `job ${name} exists`);
  const rest = CI.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:\n/);
  return next < 0 ? rest : rest.slice(0, next + 1);
}

test('SEC-03: the release is a separate job that needs both the APK build and the emulator smoke test', () => {
  const rel = job('release');
  assert.match(rel, /needs:\s*\[\s*apk\s*,\s*emulator-smoke\s*\]/);
  assert.match(rel, /gh release create android-latest/);
  assert.match(rel, /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
});

test('SEC-02: the release job runs in the "release" environment (required reviewer can be set there)', () => {
  assert.match(job('release'), /environment:\s*\n\s*name: release/);
});

test('SEC-02: only the release job may write; the workflow default is read-only', () => {
  const top = CI.slice(0, CI.indexOf('\njobs:'));
  assert.match(top, /permissions:\s*\n\s*contents: read/);
  assert.match(job('release'), /permissions:\s*\n\s*contents: write/);
  assert.doesNotMatch(job('apk'), /gh release (create|delete)/, 'the build job no longer publishes');
  assert.doesNotMatch(job('emulator-smoke'), /contents: write/);
});

test('SEC-03: the release publishes exactly the APK that the build job produced and checks its hash', () => {
  const rel = job('release');
  assert.match(rel, /gh run download "\$GITHUB_RUN_ID" --name jozansag-szamlalo-apk/);
  assert.match(rel, /sha256sum -c jozansag-szamlalo\.apk\.sha256/);
  assert.match(rel, /needs\.apk\.outputs\.signing_kind/);
  assert.match(job('apk'), /outputs:[\s\S]*version_code:[\s\S]*signing_kind:[\s\S]*cert_sha256:/);
});

test('SEC-03: a debug-signed build is never published', () => {
  assert.match(job('release'), /if \[ "\$SIGNING_KIND" != "release" \]; then[\s\S]{0,200}exit 1/);
});

test('SEC-04: the emulator harness waits for the app origin and never throws on blocked localStorage', () => {
  const flow = readFileSync('scripts/android/flow.mjs', 'utf8');
  const install = flow.slice(flow.indexOf('export async function install'), flow.indexOf('export async function environment'));
  assert.match(install, /location\.origin === 'https:\/\/localhost'/);
  assert.doesNotMatch(install.replace(/try \{[^}]*\}/g, ''), /localStorage\.(get|set)Item/, 'every localStorage call is inside try');
});
