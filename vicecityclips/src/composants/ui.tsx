// Briques d'interface reutilisees par tous les ecrans.

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

/* ------------------------------------------------------------------ */
/* Pastilles de statut                                                 */
/* ------------------------------------------------------------------ */

const TONS = {
  attente:
    'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
  approuve:
    'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  refuse: 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  paye: 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-700 dark:text-emerald-50',
  neutre:
    'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  info: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
} as const;

export type Ton = keyof typeof TONS;

export function Pastille({ ton = 'neutre', children }: { ton?: Ton; children: ReactNode }) {
  return <span className={`pastille ${TONS[ton]}`}>{children}</span>;
}

export function tonStatutClip(statut: string): Ton {
  switch (statut) {
    case 'En attente':
      return 'attente';
    case 'Approuvé':
      return 'approuve';
    case 'Refusé':
      return 'refuse';
    case 'Payé':
      return 'paye';
    default:
      return 'neutre';
  }
}

export function PastilleStatutClip({ statut }: { statut: string }) {
  return <Pastille ton={tonStatutClip(statut)}>{statut}</Pastille>;
}

export function PastilleStatutTache({ statut }: { statut: string }) {
  const ton: Ton = statut === 'Fait' ? 'approuve' : statut === 'En cours' ? 'attente' : 'neutre';
  return <Pastille ton={ton}>{statut}</Pastille>;
}

/* ------------------------------------------------------------------ */
/* Mises en page                                                       */
/* ------------------------------------------------------------------ */

export function Carte({
  titre,
  action,
  children,
  className = '',
}: {
  titre?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`carte ${className}`}>
      {(titre || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          {titre ? <h2>{titre}</h2> : <span />}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** Tuile d'indicateur du tableau de bord. */
export function Indicateur({
  libelle,
  valeur,
  precision,
  ton = 'neutre',
}: {
  libelle: string;
  valeur: ReactNode;
  precision?: ReactNode;
  ton?: 'neutre' | 'bon' | 'attention' | 'mauvais';
}) {
  const couleurValeur = {
    neutre: 'text-slate-900 dark:text-slate-50',
    bon: 'text-emerald-700 dark:text-emerald-400',
    attention: 'text-orange-700 dark:text-orange-400',
    mauvais: 'text-red-700 dark:text-red-400',
  }[ton];

  return (
    <div className="carte">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{libelle}</p>
      <p className={`nombres mt-1 text-2xl font-semibold tracking-tight ${couleurValeur}`}>{valeur}</p>
      {precision && <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{precision}</p>}
    </div>
  );
}

/** Jauge horizontale (avancement, objectif mensuel). */
export function Jauge({
  part,
  libelle,
  ton = 'sky',
}: {
  part: number;
  libelle?: ReactNode;
  ton?: 'sky' | 'emerald';
}) {
  const largeur = Math.max(0, Math.min(1, part)) * 100;
  const couleur = ton === 'emerald' ? 'bg-emerald-500' : 'bg-sky-500';
  return (
    <div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full ${couleur} transition-[width] duration-500`}
          style={{ width: `${largeur}%` }}
          role="progressbar"
          aria-valuenow={Math.round(largeur)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {libelle && <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{libelle}</p>}
    </div>
  );
}

export function Vide({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {children}
    </p>
  );
}

export function Chargement({ children = 'Chargement…' }: { children?: ReactNode }) {
  return <p className="px-1 py-6 text-sm text-slate-500 dark:text-slate-400">{children}</p>;
}

export function Message({
  ton,
  children,
  onFermer,
}: {
  ton: 'erreur' | 'succes' | 'info' | 'attention';
  children: ReactNode;
  onFermer?: () => void;
}) {
  const styles = {
    erreur:
      'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
    succes:
      'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    info: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
    attention:
      'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200',
  }[ton];

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`} role="status">
      <div className="flex-1 whitespace-pre-line">{children}</div>
      {onFermer && (
        <button type="button" onClick={onFermer} className="shrink-0 font-semibold opacity-70 hover:opacity-100" aria-label="Fermer">
          ×
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Champs de formulaire                                                */
/* ------------------------------------------------------------------ */

function Enveloppe({
  libelle,
  aide,
  idChamp,
  children,
}: {
  libelle: ReactNode;
  aide?: ReactNode;
  idChamp: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="etiquette" htmlFor={idChamp}>
        {libelle}
      </label>
      {children}
      {aide && <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{aide}</p>}
    </div>
  );
}

type ProprietesTexte = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  libelle: ReactNode;
  aide?: ReactNode;
};

export function ChampTexte({ libelle, aide, ...reste }: ProprietesTexte) {
  const id = useId();
  return (
    <Enveloppe libelle={libelle} aide={aide} idChamp={id}>
      <input id={id} className="champ" {...reste} />
    </Enveloppe>
  );
}

type ProprietesZone = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  libelle: ReactNode;
  aide?: ReactNode;
};

export function ChampZone({ libelle, aide, ...reste }: ProprietesZone) {
  const id = useId();
  return (
    <Enveloppe libelle={libelle} aide={aide} idChamp={id}>
      <textarea id={id} rows={3} className="champ" {...reste} />
    </Enveloppe>
  );
}

type ProprietesListe = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  libelle: ReactNode;
  aide?: ReactNode;
  options: Array<{ valeur: string; libelle: string }>;
  videLibelle?: string;
};

export function ChampListe({ libelle, aide, options, videLibelle, ...reste }: ProprietesListe) {
  const id = useId();
  return (
    <Enveloppe libelle={libelle} aide={aide} idChamp={id}>
      <select id={id} className="champ" {...reste}>
        {videLibelle !== undefined && <option value="">{videLibelle}</option>}
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </Enveloppe>
  );
}

export function ChampCase({
  libelle,
  coche,
  onChange,
}: {
  libelle: ReactNode;
  coche: boolean;
  onChange: (valeur: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2.5 py-1">
      <input
        id={id}
        type="checkbox"
        checked={coche}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500/40 dark:border-slate-600 dark:bg-slate-900"
      />
      <label htmlFor={id} className="text-sm text-slate-800 dark:text-slate-200">
        {libelle}
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fenetre modale                                                      */
/* ------------------------------------------------------------------ */

export function Modale({
  titre,
  ouverte,
  onFermer,
  children,
  pied,
}: {
  titre: ReactNode;
  ouverte: boolean;
  onFermer: () => void;
  children: ReactNode;
  pied?: ReactNode;
}) {
  useEffect(() => {
    if (!ouverte) return;
    const surTouche = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onFermer();
    };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [ouverte, onFermer]);

  if (!ouverte) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm"
      onClick={onFermer}
      role="presentation"
    >
      <div
        className="max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <h2>{titre}</h2>
          <button type="button" className="bouton !min-h-0 !px-3 !py-1.5" onClick={onFermer}>
            Fermer
          </button>
        </header>
        <div className="px-4 py-4">{children}</div>
        {pied && (
          <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            {pied}
          </footer>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Theme clair / sombre                                                */
/* ------------------------------------------------------------------ */

type Theme = 'clair' | 'sombre' | 'systeme';

interface ContexteTheme {
  theme: Theme;
  definirTheme: (t: Theme) => void;
}

const ThemeContexte = createContext<ContexteTheme>({ theme: 'systeme', definirTheme: () => {} });

const CLE_THEME = 'vicecityclips.theme';

export function FournisseurTheme({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const enregistre = localStorage.getItem(CLE_THEME);
      if (enregistre === 'clair' || enregistre === 'sombre' || enregistre === 'systeme') return enregistre;
    } catch {
      /* navigation privee : on garde le reglage systeme */
    }
    return 'systeme';
  });

  useEffect(() => {
    const racine = document.documentElement;
    const appliquer = (): void => {
      const sombre =
        theme === 'sombre' ||
        (theme === 'systeme' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      racine.classList.toggle('dark', sombre);
    };
    appliquer();

    try {
      localStorage.setItem(CLE_THEME, theme);
    } catch {
      /* rien a enregistrer */
    }

    if (theme !== 'systeme') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', appliquer);
    return () => media.removeEventListener('change', appliquer);
  }, [theme]);

  return (
    <ThemeContexte.Provider value={{ theme, definirTheme: setTheme }}>{children}</ThemeContexte.Provider>
  );
}

export function useTheme(): ContexteTheme {
  return useContext(ThemeContexte);
}

/**
 * Vrai quand l'interface est affichee en mode sombre. Les graphiques en ont
 * besoin : leurs couleurs ne peuvent pas venir des classes CSS.
 */
export function useEstSombre(): boolean {
  const { theme } = useTheme();
  const [sombre, setSombre] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    const relire = (): void => setSombre(document.documentElement.classList.contains('dark'));
    relire();
    const observateur = new MutationObserver(relire);
    observateur.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observateur.disconnect();
  }, [theme]);

  return sombre;
}

export function BoutonTheme() {
  const { theme, definirTheme } = useTheme();
  const suivant: Record<Theme, Theme> = { systeme: 'clair', clair: 'sombre', sombre: 'systeme' };
  const libelle: Record<Theme, string> = {
    systeme: 'Thème : système',
    clair: 'Thème : clair',
    sombre: 'Thème : sombre',
  };
  const icone: Record<Theme, string> = { systeme: '🌓', clair: '☀️', sombre: '🌙' };
  const court: Record<Theme, string> = { systeme: 'Auto', clair: 'Clair', sombre: 'Sombre' };

  return (
    <button
      type="button"
      className="bouton !min-h-0 shrink-0 !px-3 !py-1.5 text-sm"
      onClick={() => definirTheme(suivant[theme])}
      title={`${libelle[theme]} — cliquez pour changer`}
    >
      <span aria-hidden="true">{icone[theme]}</span>
      <span>{court[theme]}</span>
      <span className="sr-only">{libelle[theme]}</span>
    </button>
  );
}
