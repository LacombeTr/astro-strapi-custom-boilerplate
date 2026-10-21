#!/usr/bin/env node
/**
 * Initialise le dépôt pour un nouveau client.
 *
 * Ce script existe pour que dériver un site client soit une opération de cinq minutes et
 * reproductible, au lieu d'une chasse aux valeurs en dur dans une dizaine de fichiers.
 *
 *   node scripts/init-project.mjs                 initialisation interactive
 *   node scripts/init-project.mjs --dry-run       affiche les changements sans rien écrire
 *   node scripts/init-project.mjs --force         réinitialise un projet déjà configuré
 *   node scripts/init-project.mjs --answers f.json  mode non interactif (voir scripts/answers.example.json)
 *
 * Aucune dépendance : uniquement la bibliothèque standard de Node.
 */
import { createInterface } from 'node:readline/promises';
import { randomBytes } from 'node:crypto';
import { stdin, stdout } from 'node:process';
import { existsSync } from 'node:fs';
import { readFile, writeFile, rm, cp, mkdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const MARKER = join(ROOT, '.setup-done');

/**
 * Mode non interactif : `--answers fichier.json`.
 *
 * Nécessaire pour deux raisons : industrialiser la création de plusieurs sites clients, et
 * rendre ce script testable. Sans lui, une entrée redirigée ferait sortir le script
 * silencieusement, readline ne résolvant jamais ses questions après la fin du flux.
 */
const answersFlagIndex = process.argv.indexOf('--answers');
const ANSWERS_PATH =
  answersFlagIndex !== -1 ? process.argv[answersFlagIndex + 1] : null;

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m',
};
const say = (msg = '') => console.log(msg);
const title = (msg) => say(`\n${C.bold}${C.cyan}${msg}${C.reset}`);
const ok = (msg) => say(`  ${C.green}✓${C.reset} ${msg}`);
const warn = (msg) => say(`  ${C.yellow}!${C.reset} ${msg}`);
const note = (msg) => say(`  ${C.dim}${msg}${C.reset}`);

/** Journal des écritures, pour le récapitulatif et le mode --dry-run. */
const changes = [];

const p = (abs) => relative(ROOT, abs) || '.';

async function write(absPath, content, label) {
  changes.push(label ?? `modifie ${p(absPath)}`);
  if (DRY_RUN) return;
  await mkdir(dirname(absPath), { recursive: true });
  await writeFile(absPath, content);
}

async function remove(absPath, label) {
  if (!existsSync(absPath)) return;
  changes.push(label ?? `supprime ${p(absPath)}`);
  if (DRY_RUN) return;
  await rm(absPath, { recursive: true, force: true });
}

async function patch(absPath, transform, label) {
  if (!existsSync(absPath)) {
    warn(`${p(absPath)} absent — ignoré.`);
    return;
  }
  const before = await readFile(absPath, 'utf8');
  const after = transform(before);
  if (after === before) return;
  await write(absPath, after, label);
}

// ───────────────────────────────────────────────────────────── Questions

let preset = null;
let rl = null;

/** Prépare la source des réponses : fichier JSON, ou terminal interactif. */
async function openInput() {
  if (ANSWERS_PATH) {
    if (!existsSync(ANSWERS_PATH)) {
      throw new Error(`fichier de réponses introuvable : ${ANSWERS_PATH}`);
    }
    preset = JSON.parse(await readFile(ANSWERS_PATH, 'utf8'));
    return;
  }

  if (!stdin.isTTY) {
    throw new Error(
      'entrée non interactive détectée.\n' +
        '  Utilisez « node scripts/init-project.mjs --answers fichier.json »\n' +
        '  (modèle : scripts/answers.example.json).',
    );
  }

  rl = createInterface({ input: stdin, output: stdout });
}

const closeInput = () => rl?.close();

/**
 * Pose une question. `key` identifie la réponse dans le fichier JSON du mode non
 * interactif ; `fallback` s'applique si la réponse est absente ou vide.
 */
async function ask(key, question, fallback = '') {
  if (preset) {
    const value = preset[key];
    return value === undefined || value === null || value === '' ? fallback : String(value);
  }
  const suffix = fallback ? ` ${C.dim}(${fallback})${C.reset}` : '';
  const answer = (await rl.question(`  ${question}${suffix} : `)).trim();
  return answer || fallback;
}

async function askYesNo(key, question, defaultYes = true) {
  if (preset) {
    return typeof preset[key] === 'boolean' ? preset[key] : defaultYes;
  }
  const hint = defaultYes ? 'O/n' : 'o/N';
  const answer = (await rl.question(`  ${question} ${C.dim}(${hint})${C.reset} : `))
    .trim()
    .toLowerCase();
  if (!answer) return defaultYes;
  return answer.startsWith('o') || answer.startsWith('y');
}

/** Normalise une URL saisie : ajoute https:// et retire le slash final. */
function normalizeUrl(input) {
  let url = input.trim();
  if (!url) return '';
  if (!/^https?:\/\//.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, '');
}

const HEX = /^#?([0-9a-f]{6})$/i;
function normalizeHex(input, fallback) {
  const match = HEX.exec(input.trim());
  return match ? `#${match[1].toUpperCase()}` : fallback;
}

// ───────────────────────────────────────────────── Couleurs : échelle OKLCH

/** sRGB (0-255) → linéaire, pour pouvoir convertir en OKLab. */
const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/**
 * Convertit un hex en OKLCH. On travaille en OKLCH parce que c'est l'espace déjà utilisé par
 * `global.css` et, surtout, parce qu'il est perceptuellement uniforme : faire varier
 * uniquement la luminosité y produit une échelle de teintes régulière, ce qu'un simple
 * éclaircissement en RGB ne donne pas.
 */
function hexToOklch(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16)));

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.sqrt(A * A + B * B);
  let hue = (Math.atan2(B, A) * 180) / Math.PI;
  if (hue < 0) hue += 360;

  return { l: L, c: chroma, h: hue };
}

/** Paliers de luminosité calqués sur les échelles Tailwind. */
const STEPS = {
  25: 0.985, 50: 0.97, 100: 0.94, 200: 0.88, 300: 0.8, 400: 0.71,
  500: 0.63, 600: 0.55, 700: 0.47, 800: 0.39, 900: 0.3, 950: 0.21,
};

/** Facteur de chroma : maximal au palier 500, décroissant vers le blanc et vers le noir. */
const CHROMA_PIVOT = Math.sin(Math.PI * 0.63) ** 1.2;

/**
 * Construit une échelle 25→950 à partir d'une seule couleur.
 *
 * La chroma suit une sinusoïde de la luminosité, et non une valeur constante : près du blanc
 * ou du noir, une saturation pleine sort du gamut sRGB et le navigateur la rabat sur une
 * teinte criarde. On obtient ainsi des paliers clairs réellement pastel et des paliers
 * sombres profonds, comme dans les échelles Tailwind.
 */
function buildScale(hex) {
  const { c, h } = hexToOklch(hex);
  const scale = {};
  for (const [step, l] of Object.entries(STEPS)) {
    const factor = Math.min(1.1, Math.max(0.04, (Math.sin(Math.PI * l) ** 1.2) / CHROMA_PIVOT));
    const chroma = Math.max(0.004, c * factor);
    scale[step] = `oklch(${l.toFixed(3)} ${chroma.toFixed(4)} ${h.toFixed(2)})`;
  }
  return scale;
}

// ───────────────────────────────────────────────────────────── Étapes

/** 1. package.json : identité du projet. */
async function updatePackageJson({ projectSlug, description }) {
  await patch(join(ROOT, 'package.json'), (raw) => {
    const pkg = JSON.parse(raw);
    pkg.name = projectSlug;
    pkg.version = '0.1.0';
    pkg.description = description;
    delete pkg.private;
    pkg.private = true;
    return `${JSON.stringify(pkg, null, 2)}\n`;
  }, 'package.json : nom, version et description du client');
}

/** 2. src/config/site.ts : source unique de vérité du site. */
async function updateSiteConfig(a) {
  const q = (value) => JSON.stringify(value ?? '');
  const address = [a.street, a.postalCode, a.city].filter(Boolean).length
    ? `{
      street: ${q(a.street)},
      postalCode: ${q(a.postalCode)},
      city: ${q(a.city)},
      country: 'France',
    }`
    : 'undefined';

  const socials = Object.entries(a.socials)
    .filter(([, url]) => url)
    .map(([key, url]) => `    ${key}: ${q(url)},`)
    .join('\n');

  await patch(join(ROOT, 'src/config/site.ts'), (raw) => {
    const block = `export const site: SiteConfig = {
  name: ${q(a.siteName)},
  url: ${q(a.url)},
  locale: ${q(a.locale)},
  description: ${q(a.description)},
  titleSuffix: ${q(a.titleSuffix)},
  ogImage: '/og-image.png',
  contact: {
    email: ${q(a.email)},
    phone: ${q(a.phone)},
    address: ${address},
  },
  socials: {
${socials}
  },
  thirdParty: {
    googlemaps: ${a.usesMaps},
    youtube: ${a.usesYouTube},
  },
  schemaType: '${a.schemaType}',
  legal: {
    companyName: ${q(a.companyName)},
    legalForm: ${q(a.legalForm)},
    siret: ${q(a.siret)},
    publisher: ${q(a.publisher)},
    host: { name: ${q(a.hostName)}, address: ${q(a.hostAddress)} },
  },
};`;
    return raw.replace(/export const site: SiteConfig = \{[\s\S]*?\n\};/, block);
  }, 'src/config/site.ts : identité, contact, réseaux sociaux et mentions légales');
}

/** 3. .env : variables du front. Les secrets Strapi restent dans backend/.env. */
async function updateEnv({ strapiUrl, gaId }) {
  const envPath = join(ROOT, '.env');
  const example = await readFile(join(ROOT, 'env.example'), 'utf8');
  let content = existsSync(envPath) ? await readFile(envPath, 'utf8') : example;

  const setVar = (text, key, value) =>
    new RegExp(`^${key}=.*$`, 'm').test(text)
      ? text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
      : `${text.replace(/\n*$/, '')}\n${key}=${value}\n`;

  content = setVar(content, 'STRAPI_URL', strapiUrl);
  content = setVar(content, 'PUBLIC_GA_ID', gaId);
  // STRAPI_TOKEN est volontairement laissé tel quel : il est écrit par l'amorçage du CMS.

  await write(envPath, content, '.env : STRAPI_URL et PUBLIC_GA_ID');
}

/**
 * 4. backend/.env : régénère les secrets Strapi.
 * Indispensable : des secrets partagés entre plusieurs sites clients signifient qu'une fuite
 * sur l'un compromet les sessions d'administration de tous les autres.
 */
async function rotateBackendSecrets() {
  const envPath = join(ROOT, 'backend/.env');
  if (!existsSync(envPath)) {
    warn('backend/.env absent — secrets Strapi non régénérés.');
    return;
  }
  const key = () => randomBytes(16).toString('base64');

  await patch(envPath, (raw) =>
    raw
      .replace(/^APP_KEYS=.*$/m, `APP_KEYS=${[key(), key(), key(), key()].join(',')}`)
      .replace(/^API_TOKEN_SALT=.*$/m, `API_TOKEN_SALT=${key()}`)
      .replace(/^ADMIN_JWT_SECRET=.*$/m, `ADMIN_JWT_SECRET=${key()}`)
      .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${key()}`)
      .replace(/^TRANSFER_TOKEN_SALT=.*$/m, `TRANSFER_TOKEN_SALT=${key()}`)
      .replace(/^ENCRYPTION_KEY=.*$/m, `ENCRYPTION_KEY=${key()}`),
    'backend/.env : secrets Strapi régénérés',
  );
}

/** 5. global.css : tokens de marque et police. */
async function updateTheme({ brandColor, accentColor, fontFamily, fontPackage }) {
  const brand = buildScale(brandColor);
  const accent = buildScale(accentColor);

  await patch(join(ROOT, 'src/styles/global.css'), (raw) => {
    let css = raw;

    // Les deux familles de tokens du starter deviennent « marque » et « accent ».
    for (const [step, value] of Object.entries(brand)) {
      css = css.replace(
        new RegExp(`(--color-brand-${step}:\\s*)[^;]+;`),
        `$1${value};`,
      );
    }
    for (const [step, value] of Object.entries(accent)) {
      css = css.replace(
        new RegExp(`(--color-violet-${step}:\\s*)[^;]+;`),
        `$1${value};`,
      );
    }

    if (fontFamily) {
      css = css.replace(
        /@import '@fontsource-variable\/[^']+';/,
        `@import '${fontPackage}';`,
      );
      // On réécrit toute la pile, pas seulement le premier nom : laisser « Inter » en
      // fallback alors que le paquet n'est plus installé donnerait une police système
      // inattendue en cas d'échec de chargement.
      css = css.replace(
        /(--font-sans:\s*)[^;]+;/,
        `$1'${fontFamily}', ui-sans-serif, system-ui, -apple-system, sans-serif;`,
      );
    }

    return css;
  }, 'src/styles/global.css : échelles de couleurs et police');
}

/** 6. Pages légales : remplace les marqueurs par les informations du client. */
async function updateLegalPages(a) {
  const missing = '[À COMPLÉTER]';
  const value = (v) => (v && v.trim() ? v.trim() : missing);

  const address = [a.street, [a.postalCode, a.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');

  const services = [];
  if (a.gaId) {
    services.push(
      '| Google Analytics 4 | Mesure d\'audience | Google Ireland Ltd. | 13 mois | Consentement |',
    );
  }
  if (a.usesMaps) {
    services.push('| Google Maps | Affichage de la carte | Google Ireland Ltd. | Session | Consentement |');
  }
  if (a.usesYouTube) {
    services.push('| YouTube | Lecture des vidéos | Google Ireland Ltd. | Session | Consentement |');
  }

  const servicesList = services.length
    ? [
        '| Service | Finalité | Éditeur | Durée | Base légale |',
        '|---|---|---|---|---|',
        ...services,
        '',
        'Ces services ne sont chargés **qu\'après** votre acceptation. En cas de refus, aucune',
        'requête ne leur est adressée.',
      ].join('\n')
    : 'Aucun service tiers n\'est actuellement activé sur ce site : aucun cookie soumis à\nconsentement n\'est déposé.';

  const replacements = {
    companyName: value(a.companyName),
    legalForm: value(a.legalForm),
    siret: value(a.siret),
    address: value(address),
    phone: value(a.phone),
    email: value(a.email),
    publisher: value(a.publisher),
    hostName: value(a.hostName),
    hostAddress: value(a.hostAddress),
    servicesList,
  };

  for (const file of [
    'mentions-legales.md',
    'politique-de-confidentialite.md',
    'politique-cookies.md',
  ]) {
    await patch(join(ROOT, 'src/content/legal', file), (raw) =>
      raw.replace(/\{\{(\w+)\}\}/g, (match, key) =>
        key in replacements ? replacements[key] : match,
      ),
    `src/content/legal/${file} : informations du client`);
  }
}

/** 7. Supprime la vitrine de démonstration et installe une page d'accueil propre. */
async function removeDemo() {
  for (const path of [
    'src/components/showcase',
    'src/components/UIToggle.astro',
    'src/components/Toolbar.astro',
    'src/components/icons/AiNativeLogo.astro',
    'src/components/icons/ShadcnLogo.astro',
    'src/components/icons/StrapiLogo.astro',
    'src/components/icons/AstroLogo.astro',
    'src/components/icons/TypeScriptLogo.astro',
    'src/components/icons/TailwindLogo.astro',
    'src/components/icons/ReactLogo.astro',
    'src/components/icons/PaintbrushIcon.astro',
    'public/preview.png',
    'public/preview-lighthouse-desktop.png',
    'public/preview-lighthouse-mobile.png',
  ]) {
    await remove(join(ROOT, path));
  }

  // Page d'accueil minimale, pilotée par le CMS.
  const template = join(ROOT, 'scripts/templates/index.astro');
  changes.push('src/pages/index.astro : remplacé par la page pilotée par le CMS');
  if (!DRY_RUN) {
    await cp(template, join(ROOT, 'src/pages/index.astro'));
  }

  // Règles de l'ancien bascule Tailwind/shadcn, devenues sans objet.
  await patch(join(ROOT, 'src/styles/global.css'), (raw) =>
    raw.replace(
      /html\[data-ui="tailwind"\][\s\S]*?\n\}\n/,
      '',
    ),
    'src/styles/global.css : règles du bascule de démonstration retirées');
}

/** 8. Réinitialise l'historique git pour que le client démarre sur un dépôt propre. */
async function resetGit(projectSlug) {
  if (DRY_RUN) {
    changes.push('git : historique réinitialisé (un seul commit initial)');
    return;
  }
  const git = (...args) => execFileSync('git', args, { cwd: ROOT, stdio: 'pipe' });
  try {
    await rm(join(ROOT, '.git'), { recursive: true, force: true });
    git('init', '-b', 'main');
    git('add', '-A');
    git('commit', '-m', `chore: initialisation du projet ${projectSlug}`);
    ok('Historique git réinitialisé (un commit initial sur « main »).');
    note('LICENSE.md et le crédit Sensinum sont conservés : le starter est sous licence MIT.');
  } catch (error) {
    warn(`Réinitialisation git impossible : ${error.message.split('\n')[0]}`);
  }
}

// ───────────────────────────────────────────────────────────── Programme

async function main() {
  say(`${C.bold}Initialisation d'un nouveau site vitrine${C.reset}`);
  if (DRY_RUN) warn('Mode --dry-run : aucun fichier ne sera écrit.');

  await openInput();
  if (preset) note(`Réponses lues depuis ${ANSWERS_PATH}.`);

  if (existsSync(MARKER) && !FORCE && !DRY_RUN) {
    warn('Ce projet a déjà été initialisé (.setup-done présent).');
    note('Relancez avec --force pour recommencer, ou --dry-run pour prévisualiser.');
    closeInput();
    process.exitCode = 1;
    return;
  }

  title('Le site');
  const siteName = await ask('siteName', 'Nom du site / du client', 'Mon site vitrine');
  const projectSlug =
    (await ask(
      'projectSlug',
      'Nom technique du projet (minuscules, sans espace)',
      siteName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site-vitrine',
    ));
  const url = normalizeUrl(await ask('url', 'Domaine de production', 'https://exemple.fr'));
  const description = await ask(
    'description',
    'Description courte (utilisée comme meta description par défaut)',
    `Site officiel de ${siteName}.`,
  );
  const titleSuffix = await ask('titleSuffix', 'Suffixe des titres de page (vide = aucun)', `| ${siteName}`);
  const locale = await ask('locale', 'Locale', 'fr-FR');

  title('Contact et identité');
  const email = await ask('email', 'Courriel de contact');
  const phone = await ask('phone', 'Téléphone');
  const street = await ask('street', 'Adresse (rue)');
  const postalCode = await ask('postalCode', 'Code postal');
  const city = await ask('city', 'Ville');
  const hasPhysicalPlace = await askYesNo(
    'hasPhysicalPlace',
    'L\'entreprise reçoit-elle du public à cette adresse ? (choisit le type de données structurées)',
    false,
  );

  title('Réseaux sociaux (laisser vide pour ignorer)');
  const socials = {
    facebook: await ask('facebook', 'Facebook'),
    instagram: await ask('instagram', 'Instagram'),
    linkedin: await ask('linkedin', 'LinkedIn'),
  };

  title('Mentions légales');
  note('Laisser vide inscrit « [À COMPLÉTER] » dans les pages légales.');
  const companyName = await ask('companyName', 'Raison sociale', siteName);
  const legalForm = await ask('legalForm', 'Forme juridique (SAS, SARL, auto-entrepreneur…)');
  const siret = await ask('siret', 'SIRET');
  const publisher = await ask('publisher', 'Responsable de la publication');
  const hostName = await ask('hostName', 'Hébergeur du site', 'Vercel Inc.');
  const hostAddress = await ask(
    'hostAddress',
    'Adresse de l\'hébergeur',
    '340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis',
  );

  title('Apparence');
  const brandColor = normalizeHex(
    await ask('brandColor', 'Couleur de marque principale (hex)', '#4CE39C'),
    '#4CE39C',
  );
  const accentColor = normalizeHex(
    await ask('accentColor', 'Couleur d\'accent (hex)', '#7E6EEB'),
    '#7E6EEB',
  );
  const fontChoice = await ask(
    'font',
    'Police (nom Fontsource, ex. inter, manrope, dm-sans)',
    'inter',
  );

  title('Technique et RGPD');
  const strapiUrl = await ask('strapiUrl', 'URL du CMS Strapi', 'http://localhost:1337');
  const gaId = await ask('gaId', 'Identifiant Google Analytics 4 (vide = aucun bandeau cookies)');
  const usesMaps = await askYesNo('usesMaps', 'Le site affichera-t-il une carte Google Maps ?', false);
  const usesYouTube = await askYesNo('usesYouTube', 'Le site intégrera-t-il des vidéos YouTube ?', false);

  title('Finalisation');
  const doDemo = await askYesNo('removeDemo', 'Supprimer la vitrine de démonstration Sensinum ?', true);
  const doGit = await askYesNo('resetGit', 'Réinitialiser l\'historique git (nouveau commit initial) ?', true);

  closeInput();

  // ── Application
  const fontSlug = fontChoice.trim().toLowerCase().replace(/\s+/g, '-');
  const fontFamily = fontSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const answers = {
    siteName, projectSlug, url, description, titleSuffix, locale,
    email, phone, street, postalCode, city, socials,
    schemaType: hasPhysicalPlace ? 'LocalBusiness' : 'Organization',
    companyName, legalForm, siret, publisher, hostName, hostAddress,
    brandColor, accentColor,
    fontFamily: `${fontFamily} Variable`,
    fontPackage: `@fontsource-variable/${fontSlug}`,
    strapiUrl, gaId, usesMaps, usesYouTube,
  };

  title('Application des changements');
  await updatePackageJson(answers);
  await updateSiteConfig(answers);
  await updateEnv(answers);
  await rotateBackendSecrets();
  await updateTheme(answers);
  await updateLegalPages(answers);
  if (doDemo) await removeDemo();

  for (const change of changes) ok(change);

  if (DRY_RUN) {
    say(`\n${C.yellow}Aucun fichier écrit (--dry-run).${C.reset}`);
    return;
  }

  await writeFile(MARKER, `${new Date().toISOString()}\n${projectSlug}\n`);

  // Vérifie que la page d'accueil copiée depuis scripts/templates/ compile bien en place :
  // ce dossier est exclu du tsconfig, ses imports ne sont donc contrôlés qu'à partir d'ici.
  if (doDemo && existsSync(join(ROOT, 'node_modules'))) {
    title('Vérification des types');
    try {
      execFileSync('npx', ['astro', 'check'], { cwd: ROOT, stdio: 'pipe' });
      ok('astro check : aucune erreur.');
    } catch (error) {
      warn('astro check signale des erreurs — lancez « npm run typecheck » pour les voir.');
      note(String(error.stdout ?? '').split('\n').slice(-6).join('\n'));
    }
  }

  if (doGit) await resetGit(projectSlug);

  title('Terminé');
  say(`  1. ${C.bold}npm run dev${C.reset}            lance Strapi (1337) et Astro (4321)`);
  say('  2. http://localhost:1337/admin  créez le compte administrateur');
  say('  3. http://localhost:4321        le site, alimenté par le CMS');
  say('');
  if (answers.fontPackage !== '@fontsource-variable/inter') {
    warn(`Pensez à installer la police : npm install ${answers.fontPackage}`);
  }
  if (gaId) {
    note('GA4 configuré : le bandeau cookies s\'affichera, et rien ne sera chargé avant acceptation.');
  } else {
    note('Aucun service tiers : aucun cookie, donc aucun bandeau. C\'est le réglage le plus sûr.');
  }
  note('Relisez src/content/legal/ : les modèles ne sont pas un conseil juridique.');
  say('');
}

main().catch((error) => {
  closeInput();
  console.error(`\n${C.red}Échec de l'initialisation :${C.reset} ${error.message}`);
  process.exitCode = 1;
});
