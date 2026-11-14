import { UNAVAILABLE } from '@/lib/form-route';

/**
 * Message affiché quand une route de formulaire a échoué côté serveur.
 *
 * Il ne dit pas ce qui a cassé — le visiteur n'y peut rien et n'a pas à le
 * savoir — mais il dit ce qui compte pour lui : rien n'a été enregistré, ce
 * n'est pas une erreur de saisie, et réessayer plus tard a un sens.
 */
export function ServiceUnavailable({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  if (params['erreur'] !== UNAVAILABLE) return null;

  return (
    <p role="alert" className="mt-6 rounded-card border border-warn/40 bg-warn-bg p-4 text-sm">
      <strong className="font-semibold text-warn">Le service est momentanément indisponible.</strong>{' '}
      Rien n’a été enregistré, et ce n’est pas une erreur de votre part. Réessayez dans
      quelques minutes.
    </p>
  );
}
