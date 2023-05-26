export function svgIcon(path: string, size = 24) {
  return `<svg style="width:${size}px;height:${size}px" viewBox="0 0 ${size} ${size}">
    <path fill="currentColor" d="${path}" />
  </svg>`;
}
