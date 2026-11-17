// Acces au petit serveur local. Toutes les requetes passent par ici.

import type {
  CampagneCalculee,
  ClipCalcule,
  CompteCalcule,
  PaiementCalcule,
  PieceJointe,
  Reglages,
  ReleveAbonnes,
  Tache,
  TableauDeBord,
} from '../../shared/types';

export interface EtatApplication {
  baseVide: boolean;
  fichierExcel: string | null;
  dossier: string;
}

export interface ResultatImport {
  fichier: string;
  campagnes: number;
  comptes: number;
  relevesAbonnes: number;
  clips: number;
  paiements: number;
  taches: number;
  lignesExempleIgnorees: number;
  avertissements: string[];
}

export interface ResultatRestauration {
  nbPiecesJointes: number;
  sauvegardeDeSecurite: string;
  creeLe: string | null;
  lignes: Record<string, number>;
}

/** Erreur renvoyee par le serveur, avec son message en francais. */
export class ErreurApi extends Error {}

async function demander<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(`/api${chemin}`, options);
  } catch {
    throw new ErreurApi(
      "Impossible de joindre le serveur de l'application. Verifiez que la fenetre du terminal qui l'a lancee est toujours ouverte.",
    );
  }

  if (!reponse.ok) {
    let message = `Erreur ${reponse.status}`;
    try {
      const corps = (await reponse.json()) as { erreur?: string };
      if (corps.erreur) message = corps.erreur;
    } catch {
      /* reponse sans JSON */
    }
    throw new ErreurApi(message);
  }

  if (reponse.status === 204) return undefined as T;
  return (await reponse.json()) as T;
}

function enJson<T>(methode: string, corps: unknown): RequestInit {
  return {
    method: methode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  };
}

function parametres(filtres: Record<string, string | number | null | undefined>): string {
  const p = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(filtres)) {
    if (valeur !== null && valeur !== undefined && valeur !== '') p.set(cle, String(valeur));
  }
  const texte = p.toString();
  return texte ? `?${texte}` : '';
}

export const api = {
  etat: () => demander<EtatApplication>('/etat'),

  reglages: () => demander<Reglages>('/reglages'),
  enregistrerReglages: (valeurs: Partial<Reglages>) =>
    demander<Reglages>('/reglages', enJson('PUT', valeurs)),

  tableauDeBord: () => demander<TableauDeBord>('/tableau-de-bord'),

  campagnes: () => demander<CampagneCalculee[]>('/campagnes'),
  creerCampagne: (valeurs: Record<string, unknown>) =>
    demander<CampagneCalculee>('/campagnes', enJson('POST', valeurs)),
  modifierCampagne: (id: string, valeurs: Record<string, unknown>) =>
    demander<CampagneCalculee>(`/campagnes/${encodeURIComponent(id)}`, enJson('PUT', valeurs)),
  supprimerCampagne: (id: string) =>
    demander<{ supprime: boolean }>(`/campagnes/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  comptes: () => demander<CompteCalcule[]>('/comptes'),
  creerCompte: (valeurs: Record<string, unknown>) =>
    demander<CompteCalcule>('/comptes', enJson('POST', valeurs)),
  modifierCompte: (id: number, valeurs: Record<string, unknown>) =>
    demander<CompteCalcule>(`/comptes/${id}`, enJson('PUT', valeurs)),
  supprimerCompte: (id: number) =>
    demander<{ supprime: boolean }>(`/comptes/${id}`, { method: 'DELETE' }),

  abonnes: (compteId: number) => demander<ReleveAbonnes[]>(`/comptes/${compteId}/abonnes`),
  ajouterReleveAbonnes: (compteId: number, date: string, abonnes: number) =>
    demander<ReleveAbonnes>(`/comptes/${compteId}/abonnes`, enJson('POST', { date, abonnes })),
  supprimerReleveAbonnes: (id: number) =>
    demander<{ supprime: boolean }>(`/abonnes/${id}`, { method: 'DELETE' }),

  clips: (filtres: Record<string, string | number | null | undefined> = {}) =>
    demander<ClipCalcule[]>(`/clips${parametres(filtres)}`),
  clip: (id: number) => demander<ClipCalcule>(`/clips/${id}`),
  creerClip: (valeurs: Record<string, unknown>) =>
    demander<ClipCalcule>('/clips', enJson('POST', valeurs)),
  modifierClip: (id: number, valeurs: Record<string, unknown>) =>
    demander<ClipCalcule>(`/clips/${id}`, enJson('PUT', valeurs)),
  supprimerClip: (id: number) =>
    demander<{ supprime: boolean }>(`/clips/${id}`, { method: 'DELETE' }),

  paiements: () => demander<PaiementCalcule[]>('/paiements'),
  creerPaiement: (valeurs: Record<string, unknown>) =>
    demander<PaiementCalcule>('/paiements', enJson('POST', valeurs)),
  modifierPaiement: (id: number, valeurs: Record<string, unknown>) =>
    demander<PaiementCalcule>(`/paiements/${id}`, enJson('PUT', valeurs)),
  supprimerPaiement: (id: number) =>
    demander<{ supprime: boolean }>(`/paiements/${id}`, { method: 'DELETE' }),

  taches: () => demander<Tache[]>('/taches'),
  creerTache: (valeurs: Record<string, unknown>) =>
    demander<Tache>('/taches', enJson('POST', valeurs)),
  modifierTache: (id: number, valeurs: Record<string, unknown>) =>
    demander<Tache>(`/taches/${id}`, enJson('PUT', valeurs)),
  supprimerTache: (id: number) =>
    demander<{ supprime: boolean }>(`/taches/${id}`, { method: 'DELETE' }),

  async ajouterPieceJointe(
    type: 'clips' | 'paiements',
    parentId: number,
    fichier: File,
  ): Promise<PieceJointe> {
    const corps = new FormData();
    corps.append('fichier', fichier);
    return demander<PieceJointe>(`/${type}/${parentId}/pieces-jointes`, {
      method: 'POST',
      body: corps,
    });
  },
  supprimerPieceJointe: (id: number) =>
    demander<{ supprime: boolean }>(`/pieces-jointes/${id}`, { method: 'DELETE' }),

  importerExcel: (remplacer: boolean) =>
    demander<ResultatImport>('/import-excel', enJson('POST', { remplacer })),

  async restaurer(archive: File): Promise<ResultatRestauration> {
    const corps = new FormData();
    corps.append('archive', archive);
    return demander<ResultatRestauration>('/restauration', { method: 'POST', body: corps });
  },
};

/**
 * Lance un telechargement depuis le navigateur (export ou sauvegarde).
 * On passe par un lien plutot que par fetch pour que Safari sur iPhone
 * propose bien l'enregistrement du fichier.
 */
export function telecharger(chemin: string): void {
  const lien = document.createElement('a');
  lien.href = `/api${chemin}`;
  lien.rel = 'noopener';
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
}
