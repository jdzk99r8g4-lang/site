import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { messageErreur, useDonnees, useRafraichir } from '../lib/etat';
import {
  Carte,
  ChampListe,
  ChampTexte,
  ChampZone,
  Chargement,
  Jauge,
  Message,
  Modale,
  PastilleStatutTache,
  Vide,
} from '../composants/ui';
import { date } from '../lib/format';
import { STATUTS_TACHE, type StatutTache, type Tache } from '../../shared/types';

interface ValeursTache {
  phase: string;
  tache: string;
  detail: string;
  echeance: string;
  statut: string;
  notes: string;
}

function valeursVides(phase = ''): ValeursTache {
  return { phase, tache: '', detail: '', echeance: '', statut: 'À faire', notes: '' };
}

export default function Checklist() {
  const rafraichir = useRafraichir();
  const { donnees, erreur, enCours } = useDonnees(() => api.taches());
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<Tache | null>(null);
  const [aSupprimer, setASupprimer] = useState<Tache | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  const [enregistrementId, setEnregistrementId] = useState<number | null>(null);

  const changerStatut = async (tache: Tache, statut: StatutTache): Promise<void> => {
    setEnregistrementId(tache.id);
    try {
      await api.modifierTache(tache.id, { statut });
      setErreurAction(null);
      rafraichir();
    } catch (e) {
      setErreurAction(messageErreur(e));
    } finally {
      setEnregistrementId(null);
    }
  };

  const supprimer = async (): Promise<void> => {
    if (!aSupprimer) return;
    try {
      await api.supprimerTache(aSupprimer.id);
      setMessage('Tâche supprimée.');
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

  const taches = donnees ?? [];
  const faites = taches.filter((t) => t.statut === 'Fait').length;
  const enCoursCount = taches.filter((t) => t.statut === 'En cours').length;
  const avancement = taches.length > 0 ? faites / taches.length : 0;

  // Les taches gardent l'ordre du fichier Excel, regroupees par phase.
  const phases: Array<{ nom: string; taches: Tache[] }> = [];
  for (const tache of taches) {
    const nom = tache.phase ?? 'Sans phase';
    const derniere = phases[phases.length - 1];
    if (derniere && derniere.nom === nom) derniere.taches.push(tache);
    else phases.push({ nom, taches: [tache] });
  }

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

      <Carte titre="Avancement">
        <div className="flex items-baseline justify-between gap-3">
          <p className="nombres text-2xl font-semibold tracking-tight">
            {faites} / {taches.length}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {enCoursCount > 0 ? `${enCoursCount} en cours` : 'tâches faites'}
          </p>
        </div>
        <div className="mt-3">
          <Jauge
            part={avancement}
            ton={avancement >= 1 ? 'emerald' : 'sky'}
            libelle={`${Math.round(avancement * 100)} % de la checklist`}
          />
        </div>
      </Carte>

      <div className="flex justify-end">
        <button
          type="button"
          className="bouton bouton-principal"
          onClick={() => {
            setEnEdition(null);
            setModaleOuverte(true);
          }}
        >
          ＋ Ajouter une tâche
        </button>
      </div>

      {taches.length === 0 && <Vide>Aucune tâche. Ajoutez-en une pour commencer.</Vide>}

      <div className="space-y-4">
        {phases.map((phase) => {
          const faitesPhase = phase.taches.filter((t) => t.statut === 'Fait').length;
          return (
            <Carte
              key={phase.nom}
              titre={phase.nom}
              action={
                <span className="nombres whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  {faitesPhase} / {phase.taches.length}
                </span>
              }
            >
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {phase.taches.map((t) => (
                  <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`font-medium ${
                            t.statut === 'Fait'
                              ? 'text-slate-400 line-through dark:text-slate-500'
                              : ''
                          }`}
                        >
                          {t.numero !== null && (
                            <span className="mr-1.5 text-xs text-slate-400 dark:text-slate-500">
                              {t.numero}.
                            </span>
                          )}
                          {t.tache}
                        </p>
                        {t.detail && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.detail}</p>
                        )}
                        {t.notes && (
                          <p className="mt-1 whitespace-pre-line text-sm italic text-slate-500 dark:text-slate-500">
                            {t.notes}
                          </p>
                        )}
                        {t.echeance && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                            Échéance : {date(t.echeance)}
                          </p>
                        )}
                      </div>
                      <PastilleStatutTache statut={t.statut} />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {STATUTS_TACHE.map((statut) => (
                        <button
                          key={statut}
                          type="button"
                          onClick={() => changerStatut(t, statut)}
                          disabled={enregistrementId === t.id || t.statut === statut}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-100 ${
                            t.statut === statut
                              ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                              : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                        >
                          {statut}
                        </button>
                      ))}
                      <span className="flex-1" />
                      <button
                        type="button"
                        className="bouton !min-h-0 !px-2.5 !py-1 text-xs"
                        onClick={() => {
                          setEnEdition(t);
                          setModaleOuverte(true);
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="bouton bouton-danger !min-h-0 !px-2.5 !py-1 text-xs"
                        onClick={() => setASupprimer(t)}
                      >
                        Retirer
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Carte>
          );
        })}
      </div>

      <ModaleTache
        ouverte={modaleOuverte}
        tache={enEdition}
        phasesExistantes={[...new Set(taches.map((t) => t.phase).filter((p): p is string => Boolean(p)))]}
        onFermer={() => setModaleOuverte(false)}
        onEnregistre={(m) => {
          setMessage(m);
          setErreurAction(null);
          rafraichir();
        }}
      />

      <Modale
        titre="Retirer cette tâche ?"
        ouverte={aSupprimer !== null}
        onFermer={() => setASupprimer(null)}
        pied={
          <>
            <button type="button" className="bouton" onClick={() => setASupprimer(null)}>
              Annuler
            </button>
            <button type="button" className="bouton bouton-danger" onClick={supprimer}>
              Retirer
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          La tâche « {aSupprimer?.tache} » sera supprimée de la checklist.
        </p>
      </Modale>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ModaleTache({
  ouverte,
  tache,
  phasesExistantes,
  onFermer,
  onEnregistre,
}: {
  ouverte: boolean;
  tache: Tache | null;
  phasesExistantes: string[];
  onFermer: () => void;
  onEnregistre: (message: string) => void;
}) {
  const [valeurs, setValeurs] = useState<ValeursTache>(valeursVides);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!ouverte) return;
    setValeurs(
      tache
        ? {
            phase: tache.phase ?? '',
            tache: tache.tache,
            detail: tache.detail ?? '',
            echeance: tache.echeance ?? '',
            statut: tache.statut,
            notes: tache.notes ?? '',
          }
        : valeursVides(phasesExistantes[phasesExistantes.length - 1] ?? ''),
    );
    setErreur(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouverte, tache]);

  const modifier = <C extends keyof ValeursTache>(champ: C, valeur: string): void =>
    setValeurs((v) => ({ ...v, [champ]: valeur }));

  const enregistrer = async (): Promise<void> => {
    if (!valeurs.tache.trim()) {
      setErreur("L'intitulé de la tâche est obligatoire.");
      return;
    }
    setEnCours(true);
    try {
      const texte = (s: string): string | null => (s.trim() === '' ? null : s.trim());
      const corps: Record<string, unknown> = {
        phase: texte(valeurs.phase),
        tache: valeurs.tache.trim(),
        detail: texte(valeurs.detail),
        echeance: texte(valeurs.echeance),
        statut: valeurs.statut,
        notes: texte(valeurs.notes),
      };
      if (tache) await api.modifierTache(tache.id, corps);
      else await api.creerTache(corps);
      onEnregistre(tache ? 'Tâche modifiée.' : 'Tâche ajoutée.');
      onFermer();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modale
      titre={tache ? 'Modifier la tâche' : 'Nouvelle tâche'}
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

        <ChampTexte
          libelle="Tâche"
          value={valeurs.tache}
          onChange={(e) => modifier('tache', e.target.value)}
          placeholder="Ce qu'il y a à faire"
        />

        <div className="grid gap-3">
          <ChampTexte
            libelle="Phase"
            value={valeurs.phase}
            onChange={(e) => modifier('phase', e.target.value)}
            list="phases-existantes"
            placeholder="1. Comptes"
          />
          <datalist id="phases-existantes">
            {phasesExistantes.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <ChampTexte
            libelle="Échéance"
            type="date"
            value={valeurs.echeance}
            onChange={(e) => modifier('echeance', e.target.value)}
          />
          <ChampListe
            libelle="Statut"
            value={valeurs.statut}
            onChange={(e) => modifier('statut', e.target.value)}
            options={STATUTS_TACHE.map((s) => ({ valeur: s, libelle: s }))}
          />
        </div>

        <ChampZone
          libelle="Comment / détail"
          rows={4}
          value={valeurs.detail}
          onChange={(e) => modifier('detail', e.target.value)}
        />

        <ChampZone
          libelle="Notes"
          value={valeurs.notes}
          onChange={(e) => modifier('notes', e.target.value)}
        />
      </div>
    </Modale>
  );
}
