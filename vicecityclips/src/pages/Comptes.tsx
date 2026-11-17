import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { messageErreur, useDonnees, useRafraichir } from '../lib/etat';
import {
  Carte,
  ChampCase,
  ChampListe,
  ChampTexte,
  ChampZone,
  Chargement,
  Message,
  Modale,
  Pastille,
  Vide,
} from '../composants/ui';
import { aujourdhui, date, dollars, nombre } from '../lib/format';
import { PLATEFORMES, type CompteCalcule, type ReleveAbonnes } from '../../shared/types';

interface ValeursCompte {
  identifiant: string;
  nomAffiche: string;
  plateforme: string;
  niche: string;
  langue: string;
  configurationPays: string;
  dateCreation: string;
  relieContentRewards: boolean;
  audiencePrincipale: string;
  notes: string;
}

function valeursVides(): ValeursCompte {
  return {
    identifiant: '',
    nomAffiche: '',
    plateforme: '',
    niche: '',
    langue: '',
    configurationPays: '',
    dateCreation: '',
    relieContentRewards: false,
    audiencePrincipale: '',
    notes: '',
  };
}

function valeursDepuis(c: CompteCalcule): ValeursCompte {
  return {
    identifiant: c.identifiant,
    nomAffiche: c.nomAffiche ?? '',
    plateforme: c.plateforme ?? '',
    niche: c.niche ?? '',
    langue: c.langue ?? '',
    configurationPays: c.configurationPays ?? '',
    dateCreation: c.dateCreation ?? '',
    relieContentRewards: c.relieContentRewards,
    audiencePrincipale: c.audiencePrincipale ?? '',
    notes: c.notes ?? '',
  };
}

function corpsRequete(v: ValeursCompte): Record<string, unknown> {
  const texte = (s: string): string | null => (s.trim() === '' ? null : s.trim());
  return {
    identifiant: v.identifiant.trim(),
    nomAffiche: texte(v.nomAffiche),
    plateforme: texte(v.plateforme),
    niche: texte(v.niche),
    langue: texte(v.langue),
    configurationPays: texte(v.configurationPays),
    dateCreation: texte(v.dateCreation),
    relieContentRewards: v.relieContentRewards,
    audiencePrincipale: texte(v.audiencePrincipale),
    notes: texte(v.notes),
  };
}

export default function Comptes() {
  const rafraichir = useRafraichir();
  const { donnees, erreur, enCours } = useDonnees(() => api.comptes());
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<CompteCalcule | null>(null);
  const [abonnesDe, setAbonnesDe] = useState<CompteCalcule | null>(null);
  const [aSupprimer, setASupprimer] = useState<CompteCalcule | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreurAction, setErreurAction] = useState<string | null>(null);

  const supprimer = async (): Promise<void> => {
    if (!aSupprimer) return;
    try {
      await api.supprimerCompte(aSupprimer.id);
      setMessage(`Compte ${aSupprimer.identifiant} supprimé.`);
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

  const comptes = donnees ?? [];

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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">{comptes.length} compte(s)</p>
        <button
          type="button"
          className="bouton bouton-principal"
          onClick={() => {
            setEnEdition(null);
            setModaleOuverte(true);
          }}
        >
          ＋ Ajouter un compte
        </button>
      </div>

      {comptes.length === 0 && <Vide>Aucun compte enregistré.</Vide>}

      <div className="space-y-3">
        {comptes.map((c) => (
          <article key={c.id} className="carte">
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold">{c.identifiant}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {c.nomAffiche ?? '—'}
                  {c.plateforme ? ` · ${c.plateforme}` : ''}
                  {c.niche ? ` · ${c.niche}` : ''}
                  {c.langue ? ` · ${c.langue}` : ''}
                </p>
              </div>
              {c.relieContentRewards ? (
                <Pastille ton="approuve">Relié à Content Rewards</Pastille>
              ) : (
                <Pastille ton="attente">Pas encore relié</Pastille>
              )}
            </header>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-500">Abonnés</dt>
                <dd className="nombres font-medium">{c.abonnes === null ? '—' : nombre(c.abonnes)}</dd>
                {c.abonnesMajLe && (
                  <dd className="text-[11px] text-slate-400 dark:text-slate-500">
                    au {date(c.abonnesMajLe)}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-500">Clips</dt>
                <dd className="nombres font-medium">{nombre(c.nbClips)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-500">Vues comptées</dt>
                <dd className="nombres font-medium">{nombre(c.vuesComptees)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-500">Gain net estimé</dt>
                <dd className="nombres font-medium">{dollars(c.gainNetEstime)}</dd>
              </div>
            </dl>

            {(c.configurationPays || c.audiencePrincipale || c.dateCreation) && (
              <dl className="mt-3 grid gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-500">Configuration pays</dt>
                  <dd>{c.configurationPays ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-500">Audience principale</dt>
                  <dd>{c.audiencePrincipale ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-500">Créé le</dt>
                  <dd>{c.dateCreation ? date(c.dateCreation) : '—'}</dd>
                </div>
              </dl>
            )}

            {c.notes && (
              <p className="mt-3 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">{c.notes}</p>
            )}

            <footer className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="bouton !min-h-0 !px-3 !py-1.5 text-xs"
                onClick={() => setAbonnesDe(c)}
              >
                📈 Abonnés
              </button>
              <span className="flex-1" />
              <button
                type="button"
                className="bouton !min-h-0 !px-3 !py-1.5 text-xs"
                onClick={() => {
                  setEnEdition(c);
                  setModaleOuverte(true);
                }}
              >
                Modifier
              </button>
              <button
                type="button"
                className="bouton bouton-danger !min-h-0 !px-3 !py-1.5 text-xs"
                onClick={() => setASupprimer(c)}
              >
                Supprimer
              </button>
            </footer>
          </article>
        ))}
      </div>

      <ModaleCompte
        ouverte={modaleOuverte}
        compte={enEdition}
        onFermer={() => setModaleOuverte(false)}
        onEnregistre={(m) => {
          setMessage(m);
          setErreurAction(null);
          rafraichir();
        }}
      />

      <ModaleAbonnes
        compte={abonnesDe}
        onFermer={() => setAbonnesDe(null)}
        onEnregistre={(m) => {
          setMessage(m);
          setErreurAction(null);
          rafraichir();
        }}
      />

      <Modale
        titre="Supprimer ce compte ?"
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
          Le compte <strong>{aSupprimer?.identifiant}</strong> et son historique d'abonnés seront
          supprimés.
          {(aSupprimer?.nbClips ?? 0) > 0 && (
            <>
              {' '}
              Ses {aSupprimer?.nbClips} clip(s) resteront, mais sans compte rattaché.
            </>
          )}
        </p>
      </Modale>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ModaleCompte({
  ouverte,
  compte,
  onFermer,
  onEnregistre,
}: {
  ouverte: boolean;
  compte: CompteCalcule | null;
  onFermer: () => void;
  onEnregistre: (message: string) => void;
}) {
  const [valeurs, setValeurs] = useState<ValeursCompte>(valeursVides);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!ouverte) return;
    setValeurs(compte ? valeursDepuis(compte) : valeursVides());
    setErreur(null);
  }, [ouverte, compte]);

  const modifier = <C extends keyof ValeursCompte>(champ: C, valeur: ValeursCompte[C]): void =>
    setValeurs((v) => ({ ...v, [champ]: valeur }));

  const enregistrer = async (): Promise<void> => {
    if (!valeurs.identifiant.trim()) {
      setErreur("L'identifiant du compte est obligatoire (exemple : @ontherunclips).");
      return;
    }
    setEnCours(true);
    try {
      const corps = corpsRequete(valeurs);
      if (compte) await api.modifierCompte(compte.id, corps);
      else await api.creerCompte(corps);
      onEnregistre(compte ? 'Compte modifié.' : 'Compte ajouté.');
      onFermer();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modale
      titre={compte ? compte.identifiant : 'Nouveau compte'}
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
            libelle="Identifiant (@…)"
            value={valeurs.identifiant}
            onChange={(e) => modifier('identifiant', e.target.value)}
            placeholder="@ontherunclips"
          />
          <ChampTexte
            libelle="Nom affiché"
            value={valeurs.nomAffiche}
            onChange={(e) => modifier('nomAffiche', e.target.value)}
            placeholder="On The Run"
          />
          <ChampListe
            libelle="Plateforme"
            value={valeurs.plateforme}
            onChange={(e) => modifier('plateforme', e.target.value)}
            videLibelle="— Choisir —"
            options={PLATEFORMES.map((p) => ({ valeur: p, libelle: p }))}
          />
          <ChampTexte
            libelle="Niche"
            value={valeurs.niche}
            onChange={(e) => modifier('niche', e.target.value)}
            placeholder="GTA 6"
          />
          <ChampTexte
            libelle="Langue"
            value={valeurs.langue}
            onChange={(e) => modifier('langue', e.target.value)}
            placeholder="Anglais"
          />
          <ChampTexte
            libelle="Configuration pays"
            value={valeurs.configurationPays}
            onChange={(e) => modifier('configurationPays', e.target.value)}
            placeholder="eSIM US prévue"
          />
          <ChampTexte
            libelle="Date de création"
            type="date"
            value={valeurs.dateCreation}
            onChange={(e) => modifier('dateCreation', e.target.value)}
          />
          <ChampTexte
            libelle="Audience principale (pays, %)"
            value={valeurs.audiencePrincipale}
            onChange={(e) => modifier('audiencePrincipale', e.target.value)}
            placeholder="USA 62 %, UK 11 %…"
          />
        </div>

        <ChampCase
          libelle="Relié à Content Rewards"
          coche={valeurs.relieContentRewards}
          onChange={(v) => modifier('relieContentRewards', v)}
        />

        <ChampZone
          libelle="Notes"
          value={valeurs.notes}
          onChange={(e) => modifier('notes', e.target.value)}
        />

        {compte && (
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Le nombre d'abonnés se saisit depuis le bouton « Abonnés » de la fiche : chaque relevé est
            daté, ce qui permet de suivre la progression.
          </p>
        )}
      </div>
    </Modale>
  );
}

/* ------------------------------------------------------------------ */

function ModaleAbonnes({
  compte,
  onFermer,
  onEnregistre,
}: {
  compte: CompteCalcule | null;
  onFermer: () => void;
  onEnregistre: (message: string) => void;
}) {
  const [nouvelleDate, setNouvelleDate] = useState(aujourdhui());
  const [nouveauNombre, setNouveauNombre] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const historique = useDonnees<ReleveAbonnes[]>(
    () => (compte ? api.abonnes(compte.id) : Promise.resolve([])),
    [compte?.id ?? 0],
  );

  useEffect(() => {
    setNouvelleDate(aujourdhui());
    setNouveauNombre('');
    setErreur(null);
  }, [compte?.id]);

  const ajouter = async (): Promise<void> => {
    if (!compte) return;
    const n = Number(nouveauNombre.replace(/[\s ]/g, '').replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) {
      setErreur("Indiquez un nombre d'abonnés (exemple : 1250).");
      return;
    }
    setEnCours(true);
    try {
      await api.ajouterReleveAbonnes(compte.id, nouvelleDate, Math.round(n));
      setNouveauNombre('');
      setErreur(null);
      onEnregistre('Relevé d’abonnés enregistré.');
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  const supprimerReleve = async (id: number): Promise<void> => {
    try {
      await api.supprimerReleveAbonnes(id);
      onEnregistre('Relevé supprimé.');
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  const releves = historique.donnees ?? [];

  return (
    <Modale
      titre={compte ? `Abonnés de ${compte.identifiant}` : 'Abonnés'}
      ouverte={compte !== null}
      onFermer={onFermer}
    >
      <div className="space-y-4">
        {erreur && <Message ton="erreur">{erreur}</Message>}

        <Carte titre="Nouveau relevé">
          <div className="grid gap-3">
            <ChampTexte
              libelle="Date"
              type="date"
              value={nouvelleDate}
              onChange={(e) => setNouvelleDate(e.target.value)}
            />
            <ChampTexte
              libelle="Abonnés"
              inputMode="numeric"
              value={nouveauNombre}
              onChange={(e) => setNouveauNombre(e.target.value)}
              placeholder="1250"
            />
            <button type="button" className="bouton bouton-principal" onClick={ajouter} disabled={enCours}>
              Ajouter
            </button>
          </div>
        </Carte>

        {historique.enCours && !historique.donnees && <Chargement />}

        {releves.length === 0 ? (
          <Vide>Aucun relevé pour l'instant.</Vide>
        ) : (
          <table className="tableau">
            <thead>
              <tr>
                <th>Date</th>
                <th className="text-right">Abonnés</th>
                <th className="text-right">Évolution</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {releves.map((r, index) => {
                // Les releves sont tries du plus recent au plus ancien.
                const precedent = releves[index + 1];
                const ecart = precedent ? r.abonnes - precedent.abonnes : null;
                return (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">{date(r.date)}</td>
                    <td className="nombres text-right font-medium">{nombre(r.abonnes)}</td>
                    <td className="nombres text-right">
                      {ecart === null ? (
                        '—'
                      ) : (
                        <span
                          className={
                            ecart > 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : ecart < 0
                                ? 'text-red-700 dark:text-red-400'
                                : ''
                          }
                        >
                          {ecart > 0 ? '+' : ''}
                          {nombre(ecart)}
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="bouton bouton-danger !min-h-0 !px-2.5 !py-1 text-xs"
                        onClick={() => supprimerReleve(r.id)}
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Modale>
  );
}
