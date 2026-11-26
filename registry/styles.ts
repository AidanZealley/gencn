// Copies each built item into every shadcn style folder, so a namespace URL
// with {style} (`.../r/{style}/{name}.json`) resolves for any project.
// Items with `meta.library` only go to that library's styles.
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'

const out = '../apps/playground/public/r'
const looks = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea']
// React Aria isn't published until its blocks are checked against shadcn's
// React Aria components.
const libraries = ['base', 'radix']
const styles = [
  ...libraries.flatMap((library) =>
    looks.map((look) => ({ style: `${library}-${look}`, library })),
  ),
  // Styles from before the library prefix; both are Radix.
  { style: 'new-york', library: 'radix' },
  { style: 'default', library: 'radix' },
]

type Item = { name: string; meta?: { library?: string } }
const { items }: { items: Item[] } = JSON.parse(
  readFileSync('registry.json', 'utf8'),
)

for (const { style, library } of styles) {
  mkdirSync(`${out}/${style}`, { recursive: true })
  for (const { name, meta } of items) {
    if (meta?.library && meta.library !== library) continue
    copyFileSync(`${out}/${name}.json`, `${out}/${style}/${name}.json`)
  }
}
console.log(`Copied ${items.length} items into ${styles.length} styles.`)
