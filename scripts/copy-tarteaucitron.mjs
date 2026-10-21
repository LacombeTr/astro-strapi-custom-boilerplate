/**
 * Copie les assets de tarteaucitron dans public/vendor/tarteaucitron/.
 *
 * Pourquoi : tarteaucitron est du JS global chargé via <script is:inline>, il ne passe donc
 * pas par le bundler Vite. Or Astro ne sert pas node_modules au runtime — les fichiers
 * doivent être physiquement présents dans public/.
 *
 * Lancé par le `postinstall`. public/vendor/ est gitignoré : c'est un artefact d'install.
 */
import { cp, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'tarteaucitronjs');
const dest = join(root, 'public', 'vendor', 'tarteaucitron');

/** Seuls les fichiers réellement nécessaires — pas les ~200 langues ni les demos. */
const ENTRIES = [
  'tarteaucitron.js',
  'tarteaucitron.services.js',
  'advertising.js',
  'css',
  'lang/tarteaucitron.fr.js',
  'lang/tarteaucitron.en.js',
];

const exists = async (p) => access(p).then(() => true, () => false);

if (!(await exists(src))) {
  console.warn('[tarteaucitron] paquet absent — étape ignorée (normal avant `npm install`).');
  process.exit(0);
}

let copied = 0;
for (const entry of ENTRIES) {
  const from = join(src, entry);
  if (!(await exists(from))) {
    console.warn(`[tarteaucitron] introuvable, ignoré : ${entry}`);
    continue;
  }
  const to = join(dest, entry);
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to, { recursive: true });
  copied++;
}

console.log(`[tarteaucitron] ${copied} entrée(s) copiée(s) vers public/vendor/tarteaucitron/`);
