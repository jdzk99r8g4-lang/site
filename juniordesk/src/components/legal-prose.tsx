/**
 * Mise en forme des pages légales.
 *
 * `Todo` encadre les champs qui ne peuvent pas être remplis depuis un clavier :
 * identité juridique, hébergeur, durées contractuelles. Ils sont rendus
 * VISIBLES et non discrets, pour qu'il soit impossible de publier le site en
 * croyant ces pages terminées. Des coordonnées d'entreprise inventées
 * n'auraient aucune valeur juridique et exposeraient l'éditeur.
 */

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-[15px] font-bold">{title}</h2>
      <div className="mt-2 space-y-3 text-sm text-muted">{children}</div>
    </section>
  );
}

export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-warn-bg px-1.5 py-0.5 font-semibold text-warn">
      [À COMPLÉTER : {children}]
    </mark>
  );
}

export function ToCheck({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-amber-bg px-1.5 py-0.5 font-semibold text-amber">
      [À CONFIRMER : {children}]
    </mark>
  );
}
