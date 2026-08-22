import { ContentShield } from "@/components/content-shield";
import { ProtectedText } from "@/components/protected-text";
import type { ConceptMapNode } from "@/lib/data/academic";

const branchStyles = [
  "border-brand/25 bg-blue-50/70 text-brand",
  "border-success/25 bg-success-soft/60 text-success",
  "border-amber-300/60 bg-amber-50 text-amber-900",
  "border-violet-300/60 bg-violet-50 text-violet-900",
];

export function ConceptMap({
  description,
  nodes,
  title,
}: {
  description: string;
  nodes: ConceptMapNode[];
  title: string;
}) {
  const roots = nodes.filter(({ parentId }) => !parentId);

  function childrenOf(parentId: string) {
    return nodes.filter((node) => node.parentId === parentId);
  }

  return (
    <section>
      <ContentShield>
        <div className="overflow-hidden rounded-3xl border border-brand/15 bg-[radial-gradient(circle_at_top_right,rgba(220,233,226,0.85),transparent_36%),linear-gradient(135deg,#fffdf9,#f7f5f0)] p-5 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-success">
            Mapa conceptual
          </p>
          <h2 className="mt-2 text-3xl text-brand">{title}</h2>
          <ProtectedText as="p" className="mt-3 max-w-3xl leading-7 text-muted">
            {description}
          </ProtectedText>

          <div className="mt-8 space-y-8" aria-label={title}>
            {roots.map((root) => {
              const branches = childrenOf(root.id);
              return (
                <article key={root.id}>
                  <div className="relative mx-auto max-w-2xl rounded-2xl bg-brand px-6 py-5 text-center text-white shadow-[0_12px_30px_rgba(36,59,100,0.16)]">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                      Idea central
                    </span>
                    <ProtectedText as="h3" className="text-lg font-semibold">
                      {root.label}
                    </ProtectedText>
                    {root.description ? (
                      <ProtectedText as="p" className="mt-2 text-sm leading-6 text-white/75">
                        {root.description}
                      </ProtectedText>
                    ) : null}
                  </div>

                  {branches.length ? (
                    <div className="relative mt-8 grid gap-5 before:absolute before:-top-8 before:left-1/2 before:h-8 before:border-l-2 before:border-dashed before:border-brand/25 md:grid-cols-2">
                      {branches.map((child, index) => {
                        const leaves = childrenOf(child.id);
                        return (
                          <section
                            className={`relative rounded-2xl border p-5 shadow-sm before:absolute before:-top-5 before:left-1/2 before:h-5 before:border-l-2 before:border-dashed before:border-brand/25 ${branchStyles[index % branchStyles.length]}`}
                            key={child.id}
                          >
                            <div className="flex items-start gap-3">
                              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/80 text-sm font-bold">
                                {index + 1}
                              </span>
                              <div>
                                <ProtectedText as="h4" className="font-semibold">
                                  {child.label}
                                </ProtectedText>
                                {child.description ? (
                                  <ProtectedText
                                    as="p"
                                    className="mt-1 text-sm leading-6 text-muted"
                                  >
                                    {child.description}
                                  </ProtectedText>
                                ) : null}
                              </div>
                            </div>
                            {leaves.length ? (
                              <ul className="mt-4 space-y-2 border-t border-current/10 pt-4">
                                {leaves.map((leaf) => (
                                  <li
                                    className="rounded-xl bg-white/75 px-4 py-3 text-sm text-foreground"
                                    key={leaf.id}
                                  >
                                    <ProtectedText as="span" className="font-semibold">
                                      {leaf.label}
                                    </ProtectedText>
                                    {leaf.description ? (
                                      <ProtectedText
                                        as="span"
                                        className="mt-1 block leading-5 text-muted"
                                      >
                                        {leaf.description}
                                      </ProtectedText>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </section>
                        );
                      })}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </ContentShield>
    </section>
  );
}
