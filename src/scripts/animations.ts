/**
 * Animations d'apparition au défilement.
 *
 * Deux choix de taille, volontaires sur un site dont l'argument principal est la légèreté :
 *
 *  - `motion/mini` au lieu de `motion` : seul `animate` est importé, soit ~5 Ko au lieu de
 *    ~62 Ko pour le paquet complet. Les apparitions n'ont pas besoin du moteur de ressorts
 *    ni des gestes.
 *  - `IntersectionObserver` natif au lieu du `inView` de motion : même service, zéro octet.
 *
 * `motion/react` reste disponible pour un composant réellement interactif, mais ne justifie
 * pas à lui seul de créer un îlot hydraté.
 *
 * Usage dans un layout :
 *
 *   <script>
 *     import { initAnimations } from '../scripts/animations';
 *     initAnimations();
 *   </script>
 *
 * Markup : `<section data-reveal>` ou `<ul data-stagger>`.
 */
import { animate } from 'motion/mini';

/**
 * Respecte le réglage système « réduire les animations ». Ce n'est pas une préférence
 * esthétique : les animations peuvent déclencher des troubles vestibulaires.
 */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const reveal = (element: Element, delay = 0) =>
  animate(
    element,
    { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0px)'] },
    { duration: 0.45, delay, ease: 'easeOut' },
  );

/**
 * Observe une fois chaque cible, puis cesse de l'observer : rejouer l'animation à chaque
 * passage est distrayant, et garder l'observateur actif coûte inutilement.
 */
function observe(selector: string, onEnter: (element: Element) => void) {
  const targets = document.querySelectorAll(selector);
  if (targets.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        onEnter(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
  );

  for (const target of targets) observer.observe(target);
}

/** Fait apparaître les éléments `[data-reveal]` à leur entrée dans le viewport. */
export function revealOnScroll(selector = '[data-reveal]') {
  observe(selector, (element) => reveal(element));
}

/** Fait apparaître en cascade les enfants directs de chaque `[data-stagger]`. */
export function staggerChildren(selector = '[data-stagger]') {
  observe(selector, (element) => {
    Array.from(element.children).forEach((child, index) => {
      reveal(child, index * 0.08);
    });
  });
}

/**
 * Point d'entrée unique.
 *
 * L'opacité n'est jamais mise à 0 en CSS : si ce script échoue ou n'est pas exécuté, le
 * contenu reste visible. Une animation ne doit jamais pouvoir masquer du contenu.
 */
export function initAnimations() {
  if (prefersReducedMotion()) return;
  revealOnScroll();
  staggerChildren();
}
