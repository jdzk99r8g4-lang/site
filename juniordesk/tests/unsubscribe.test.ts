import { describe, it, expect, vi } from 'vitest';

/**
 * Le bouton « Se désabonner » que Gmail et Outlook affichent eux-mêmes
 * appelle cette adresse en POST, sans ouvrir de page. Une page Next ne répond
 * qu'en GET : sans cette route, l'en-tête `List-Unsubscribe-Post` serait
 * annoncé et ne fonctionnerait pas — ce qui est pire que de ne rien annoncer,
 * parce que la messagerie constate l'échec et peut en tenir compte.
 */
const unsubscribe = vi.hoisted(() => vi.fn());
vi.mock('@/lib/alerts', () => ({ unsubscribe }));

const { POST, GET } = await import('@/app/api/alertes/desinscription/route');

function requete(url: string, method = 'POST'): Request {
  return new Request(url, { method });
}

describe('désinscription en un clic', () => {
  it('désinscrit et répond sans contenu', async () => {
    unsubscribe.mockResolvedValueOnce({ ok: true });
    const res = await POST(requete('https://juniordesk.fr/api/alertes/desinscription?jeton=abc'));
    expect(unsubscribe).toHaveBeenCalledWith('abc');
    expect(res.status).toBe(204);
  });

  it('répond 204 même sur un jeton déjà utilisé', async () => {
    /*
     * Le but de l'appelant est « que cette adresse ne reçoive plus rien ». Si
     * c'est déjà le cas, c'est un succès. Répondre en erreur ferait réessayer
     * la messagerie et pourrait lui faire croire le mécanisme cassé.
     */
    unsubscribe.mockResolvedValueOnce({ ok: false, error: 'Lien déjà utilisé.' });
    const res = await POST(requete('https://juniordesk.fr/api/alertes/desinscription?jeton=vieux'));
    expect(res.status).toBe(204);
  });

  it('refuse un appel sans jeton', async () => {
    const res = await POST(requete('https://juniordesk.fr/api/alertes/desinscription'));
    expect(res.status).toBe(400);
  });

  it('ne désinscrit personne sur une simple visite', async () => {
    /*
     * Certaines messageries et antivirus ouvrent les liens d'un message pour
     * les analyser. Un GET doit renvoyer vers la page lisible, jamais couper
     * l'alerte de quelqu'un au passage.
     */
    unsubscribe.mockClear();
    const res = await GET(requete('https://juniordesk.fr/api/alertes/desinscription?jeton=abc', 'GET'));
    expect(unsubscribe).not.toHaveBeenCalled();
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/alertes/desinscription');
    expect(res.headers.get('location')).toContain('jeton=abc');
  });
});
