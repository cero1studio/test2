// Etiquetas de apariencia y estilo para filtrar. Describen a personas adultas:
// no se admiten etiquetas que aludan a minoría de edad o apariencia infantil.
export const TAG_GROUPS = [
  { group: 'Estilo', tags: [['tatuajes', 'Tatuada'], ['piercings', 'Piercings'], ['gotica', 'Gótica / alternativa'], ['elegante', 'Elegante'], ['deportiva', 'Fitness'], ['gafas', 'Gafas']] },
  { group: 'Cuerpo', tags: [['bajita', 'Bajita'], ['alta', 'Alta'], ['delgada', 'Delgada'], ['curvy', 'Curvy'], ['natural', 'Natural']] },
  { group: 'Cabello', tags: [['rubia', 'Rubia'], ['morena', 'Morena'], ['pelirroja', 'Pelirroja'], ['color', 'Cabello de color'], ['rizada', 'Rizada']] },
  { group: 'Personalidad', tags: [['conversadora', 'Conversadora'], ['risuena', 'Risueña'], ['timida', 'Tímida'], ['extrovertida', 'Extrovertida']] },
] as const

export const TAGS: { key: string; label: string }[] = TAG_GROUPS.flatMap((g) => g.tags.map(([key, label]) => ({ key, label })))
export const tagLabel = (key: string) => TAGS.find((t) => t.key === key)?.label ?? key
export const isTag = (key: unknown): key is string => TAGS.some((t) => t.key === key)
