import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { messageErreur } from '../lib/etat';
import { ChampListe, ChampTexte, ChampZone, Message, Modale, Pastille } from './ui';
import { aujourdhui, dollars, delai, maintenantHeure } from '../lib/format';
import { PLATEFORMES, STATUTS_CLIP, type CampagneCalculee, type ClipCalcule, type CompteCalcule } from '../../shared/types';

export interface ValeursClip {
  datePublication: string;
  heurePublication: string;
  heureSoumission: string;
  compteId: string;
  plateforme: string;
  campagneId: string;
  createur: string;
  lienPublication: string;
  lienSource: string;
  vuesJ3: string;
  vuesFinales: string;
  statut: string;
  motifRefus: string;
  notes: string;
}

function valeursVides(): ValeursClip {
  return {
    datePublication: aujourdhui(),
    heurePublication: maintenantHeure(),
    heureSoumission: '',
    compteId: '',
    plateforme: '',
    campagneId: '',
    createur: '',
    lienPublication: '',
    lienSource: '',
    vuesJ3: '',
    vuesFinales: '',
    statut: 'En attente',
    motifRefus: '',
    notes: '',
  };
}

function valeursDepuisClip(clip: ClipCalcule): ValeursClip {
  return {
    datePublication: clip.datePublication ?? '',
    heurePublication: clip.heurePublication ?? '',
    heureSoumission: clip.heureSoumission ?? '',
    compteId: clip.compteId === null ? '' : String(clip.compteId),
    plateforme: clip.plateforme ?? '',
    campagneId: clip.campagneId ?? '',
    createur: clip.createur ?? '',
    lienPublication: clip.lienPublication ?? '',
    lienSource: clip.lienSource ?? '',
    vuesJ3: clip.vuesJ3 === null ? '' : String(clip.vuesJ3),
    vuesFinales: clip.vuesFinales === null ? '' : String(clip.vuesFinales),
    statut: clip.statut,
    motifRefus: clip.motifRefus ?? '',
    notes: clip.notes ?? '',
  };
}

/** Prepare le corps de requete : les champs vides deviennent null. */
function corpsRequete(v: ValeursClip): Record<string, unknown> {
  const texte = (s: string): string | null => (s.trim() === '' ? null : s.trim());
  const entier = (s: string): number | null => {
    const n = Number(s.replace(/[\s ]/g, '').replace(',', '.'));
    return s.trim() === '' || !Number.isFinite(n) ? null : Math.round(n);
  };

  return {
    datePublication: texte(v.datePublication),
    heurePublication: texte(v.heurePublication),
    heureSoumission: texte(v.heureSoumission),
    compteId: v.compteId === '' ? null : Number(v.compteId),
    plateforme: texte(v.plateforme),
    campagneId: texte(v.campagneId),
    createur: texte(v.createur),
    lienPublication: texte(v.lienPublication),
    lienSource: texte(v.lienSource),
    vuesJ3: entier(v.vuesJ3),
    vuesFinales: entier(v.vuesFinales),
    statut: v.statut,
    motifRefus: texte(v.motifRefus),
    notes: texte(v.notes),
  };
}

export function ModaleClip({
  ouverte,
  clip,
  comptes,
  campagnes,
  valeursInitiales,
  onFermer,
  onEnregistre,
}: {
  ouverte: boolean;
  /** null pour un nouveau clip. */
  clip: ClipCalcule | null;
  comptes: CompteCalcule[];
  campagnes: CampagneCalculee[];
  /** Valeurs de depart pour un nouveau clip (ex. « Publié maintenant »). */
  valeursInitiales?: Partial<ValeursClip>;
  onFermer: () => void;
  onEnregistre: (message: string) => void;
}) {
  const [valeurs, setValeurs] = useState<ValeursClip>(valeursVides);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [fichierEnAttente, setFichierEnAttente] = useState<File | null>(null);
  const champFichier = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ouverte) return;
    setValeurs(clip ? valeursDepuisClip(clip) : { ...valeursVides(), ...valeursInitiales });
    setErreur(null);
    setFichierEnAttente(null);
    if (champFichier.current) champFichier.current.value = '';
    // valeursInitiales est un objet litteral : on ne le met pas dans les
    // dependances pour ne pas reinitialiser le formulaire a chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouverte, clip]);

  const modifier = <C extends keyof ValeursClip>(champ: C, valeur: ValeursClip[C]): void =>
    setValeurs((v) => ({ ...v, [champ]: valeur }));

  const campagneChoisie = campagnes.find((c) => c.id === valeurs.campagneId) ?? null;

  const enregistrer = async (): Promise<void> => {
    if (!valeurs.datePublication) {
      setErreur('La date de publication est obligatoire.');
      return;
    }
    setEnCours(true);
    try {
      const corps = corpsRequete(valeurs);
      const enregistre = clip
        ? await api.modifierClip(clip.id, corps)
        : await api.creerClip(corps);

      if (fichierEnAttente) {
        await api.ajouterPieceJointe('clips', enregistre.id, fichierEnAttente);
      }
      onEnregistre(clip ? 'Clip modifié.' : 'Clip ajouté.');
      onFermer();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  const supprimerPiece = async (id: number): Promise<void> => {
    try {
      await api.supprimerPieceJointe(id);
      onEnregistre('Pièce jointe supprimée.');
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  return (
    <Modale
      titre={clip ? `Clip du ${valeurs.datePublication || '?'}` : 'Nouveau clip'}
      ouverte={ouverte}
      onFermer={onFermer}
      pied={
        <>
          <button type="button" className="bouton" onClick={onFermer}>
            Annuler
          </button>
          <button type="button" className="bouton bouton-principal" onClick={enregistrer} disabled={enCours}>
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {erreur && <Message ton="erreur">{erreur}</Message>}

        <div className="grid gap-3 sm:grid-cols-3">
          <ChampTexte
            libelle="Date de publication"
            type="date"
            value={valeurs.datePublication}
            onChange={(e) => modifier('datePublication', e.target.value)}
          />
          <ChampTexte
            libelle="Heure de publication"
            type="time"
            value={valeurs.heurePublication}
            onChange={(e) => modifier('heurePublication', e.target.value)}
          />
          <div>
            <ChampTexte
              libelle="Heure de soumission"
              type="time"
              value={valeurs.heureSoumission}
              onChange={(e) => modifier('heureSoumission', e.target.value)}
              aide={
                clip?.delaiSoumissionMin !== null && clip?.delaiSoumissionMin !== undefined
                  ? `Délai actuel : ${delai(clip.delaiSoumissionMin)}`
                  : 'À remplir dès que le clip est soumis'
              }
            />
            <button
              type="button"
              className="bouton mt-2 !min-h-0 w-full !px-3 !py-1.5 text-xs"
              onClick={() => modifier('heureSoumission', maintenantHeure())}
            >
              Soumis maintenant ({maintenantHeure()})
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ChampListe
            libelle="Compte"
            value={valeurs.compteId}
            onChange={(e) => {
              const id = e.target.value;
              modifier('compteId', id);
              // La plateforme du compte est proposee automatiquement.
              const compte = comptes.find((c) => String(c.id) === id);
              if (compte?.plateforme && !valeurs.plateforme) modifier('plateforme', compte.plateforme);
            }}
            videLibelle="— Choisir —"
            options={comptes.map((c) => ({
              valeur: String(c.id),
              libelle: `${c.identifiant}${c.plateforme ? ` (${c.plateforme})` : ''}`,
            }))}
          />
          <ChampListe
            libelle="Plateforme"
            value={valeurs.plateforme}
            onChange={(e) => modifier('plateforme', e.target.value)}
            videLibelle="— Choisir —"
            options={PLATEFORMES.map((p) => ({ valeur: p, libelle: p }))}
          />
          <ChampListe
            libelle="Campagne"
            value={valeurs.campagneId}
            onChange={(e) => modifier('campagneId', e.target.value)}
            videLibelle="— Aucune —"
            options={campagnes.map((c) => ({ valeur: c.id, libelle: `${c.id} — ${c.nom}` }))}
            aide={
              campagneChoisie
                ? campagneChoisie.type === 'CPM'
                  ? `CPM ${dollars(campagneChoisie.cpm)} / 1 000 vues · minimum ${dollars(
                      campagneChoisie.paiementMin,
                    )}${
                      campagneChoisie.plafondParClip
                        ? ` · plafond ${dollars(campagneChoisie.plafondParClip)}`
                        : ''
                    }`
                  : `Campagne ${campagneChoisie.type} : le gain n'est pas estimé`
                : undefined
            }
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ChampTexte
            libelle="Créateur / streamer"
            value={valeurs.createur}
            onChange={(e) => modifier('createur', e.target.value)}
            placeholder="Ex. IShowSpeed"
          />
          <ChampListe
            libelle="Statut"
            value={valeurs.statut}
            onChange={(e) => modifier('statut', e.target.value)}
            options={STATUTS_CLIP.map((s) => ({ valeur: s, libelle: s }))}
          />
        </div>

        <ChampTexte
          libelle="Lien de la publication"
          type="url"
          inputMode="url"
          value={valeurs.lienPublication}
          onChange={(e) => modifier('lienPublication', e.target.value)}
          placeholder="https://www.tiktok.com/@…/video/…"
        />
        <ChampTexte
          libelle="Lien de la source"
          type="url"
          inputMode="url"
          value={valeurs.lienSource}
          onChange={(e) => modifier('lienSource', e.target.value)}
          placeholder="Lien du live ou du clip d'origine"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <ChampTexte
            libelle="Vues à J+3"
            inputMode="numeric"
            value={valeurs.vuesJ3}
            onChange={(e) => modifier('vuesJ3', e.target.value)}
          />
          <ChampTexte
            libelle="Vues finales comptées"
            inputMode="numeric"
            value={valeurs.vuesFinales}
            onChange={(e) => modifier('vuesFinales', e.target.value)}
            aide="C'est ce chiffre qui sert au calcul du gain"
          />
        </div>

        {valeurs.statut === 'Refusé' && (
          <ChampTexte
            libelle="Motif de refus"
            value={valeurs.motifRefus}
            onChange={(e) => modifier('motifRefus', e.target.value)}
            placeholder="Ex. hashtag manquant, audience hors zone…"
            aide="À noter pour ne pas refaire la même erreur"
          />
        )}

        <ChampZone
          libelle="Notes"
          value={valeurs.notes}
          onChange={(e) => modifier('notes', e.target.value)}
        />

        {/* Pieces jointes */}
        <div>
          <p className="etiquette">Capture des statistiques</p>
          {clip && clip.piecesJointes.length > 0 && (
            <ul className="mb-2 space-y-2">
              {clip.piecesJointes.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-2 dark:border-slate-700"
                >
                  <a href={p.url} target="_blank" rel="noreferrer" className="shrink-0">
                    {p.typeMime?.startsWith('image/') ? (
                      <img
                        src={p.url}
                        alt={p.nomOriginal}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xl dark:bg-slate-800">
                        📄
                      </span>
                    )}
                  </a>
                  <a href={p.url} target="_blank" rel="noreferrer" className="lien flex-1 break-all text-sm">
                    {p.nomOriginal}
                  </a>
                  <button
                    type="button"
                    className="bouton bouton-danger !min-h-0 !px-3 !py-1.5 text-xs"
                    onClick={() => supprimerPiece(p.id)}
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={champFichier}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFichierEnAttente(e.target.files?.[0] ?? null)}
            className="champ"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Images et PDF. Le fichier est copié dans le dossier <code>pieces-jointes/</code> de
            l'application, sur votre ordinateur.
          </p>
        </div>

        {clip && (
          <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950">
            <p className="mb-1 font-medium">Calculs pour ce clip</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700 dark:text-slate-300">
              <span>Délai : {delai(clip.delaiSoumissionMin)}</span>
              {clip.horsDelai && <Pastille ton="refuse">Hors délai</Pastille>}
              <span>Gain brut : {dollars(clip.gainBrutEstime)}</span>
              <span>Frais : {dollars(clip.frais)}</span>
              <span className="font-semibold">Gain net : {dollars(clip.gainNetEstime)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              Ces valeurs se mettent à jour après enregistrement.
            </p>
          </div>
        )}
      </div>
    </Modale>
  );
}
