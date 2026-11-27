import type { LangCode } from '@/types'

export const LANGUAGES: Record<LangCode, { name: string; short: string; locale: string; cjk: boolean }> = {
  en: { name: 'English', short: 'EN', locale: 'en-US', cjk: false },
  de: { name: 'German', short: 'DE', locale: 'de-DE', cjk: false },
  fr: { name: 'French', short: 'FR', locale: 'fr-FR', cjk: false },
  es: { name: 'Spanish', short: 'ES', locale: 'es-ES', cjk: false },
  ja: { name: 'Japanese', short: 'JA', locale: 'ja-JP', cjk: true },
  ko: { name: 'Korean', short: 'KO', locale: 'ko-KR', cjk: true },
  it: { name: 'Italian', short: 'IT', locale: 'it-IT', cjk: false },
  pt: { name: 'Portuguese', short: 'PT', locale: 'pt-BR', cjk: false },
  zh: { name: 'Chinese (Simplified)', short: 'ZH', locale: 'zh-CN', cjk: true },
}

export const TARGET_LANGS: LangCode[] = ['de', 'fr', 'es', 'ja', 'ko', 'it', 'pt', 'zh']

export const langName = (code: LangCode) => LANGUAGES[code]?.name ?? code
export const langShort = (code: LangCode) => LANGUAGES[code]?.short ?? code.toUpperCase()
export const pairLabel = (src: LangCode, tgt: LangCode) => `${langShort(src)} → ${langShort(tgt)}`
