export function LegalPage({ title, sections }: { title: string; sections: [string, string[]][] }) {
  return (
    <article className="container-page max-w-3xl space-y-8 py-12">
      <header className="space-y-4">
        <p className="eyebrow">Legal</p>
        <h1 className="display text-5xl">{title}</h1>
        <p className="rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">
          Borrador de trabajo. Debe ser revisado y completado por un abogado antes de publicar el sitio (razón social,
          NIT, domicilio, canal de atención y jurisdicción).
        </p>
      </header>
      {sections.map(([h, ps], i) => (
        <section key={h} className="space-y-3">
          <h2 className="h-section">{i + 1}. {h}</h2>
          {ps.map((p) => <p key={p} className="text-sm leading-relaxed text-cream/80">{p}</p>)}
        </section>
      ))}
    </article>
  )
}
