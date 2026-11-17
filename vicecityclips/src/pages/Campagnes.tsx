import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { messageErreur, useDonnees, useRafraichir } from '../lib/etat';
import {
  Carte,
  ChampListe,
  ChampTexte,
  ChampZone,
  Chargement,
  Message,
  Modale,
  Pastille,
  Vide,
} from '../composants/ui';
import { date, dollars, nombre } from '../lib/format';
import {
  STATUTS_CAMPAGNE,
  TYPES_CAMPAGNE,
  type CampagneCalculee,
} from '../../shared/types';

interface ValeursCampagne {
  id: string;
  nom: string;
  organisateur: string;
  plateformeCampagne: string;
  lien: string;
  type: string;
  cpm: string;
  paiementMin: string;
  plafondParClip: string;
  budgetTotal: string;
  plateformesEligibles: string;
  audienceExigee: string;
  langue: string;
  hashtagObligatoire: string;
  delaiSoumissionMin: string;
  dateLimite: string;
  statut: string;
  verifieLe: string;
  reglesCles: string;
}

function valeursVides(): ValeursCampagne {
  return {
    id: '',
    nom: '',
    organisateur: '',
    plateformeCampagne: '',
    lien: '',
    type: 'CPM',
    cpm: '',
    paiementMin: '',
    plafondParClip: '',
    budgetTotal: '',
    plateformesEligibles: '',
    audienceExigee: '',
    langue: '',
    hashtagObligatoire: '',
    delaiSoumissionMin: '',
    dateLimite: '',
    statut: 'Active',
    verifieLe: '',
    reglesCles: '',
  };
}

const texteOuVide = (valeur: string | number | null): string =>
  valeur === null || valeur === undefined ? '' : String(valeur);

function valeursDepuis(c: CampagneCalculee): ValeursCampagne {
  return {
    id: c.id,
    nom: c.nom,
    organisateur: texteOuVide(c.organisateur),
    plateformeCampagne: texteOuVide(c.plateformeCampagne),
    lien: texteOuVide(c.lien),
    type: c.type,
    cpm: texteOuVide(c.cpm),
    paiementMin: texteOuVide(c.paiementMin),
    plafondParClip: texteOuVide(c.plafondParClip),
    budgetTotal: texteOuVide(c.budgetTotal),
    plateformesEligibles: texteOuVide(c.plateformesEligibles),
    audienceExigee: texteOuVide(c.audienceExigee),
    langue: texteOuVide(c.langue),
    hashtagObligatoire: texteOuVide(c.hashtagObligatoire),
    delaiSoumissionMin: texteOuVide(c.delaiSoumissionMin),
    dateLimite: texteOuVide(c.dateLimite),
    statut: texteOuVide(c.statut) || 'Active',
    verifieLe: texteOuVide(c.verifieLe),
    reglesCles: texteOuVide(c.reglesCles),
  };
}

const nombreOuNull = (texte: string): number | null => {
  const n = Number(texte.replace(/[\s ]/g, '').replace(',', '.'));
  return texte.trim() === '' || !Number.isFinite(n) ? null : n;
};

function corpsRequete(v: ValeursCampagne): Record<string, unknown> {
  const texte = (s: string): string | null => (s.trim() === '' ? null : s.trim());
  return {
    id: v.id.trim(),
    nom: texte(v.nom) ?? v.id.trim(),
    organisateur: texte(v.organisateur),
    plateformeCampagne: texte(v.plateformeCampagne),
    lien: texte(v.lien),
    type: v.type,
    cpm: nombreOuNull(v.cpm),
    paiementMin: nombreOuNull(v.paiementMin),
    plafondParClip: nombreOuNull(v.plafondParClip),
    budgetTotal: nombreOuNull(v.budgetTotal),
    plateformesEligibles: texte(v.plateformesEligibles),
    audienceExigee: texte(v.audienceExigee),
    langue: texte(v.langue),
    hashtagObligatoire: texte(v.hashtagObligatoire),
    delaiSoumissionMin: nombreOuNull(v.delaiSoumissionMin),
    dateLimite: texte(v.dateLimite),
    statut: texte(v.statut),
    verifieLe: texte(v.verifieLe),
    reglesCles: texte(v.reglesCles),
  };
}

export default function Campagnes() {
  const rafraichir = useRafraichir();
  const { donnees, erreur, enCours } = useDonnees(() => api.campagnes());
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<CampagneCalculee | null>(null);
  const [aSupprimer, setASupprimer] = useState<CampagneCalculee | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreurAction, setErreurAction] = useState<string | null>(null);

  const supprimer = async (): Promise<void> => {
    if (!aSupprimer) return;
    try {
      await api.supprimerCampagne(aSupprimer.id);
      setMessage(`Campagne ${aSupprimer.id} supprimée.`);
      setErreurAction(null);
      setASupprimer(null);
      rafraichir();
    } catch (e) {
      setErreurAction(messageErreur(e));
      setASupprimer(null);
    }
  };

  if (enCours && !donnees) return <Chargement />;
  if (erreur) return <Message ton="erreur">{erreur}</Message>;

  const campagnes = donnees ?? [];
  const aVerifier = campagnes.filter((c) => c.verificationPerimee);

  return (
    <div className="space-y-4">
      {message && (
        <Message ton="succes" onFermer={() => setMessage(null)}>
          {message}
        </Message>
      )}
      {erreurAction && (
        <Message ton="erreur" onFermer={() => setErreurAction(null)}>
          {erreurAction}
        </Message>
      )}

      {aVerifier.length > 0 && (
        <Message ton="attention">
          {aVerifier.length === 1
            ? `Les conditions de ${aVerifier[0].id} n'ont pas été revues depuis plus de 7 jours.`
            : `${aVerifier.length} campagnes n'ont pas été revues depuis plus de 7 jours : ${aVerifier
                .map((c) => c.id)
                .join(', ')}.`}{' '}
          Les budgets et les règles changent vite : rouvrez la page de la campagne, puis mettez à jour
          « Vérifié le ».
        </Message>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">{campagnes.length} campagne(s)</p>
        <button
          type="button"
          className="bouton bouton-principal"
          onClick={() => {
            setEnEdition(null);
            setModaleOuverte(true);
          }}
        >
          ＋ Ajouter une campagne
        </button>
      </div>

      {campagnes.length === 0 && <Vide>Aucune campagne enregistrée.</Vide>}

      <div className="space-y-3">
        {campagnes.map((c) => (
          <CarteCampagne
            key={c.id}
            campagne={c}
            onModifier={() => {
              setEnEdition(c);
              setModaleOuverte(true);
            }}
            onSupprimer={() => setASupprimer(c)}
          />
        ))}
      </div>

      <ModaleCampagne
        ouverte={modaleOuverte}
        campagne={enEdition}
        onFermer={() => setModaleOuverte(false)}
        onEnregistre={(m) => {
          setMessage(m);
          setErreurAction(null);
          rafraichir();
        }}
      />

      <Modale
        titre="Supprimer cette campagne ?"
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
          La campagne <strong>{aSupprimer?.id}</strong> sera supprimée.
          {(aSupprimer?.nbClips ?? 0) > 0 && (
            <>
              {' '}
              Ses {aSupprimer?.nbClips} clip(s) ne seront pas supprimés, mais ils perdront leur
              rattachement à cette campagne : leur gain ne sera plus estimé.
            </>
          )}
        </p>
      </Modale>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CarteCampagne({
  campagne: c,
  onModifier,
  onSupprimer,
}: {
  campagne: CampagneCalculee;
  onModifier: () => void;
  onSupprimer: () => void;
}) {
  const [detailsOuverts, setDetailsOuverts] = useState(false);

  return (
    <article className="carte">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
              {c.id}
            </span>
            <Pastille ton={c.type === 'CPM' ? 'info' : 'neutre'}>{c.type}</Pastille>
            {c.statut && <Pastille ton={c.statut === 'Active' ? 'approuve' : 'neutre'}>{c.statut}</Pastille>}
          </div>
          <p className="mt-1.5 font-semibold">{c.nom}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {c.organisateur ?? 'Organisateur non renseigné'}
            {c.plateformeCampagne ? ` · ${c.plateformeCampagne}` : ''}
          </p>
        </div>
        {c.verificationPerimee ? (
          <Pastille ton="refuse">
            {c.verifieLe ? `Vérifié il y a ${c.joursDepuisVerification} j` : 'Jamais vérifié'}
          </Pastille>
        ) : (
          <Pastille ton="approuve">Vérifié le {date(c.verifieLe)}</Pastille>
        )}
      </header>

      {c.type === 'CPM' ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Donnee libelle="CPM" valeur={`${dollars(c.cpm)} / 1 000 vues`} />
          <Donnee libelle="Paiement minimum" valeur={dollars(c.paiementMin)} />
          <Donnee
            libelle="Plafond par clip"
            valeur={c.plafondParClip === null ? 'Aucun' : dollars(c.plafondParClip)}
          />
          <Donnee
            libelle="Vues minimum"
            valeur={c.vuesMinimum === null ? '—' : nombre(c.vuesMinimum)}
            precision="Pour atteindre le minimum"
          />
        </dl>
      ) : (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
          Campagne de type <strong>{c.type}</strong> : le gain n'est pas estimé. Notez le montant
          réellement reçu dans l'écran Paiements.
        </p>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
        <Donnee libelle="Clips" valeur={nombre(c.nbClips)} />
        <Donnee libelle="Vues comptées" valeur={nombre(c.vuesComptees)} />
        <Donnee libelle="Gain net estimé" valeur={dollars(c.gainNetEstime)} />
        <Donnee libelle="Paiements reçus" valeur={dollars(c.paiementsRecusNetUsd)} />
      </dl>

      {detailsOuverts && (
        <dl className="mt-3 grid gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
          <Donnee libelle="Budget total" valeur={c.budgetTotal === null ? '—' : dollars(c.budgetTotal)} />
          <Donnee libelle="Plateformes éligibles" valeur={c.plateformesEligibles ?? '—'} />
          <Donnee libelle="Audience exigée" valeur={c.audienceExigee ?? '—'} />
          <Donnee libelle="Langue" valeur={c.langue ?? '—'} />
          <Donnee libelle="Hashtag / mention obligatoire" valeur={c.hashtagObligatoire ?? '—'} />
          <Donnee
            libelle="Délai de soumission"
            valeur={c.delaiSoumissionMin === null ? 'Non indiqué (30 min par défaut)' : `${c.delaiSoumissionMin} min`}
          />
          <Donnee libelle="Date limite" valeur={c.dateLimite ? date(c.dateLimite) : 'Non indiquée'} />
          {c.lien && (
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-500">Lien de la campagne</dt>
              <dd>
                <a href={c.lien} target="_blank" rel="noreferrer" className="lien break-all">
                  {c.lien}
                </a>
              </dd>
            </div>
          )}
          {c.reglesCles && (
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-500">Règles clés</dt>
              <dd className="whitespace-pre-line text-slate-700 dark:text-slate-300">{c.reglesCles}</dd>
            </div>
          )}
        </dl>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="bouton !min-h-0 !px-3 !py-1.5 text-xs"
          onClick={() => setDetailsOuverts((o) => !o)}
        >
          {detailsOuverts ? 'Masquer les détails' : 'Voir les détails'}
        </button>
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

function Donnee({
  libelle,
  valeur,
  precision,
}: {
  libelle: string;
  valeur: string;
  precision?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500 dark:text-slate-500">{libelle}</dt>
      <dd className="nombres font-medium">{valeur}</dd>
      {precision && <dd className="text-[11px] text-slate-400 dark:text-slate-500">{precision}</dd>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ModaleCampagne({
  ouverte,
  campagne,
  onFermer,
  onEnregistre,
}: {
  ouverte: boolean;
  campagne: CampagneCalculee | null;
  onFermer: () => void;
  onEnregistre: (message: string) => void;
}) {
  const [valeurs, setValeurs] = useState<ValeursCampagne>(valeursVides);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!ouverte) return;
    setValeurs(campagne ? valeursDepuis(campagne) : valeursVides());
    setErreur(null);
  }, [ouverte, campagne]);

  const modifier = <C extends keyof ValeursCampagne>(champ: C, valeur: string): void =>
    setValeurs((v) => ({ ...v, [champ]: valeur }));

  const vuesMinimumApercu = (): string => {
    const min = nombreOuNull(valeurs.paiementMin);
    const cpm = nombreOuNull(valeurs.cpm);
    if (min === null || cpm === null || cpm <= 0) return '—';
    return nombre((min / cpm) * 1000);
  };

  const enregistrer = async (): Promise<void> => {
    if (!valeurs.id.trim()) {
      setErreur("L'identifiant court est obligatoire (exemple : TJR-REACH).");
      return;
    }
    setEnCours(true);
    try {
      const corps = corpsRequete(valeurs);
      if (campagne) await api.modifierCampagne(campagne.id, corps);
      else await api.creerCampagne(corps);
      onEnregistre(campagne ? 'Campagne modifiée.' : 'Campagne ajoutée.');
      onFermer();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modale
      titre={campagne ? `Campagne ${campagne.id}` : 'Nouvelle campagne'}
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

        <div className="grid gap-3">
          <ChampTexte
            libelle="Identifiant court (unique)"
            value={valeurs.id}
            onChange={(e) => modifier('id', e.target.value.toUpperCase())}
            placeholder="TJR-REACH"
            aide="C'est ce code que vous choisirez sur chaque clip"
          />
          <ChampTexte
            libelle="Nom de la campagne"
            value={valeurs.nom}
            onChange={(e) => modifier('nom', e.target.value)}
          />
          <ChampTexte
            libelle="Organisateur"
            value={valeurs.organisateur}
            onChange={(e) => modifier('organisateur', e.target.value)}
            placeholder="Reach, Placements…"
          />
          <ChampTexte
            libelle="Plateforme de campagne"
            value={valeurs.plateformeCampagne}
            onChange={(e) => modifier('plateformeCampagne', e.target.value)}
            placeholder="Content Rewards"
          />
        </div>

        <ChampTexte
          libelle="Lien de la campagne"
          type="url"
          inputMode="url"
          value={valeurs.lien}
          onChange={(e) => modifier('lien', e.target.value)}
        />

        <div className="grid gap-3">
          <ChampListe
            libelle="Type"
            value={valeurs.type}
            onChange={(e) => modifier('type', e.target.value)}
            options={TYPES_CAMPAGNE.map((t) => ({ valeur: t, libelle: t }))}
            aide="Seules les campagnes CPM donnent une estimation de gain"
          />
          <ChampListe
            libelle="Statut"
            value={valeurs.statut}
            onChange={(e) => modifier('statut', e.target.value)}
            options={STATUTS_CAMPAGNE.map((s) => ({ valeur: s, libelle: s }))}
          />
        </div>

        {valeurs.type === 'CPM' && (
          <div className="grid gap-3">
            <ChampTexte
              libelle="CPM ($ / 1 000 vues)"
              inputMode="decimal"
              value={valeurs.cpm}
              onChange={(e) => modifier('cpm', e.target.value)}
              placeholder="0,70"
            />
            <ChampTexte
              libelle="Paiement minimum ($)"
              inputMode="decimal"
              value={valeurs.paiementMin}
              onChange={(e) => modifier('paiementMin', e.target.value)}
              placeholder="2"
            />
            <ChampTexte
              libelle="Plafond par clip ($)"
              inputMode="decimal"
              value={valeurs.plafondParClip}
              onChange={(e) => modifier('plafondParClip', e.target.value)}
              placeholder="Vide = aucun plafond"
              aide={`Vues minimum : ${vuesMinimumApercu()}`}
            />
          </div>
        )}

        <div className="grid gap-3">
          <ChampTexte
            libelle="Budget total ($)"
            inputMode="decimal"
            value={valeurs.budgetTotal}
            onChange={(e) => modifier('budgetTotal', e.target.value)}
          />
          <ChampTexte
            libelle="Délai de soumission (min)"
            inputMode="numeric"
            value={valeurs.delaiSoumissionMin}
            onChange={(e) => modifier('delaiSoumissionMin', e.target.value)}
            placeholder="30"
            aide="Utilisé par le minuteur. Vide = 30 min"
          />
          <ChampTexte
            libelle="Plateformes éligibles"
            value={valeurs.plateformesEligibles}
            onChange={(e) => modifier('plateformesEligibles', e.target.value)}
            placeholder="TikTok, Instagram Reels, YouTube Shorts"
          />
          <ChampTexte
            libelle="Audience exigée"
            value={valeurs.audienceExigee}
            onChange={(e) => modifier('audienceExigee', e.target.value)}
            placeholder="≥ 50 % USA, CA, AU, UK, NZ"
          />
          <ChampTexte
            libelle="Langue"
            value={valeurs.langue}
            onChange={(e) => modifier('langue', e.target.value)}
          />
          <ChampTexte
            libelle="Hashtag / mention obligatoire"
            value={valeurs.hashtagObligatoire}
            onChange={(e) => modifier('hashtagObligatoire', e.target.value)}
            placeholder="#TJR"
          />
          <ChampTexte
            libelle="Date limite"
            type="date"
            value={valeurs.dateLimite}
            onChange={(e) => modifier('dateLimite', e.target.value)}
          />
          <ChampTexte
            libelle="Vérifié le"
            type="date"
            value={valeurs.verifieLe}
            onChange={(e) => modifier('verifieLe', e.target.value)}
            aide="Date du dernier contrôle des conditions. Alerte au-delà de 7 jours"
          />
        </div>

        <ChampZone
          libelle="Règles clés / notes"
          rows={5}
          value={valeurs.reglesCles}
          onChange={(e) => modifier('reglesCles', e.target.value)}
          placeholder="Interdits, exigences de montage, pièges à éviter…"
        />
      </div>
    </Modale>
  );
}
