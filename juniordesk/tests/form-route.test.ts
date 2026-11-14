import { describe, it, expect, vi } from 'vitest';
import { guarded, UNAVAILABLE } from '@/lib/form-route';

const requete = () => new Request('https://juniordesk.fr/api/compte/connexion', { method: 'POST' });

describe('repli des routes de formulaire', () => {
  it('laisse passer une réponse normale sans y toucher', async () => {
    const reponse = new Response(null, { status: 303, headers: { location: '/mon-espace' } });
    const route = guarded('/connexion', async () => reponse);
    expect(await route(requete())).toBe(reponse);
  });

  it('ramène le visiteur au formulaire quand la route casse', async () => {
    /*
     * Constaté en lançant le site sans ALERTS_SECRET : la route levait une
     * exception et le visiteur recevait la page 500 brute du serveur, à
     * l'adresse /api/compte/connexion, sans lien pour revenir.
     */
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    const route = guarded('/connexion', async () => {
      throw new Error('magasin injoignable');
    });
    const res = await route(requete());
    silence.mockRestore();

    expect(res.status).toBe(303);
    const cible = new URL(res.headers.get('location') ?? '');
    expect(cible.pathname).toBe('/connexion');
    expect(cible.searchParams.get('erreur')).toBe(UNAVAILABLE);
  });

  it('journalise l’erreur : le repli ne doit pas la cacher à l’exploitant', async () => {
    const journal = vi.spyOn(console, 'error').mockImplementation(() => {});
    const erreur = new Error('secret absent');
    await guarded('/alertes', async () => {
      throw erreur;
    })(requete());

    expect(journal).toHaveBeenCalledTimes(1);
    expect(journal.mock.calls[0]).toContain(erreur);
    journal.mockRestore();
  });

  it('ne laisse rien fuir de l’erreur dans l’adresse', async () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await guarded('/connexion', async () => {
      throw new Error('mot-de-passe-de-la-base=hunter2');
    })(requete());
    silence.mockRestore();
    expect(res.headers.get('location')).not.toContain('hunter2');
  });
});
