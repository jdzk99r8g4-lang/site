import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { messageErreur, useDonnees, useRafraichir } from '../lib/etat';
import { Carte, Chargement, Message, Pastille, Vide } from '../composants/ui';
import { ModaleClip } from '../composants/FormulaireClip';
import { aujourdhui, date, delai, heure, maintenantHeure } from '../lib/format';
import {
  DELAI_SOUMISSION_REFERENCE_MIN,
  type CampagneCalculee,
  type ClipCalcule,
  type CompteCalcule,
} from '../../shared/types';

/** Horloge qui avance chaque seconde, pour le compte a rebours. */
function useHorloge(): number {
  const [instant, setInstant] = useState(() => Date.now());
  useEffect(() => {
    const minuterie = window.setInterval(() => setInstant(Date.now()), 1000);
    return () => window.clearInterval(minuterie);
  }, []);
  return instant;
}

/** Date et heure de publication d'un clip, dans l'heure locale de l'appareil. */
function instantPublication(clip: ClipCalcule): number | null {
  if (!clip.datePublication || !clip.heurePublication) return null;
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clip.datePublication);
  const h = /^(\d{1,2}):(\d{2})/.exec(clip.heurePublication);
  if (!d || !h) return null;
  return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(h[1]), Number(h[2]), 0, 0).getTime();
}

function formaterCompteARebours(millisecondes: number): string {
  const total = Math.max(0, Math.ceil(millisecondes / 1000));
  const minutes = Math.floor(total / 60);
  const secondes = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secondes).padStart(2, '0')}`;
}

export default function Minuteur() {
  const rafraichir = useRafraichir();
  const instant = useHorloge();
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [clipEnEdition, setClipEnEdition] = useState<ClipCalcule | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistrementId, setEnregistrementId] = useState<number | null>(null);

  const listes = useDonnees<{ comptes: CompteCalcule[]; campagnes: CampagneCalculee[] }>(async () => {
    const [comptes, campagnes] = await Promise.all([api.comptes(), api.campagnes()]);
    return { comptes, campagnes };
  });
  const clips = useDonnees<ClipCalcule[]>(() => api.clips());

  const campagnes = listes.donnees?.campagnes ?? [];

  /** Delai de soumission a respecter pour ce clip, en minutes. */
  const delaiCible = (clip: ClipCalcule): number => {
    const campagne = campagnes.find((c) => c.id === clip.campagneId);
    const propre = campagne?.delaiSoumissionMin;
    return propre !== null && propre !== undefined && propre > 0
      ? propre
      : DELAI_SOUMISSION_REFERENCE_MIN;
  };

  const marquerSoumis = async (clip: ClipCalcule): Promise<void> => {
    setEnregistrementId(clip.id);
    try {
      const maintenant = maintenantHeure();
      const corps: Record<string, unknown> = { heureSoumission: maintenant };
      // Un clip publié hier et soumis après minuit garde sa date de publication :
      // le calcul du délai gère déjà le passage de minuit.
      const misAJour = await api.modifierClip(clip.id, corps);
      setMessage(
        `Soumission enregistrée à ${maintenant} — délai de ${delai(misAJour.delaiSoumissionMin)}${
          misAJour.horsDelai ? ', au-delà des 30 minutes' : ', dans les temps'
        }.`,
      );
      setErreur(null);
      rafraichir();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnregistrementId(null);
    }
  };

  if (clips.enCours && !clips.donnees) return <Chargement />;
  if (clips.erreur) return <Message ton="erreur">{clips.erreur}</Message>;

  const tous = clips.donnees ?? [];
  const aSoumettre = tous
    .filter((c) => !c.heureSoumission && instantPublication(c) !== null)
    .map((c) => ({ clip: c, publication: instantPublication(c)! }))
    .sort((a, b) => b.publication - a.publication);

  const soumisAujourdhui = tous.filter(
    (c) => c.heureSoumission && c.datePublication === aujourdhui(),
  );

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

      <Carte titre="Je viens de publier un clip">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Le compte à rebours part de l'heure de publication. Vous avez{' '}
          {DELAI_SOUMISSION_REFERENCE_MIN} minutes pour soumettre le lien dans Content Rewards.
        </p>
        <button
          type="button"
          className="bouton bouton-principal mt-3 w-full !min-h-[52px] text-base"
          onClick={() => {
            setClipEnEdition(null);
            setModaleOuverte(true);
          }}
        >
          ⏱ Publié maintenant ({maintenantHeure()})
        </button>
      </Carte>

      <div>
        <h2 className="mb-2 px-1">À soumettre</h2>
        {aSoumettre.length === 0 ? (
          <Vide>
            Aucun clip en attente de soumission. Tout est à jour.
          </Vide>
        ) : (
          <div className="space-y-3">
            {aSoumettre.map(({ clip, publication }) => {
              const minutes = delaiCible(clip);
              const echeance = publication + minutes * 60_000;
              const restant = echeance - instant;
              const depasse = restant <= 0;
              const minutesRestantes = restant / 60_000;

              const couleur = depasse
                ? 'border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950'
                : minutesRestantes <= 5
                  ? 'border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  : minutesRestantes <= 10
                    ? 'border-orange-400 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900';

              const couleurChiffres = depasse
                ? 'text-red-700 dark:text-red-400'
                : minutesRestantes <= 5
                  ? 'text-red-700 dark:text-red-400'
                  : minutesRestantes <= 10
                    ? 'text-orange-700 dark:text-orange-400'
                    : 'text-slate-900 dark:text-slate-50';

              const campagne = campagnes.find((c) => c.id === clip.campagneId);

              return (
                <article key={clip.id} className={`rounded-2xl border p-4 shadow-carte ${couleur}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {clip.compteIdentifiant ?? 'Compte non renseigné'}
                        {clip.plateforme ? ` · ${clip.plateforme}` : ''}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Publié le {date(clip.datePublication)} à {clip.heurePublication}
                        {clip.campagneId ? ` · ${clip.campagneId}` : ' · sans campagne'}
                      </p>
                    </div>
                    {depasse ? (
                      <Pastille ton="refuse">Délai dépassé</Pastille>
                    ) : minutesRestantes <= 5 ? (
                      <Pastille ton="refuse">Dernières minutes</Pastille>
                    ) : minutesRestantes <= 10 ? (
                      <Pastille ton="attente">Bientôt la fin</Pastille>
                    ) : (
                      <Pastille ton="info">Dans les temps</Pastille>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p
                        className={`nombres text-5xl font-bold tabular-nums tracking-tight ${couleurChiffres}`}
                        aria-live="polite"
                      >
                        {depasse ? `+${formaterCompteARebours(-restant)}` : formaterCompteARebours(restant)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {depasse
                          ? `Dépassé de ${formaterCompteARebours(-restant)} sur les ${minutes} minutes`
                          : `Restant sur les ${minutes} minutes${
                              campagne?.delaiSoumissionMin ? ` exigées par ${campagne.id}` : ''
                            }`}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        className="bouton bouton-principal !min-h-[52px] px-6 text-base"
                        onClick={() => marquerSoumis(clip)}
                        disabled={enregistrementId === clip.id}
                      >
                        {enregistrementId === clip.id ? 'Enregistrement…' : '✓ Soumis'}
                      </button>
                      <button
                        type="button"
                        className="bouton !min-h-0 !px-3 !py-1.5 text-xs"
                        onClick={() => {
                          setClipEnEdition(clip);
                          setModaleOuverte(true);
                        }}
                      >
                        Ouvrir la fiche
                      </button>
                    </div>
                  </div>

                  {clip.lienPublication && (
                    <a
                      href={clip.lienPublication}
                      target="_blank"
                      rel="noreferrer"
                      className="lien mt-3 inline-block break-all text-sm"
                    >
                      {clip.lienPublication}
                    </a>
                  )}

                  {campagne?.hashtagObligatoire &&
                    campagne.hashtagObligatoire !== 'Non indiqué' && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        Mention obligatoire : <strong>{campagne.hashtagObligatoire}</strong>
                      </p>
                    )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {soumisAujourdhui.length > 0 && (
        <Carte titre="Soumis aujourd'hui">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {soumisAujourdhui.map((clip) => (
              <li key={clip.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {clip.compteIdentifiant ?? 'Compte non renseigné'}
                    {clip.campagneId ? ` · ${clip.campagneId}` : ''}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Publié à {heure(clip.heurePublication)} · soumis à {heure(clip.heureSoumission)}
                  </p>
                </div>
                {clip.horsDelai ? (
                  <Pastille ton="refuse">{delai(clip.delaiSoumissionMin)}</Pastille>
                ) : (
                  <Pastille ton="approuve">{delai(clip.delaiSoumissionMin)}</Pastille>
                )}
              </li>
            ))}
          </ul>
        </Carte>
      )}

      <ModaleClip
        ouverte={modaleOuverte}
        clip={clipEnEdition}
        comptes={listes.donnees?.comptes ?? []}
        campagnes={campagnes}
        valeursInitiales={{ datePublication: aujourdhui(), heurePublication: maintenantHeure() }}
        onFermer={() => setModaleOuverte(false)}
        onEnregistre={(m) => {
          setMessage(m);
          setErreur(null);
          rafraichir();
        }}
      />
    </div>
  );
}
