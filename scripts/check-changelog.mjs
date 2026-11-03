// PR-ellenőrzés: ha a PR az alkalmazás kódját (src/, android/app/src/, public/, index.html) módosítja,
// a CHANGELOG.md-nek is változnia kell. A fájllistát a GitHub API-ból kapja (gh CLI), vagy argumentumként.
//   node scripts/check-changelog.mjs <fájl1> <fájl2> ...
import { execFileSync } from 'node:child_process';

export function needsChangelog(files) {
  const code = files.filter((f) => /^(src\/|android\/app\/src\/|public\/|index\.html$)/.test(f));
  return code.length > 0 && !files.includes('CHANGELOG.md');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let files = process.argv.slice(2);
  if (!files.length && process.env.PR_NUMBER) {
    files = execFileSync('gh', ['api', `repos/${process.env.GITHUB_REPOSITORY}/pulls/${process.env.PR_NUMBER}/files`, '--paginate', '--jq', '.[].filename'], { encoding: 'utf8' })
      .split('\n').filter(Boolean);
  }
  if (needsChangelog(files)) {
    console.log('::error::A PR az alkalmazás kódját módosítja, de a CHANGELOG.md-t nem. Írd le röviden a változást (a legfelső szakaszba).');
    process.exit(1);
  }
  console.log('Változásnapló rendben.');
}
