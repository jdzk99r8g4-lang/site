// Chargement des donnees et rafraichissement partage entre les ecrans.
//
// Chaque ecran declare ce qu'il veut charger ; des qu'une modification est
// enregistree, « rafraichir() » fait recharger tous les ecrans ouverts, pour que
// les totaux et le tableau de bord restent coherents.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ErreurApi } from './api';

interface ContexteDonnees {
  version: number;
  rafraichir: () => void;
}

const Contexte = createContext<ContexteDonnees>({ version: 0, rafraichir: () => {} });

export function FournisseurDonnees({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const rafraichir = useCallback(() => setVersion((v) => v + 1), []);
  const valeur = useMemo(() => ({ version, rafraichir }), [version, rafraichir]);
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useRafraichir(): () => void {
  return useContext(Contexte).rafraichir;
}

export function useVersionDonnees(): number {
  return useContext(Contexte).version;
}

export interface Chargement<T> {
  donnees: T | null;
  erreur: string | null;
  enCours: boolean;
}

/**
 * Charge des donnees depuis le serveur. Le chargement est relance quand
 * « cles » change ou quand une modification est enregistree ailleurs.
 */
export function useDonnees<T>(charger: () => Promise<T>, cles: unknown[] = []): Chargement<T> {
  const version = useVersionDonnees();
  const [etat, setEtat] = useState<Chargement<T>>({ donnees: null, erreur: null, enCours: true });

  // La fonction de chargement change a chaque rendu : on la garde dans une
  // reference pour ne declencher le chargement que sur « cles » et « version ».
  const chargerRef = useRef(charger);
  chargerRef.current = charger;

  const signature = JSON.stringify(cles);

  useEffect(() => {
    let annule = false;
    setEtat((precedent) => ({ ...precedent, enCours: true }));

    chargerRef
      .current()
      .then((donnees) => {
        if (!annule) setEtat({ donnees, erreur: null, enCours: false });
      })
      .catch((erreur: unknown) => {
        if (annule) return;
        const message =
          erreur instanceof ErreurApi || erreur instanceof Error
            ? erreur.message
            : 'Erreur inconnue.';
        setEtat({ donnees: null, erreur: message, enCours: false });
      });

    return () => {
      annule = true;
    };
  }, [signature, version]);

  return etat;
}

/** Transforme une erreur quelconque en message lisible. */
export function messageErreur(erreur: unknown): string {
  if (erreur instanceof ErreurApi || erreur instanceof Error) return erreur.message;
  return "Une erreur inattendue s'est produite.";
}
