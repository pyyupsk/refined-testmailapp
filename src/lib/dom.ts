export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Partial<HTMLElementTagNameMap[K]> & { dataset?: Record<string, string> },
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  const { dataset, ...rest } = props ?? {};
  Object.assign(node, rest);
  if (dataset) Object.assign(node.dataset, dataset);
  if (children) node.append(...children);
  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

const ICONS = {
  check: 'M3.5 8.5l3 3 6-7',
  mail: 'M2.5 4.5h11v7h-11z M2.5 4.5l5.5 4 5.5-4',
  copy: 'M5.5 5.5h7v7h-7z M3.5 10.5v-7h7',
  info: 'M8 7.5v4 M8 5v.01 M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z',
  download: 'M8 2.5v8 M4.5 7l3.5 3.5L11.5 7 M3 13.5h10',
  back: 'M10 3.5L5.5 8l4.5 4.5',
  search: 'M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M10.5 10.5L14 14',
  close: 'M4 4l8 8 M12 4l-8 8',
  plane: 'M14 2L2 7.5l4.5 1.5L8 13.5 14 2z M6.5 9L14 2',
} as const;

export type IconName = keyof typeof ICONS;

export function icon(name: IconName): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('rtm-icon');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', ICONS[name]);
  svg.append(path);
  return svg;
}
