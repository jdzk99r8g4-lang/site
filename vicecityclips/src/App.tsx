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
  /** Visible directement dans la barre d'onglets du telephone. */
  principale: boolean;
  composant: ComponentType;
}

const PAGES: Page[] = [
  { cle: 'tableau-de-bord', titre: 'Tableau de bord', court: 'Bord', icone: '📊', principale: true, composant: TableauDeBord },
  { cle: 'clips', titre: 'Clips', court: 'Clips', icone: '🎬', principale: true, composant: Clips },
  { cle: 'minuteur', titre: 'Minuteur de soumission', court: 'Minuteur', icone: '⏱', principale: true, composant: Minuteur },
  { cle: 'campagnes', titre: 'Campagnes', court: 'Campagnes', icone: '🎯', principale: true, composant: Campagnes },
  { cle: 'comptes', titre: 'Comptes', court: 'Comptes', icone: '👤', principale: false, composant: Comptes },
  { cle: 'paiements', titre: 'Paiements', court: 'Paiements', icone: '💵', principale: false, composant: Paiements },
  { cle: 'checklist', titre: 'Checklist de lancement', court: 'Checklist', icone: '✅', principale: false, composant: Checklist },
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
    <div className="min-h-screen lg:flex">
      {/* Barre laterale sur ordinateur */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-4 lg:block dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 px-2">
          <p className="text-lg font-semibold tracking-tight">ViceCityClips</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tableau de pilotage</p>
        </div>
        <nav className="space-y-1">
          {PAGES.map((p) => (
            <button
              key={p.cle}
              type="button"
              onClick={() => aller(p.cle)}
              aria-current={p.cle === cleCourante ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                p.cle === cleCourante
                  ? 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span aria-hidden="true" className="text-base">
                {p.icone}
              </span>
              {p.titre}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* En-tete */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-500 lg:hidden dark:text-slate-400">
                ViceCityClips
              </p>
              <h1 className="truncate">{page.titre}</h1>
            </div>
            <BoutonTheme />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 lg:pb-10">
          <Contenu />
        </main>
      </div>

      {/* Menu « Plus » du telephone */}
      {menuOuvert && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOuvert(false)}
          role="presentation"
        >
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-slate-200 bg-white p-4 pb-8 dark:border-slate-800 dark:bg-slate-900"
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
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium ${
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

      {/* Barre d'onglets du telephone */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-stretch pb-[env(safe-area-inset-bottom)]">
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
