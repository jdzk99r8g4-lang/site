// Mise en forme des nombres, montants et dates, en francais.
// Les montants sont en dollars sauf mention contraire.

const NOMBRE = new Intl.NumberFormat('fr-FR');
const DEUX_DECIMALES = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const NON_ESTIME = 'non estimé';

export function nombre(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined || !Number.isFinite(valeur)) return '—';
  return NOMBRE.format(Math.round(valeur));
}

/** Montant en dollars : « 8,68 $ ». null devient « non estimé ». */
export function dollars(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined || !Number.isFinite(valeur)) return NON_ESTIME;
  return `${DEUX_DECIMALES.format(valeur)} $`;
}

/** Montant en euros : « 6,72 € ». */
export function euros(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined || !Number.isFinite(valeur)) return '—';
  return `${DEUX_DECIMALES.format(valeur)} €`;
}

/** Fraction affichee en pourcentage : 0,75 devient « 75 % ». */
export function pourcent(valeur: number | null | undefined, decimales = 0): string {
  if (valeur === null || valeur === undefined || !Number.isFinite(valeur)) return '—';
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valeur * 100)} %`;
}

/** Date « 2026-11-19 » affichee « 19/11/2026 ». */
export function date(valeur: string | null | undefined): string {
  if (!valeur) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valeur);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : valeur;
}

/** Mois « 2026-11 » affiche « novembre 2026 ». */
export function mois(valeur: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(valeur);
  if (!m) return valeur;
  const nom = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(Number(m[1]), Number(m[2]) - 1, 1),
  );
  return nom;
}

/** Mois « 2026-11 » affiche « nov. 26 » (pour les axes de graphique). */
export function moisCourt(valeur: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(valeur);
  if (!m) return valeur;
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(
    new Date(Number(m[1]), Number(m[2]) - 1, 1),
  );
}

export function heure(valeur: string | null | undefined): string {
  return valeur ? valeur : '—';
}

/** Delai en minutes : « 14 min » ou « 1 h 05 ». */
export function delai(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return '—';
  const arrondi = Math.round(minutes);
  if (arrondi < 60) return `${arrondi} min`;
  const h = Math.floor(arrondi / 60);
  const m = arrondi % 60;
  return `${h} h ${String(m).padStart(2, '0')}`;
}

/** Date du jour au format « AAAA-MM-JJ », d'apres l'horloge de l'appareil. */
export function aujourdhui(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Heure actuelle au format « HH:MM ». */
export function maintenantHeure(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Mois courant au format « AAAA-MM ». */
export function moisCourant(): string {
  return aujourdhui().slice(0, 7);
}
