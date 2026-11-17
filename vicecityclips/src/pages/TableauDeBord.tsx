import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api';
import { useDonnees } from '../lib/etat';
import { Carte, Chargement, Indicateur, Jauge, Message, Vide, useEstSombre } from '../composants/ui';
import { dollars, euros, delai, mois, moisCourt, nombre, pourcent } from '../lib/format';
import { arrondi2 } from '../../shared/calculs';
import type { LigneMensuelle } from '../../shared/types';

type Mesure = 'clips' | 'vues' | 'gains' | 'recu';

const MESURES: Array<{ cle: Mesure; libelle: string; couleur: string }> = [
  { cle: 'clips', libelle: 'Clips publiés', couleur: '#0ea5e9' },
  { cle: 'vues', libelle: 'Vues comptées', couleur: '#8b5cf6' },
  { cle: 'gains', libelle: 'Gains nets approuvés ($)', couleur: '#10b981' },
  { cle: 'recu', libelle: 'Reçu (€)', couleur: '#f59e0b' },
];

export default function TableauDeBord() {
  const { donnees, erreur, enCours } = useDonnees(() => api.tableauDeBord());

  if (enCours && !donnees) return <Chargement />;
  if (erreur) return <Message ton="erreur">{erreur}</Message>;
  if (!donnees) return null;

  const t = donnees;

  return (
    <div className="space-y-4">
      {t.clipsPublies === 0 && (
        <Message ton="info">
          Aucun clip enregistré pour l'instant. Les lignes marquées EXEMPLE de votre fichier Excel
          n'ont pas été importées, c'est voulu : le suivi démarre à zéro. Ajoutez votre premier clip
          depuis l'écran « Clips » ou « Minuteur ».
        </Message>
      )}

      {/* Objectif mensuel */}
      <Carte titre={`Objectif de ${mois(t.moisCourant)}`}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="nombres text-2xl font-semibold tracking-tight">{euros(t.recuMoisCourantEur)}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            sur {euros(t.objectifMensuelEur)}
          </p>
        </div>
        <div className="mt-3">
          <Jauge
            part={t.partObjectifMoisCourant}
            ton={t.partObjectifMoisCourant >= 1 ? 'emerald' : 'sky'}
            libelle={`${pourcent(t.partObjectifMoisCourant, 1)} de l'objectif mensuel · ${euros(
              Math.max(0, t.objectifMensuelEur - t.recuMoisCourantEur),
            )} restants`}
          />
        </div>
      </Carte>

      {/* Production */}
      <div>
        <h2 className="mb-2 px-1">Production</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Indicateur libelle="Clips publiés" valeur={nombre(t.clipsPublies)} />
          <Indicateur
            libelle="Approuvés ou payés"
            valeur={nombre(t.clipsApprouvesOuPayes)}
            ton={t.clipsApprouvesOuPayes > 0 ? 'bon' : 'neutre'}
          />
          <Indicateur
            libelle="En attente"
            valeur={nombre(t.clipsEnAttente)}
            ton={t.clipsEnAttente > 0 ? 'attention' : 'neutre'}
          />
          <Indicateur
            libelle="Refusés"
            valeur={nombre(t.clipsRefuses)}
            ton={t.clipsRefuses > 0 ? 'mauvais' : 'neutre'}
          />
          <Indicateur
            libelle="Taux d'approbation"
            valeur={t.tauxApprobation === null ? '—' : pourcent(t.tauxApprobation)}
            precision={
              t.tauxApprobation === null ? 'Aucun clip encore approuvé ni refusé' : 'Approuvés et payés / tranchés'
            }
          />
          <Indicateur libelle="Vues comptées" valeur={nombre(t.vuesComptees)} />
          <Indicateur
            libelle="Délai moyen de soumission"
            valeur={delai(t.delaiMoyenSoumissionMin)}
            precision="À tenir sous 30 min"
            ton={
              t.delaiMoyenSoumissionMin === null
                ? 'neutre'
                : t.delaiMoyenSoumissionMin > 30
                  ? 'mauvais'
                  : t.delaiMoyenSoumissionMin > 20
                    ? 'attention'
                    : 'bon'
            }
          />
          <Indicateur
            libelle="Soumis après 30 min"
            valeur={nombre(t.clipsHorsDelai)}
            precision="Doit rester à 0"
            ton={t.clipsHorsDelai > 0 ? 'mauvais' : 'bon'}
          />
        </div>
      </div>

      {/* Argent */}
      <div>
        <h2 className="mb-2 px-1">Argent</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Indicateur
            libelle="Gain net estimé (approuvés ou payés)"
            valeur={dollars(t.gainNetEstimeApprouveUsd)}
            ton={t.gainNetEstimeApprouveUsd > 0 ? 'bon' : 'neutre'}
          />
          <Indicateur
            libelle="Gain net potentiel (en attente)"
            valeur={dollars(t.gainNetPotentielEnAttenteUsd)}
            precision="Si les clips en attente sont approuvés"
            ton={arrondi2(t.gainNetPotentielEnAttenteUsd) > 0 ? 'attention' : 'neutre'}
          />
          <Indicateur libelle="Paiements reçus nets" valeur={dollars(t.paiementsRecusNetUsd)} />
          <Indicateur libelle="Paiements reçus nets (€)" valeur={euros(t.paiementsRecusNetEur)} />
          <Indicateur
            libelle="Reste à recevoir estimé"
            valeur={dollars(t.resteARecevoirUsd)}
            precision="Estimé approuvé − déjà reçu"
            ton={arrondi2(t.resteARecevoirUsd) > 0 ? 'attention' : 'neutre'}
          />
          {t.clipsNonEstimes > 0 && (
            <Indicateur
              libelle="Clips non estimés"
              valeur={nombre(t.clipsNonEstimes)}
              precision="Campagnes Pool, Par post ou Forfait"
            />
          )}
        </div>
        <p className="mt-2 px-1 text-xs text-slate-500 dark:text-slate-500">
          Les gains sont estimés sur les campagnes CPM uniquement, frais de {pourcent(t.reglages.fraisCpm, 1)}{' '}
          déduits. Seul ce qui apparaît dans Content Rewards puis Whop fait foi.
        </p>
      </div>

      <GraphiqueMensuel lignes={t.suiviMensuel} objectifEur={t.objectifMensuelEur} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function GraphiqueMensuel({
  lignes,
  objectifEur,
}: {
  lignes: LigneMensuelle[];
  objectifEur: number;
}) {
  const [mesure, setMesure] = useState<Mesure>('clips');
  const sombre = useEstSombre();

  if (lignes.length === 0) return null;

  const donnees = lignes.map((l) => ({
    mois: l.mois,
    etiquette: moisCourt(l.mois),
    clips: l.clipsPublies,
    vues: l.vuesComptees,
    gains: Math.round(l.gainNetEstimeApprouveUsd * 100) / 100,
    recu: Math.round(l.recuNetEur * 100) / 100,
  }));

  const choisie = MESURES.find((m) => m.cle === mesure)!;
  const couleurTexte = sombre ? '#94a3b8' : '#64748b';
  const couleurGrille = sombre ? '#1e293b' : '#e2e8f0';

  const formaterValeur = (valeur: number): string => {
    switch (mesure) {
      case 'gains':
        return dollars(valeur);
      case 'recu':
        return euros(valeur);
      default:
        return nombre(valeur);
    }
  };

  return (
    <Carte titre="Mois par mois">
      <div className="mb-3 flex flex-wrap gap-2">
        {MESURES.map((m) => (
          <button
            key={m.cle}
            type="button"
            onClick={() => setMesure(m.cle)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              m.cle === mesure
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {m.libelle}
          </button>
        ))}
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={donnees} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={couleurGrille} vertical={false} />
            <XAxis
              dataKey="etiquette"
              tick={{ fill: couleurTexte, fontSize: 12 }}
              stroke={couleurGrille}
            />
            <YAxis
              tick={{ fill: couleurTexte, fontSize: 12 }}
              stroke={couleurGrille}
              width={56}
              allowDecimals={mesure === 'gains' || mesure === 'recu'}
              tickFormatter={(v: number) => nombre(v)}
            />
            <Tooltip
              formatter={(valeur) => [formaterValeur(Number(valeur)), choisie.libelle]}
              labelFormatter={(etiquette: string) => {
                const ligne = donnees.find((d) => d.etiquette === etiquette);
                return ligne ? mois(ligne.mois) : etiquette;
              }}
              contentStyle={{
                backgroundColor: sombre ? '#0f172a' : '#ffffff',
                border: `1px solid ${sombre ? '#1e293b' : '#e2e8f0'}`,
                borderRadius: 12,
                color: sombre ? '#e2e8f0' : '#0f172a',
                fontSize: 13,
              }}
            />
            <Bar dataKey={mesure} fill={choisie.couleur} radius={[6, 6, 0, 0]} maxBarSize={72} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 -mx-4 overflow-x-auto px-4">
        <table className="tableau">
          <thead>
            <tr>
              <th>Mois</th>
              <th className="text-right">Clips</th>
              <th className="text-right">Vues</th>
              <th className="text-right">Gains nets ($)</th>
              <th className="text-right">Reçu (€)</th>
              <th className="text-right">% objectif</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.mois}>
                <td className="whitespace-nowrap font-medium">{mois(l.mois)}</td>
                <td className="nombres text-right">{nombre(l.clipsPublies)}</td>
                <td className="nombres text-right">{nombre(l.vuesComptees)}</td>
                <td className="nombres text-right">{dollars(l.gainNetEstimeApprouveUsd)}</td>
                <td className="nombres text-right">{euros(l.recuNetEur)}</td>
                <td className="nombres text-right">
                  {l.partObjectif === null ? '—' : pourcent(l.partObjectif, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {objectifEur > 0 && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
          Le pourcentage compare les euros réellement reçus dans le mois à l'objectif de{' '}
          {euros(objectifEur)}.
        </p>
      )}
      {lignes.length === 1 && <Vide>Les autres mois apparaîtront au fil de vos clips et paiements.</Vide>}
    </Carte>
  );
}
