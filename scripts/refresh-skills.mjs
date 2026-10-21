/**
 * Re-télécharge les SKILL.md amont vendorés dans .claude/skills/.
 *
 * À lancer après une montée de version de @sensinum/astro-strapi-loader ou
 * @sensinum/astro-strapi-blocks, pour que les instructions locales correspondent au code
 * réellement installé. La note de version en tête de chaque fichier est régénérée.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKGS = ['astro-strapi-loader', 'astro-strapi-blocks'];

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

for (const name of PKGS) {
  const installed = pkg.dependencies?.[`@sensinum/${name}`]?.replace(/^[\^~]/, '') ?? 'inconnue';
  const url = `https://raw.githubusercontent.com/VirtusLab-Open-Source/${name}/main/.ai/${name}/SKILL.md`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[skills] ${name} : HTTP ${res.status} — conservation de la copie locale.`);
    continue;
  }
  const body = await res.text();

  // Réinsère la note de vendoring juste après le frontmatter YAML.
  const end = body.indexOf('\n---', 3);
  if (!body.startsWith('---') || end === -1) {
    console.error(`[skills] ${name} : frontmatter inattendu — fichier non écrit.`);
    continue;
  }
  const head = body.slice(0, end + 4);
  const rest = body.slice(end + 4);
  const note = [
    '',
    '',
    '> **Vendoré depuis l’amont.** Copie locale de `.ai/' + name + '/SKILL.md` du dépôt',
    '> [VirtusLab-Open-Source/' + name + `](https://github.com/VirtusLab-Open-Source/${name}),`,
    '> alignée sur `@sensinum/' + name + '@' + installed + '`.',
    '> À rafraîchir lors de la montée de version du paquet (`npm run skills:refresh`).',
  ].join('\n');

  await writeFile(join(root, '.claude', 'skills', name, 'SKILL.md'), head + note + rest);
  console.log(`[skills] ${name} mis à jour (aligné sur ${installed}).`);
}
