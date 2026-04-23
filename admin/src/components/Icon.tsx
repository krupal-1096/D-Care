import { SVGProps } from "react";

type IconName =
  | "menu"
  | "cases"
  | "doctors"
  | "moon"
  | "sun"
  | "check"
  | "upload"
  | "plus"
  | "minus"
  | "filter"
  | "google"
  | "logo"
  | "list"
  | "grid"
  | "image"
  | "shield"
  | "badge"
  | "lock"
  | "trash";

type Props = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function Icon({ name, size = 22, strokeWidth = 1.8, className }: Props) {
  const common: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  };

  switch (name) {
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      );
    case "cases":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="3" />
          <path d="M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1Z" />
          <path d="M8 12h8" />
        </svg>
      );
    case "doctors":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M6 20.5c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5" />
          <path d="M8 14h8" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M21 12.8A9 9 0 0 1 11.2 3 7.2 7.2 0 1 0 21 12.8Z" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.5-7.5-1.4 1.4M7.9 16.6l-1.4 1.4m0-12.8 1.4 1.4m8.2 8.2 1.4 1.4" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 13 4 4L19 7" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "minus":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <path d="M8 6h12" />
          <path d="M4 6h.01" />
          <path d="M4 12h.01" />
          <path d="M4 18h.01" />
          <path d="M8 12h12" />
          <path d="M8 18h12" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M3 16s2.5-2.5 4.5-2.5S12 16 12 16s1.5-1.5 3.5-1.5S21 16 21 16" />
        </svg>
      );
    case "google":
      return (
        <svg
          {...common}
          stroke="none"
          viewBox="0 0 48 48"
          width={size}
          height={size}
          aria-hidden
        >
          <circle cx="24" cy="24" r="22" fill="#fff" />
          <path
            fill="#4285f4"
            d="M24 20.1v8h11.3c.2-.9.3-1.8.3-2.8 0-1.6-.2-3.1-.6-4.4H24Z"
          />
          <path
            fill="#34a853"
            d="M17.5 27.8l-1.2 6.1-5.9.1A21.9 21.9 0 0 1 6 24c0-3 .7-5.8 1.9-8.2l5.3.9 2.3 5.4a8.8 8.8 0 0 0 2 12.8Z"
          />
          <path
            fill="#fbbc04"
            d="M41.8 20.9A22 22 0 0 0 24 2c-5.9 0-11.3 2.4-15.1 6.3l6.2 4.9a12.7 12.7 0 0 1 19.3 6.7Z"
          />
          <path
            fill="#ea4335"
          d="M24 44a21.9 21.9 0 0 0 15.2-5.6l-7-5.7a12.7 12.7 0 0 1-18.7-6.8l-6.1.5A21.9 21.9 0 0 0 24 44Z"
        />
      </svg>
    );
    case "logo":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="5" fill="currentColor" opacity="0.08" stroke="none" />
          <path d="M12 7v10" />
          <path d="M7 12h10" />
          <path d="M9.5 5.5 12 3.5l2.5 2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5.8c0 3.4 2.8 6.8 7 9.2 4.2-2.4 7-5.8 7-9.2V6l-7-3Z" />
          <path d="M9 11.5 11.2 14 15 9.5" />
        </svg>
      );
    case "badge":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M7 11.5c-1.3.7-2 1.8-2 3.2V19l3-1.5 3 1.5 3-1.5 3 1.5v-4.3c0-1.4-.7-2.5-2-3.2" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M9 11V8a3 3 0 1 1 6 0v3" />
          <path d="M12 15v2" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M9 7V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" />
          <path d="M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      );
    default:
      return null;
  }
}
