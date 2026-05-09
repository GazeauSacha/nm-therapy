import { useEffect, useReducer } from 'react';
import { useTranslation } from 'react-i18next';

const _store: Record<string, string> = {};
const _subs = new Set<() => void>();

export function populateDbContent(data: Record<string, string>): void {
  Object.assign(_store, data);
  _subs.forEach(fn => fn());
}

/**
 * Returns a content getter `c(key, staticDefault)` that resolves with priority:
 * 1. DB content (from site_content table, NL variant first when lang=nl)
 * 2. i18n translation (once ready)
 * 3. staticDefault (shown immediately, French hardcoded — for SEO first paint)
 *
 * Call useContent() once per component; use the returned `c` anywhere including .map().
 */
export function useContent() {
  const { t, ready, i18n } = useTranslation();
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    _subs.add(rerender);
    return () => { _subs.delete(rerender); };
  }, []);

  function c(key: string, staticDefault: string): string {
    if (i18n.language === 'nl') {
      const nlVal = _store[`${key}_nl`];
      if (nlVal?.trim()) return nlVal;
    }
    const dbVal = _store[key];
    if (dbVal?.trim()) return dbVal;

    if (ready) {
      const val = t(key, { defaultValue: '\0' });
      if (val !== '\0') return val;
    }

    return staticDefault;
  }

  return { c, i18n };
}
