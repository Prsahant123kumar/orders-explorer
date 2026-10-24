import { useEffect } from 'react';
import { buildSearch } from './codec';
import type { UrlState } from './codec';

export function useUrlSync(state: UrlState): void {
  const { groups, sort, pinned, selected } = state;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const search = buildSearch({ groups, sort, pinned, selected });
      const url = `${window.location.pathname}${search}${window.location.hash}`;
      window.history.replaceState(null, '', url);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [groups, sort, pinned, selected]);
}