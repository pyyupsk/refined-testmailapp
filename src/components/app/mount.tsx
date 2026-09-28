import { render } from 'solid-js/web';

import type { ParsedResult } from '@/lib/types';

import { App } from './app';

export function mountApp(
  container: HTMLElement,
  initial: ParsedResult,
  raw: string,
  rawData: unknown,
): () => void {
  return render(() => <App initial={initial} raw={raw} rawData={rawData} />, container);
}
