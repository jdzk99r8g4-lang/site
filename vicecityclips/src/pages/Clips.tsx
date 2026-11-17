import { useState } from 'react';
import { api } from '../lib/api';
import { messageErreur, useDonnees, useRafraichir } from '../lib/etat';
import {
  Carte,
  ChampListe,
  Chargement,
  Message,
  Modale,
  PastilleStatutClip,
  Pastille,
  Vide,
} from '../composants/ui';
import { ModaleClip } from '../composants/FormulaireClip';
import { date, delai, dollars, heure, nombre } from '../lib/format';
import {
  PLATEFORMES,
  STATUTS_CLIP,
  type CampagneCalculee,
  type ClipCalcule,
  type CompteCalcule,
} from '../../shared/types';

interface Filtres {
  compteId: string;
  plateforme: string;
  campagneId: string;
  statut: string;
  mois: string;
}

const FILTRES_VIDES: Filtres = { compteId: '', plateforme: '', campagneId: '', statut: '', mois: '' };

export default function Clips() {
  const rafraichir = useRafraichir();
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_VIDES);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [clipEnEdition, setClipEnEdition] = useState<ClipCalcule | null>(null);
  const [aSupprimer, setASupprimer] = useState<ClipCalcule | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const listes = useDonnees<{ comptes: CompteCalcule[]; campagnes: CampagneCalculee[] }>(async () => {
    const [comptes, campagnes] = await Promise.all([api.comptes(), api.campagnes()]);
    return { comptes, campagnes };
  });

  const clips = useDonnees<ClipCalcule[]>(
    () =>
      api.clips({
        compteId: filtres.compteId || null,
        plateforme: filtres.plateforme || null,
        campagneId: filtres.campagneId || null,
        statut: filtres.statut || null,
        mois: filtres.mois || null,
      }),
    [filtres.compteId, filtres.plateforme, filtres.campagneId, filtres.statut, filtres.mois],
  );

  const tousLesClips = useDonnees<ClipCalcule[]>(() => api.clips());

  const modifierFiltre = <C extends keyof Filtres>(champ: C, valeur: string): void =>
    setFiltres((f) => ({ ...f, [champ]: valeur }));

  const moisDisponibles = [
    ...new Set(
      (tousLesClips.donnees ?? [])
        .map((c) => c.datePublication?.slice(0, 7))
        .filter((m): m is string => Boolean(m)),
    ),
  ].sort((a, b) => b.localeCompare(a));

  const supprimer = async (): Promise<void> => {
    if (!aSupprimer) return;
    try {
      await api.supprimerClip(aSupprimer.id);
      setMessage('Clip supprimé.');
      setErreur(null);
      setASupprimer(null);
      rafraichir();
    } catch (e) {
      setErreur(messageErreur(e));
      setASupprimer(null);
    }
  };

  const filtresActifs = Object.values(filtres).some((v) => v !== '');

  return (
    <div className="space-y-4">
      {message && (
        <Message ton="succes" onFermer={() => setMessage(null)}>
          {message}
        </Message>
      )}
      {erreur && (
        <Message ton="erreur" onFermer={() => setErreur(null)}>
          {erreur}
        </Message>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {clips.donnees ? `${clips.donnees.length} clip(s)` : ''}
          {filtresActifs && tousLesClips.donnees ? ` sur ${tousLesClips.donnees.length}` : ''}
        </p>
        <button
          type="button"
          className="bouton bouton-principal"
          onClick={() => {
            setClipEnEdition(null);
            setModaleOuverte(true);
          }}
        >
          ＋ Ajouter un clip
        </button>
      </div>

      <Carte
        titre="Filtres"
        action={
          filtresActifs ? (
            <button
              type="button"
              className="bouton !min-h-0 !px-3 !py-1.5 text-xs"
              onClick={() => setFiltres(FILTRES_VIDES)}
            >
              Tout afficher
            </button>
          ) : undefined
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <ChampListe
            libelle="Compte"
            value={filtres.compteId}
            onChange={(e) => modifierFiltre('compteId', e.target.value)}
            videLibelle="Tous"
            options={(listes.donnees?.comptes ?? []).map((c) => ({
              valeur: String(c.id),
              libelle: c.identifiant,
            }))}
          />
          <ChampListe
            libelle="Plateforme"
            value={filtres.plateforme}
            onChange={(e) => modifierFiltre('plateforme', e.target.value)}
            videLibelle="Toutes"
            options={PLATEFORMES.map((p) => ({ valeur: p, libelle: p }))}
          />
          <ChampListe
            libelle="Campagne"
            value={filtres.campagneId}
            onChange={(e) => modifierFiltre('campagneId', e.target.value)}
            videLibelle="Toutes"
            options={(listes.donnees?.campagnes ?? []).map((c) => ({ valeur: c.id, libelle: c.id }))}
          />
          <ChampListe
            libelle="Statut"
            value={filtres.statut}
            onChange={(e) => modifierFiltre('statut', e.target.value)}
            videLibelle="Tous"
            options={STATUTS_CLIP.map((s) => ({ valeur: s, libelle: s }))}
          />
          <ChampListe
            libelle="Mois"
            value={filtres.mois}
            onChange={(e) => modifierFiltre('mois', e.target.value)}
            videLibelle="Tous"
            options={moisDisponibles.map((m) => ({ valeur: m, libelle: m }))}
          />
        </div>
      </Carte>

      {clips.enCours && !clips.donnees && <Chargement />}
      {clips.erreur && <Message ton="erreur">{clips.erreur}</Message>}

      {clips.donnees && clips.donnees.length === 0 && (
        <Vide>
          {filtresActifs
            ? 'Aucun clip ne correspond à ces filtres.'
            : "Aucun clip pour l'instant. Utilisez « Ajouter un clip », ou l'écran Minuteur juste après avoir publié."}
        </Vide>
      )}

      <div className="space-y-3">
        {(clips.donnees ?? []).map((clip) => (
          <CarteClip
            key={clip.id}
            clip={clip}
            onModifier={() => {
              setClipEnEdition(clip);
              setModaleOuverte(true);
            }}
            onSupprimer={() => setASupprimer(clip)}
          />
        ))}
      </div>

      <ModaleClip
        ouverte={modaleOuverte}
        clip={clipEnEdition}
        comptes={listes.donnees?.comptes ?? []}
        campagnes={listes.donnees?.campagnes ?? []}
        onFermer={() => setModaleOuverte(false)}
        onEnregistre={(m) => {
          setMessage(m);
          setErreur(null);
          rafraichir();
        }}
      />

      <Modale
        titre="Supprimer ce clip ?"
        ouverte={aSupprimer !== null}
        onFermer={() => setASupprimer(null)}
        pied={
          <>
            <button type="button" className="bouton" onClick={() => setASupprimer(null)}>
              Annuler
            </button>
            <button type="button" className="bouton bouton-danger" onClick={supprimer}>
              Supprimer
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Le clip du {date(aSupprimer?.datePublication)} ({aSupprimer?.compteIdentifiant ?? 'sans compte'})
          et ses pièces jointes seront supprimés. Cette action est définitive.
        </p>
      </Modale>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CarteClip({
  clip,
  onModifier,
  onSupprimer,
}: {
  clip: ClipCalcule;
  onModifier: () => void;
  onSupprimer: () => void;
}) {
  return (
    <article className="carte">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">
            {date(clip.datePublication)}
            {clip.heurePublication && (
              <span className="font-normal text-slate-500 dark:text-slate-400">
                {' '}
                à {clip.heurePublication}
              </span>
            )}
          </p>
          <p className="truncate text-sm text-slate-600 dark:text-slate-400">
            {clip.compteIdentifiant ?? 'Compte non renseigné'}
            {clip.plateforme ? ` · ${clip.plateforme}` : ''}
            {clip.createur ? ` · ${clip.createur}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PastilleStatutClip statut={clip.statut} />
          {clip.horsDelai && <Pastille ton="refuse">Hors délai</Pastille>}
        </div>
      </header>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Valeur libelle="Campagne" valeur={clip.campagneId ?? '—'} precision={clip.campagneNom ?? undefined} />
        <Valeur libelle="Soumis à" valeur={heure(clip.heureSoumission)} />
        <Valeur
          libelle="Délai"
          valeur={delai(clip.delaiSoumissionMin)}
          ton={clip.horsDelai ? 'mauvais' : undefined}
        />
        <Valeur libelle="Vues J+3" valeur={nombre(clip.vuesJ3)} />
        <Valeur libelle="Vues finales" valeur={nombre(clip.vuesFinales)} />
        <Valeur
          libelle="Gain net"
          valeur={dollars(clip.gainNetEstime)}
          precision={
            clip.gainBrutEstime === null
              ? `Campagne ${clip.campagneType ?? 'sans type'}`
              : `Brut ${dollars(clip.gainBrutEstime)} − frais ${dollars(clip.frais)}`
          }
        />
      </dl>

      {clip.statut === 'Refusé' && clip.motifRefus && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
          <strong>Motif du refus :</strong> {clip.motifRefus}
        </p>
      )}

      {clip.notes && (
        <p className="mt-3 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">{clip.notes}</p>
      )}

      {clip.piecesJointes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {clip.piecesJointes.map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" title={p.nomOriginal}>
              {p.typeMime?.startsWith('image/') ? (
                <img src={p.url} alt={p.nomOriginal} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xl dark:bg-slate-800">
                  📄
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-2">
        {clip.lienPublication && (
          <a href={clip.lienPublication} target="_blank" rel="noreferrer" className="bouton !min-h-0 !px-3 !py-1.5 text-xs">
            Voir la publication ↗
          </a>
        )}
        {clip.lienSource && (
          <a href={clip.lienSource} target="_blank" rel="noreferrer" className="bouton !min-h-0 !px-3 !py-1.5 text-xs">
            Source ↗
          </a>
        )}
        <span className="flex-1" />
        <button type="button" className="bouton !min-h-0 !px-3 !py-1.5 text-xs" onClick={onModifier}>
          Modifier
        </button>
        <button
          type="button"
          className="bouton bouton-danger !min-h-0 !px-3 !py-1.5 text-xs"
          onClick={onSupprimer}
        >
          Supprimer
        </button>
      </footer>
    </article>
  );
}

function Valeur({
  libelle,
  valeur,
  precision,
  ton,
}: {
  libelle: string;
  valeur: string;
  precision?: string;
  ton?: 'mauvais';
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500 dark:text-slate-500">{libelle}</dt>
      <dd
        className={`nombres truncate font-medium ${
          ton === 'mauvais' ? 'text-red-700 dark:text-red-400' : ''
        }`}
        title={precision}
      >
        {valeur}
      </dd>
      {precision && (
        <dd className="truncate text-[11px] text-slate-400 dark:text-slate-500" title={precision}>
          {precision}
        </dd>
      )}
    </div>
  );
}
