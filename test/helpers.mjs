import { readFile } from 'node:fs/promises'

export async function fixture() {
  return JSON.parse(await readFile(new URL('../examples/contained.json', import.meta.url), 'utf8'))
}

export const json = value => JSON.stringify(value)
