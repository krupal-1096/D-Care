const swatches = ["#def7e4", "#b8ecc6", "#9adabf", "#8ddfa5", "#5ed483", "#35c96b", "#28a555"];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const avatarPlaceholder = (name: string) => {
  const init = initials(name || "Patient");
  const shade = swatches[(name.length + init.length) % swatches.length];
  const accent = swatches[(name.length * 3) % swatches.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="${name} avatar"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${shade}"/><stop offset="100%" stop-color="${accent}"/></linearGradient></defs><rect width="160" height="160" rx="32" fill="${shade}" /><circle cx="120" cy="36" r="32" fill="${accent}" opacity="0.35"/><circle cx="36" cy="124" r="22" fill="${accent}" opacity="0.4"/><rect x="14" y="14" width="132" height="132" rx="28" fill="url(#g)" opacity="0.35"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#0d1b2a">${init}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const casePlaceholder = (title: string, accent = "#5ed483") => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" role="img" aria-label="${title}"><defs><linearGradient id="c" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${accent}" stop-opacity="0.95"/><stop offset="100%" stop-color="#f1fcf4" stop-opacity="0.9"/></linearGradient></defs><rect width="640" height="480" fill="#f6fbf7"/><rect width="640" height="480" fill="url(#c)" opacity="0.65"/><circle cx="520" cy="120" r="140" fill="${accent}" opacity="0.18"/><circle cx="140" cy="340" r="120" fill="${accent}" opacity="0.18"/><rect x="48" y="80" width="260" height="28" rx="14" fill="#0d1b2a" opacity="0.12"/><rect x="48" y="132" width="220" height="18" rx="9" fill="#0d1b2a" opacity="0.08"/><path d="M80 280c40-62 132-62 172 0s92 62 132 0 132-62 172 0" stroke="#0d1b2a" stroke-width="6" stroke-opacity="0.06" fill="none"/><text x="48" y="360" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#1f8244" opacity="0.85">${title}</text><text x="48" y="392" font-family="Arial, sans-serif" font-size="14" fill="#0d1b2a" opacity="0.6">Synthetic clinical placeholder</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
