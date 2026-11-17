import { useRef, useState } from 'react';
import { api, telecharger, type EtatApplication, type ResultatImport } from '../lib/api';
import { messageErreur, useDonnees, useRafraichir } from '../lib/etat';
import {
  Carte,
  ChampTexte,
  Chargement,
  Message,
  Modale,
} from '../composants/ui';
import type { Reglages as TypeReglages } from '../../shared/types';
import { euros, pourcent } from '../lib/format';

export default function Reglages() {
  const rafraichir = useRafraichir();
  const chargement = useDonnees<{ reglages: TypeReglages; etat: EtatApplication }>(async () => {
    const [reglages, etat] = await Promise.all([api.reglages(), api.etat()]);
    return { reglages, etat };
  });

  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  if (chargement.enCours && !chargement.donnees) return <Chargement />;
  if (chargement.erreur) return <Message ton="erreur">{chargement.erreur}</Message>;
  if (!chargement.donnees) return null;

  const { reglages, etat } = chargement.donnees;

  return (
    <div className="space-y-4">
      {erreur && (
        <Message ton="erreur" onFermer={() => setErreur(null)}>
          {erreur}
        </Message>
      )}
      {succes && (
        <Message ton="succes" onFermer={() => setSucces(null)}>
          {succes}
        </Message>
      )}

      <FormulaireReglages
        reglages={reglages}
        onEnregistre={(message) => {
          setSucces(message);
          setErreur(null);
          rafraichir();
        }}
        onErreur={(message) => {
          setErreur(message);
          setSucces(null);
        }}
      />

      <Exports onErreur={setErreur} />

      <SauvegardeRestauration
        onSucces={(message) => {
          setSucces(message);
          setErreur(null);
          rafraichir();
        }}
        onErreur={(message) => {
          setErreur(message);
          setSucces(null);
        }}
      />

      <ImportExcel
        etat={etat}
        onSucces={(message) => {
          setSucces(message);
          setErreur(null);
          rafraichir();
        }}
        onErreur={(message) => {
          setErreur(message);
          setSucces(null);
        }}
      />

      <Carte titre="Où sont mes données ?">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Tout est enregistré sur votre ordinateur, dans ce dossier :
        </p>
        <p className="mt-2 break-all rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs dark:bg-slate-950">
          {etat.dossier}
        </p>
        <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <li>
            <strong>vicecityclips.db</strong> : la base de données (clips, campagnes, comptes,
            paiements, checklist).
          </li>
          <li>
            <strong>pieces-jointes/</strong> : vos captures d'écran et justificatifs.
          </li>
          <li>
            <strong>sauvegardes/</strong> : les copies de sécurité créées avant chaque restauration.
          </li>
        </ul>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Aucune donnée ne part sur internet : l'application ne contacte aucun service en ligne.
        </p>
      </Carte>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FormulaireReglages({
  reglages,
  onEnregistre,
  onErreur,
}: {
  reglages: TypeReglages;
  onEnregistre: (message: string) => void;
  onErreur: (message: string) => void;
}) {
  // Les frais sont stockes en fraction (0,1) et saisis en pourcentage (10).
  const [fraisPourcent, setFraisPourcent] = useState(String(reglages.fraisCpm * 100).replace('.', ','));
  const [taux, setTaux] = useState(String(reglages.tauxEurParUsd).replace('.', ','));
  const [objectif, setObjectif] = useState(String(reglages.objectifMensuelEur).replace('.', ','));
  const [enregistrement, setEnregistrement] = useState(false);

  const enNombre = (texte: string): number => Number(texte.replace(',', '.').trim());

  const enregistrer = async (): Promise<void> => {
    const frais = enNombre(fraisPourcent);
    const t = enNombre(taux);
    const o = enNombre(objectif);

    if (!Number.isFinite(frais) || frais < 0 || frais > 100) {
      onErreur('Les frais doivent être un pourcentage entre 0 et 100.');
      return;
    }
    if (!Number.isFinite(t) || t <= 0) {
      onErreur('Le taux de change doit être un nombre positif (exemple : 0,86).');
      return;
    }
    if (!Number.isFinite(o) || o < 0) {
      onErreur("L'objectif mensuel doit être un nombre positif.");
      return;
    }

    setEnregistrement(true);
    try {
      await api.enregistrerReglages({
        fraisCpm: frais / 100,
        tauxEurParUsd: t,
        objectifMensuelEur: o,
      });
      onEnregistre('Réglages enregistrés.');
    } catch (e) {
      onErreur(messageErreur(e));
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <Carte titre="Réglages de calcul">
      <div className="grid gap-4 sm:grid-cols-3">
        <ChampTexte
          libelle="Frais Content Rewards (campagnes CPM)"
          inputMode="decimal"
          value={fraisPourcent}
          onChange={(e) => setFraisPourcent(e.target.value)}
          aide={`En pourcentage. Actuellement ${pourcent(reglages.fraisCpm, 1)} retirés du gain brut.`}
        />
        <ChampTexte
          libelle="Taux de change par défaut (€ pour 1 $)"
          inputMode="decimal"
          value={taux}
          onChange={(e) => setTaux(e.target.value)}
          aide="Utilisé quand un paiement n'a pas son propre taux."
        />
        <ChampTexte
          libelle="Objectif mensuel (€ reçus)"
          inputMode="decimal"
          value={objectif}
          onChange={(e) => setObjectif(e.target.value)}
          aide={`Jauge du tableau de bord. Actuellement ${euros(reglages.objectifMensuelEur)}.`}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" className="bouton bouton-principal" onClick={enregistrer} disabled={enregistrement}>
          {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
        Ces trois valeurs viennent de l'onglet « Tableau de bord » de votre fichier Excel. Le taux de
        change bouge : pensez à le remettre à jour, ou saisissez le taux exact sur chaque paiement.
      </p>
    </Carte>
  );
}

/* ------------------------------------------------------------------ */

function Exports({ onErreur }: { onErreur: (message: string) => void }) {
  return (
    <Carte titre="Exporter mes données">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        L'export contient tout : indicateurs, suivi mensuel, clips, campagnes, comptes, historique
        d'abonnés, paiements et checklist, valeurs calculées comprises.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="bouton"
          onClick={() => {
            try {
              telecharger('/export/excel');
            } catch (e) {
              onErreur(messageErreur(e));
            }
          }}
        >
          📗 Export Excel (.xlsx)
        </button>
        <button
          type="button"
          className="bouton"
          onClick={() => {
            try {
              telecharger('/export/csv');
            } catch (e) {
              onErreur(messageErreur(e));
            }
          }}
        >
          📄 Export CSV (archive .zip)
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
        Les fichiers CSV sont préparés pour Excel en français : séparateur point-virgule et virgule
        décimale. Un double-clic suffit à les ouvrir correctement.
      </p>
    </Carte>
  );
}

/* ------------------------------------------------------------------ */

function SauvegardeRestauration({
  onSucces,
  onErreur,
}: {
  onSucces: (message: string) => void;
  onErreur: (message: string) => void;
}) {
  const champFichier = useRef<HTMLInputElement>(null);
  const [archive, setArchive] = useState<File | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const restaurer = async (): Promise<void> => {
    if (!archive) return;
    setEnCours(true);
    try {
      const resultat = await api.restaurer(archive);
      const total = Object.entries(resultat.lignes)
        .map(([table, n]) => `${table} : ${n}`)
        .join(', ');
      onSucces(
        `Sauvegarde restaurée (${resultat.nbPiecesJointes} pièce(s) jointe(s)).\n${total}\n` +
          `L'état précédent a été mis de côté dans sauvegardes/${resultat.sauvegardeDeSecurite}.`,
      );
      setArchive(null);
      setConfirmation(false);
      if (champFichier.current) champFichier.current.value = '';
    } catch (e) {
      onErreur(messageErreur(e));
      setConfirmation(false);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Carte titre="Sauvegarde et restauration">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Une sauvegarde est un seul fichier <strong>.zip</strong> contenant la base de données et
        toutes vos pièces jointes. Gardez-en une copie ailleurs que sur votre Mac.
      </p>

      <div className="mt-3">
        <button type="button" className="bouton bouton-principal" onClick={() => telecharger('/sauvegarde')}>
          💾 Télécharger une sauvegarde complète
        </button>
      </div>

      <hr className="my-4 border-slate-200 dark:border-slate-800" />

      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Restaurer une sauvegarde</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Cela remplace <strong>toutes</strong> les données actuelles par celles de l'archive. L'état
        actuel est d'abord copié dans le dossier <code>sauvegardes/</code>, donc rien n'est perdu
        définitivement.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <input
          ref={champFichier}
          type="file"
          accept=".zip,application/zip"
          onChange={(e) => setArchive(e.target.files?.[0] ?? null)}
          className="champ sm:max-w-sm"
        />
        <button
          type="button"
          className="bouton bouton-danger"
          disabled={!archive || enCours}
          onClick={() => setConfirmation(true)}
        >
          Restaurer
        </button>
      </div>

      <Modale
        titre="Restaurer cette sauvegarde ?"
        ouverte={confirmation}
        onFermer={() => setConfirmation(false)}
        pied={
          <>
            <button type="button" className="bouton" onClick={() => setConfirmation(false)}>
              Annuler
            </button>
            <button type="button" className="bouton bouton-danger" onClick={restaurer} disabled={enCours}>
              {enCours ? 'Restauration…' : 'Oui, restaurer'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Toutes les données actuelles (clips, campagnes, comptes, paiements, checklist et pièces
          jointes) vont être remplacées par le contenu de <strong>{archive?.name}</strong>.
        </p>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          Une copie de l'état actuel sera enregistrée dans le dossier <code>sauvegardes/</code> avant
          le remplacement.
        </p>
      </Modale>
    </Carte>
  );
}

/* ------------------------------------------------------------------ */

function ImportExcel({
  etat,
  onSucces,
  onErreur,
}: {
  etat: EtatApplication;
  onSucces: (message: string) => void;
  onErreur: (message: string) => void;
}) {
  const [confirmation, setConfirmation] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const importer = async (remplacer: boolean): Promise<void> => {
    setEnCours(true);
    try {
      const r: ResultatImport = await api.importerExcel(remplacer);
      const details =
        `${r.campagnes} campagne(s), ${r.comptes} compte(s), ${r.clips} clip(s), ` +
        `${r.paiements} paiement(s), ${r.taches} tâche(s).` +
        (r.lignesExempleIgnorees > 0
          ? `\n${r.lignesExempleIgnorees} ligne(s) marquée(s) EXEMPLE ignorée(s), comme prévu.`
          : '') +
        (r.avertissements.length > 0 ? `\n\nÀ vérifier :\n- ${r.avertissements.join('\n- ')}` : '');
      onSucces(`Import terminé.\n${details}`);
      setConfirmation(false);
    } catch (e) {
      onErreur(messageErreur(e));
      setConfirmation(false);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Carte titre="Reprendre le fichier Excel">
      {etat.fichierExcel ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Fichier détecté dans le dossier de l'application :{' '}
          <strong className="break-all">{etat.fichierExcel}</strong>
        </p>
      ) : (
        <Message ton="attention">
          Aucun fichier .xlsx dans le dossier de l'application. Pour pouvoir importer, placez-y
          « ViceCityClips - Tableau de pilotage.xlsx ».
        </Message>
      )}

      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
        L'import a déjà eu lieu au premier lancement. Le relancer efface tout ce qui est enregistré
        ici et repart du fichier Excel : à utiliser seulement si vous voulez vraiment revenir à son
        contenu. Les lignes marquées EXEMPLE ne sont jamais importées.
      </p>

      <div className="mt-3">
        <button
          type="button"
          className="bouton bouton-danger"
          disabled={!etat.fichierExcel || enCours}
          onClick={() => setConfirmation(true)}
        >
          ♻️ Réimporter depuis le fichier Excel
        </button>
      </div>

      <Modale
        titre="Repartir du fichier Excel ?"
        ouverte={confirmation}
        onFermer={() => setConfirmation(false)}
        pied={
          <>
            <button type="button" className="bouton" onClick={() => setConfirmation(false)}>
              Annuler
            </button>
            <button
              type="button"
              className="bouton bouton-danger"
              onClick={() => importer(true)}
              disabled={enCours}
            >
              {enCours ? 'Import…' : 'Oui, tout remplacer'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Tout ce que vous avez saisi dans l'application (clips, paiements, avancement de la
          checklist, pièces jointes) sera effacé et remplacé par le contenu de{' '}
          <strong>{etat.fichierExcel}</strong>.
        </p>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          Si vous n'êtes pas sûr, téléchargez d'abord une sauvegarde complète ci-dessus.
        </p>
      </Modale>
    </Carte>
  );
}
