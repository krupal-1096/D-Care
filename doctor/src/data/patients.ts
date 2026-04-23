import { Patient } from "../types";

const swatches = ["#def7e4", "#b8ecc6", "#9adabf", "#8ddfa5", "#5ed483", "#35c96b", "#28a555"];

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const avatarPlaceholder = (name: string) => {
  const initials = getInitials(name);
  const shade = swatches[(name.length + initials.length) % swatches.length];
  const accent = swatches[(name.length * 3) % swatches.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="${name} avatar"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${shade}"/><stop offset="100%" stop-color="${accent}"/></linearGradient></defs><rect width="160" height="160" rx="32" fill="${shade}" /><circle cx="120" cy="36" r="32" fill="${accent}" opacity="0.35"/><circle cx="36" cy="124" r="22" fill="${accent}" opacity="0.4"/><rect x="14" y="14" width="132" height="132" rx="28" fill="url(#g)" opacity="0.35"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#0d1b2a">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const casePlaceholder = (title: string, accent: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" role="img" aria-label="${title}"><defs><linearGradient id="c" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${accent}" stop-opacity="0.95"/><stop offset="100%" stop-color="#f1fcf4" stop-opacity="0.9"/></linearGradient></defs><rect width="640" height="480" fill="#f6fbf7"/><rect width="640" height="480" fill="url(#c)" opacity="0.65"/><circle cx="520" cy="120" r="140" fill="${accent}" opacity="0.18"/><circle cx="140" cy="340" r="120" fill="${accent}" opacity="0.18"/><rect x="48" y="80" width="260" height="28" rx="14" fill="#0d1b2a" opacity="0.12"/><rect x="48" y="132" width="220" height="18" rx="9" fill="#0d1b2a" opacity="0.08"/><path d="M80 280c40-62 132-62 172 0s92 62 132 0 132-62 172 0" stroke="#0d1b2a" stroke-width="6" stroke-opacity="0.06" fill="none"/><text x="48" y="360" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#1f8244" opacity="0.85">${title}</text><text x="48" y="392" font-family="Arial, sans-serif" font-size="14" fill="#0d1b2a" opacity="0.6">Synthetic clinical placeholder</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const patientSeed: Patient[] = [
  {
    id: "p-01",
    name: "Aarav Sharma",
    age: 32,
    email: "aarav.sharma@clinic.in",
    photo: avatarPlaceholder("Aarav Sharma"),
    diseaseImages: [
      casePlaceholder("Eczema flare - left forearm skin sample", swatches[0]),
      casePlaceholder("Eczema flare - right hand dorsal skin sample", swatches[1]),
      casePlaceholder("Seborrheic dermatitis - scalp parietal skin sample", swatches[2]),
      casePlaceholder("Hyperpigmentation - lower back skin sample", swatches[3]),
      casePlaceholder("Eczema flare - left calf skin sample", swatches[4]),
      casePlaceholder("Seborrheic dermatitis - behind ear skin sample", swatches[5]),
      casePlaceholder("Hyperpigmentation - collarbone skin sample", swatches[6]),
      casePlaceholder("Eczema flare - upper arm extensor skin sample", swatches[1])
    ],
    diseaseImageLabels: [
      "Eczema flare - left forearm skin sample",
      "Eczema flare - right hand dorsal skin sample",
      "Seborrheic dermatitis - scalp parietal skin sample",
      "Hyperpigmentation - lower back skin sample",
      "Eczema flare - left calf skin sample",
      "Seborrheic dermatitis - behind ear skin sample",
      "Hyperpigmentation - collarbone skin sample",
      "Eczema flare - upper arm extensor skin sample"
    ],
    diseases: [
      { id: "d-1", name: "Eczema flare", severity: 32, notes: "Itch improving with emollients." },
      { id: "d-2", name: "Seborrheic dermatitis", severity: 26, notes: "Mild scalp scaling." },
      { id: "d-3", name: "Hyperpigmentation", severity: 18, notes: "Fading under sunscreen." }
    ],
    registeredDate: "2025-01-05T00:00:00.000Z",
    verified: false
  },
  {
    id: "p-02",
    name: "Meera Iyer",
    age: 41,
    email: "meera.iyer@clinic.in",
    photo: avatarPlaceholder("Meera Iyer"),
    diseaseImages: [
      casePlaceholder("Contact dermatitis - left elbow plaque skin sample", swatches[3]),
      casePlaceholder("Psoriasis plaques - scalp crown skin sample", swatches[4]),
      casePlaceholder("Post-inflammatory erythema - upper chest skin sample", swatches[5]),
      casePlaceholder("Psoriasis plaques - knee skin sample", swatches[6]),
      casePlaceholder("Contact dermatitis - dorsal wrist skin sample", swatches[0]),
      casePlaceholder("Post-inflammatory erythema - left cheek skin sample", swatches[1]),
      casePlaceholder("Psoriasis plaques - lower back skin sample", swatches[2]),
      casePlaceholder("Contact dermatitis - right shoulder skin sample", swatches[4])
    ],
    diseaseImageLabels: [
      "Contact dermatitis - left elbow plaque skin sample",
      "Psoriasis plaques - scalp crown skin sample",
      "Post-inflammatory erythema - upper chest skin sample",
      "Psoriasis plaques - knee skin sample",
      "Contact dermatitis - dorsal wrist skin sample",
      "Post-inflammatory erythema - left cheek skin sample",
      "Psoriasis plaques - lower back skin sample",
      "Contact dermatitis - right shoulder skin sample"
    ],
    diseases: [
      { id: "d-1", name: "Contact dermatitis", severity: 44, notes: "Redness still active." },
      { id: "d-2", name: "Psoriasis plaques", severity: 58, notes: "Monitoring elbow scaling." },
      { id: "d-3", name: "Post-inflammatory erythema", severity: 34, notes: "Lightening slowly." }
    ],
    registeredDate: "2024-12-18T00:00:00.000Z",
    verified: false
  },
  {
    id: "p-03",
    name: "Kabir Singh",
    age: 29,
    email: "kabir.singh@clinic.in",
    photo: avatarPlaceholder("Kabir Singh"),
    diseaseImages: [
      casePlaceholder("Acne vulgaris - right cheek skin sample", swatches[6]),
      casePlaceholder("Acne vulgaris - neck side skin sample", swatches[1]),
      casePlaceholder("Scarring review - left thigh skin sample", swatches[2]),
      casePlaceholder("Folliculitis - upper back skin sample", swatches[3]),
      casePlaceholder("Acne vulgaris - forehead skin sample", swatches[4]),
      casePlaceholder("Scarring review - jawline skin sample", swatches[5]),
      casePlaceholder("Folliculitis - chest skin sample", swatches[0]),
      casePlaceholder("Acne vulgaris - chin skin sample", swatches[2])
    ],
    diseaseImageLabels: [
      "Acne vulgaris - right cheek skin sample",
      "Acne vulgaris - neck side skin sample",
      "Scarring review - left thigh skin sample",
      "Folliculitis - upper back skin sample",
      "Acne vulgaris - forehead skin sample",
      "Scarring review - jawline skin sample",
      "Folliculitis - chest skin sample",
      "Acne vulgaris - chin skin sample"
    ],
    diseases: [
      { id: "d-1", name: "Acne vulgaris", severity: 48, notes: "Occasional nodules remain." },
      { id: "d-2", name: "Folliculitis", severity: 26, notes: "Mostly resolved." },
      { id: "d-3", name: "Scarring review", severity: 22, notes: "Low hypertrophic risk." }
    ],
    registeredDate: "2025-02-02T00:00:00.000Z",
    verified: false
  },
  {
    id: "p-04",
    name: "Anika Patel",
    age: 36,
    email: "anika.patel@clinic.in",
    photo: avatarPlaceholder("Anika Patel"),
    diseaseImages: [
      casePlaceholder("Vitiligo patches - shoulder patch skin sample", swatches[0]),
      casePlaceholder("Vitiligo patches - upper arm flexor skin sample", swatches[3]),
      casePlaceholder("Melasma - left calf skin sample", swatches[4]),
      casePlaceholder("Vitiligo patches - neck lateral skin sample", swatches[5]),
      casePlaceholder("Melasma - cheekbone skin sample", swatches[6]),
      casePlaceholder("Barrier dryness - dorsal hand skin sample", swatches[1]),
      casePlaceholder("Vitiligo patches - ankle skin sample", swatches[2]),
      casePlaceholder("Barrier dryness - shin skin sample", swatches[0])
    ],
    diseaseImageLabels: [
      "Vitiligo patches - shoulder patch skin sample",
      "Vitiligo patches - upper arm flexor skin sample",
      "Melasma - left calf skin sample",
      "Vitiligo patches - neck lateral skin sample",
      "Melasma - cheekbone skin sample",
      "Barrier dryness - dorsal hand skin sample",
      "Vitiligo patches - ankle skin sample",
      "Barrier dryness - shin skin sample"
    ],
    diseases: [
      { id: "d-1", name: "Vitiligo patches", severity: 62, notes: "Edges stable this month." },
      { id: "d-2", name: "Melasma", severity: 38, notes: "Responding to topical." },
      { id: "d-3", name: "Barrier dryness", severity: 24, notes: "Improving hydration." }
    ],
    registeredDate: "2025-01-20T00:00:00.000Z",
    verified: false
  },
  {
    id: "p-05",
    name: "Rohan Mehta",
    age: 52,
    email: "rohan.mehta@clinic.in",
    photo: avatarPlaceholder("Rohan Mehta"),
    diseaseImages: [
      casePlaceholder("Chronic psoriasis - knee plaque skin sample", swatches[5]),
      casePlaceholder("Seborrheic dermatitis - scalp temple skin sample", swatches[6]),
      casePlaceholder("Nummular eczema - right shin skin sample", swatches[2]),
      casePlaceholder("Chronic psoriasis - elbow extensor skin sample", swatches[3]),
      casePlaceholder("Seborrheic dermatitis - behind ear skin sample", swatches[4]),
      casePlaceholder("Nummular eczema - left calf skin sample", swatches[0]),
      casePlaceholder("Chronic psoriasis - lower back skin sample", swatches[1]),
      casePlaceholder("Seborrheic dermatitis - scalp occipital skin sample", swatches[2])
    ],
    diseaseImageLabels: [
      "Chronic psoriasis - knee plaque skin sample",
      "Seborrheic dermatitis - scalp temple skin sample",
      "Nummular eczema - right shin skin sample",
      "Chronic psoriasis - elbow extensor skin sample",
      "Seborrheic dermatitis - behind ear skin sample",
      "Nummular eczema - left calf skin sample",
      "Chronic psoriasis - lower back skin sample",
      "Seborrheic dermatitis - scalp occipital skin sample"
    ],
    diseases: [
      { id: "d-1", name: "Chronic psoriasis", severity: 55, notes: "Thick plaques on knees." },
      { id: "d-2", name: "Seborrheic dermatitis", severity: 34, notes: "Mild scalp itch." },
      { id: "d-3", name: "Nummular eczema", severity: 30, notes: "Requires moisturizers." }
    ],
    registeredDate: "2024-11-28T00:00:00.000Z",
    verified: false
  },
  {
    id: "p-06",
    name: "Leela Narayan",
    age: 64,
    email: "leela.narayan@clinic.in",
    photo: avatarPlaceholder("Leela Narayan"),
    diseaseImages: [
      casePlaceholder("Lichen planus - forearm lichenoid skin sample", swatches[1]),
      casePlaceholder("Erythema - lower leg skin sample", swatches[4]),
      casePlaceholder("Dryness - ankle skin sample", swatches[0]),
      casePlaceholder("Lichen planus - dorsal hand skin sample", swatches[2]),
      casePlaceholder("Erythema - upper arm skin sample", swatches[3]),
      casePlaceholder("Dryness - shin skin sample", swatches[5]),
      casePlaceholder("Lichen planus - wrist flexor skin sample", swatches[6]),
      casePlaceholder("Dryness - elbow flexor skin sample", swatches[1])
    ],
    diseaseImageLabels: [
      "Lichen planus - forearm lichenoid skin sample",
      "Erythema - lower leg skin sample",
      "Dryness - ankle skin sample",
      "Lichen planus - dorsal hand skin sample",
      "Erythema - upper arm skin sample",
      "Dryness - shin skin sample",
      "Lichen planus - wrist flexor skin sample",
      "Dryness - elbow flexor skin sample"
    ],
    diseases: [
      { id: "d-1", name: "Lichen planus", severity: 46, notes: "Hyperpigmented lesions." },
      { id: "d-2", name: "Erythema", severity: 28, notes: "Cooling compress helping." },
      { id: "d-3", name: "Dryness", severity: 24, notes: "Night cream effective." }
    ],
    registeredDate: "2024-12-05T00:00:00.000Z",
    verified: false
  },
  {
    id: "p-07",
    name: "Devanshi Kulkarni",
    age: 27,
    email: "devanshi.kulkarni@clinic.in",
    photo: avatarPlaceholder("Devanshi Kulkarni"),
    diseaseImages: [
      casePlaceholder("Inflammatory acne - right jawline skin sample", swatches[3]),
      casePlaceholder("Post-inflammatory erythema - left cheek skin sample", swatches[5]),
      casePlaceholder("Mild rosacea - nose bridge skin sample", swatches[6]),
      casePlaceholder("Inflammatory acne - chin skin sample", swatches[0]),
      casePlaceholder("Post-inflammatory erythema - forehead skin sample", swatches[1]),
      casePlaceholder("Mild rosacea - cheek flushing skin sample", swatches[2]),
      casePlaceholder("Inflammatory acne - temple skin sample", swatches[4]),
      casePlaceholder("Post-inflammatory erythema - jawline skin sample", swatches[3])
    ],
    diseaseImageLabels: [
      "Inflammatory acne - right jawline skin sample",
      "Post-inflammatory erythema - left cheek skin sample",
      "Mild rosacea - nose bridge skin sample",
      "Inflammatory acne - chin skin sample",
      "Post-inflammatory erythema - forehead skin sample",
      "Mild rosacea - cheek flushing skin sample",
      "Inflammatory acne - temple skin sample",
      "Post-inflammatory erythema - jawline skin sample"
    ],
    diseases: [
      { id: "d-1", name: "Inflammatory acne", severity: 42, notes: "Responding to retinoid." },
      { id: "d-2", name: "Post-inflammatory erythema", severity: 36, notes: "Slow fading." },
      { id: "d-3", name: "Mild rosacea", severity: 22, notes: "Triggers identified." }
    ],
    registeredDate: "2025-02-10T00:00:00.000Z",
    verified: false
  },
  {
    id: "p-08",
    name: "Om Prakash",
    age: 71,
    email: "om.prakash@clinic.in",
    photo: avatarPlaceholder("Om Prakash"),
    diseaseImages: [
      casePlaceholder("Venous ulcer - lower leg perimeter skin sample", swatches[4]),
      casePlaceholder("Dry skin - mid shin skin sample", swatches[2]),
      casePlaceholder("Venous ulcer - heel edge skin sample", swatches[1]),
      casePlaceholder("Cellulitis - calf lateral skin sample", swatches[0]),
      casePlaceholder("Dry skin - ankle skin sample", swatches[3]),
      casePlaceholder("Venous ulcer - pretibial skin sample", swatches[5]),
      casePlaceholder("Cellulitis - foot dorsum skin sample", swatches[6]),
      casePlaceholder("Dry skin - knee skin sample", swatches[2])
    ],
    diseaseImageLabels: [
      "Venous ulcer - lower leg perimeter skin sample",
      "Dry skin - mid shin skin sample",
      "Venous ulcer - heel edge skin sample",
      "Cellulitis - calf lateral skin sample",
      "Dry skin - ankle skin sample",
      "Venous ulcer - pretibial skin sample",
      "Cellulitis - foot dorsum skin sample",
      "Dry skin - knee skin sample"
    ],
    diseases: [
      { id: "d-1", name: "Venous ulcer", severity: 64, notes: "Compression ongoing." },
      { id: "d-2", name: "Cellulitis", severity: 30, notes: "Resolved; monitor relapse." },
      { id: "d-3", name: "Dry skin", severity: 26, notes: "Requires emollients twice daily." }
    ],
    registeredDate: "2024-10-15T00:00:00.000Z",
    verified: false
  },
  {
    id: "p-09",
    name: "Nandini Reddy",
    age: 34,
    email: "nandini.reddy@clinic.in",
    photo: avatarPlaceholder("Nandini Reddy"),
    diseaseImages: [
      casePlaceholder("Atopic dermatitis - inner elbow skin sample", swatches[0]),
      casePlaceholder("Xerosis - dorsal hand skin sample", swatches[3]),
      casePlaceholder("Pigmentation - upper back skin sample", swatches[6]),
      casePlaceholder("Atopic dermatitis - neck fold skin sample", swatches[4]),
      casePlaceholder("Xerosis - shin skin sample", swatches[5]),
      casePlaceholder("Pigmentation - cheek skin sample", swatches[1]),
      casePlaceholder("Atopic dermatitis - wrist skin sample", swatches[2]),
      casePlaceholder("Xerosis - ankle skin sample", swatches[0])
    ],
    diseaseImageLabels: [
      "Atopic dermatitis - inner elbow skin sample",
      "Xerosis - dorsal hand skin sample",
      "Pigmentation - upper back skin sample",
      "Atopic dermatitis - neck fold skin sample",
      "Xerosis - shin skin sample",
      "Pigmentation - cheek skin sample",
      "Atopic dermatitis - wrist skin sample",
      "Xerosis - ankle skin sample"
    ],
    diseases: [
      { id: "d-1", name: "Atopic dermatitis", severity: 38, notes: "Seasonal flares noted." },
      { id: "d-2", name: "Xerosis", severity: 34, notes: "Responds to ceramides." },
      { id: "d-3", name: "Pigmentation", severity: 20, notes: "Sunscreen adherence good." }
    ],
    registeredDate: "2025-01-30T00:00:00.000Z",
    verified: false
  },
  {
    id: "p-10",
    name: "Kamla Devi",
    age: 75,
    email: "kamla.devi@clinic.in",
    photo: avatarPlaceholder("Kamla Devi"),
    diseaseImages: [
      casePlaceholder("Pruritus - forearm itch site sample", swatches[2]),
      casePlaceholder("Eczema - lower leg dryness sample", swatches[5]),
      casePlaceholder("Keratosis - shoulder skin sample", swatches[4]),
      casePlaceholder("Pruritus - dorsal hand skin sample", swatches[0]),
      casePlaceholder("Eczema - knee skin sample", swatches[1]),
      casePlaceholder("Keratosis - forearm skin sample", swatches[3]),
      casePlaceholder("Pruritus - shin skin sample", swatches[6]),
      casePlaceholder("Eczema - ankle skin sample", swatches[5])
    ],
    diseaseImageLabels: [
      "Pruritus - forearm itch site sample",
      "Eczema - lower leg dryness sample",
      "Keratosis - shoulder skin sample",
      "Pruritus - dorsal hand skin sample",
      "Eczema - knee skin sample",
      "Keratosis - forearm skin sample",
      "Pruritus - shin skin sample",
      "Eczema - ankle skin sample"
    ],
    diseases: [
      { id: "d-1", name: "Pruritus", severity: 40, notes: "Likely xerosis driven." },
      { id: "d-2", name: "Eczema", severity: 36, notes: "Night itch persists." },
      { id: "d-3", name: "Keratosis", severity: 28, notes: "Monitor lesions monthly." }
    ],
    registeredDate: "2024-09-22T00:00:00.000Z",
    verified: false
  }
];
