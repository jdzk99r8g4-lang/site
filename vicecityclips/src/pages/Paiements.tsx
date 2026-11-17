import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { messageErreur, useDonnees, useRafraichir } from '../lib/etat';
import {
  Carte,
  ChampCase,
  ChampListe,
  ChampTexte,
  ChampZone,
  Chargement,
  Indicateur,
  Message,
  Modale,
  Pastille,
  Vide,
} from '../composants/ui';
import { aujourdhui, date, dollars, euros } from '../lib/format';
import {
  MOYENS_PAIEMENT,
  type CampagneCalculee,
  type PaiementCalcule,
  type Reglages,
} from '../../shared/types';

interface ValeursPaiement {
  dateReception: string;
  source: string;
  campagneId: string;
  montantBrutUsd: string;
  fraisRetraitUsd: string;
  tauxEurParUsd: string;
  moyen: string;
  reference: string;
  declareImpots: boolean;
  notes: string;
}

function valeursVides(): ValeursPaiement {
  return {
    dateReception: aujourdhui(),
    source: '',
    campagneId: '',
    montantBrutUsd: '',
    fraisRetraitUsd: '0',
    tauxEurParUsd: '',
    moyen: 'Virement',
    reference: '',
    declareImpots: false,
    notes: '',
  };
}

function valeursDepuis(p: PaiementCalcule): ValeursPaiement {
  return {
    dateReception: p.dateReception ?? '',
    source: p.source ?? '',
    campagneId: p.campagneId ?? '',
    montantBrutUsd: String(p.montantBrutUsd).replace('.', ','),
    fraisRetraitUsd: String(p.fraisRetraitUsd).replace('.', ','),
    tauxEurParUsd: p.tauxEurParUsd === null ? '' : String(p.tauxEurParUsd).replace('.', ','),
    moyen: p.moyen ?? 'Virement',
    reference: p.reference ?? '',
    declareImpots: p.declareImpots,
    notes: p.notes ?? '',
  };
}

const nombreOuNull = (texte: string): number | null => {
  const n = Number(texte.replace(/[\s ]/g, '').replace(',', '.'));
  return texte.trim() === '' || !Number.isFinite(n) ? null : n;
};

export default function Paiements() {
  const rafraichir = useRafraichir();
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<PaiementCalcule | null>(null);
  const [aSupprimer, setASupprimer] = useState<PaiementCalcule | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreurAction, setErreurAction] = useState<string | null>(null);

  const chargement = useDonnees<{
    paiements: PaiementCalcule[];
    campagnes: CampagneCalculee[];
    reglages: Reglages;
  }>(async () => {
    const [paiements, campagnes, reglages] = await Promise.all([
      api.paiements(),
      api.campagnes(),
      api.reglages(),
    ]);
    return { paiements, campagnes, reglages };
  });

  const supprimer = async (): Promise<void> => {
    if (!aSupprimer) return;
    try {
      await api.supprimerPaiement(aSupprimer.id);
      setMessage('Paiement supprimé.');
      setErreurAction(null);
      setASupprimer(null);
      rafraichir();
    } catch (e) {
      setErreurAction(messageErreur(e));
      setASupprimer(null);
    }
  };

  if (chargement.enCours && !chargement.donnees) return <Chargement />;
  if (chargement.erreur) return <Message ton="erreur">{chargement.erreur}</Message>;
  if (!chargement.donnees) return null;

  const { paiements, campagnes, reglages } = chargement.donnees;
  const totalUsd = paiements.reduce((s, p) => s + p.montantNetUsd, 0);
  const totalEur = paiements.reduce((s, p) => s + p.montantNetEur, 0);
  const nonDeclares = paiements.filter((p) => !p.declareImpots).length;

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicateur libelle="Total reçu net" valeur={dollars(totalUsd)} />
        <Indicateur libelle="Total reçu net (€)" valeur={euros(totalEur)} />
        <Indicateur libelle="Nombre de paiements" valeur={String(paiements.length)} />
        <Indicateur
          libelle="Non déclarés aux impôts"
          valeur={String(nonDeclares)}
          ton={nonDeclares > 0 ? 'attention' : 'bon'}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Taux par défaut : {reglages.tauxEurParUsd} € pour 1 $
        </p>
        <button
          type="button"
          className="bouton bouton-principal"
          onClick={() => {
            setEnEdition(null);
            setModaleOuverte(true);
          }}
        >
          ＋ Ajouter un paiement
        </button>
      </div>

      {paiements.length === 0 && (
        <Vide>
          Aucun paiement enregistré. Ajoutez chaque versement reçu, avec sa référence de transaction
          et son justificatif.
        </Vide>
      )}

      <div className="space-y-3">
        {paiements.map((p) => (
          <article key={p.id} className="carte">
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold">{date(p.dateReception)}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {p.source ?? 'Source non renseignée'}
                  {p.campagneId ? ` · ${p.campagneId}` : ''}
                  {p.moyen ? ` · ${p.moyen}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {p.declareImpots ? (
                  <Pastille ton="approuve">Déclaré</Pastille>
                ) : (
                  <Pastille ton="attente">Non déclaré</Pastille>
                )}
              </div>
            </header>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-5">
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-500">Brut</dt>
                <dd className="nombres font-medium">{dollars(p.montantBrutUsd)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-500">Frais de retrait</dt>
                <dd className="nombres font-medium">{dollars(p.fraisRetraitUsd)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-500">Net</dt>
                <dd className="nombres font-semibold">{dollars(p.montantNetUsd)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-500">Taux appliqué</dt>
                <dd className="nombres font-medium">{p.tauxApplique}</dd>
                {p.tauxParDefautUtilise && (
                  <dd className="text-[11px] text-slate-400 dark:text-slate-500">taux par défaut</dd>
                )}
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-500">Net en euros</dt>
                <dd className="nombres font-semibold">{euros(p.montantNetEur)}</dd>
              </div>
            </dl>

            {p.reference && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Référence : <span className="font-mono">{p.reference}</span>
              </p>
            )}

            {p.notes && (
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">{p.notes}</p>
            )}

            {p.piecesJointes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {p.piecesJointes.map((j) => (
                  <a key={j.id} href={j.url} target="_blank" rel="noreferrer" title={j.nomOriginal}>
                    {j.typeMime?.startsWith('image/') ? (
                      <img src={j.url} alt={j.nomOriginal} className="h-16 w-16 rounded-lg object-cover" />
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
              <span className="flex-1" />
              <button
                type="button"
                className="bouton !min-h-0 !px-3 !py-1.5 text-xs"
                onClick={() => {
                  setEnEdition(p);
                  setModaleOuverte(true);
                }}
              >
                Modifier
              </button>
              <button
                type="button"
                className="bouton bouton-danger !min-h-0 !px-3 !py-1.5 text-xs"
                onClick={() => setASupprimer(p)}
              >
                Supprimer
              </button>
            </footer>
          </article>
        ))}
      </div>

      <ModalePaiement
        ouverte={modaleOuverte}
        paiement={enEdition}
        campagnes={campagnes}
        reglages={reglages}
        onFermer={() => setModaleOuverte(false)}
        onEnregistre={(m) => {
          setMessage(m);
          setErreurAction(null);
          rafraichir();
        }}
      />

      <Modale
        titre="Supprimer ce paiement ?"
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
          Le paiement du {date(aSupprimer?.dateReception)} ({dollars(aSupprimer?.montantNetUsd)}) et son
          justificatif seront supprimés.
        </p>
      </Modale>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ModalePaiement({
  ouverte,
  paiement,
  campagnes,
  reglages,
  onFermer,
  onEnregistre,
}: {
  ouverte: boolean;
  paiement: PaiementCalcule | null;
  campagnes: CampagneCalculee[];
  reglages: Reglages;
  onFermer: () => void;
  onEnregistre: (message: string) => void;
}) {
  const [valeurs, setValeurs] = useState<ValeursPaiement>(valeursVides);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [fichierEnAttente, setFichierEnAttente] = useState<File | null>(null);
  const champFichier = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ouverte) return;
    setValeurs(paiement ? valeursDepuis(paiement) : valeursVides());
    setErreur(null);
    setFichierEnAttente(null);
    if (champFichier.current) champFichier.current.value = '';
  }, [ouverte, paiement]);

  const modifier = <C extends keyof ValeursPaiement>(champ: C, valeur: ValeursPaiement[C]): void =>
    setValeurs((v) => ({ ...v, [champ]: valeur }));

  // Apercu des calculs, identiques a ceux du serveur.
  const brut = nombreOuNull(valeurs.montantBrutUsd) ?? 0;
  const frais = nombreOuNull(valeurs.fraisRetraitUsd) ?? 0;
  const netUsd = brut - frais;
  const tauxSaisi = nombreOuNull(valeurs.tauxEurParUsd);
  const taux = tauxSaisi === null ? reglages.tauxEurParUsd : tauxSaisi;
  const netEur = netUsd * taux;

  const enregistrer = async (): Promise<void> => {
    if (!valeurs.dateReception) {
      setErreur('La date de réception est obligatoire.');
      return;
    }
    if (nombreOuNull(valeurs.montantBrutUsd) === null) {
      setErreur('Indiquez le montant brut reçu, en dollars.');
      return;
    }
    setEnCours(true);
    try {
      const texte = (s: string): string | null => (s.trim() === '' ? null : s.trim());
      const corps: Record<string, unknown> = {
        dateReception: valeurs.dateReception,
        source: texte(valeurs.source),
        campagneId: texte(valeurs.campagneId),
        montantBrutUsd: nombreOuNull(valeurs.montantBrutUsd) ?? 0,
        fraisRetraitUsd: nombreOuNull(valeurs.fraisRetraitUsd) ?? 0,
        tauxEurParUsd: nombreOuNull(valeurs.tauxEurParUsd),
        moyen: texte(valeurs.moyen),
        reference: texte(valeurs.reference),
        declareImpots: valeurs.declareImpots,
        notes: texte(valeurs.notes),
      };

      const enregistre = paiement
        ? await api.modifierPaiement(paiement.id, corps)
        : await api.creerPaiement(corps);

      if (fichierEnAttente) {
        await api.ajouterPieceJointe('paiements', enregistre.id, fichierEnAttente);
      }
      onEnregistre(paiement ? 'Paiement modifié.' : 'Paiement ajouté.');
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
      onEnregistre('Justificatif supprimé.');
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  return (
    <Modale
      titre={paiement ? `Paiement du ${date(paiement.dateReception)}` : 'Nouveau paiement'}
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

        <div className="grid gap-3 sm:grid-cols-2">
          <ChampTexte
            libelle="Date de réception"
            type="date"
            value={valeurs.dateReception}
            onChange={(e) => modifier('dateReception', e.target.value)}
          />
          <ChampTexte
            libelle="Source"
            value={valeurs.source}
            onChange={(e) => modifier('source', e.target.value)}
            placeholder="Content Rewards → Whop → banque"
          />
          <ChampListe
            libelle="Campagne"
            value={valeurs.campagneId}
            onChange={(e) => modifier('campagneId', e.target.value)}
            videLibelle="— Aucune —"
            options={campagnes.map((c) => ({ valeur: c.id, libelle: `${c.id} — ${c.nom}` }))}
          />
          <ChampListe
            libelle="Moyen"
            value={valeurs.moyen}
            onChange={(e) => modifier('moyen', e.target.value)}
            options={MOYENS_PAIEMENT.map((m) => ({ valeur: m, libelle: m }))}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ChampTexte
            libelle="Montant brut ($)"
            inputMode="decimal"
            value={valeurs.montantBrutUsd}
            onChange={(e) => modifier('montantBrutUsd', e.target.value)}
            placeholder="7,81"
          />
          <ChampTexte
            libelle="Frais de retrait ($)"
            inputMode="decimal"
            value={valeurs.fraisRetraitUsd}
            onChange={(e) => modifier('fraisRetraitUsd', e.target.value)}
          />
          <ChampTexte
            libelle="Taux € pour 1 $"
            inputMode="decimal"
            value={valeurs.tauxEurParUsd}
            onChange={(e) => modifier('tauxEurParUsd', e.target.value)}
            placeholder={`Vide = ${reglages.tauxEurParUsd}`}
            aide="Laissez vide pour utiliser le taux par défaut des réglages"
          />
        </div>

        <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950">
          <p className="mb-1 font-medium">Calcul</p>
          <p className="text-slate-700 dark:text-slate-300">
            Net = {dollars(brut)} − {dollars(frais)} = <strong>{dollars(netUsd)}</strong>
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            Net en euros = {dollars(netUsd)} × {taux} = <strong>{euros(netEur)}</strong>
            {tauxSaisi === null && ' (taux par défaut)'}
          </p>
        </div>

        <ChampTexte
          libelle="Référence de la transaction"
          value={valeurs.reference}
          onChange={(e) => modifier('reference', e.target.value)}
          placeholder="WHOP-…"
        />

        <ChampCase
          libelle="Déclaré aux impôts"
          coche={valeurs.declareImpots}
          onChange={(v) => modifier('declareImpots', v)}
        />

        <ChampZone
          libelle="Notes"
          value={valeurs.notes}
          onChange={(e) => modifier('notes', e.target.value)}
        />

        <div>
          <p className="etiquette">Justificatif (capture, relevé)</p>
          {paiement && paiement.piecesJointes.length > 0 && (
            <ul className="mb-2 space-y-2">
              {paiement.piecesJointes.map((j) => (
                <li
                  key={j.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-2 dark:border-slate-700"
                >
                  <a href={j.url} target="_blank" rel="noreferrer" className="shrink-0">
                    {j.typeMime?.startsWith('image/') ? (
                      <img src={j.url} alt={j.nomOriginal} className="h-14 w-14 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xl dark:bg-slate-800">
                        📄
                      </span>
                    )}
                  </a>
                  <a href={j.url} target="_blank" rel="noreferrer" className="lien flex-1 break-all text-sm">
                    {j.nomOriginal}
                  </a>
                  <button
                    type="button"
                    className="bouton bouton-danger !min-h-0 !px-3 !py-1.5 text-xs"
                    onClick={() => supprimerPiece(j.id)}
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
            Gardez le relevé ou la capture du virement : c'est votre preuve pour la comptabilité.
          </p>
        </div>
      </div>
    </Modale>
  );
}
