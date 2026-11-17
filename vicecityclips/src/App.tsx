import { useEffect, useState, type ComponentType } from 'react';
import { BoutonTheme } from './composants/ui';
import TableauDeBord from './pages/TableauDeBord';
import Clips from './pages/Clips';
import Minuteur from './pages/Minuteur';
import Campagnes from './pages/Campagnes';
import Comptes from './pages/Comptes';
import Paiements from './pages/Paiements';
import Checklist from './pages/Checklist';
import Reglages from './pages/Reglages';

interface Page {
  cle: string;
  titre: string;
  court: string;
  icone: string;
  /** Visible directement dans la barre d'onglets du bas. */
  principale: boolean;
  composant: ComponentType;
}

const PAGES: Page[] = [
  { cle: 'tableau-de-bord', titre: 'Tableau de bord', court: 'Bord', icone: '📊', principale: true, composant: TableauDeBord },
  { cle: 'clips', titre: 'Clips', court: 'Clips', icone: '🎬', principale: true, composant: Clips },
  { cle: 'minuteur', titre: 'Minuteur', court: 'Minuteur', icone: '⏱', principale: true, composant: Minuteur },
  { cle: 'campagnes', titre: 'Campagnes', court: 'Campagnes', icone: '🎯', principale: true, composant: Campagnes },
  { cle: 'comptes', titre: 'Comptes', court: 'Comptes', icone: '👤', principale: false, composant: Comptes },
  { cle: 'paiements', titre: 'Paiements', court: 'Paiements', icone: '💵', principale: false, composant: Paiements },
  { cle: 'checklist', titre: 'Checklist', court: 'Checklist', icone: '✅', principale: false, composant: Checklist },
  { cle: 'reglages', titre: 'Réglages', court: 'Réglages', icone: '⚙️', principale: false, composant: Reglages },
];

const PAGE_PAR_DEFAUT = PAGES[0].cle;

function cleDepuisAdresse(): string {
  const cle = window.location.hash.replace(/^#\/?/, '');
  return PAGES.some((p) => p.cle === cle) ? cle : PAGE_PAR_DEFAUT;
}

export default function App() {
  const [cleCourante, setCleCourante] = useState<string>(cleDepuisAdresse);
  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    const surChangement = (): void => setCleCourante(cleDepuisAdresse());
    window.addEventListener('hashchange', surChangement);
    return () => window.removeEventListener('hashchange', surChangement);
  }, []);

  const aller = (cle: string): void => {
    window.location.hash = `#/${cle}`;
    setCleCourante(cle);
    setMenuOuvert(false);
    window.scrollTo({ top: 0 });
  };

  const page = PAGES.find((p) => p.cle === cleCourante) ?? PAGES[0];
  const Contenu = page.composant;
  const secondaires = PAGES.filter((p) => !p.principale);
  const menuActif = secondaires.some((p) => p.cle === cleCourante);

  return (
    // Colonne au format telephone, centree. Sur un grand ecran, l'application
    // garde exactement la meme mise en page que sur l'iPhone.
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-slate-100 shadow-[0_0_60px_rgba(15,23,42,0.08)] dark:bg-slate-950">
      {/* En-tete */}
      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex w-full max-w-[480px] items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              ViceCityClips
            </p>
            <h1 className="truncate">{page.titre}</h1>
          </div>
          <BoutonTheme />
        </div>
      </header>

      {/* Le contenu passe sous l'en-tete fixe et au-dessus de la barre d'onglets. */}
      <main className="px-4 pb-32 pt-[calc(env(safe-area-inset-top)+4.75rem)]">
        <Contenu />
      </main>

      {/* Menu « Plus » */}
      {menuOuvert && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setMenuOuvert(false)}
          role="presentation"
        >
          <div
            className="absolute inset-x-0 bottom-0 mx-auto max-w-[480px] rounded-t-3xl border-t border-slate-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 px-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Autres écrans
            </p>
            <div className="grid grid-cols-2 gap-2">
              {secondaires.map((p) => (
                <button
                  key={p.cle}
                  type="button"
                  onClick={() => aller(p.cle)}
                  className={`flex min-h-[52px] items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium ${
                    p.cle === cleCourante
                      ? 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200'
                      : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span aria-hidden="true">{p.icone}</span>
                  {p.court}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Barre d'onglets */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex w-full max-w-[480px] items-stretch pb-[env(safe-area-inset-bottom)]">
          {PAGES.filter((p) => p.principale).map((p) => (
            <button
              key={p.cle}
              type="button"
              onClick={() => aller(p.cle)}
              aria-current={p.cle === cleCourante ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium ${
                p.cle === cleCourante
                  ? 'text-sky-700 dark:text-sky-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {p.icone}
              </span>
              {p.court}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMenuOuvert((o) => !o)}
            className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium ${
              menuActif || menuOuvert
                ? 'text-sky-700 dark:text-sky-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ⋯
            </span>
            Plus
          </button>
        </div>
      </nav>
    </div>
  );
}
