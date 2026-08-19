interface Props {
  number: string;
  message?: string;
  variant?: "solid" | "ghost";
  className?: string;
}

export function WhatsAppButton({
  number,
  message = "Bonjour DreamTouch, je souhaite avoir des informations sur THE UNKNOWN.",
  variant = "ghost",
  className = ""
}: Props) {
  const cleaned = number.replace(/[^0-9]/g, "");
  const href = `https://wa.me/${cleaned.startsWith("229") ? cleaned : `229${cleaned}`}?text=${encodeURIComponent(
    message
  )}`;

  const base =
    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition";
  const styles =
    variant === "solid"
      ? "bg-gold text-void hover:bg-gold-light"
      : "border border-gold/50 text-bone hover:border-gold hover:text-gold";

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${styles} ${className}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.85.5 3.58 1.36 5.07L2 22l5.19-1.36a9.86 9.86 0 0 0 4.85 1.26h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.11c-.24.68-1.4 1.31-1.93 1.38-.5.07-1.05.1-3.06-.66-2.58-.99-4.25-3.62-4.38-3.79-.13-.17-1.05-1.4-1.05-2.67 0-1.27.66-1.89.9-2.15.24-.26.52-.32.7-.32.17 0 .35 0 .5.01.16.01.38-.06.6.46.24.58.81 2 .88 2.15.07.15.11.32.02.5-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.13-.28.27-.12.53.16.26.71 1.17 1.53 1.9 1.05.94 1.93 1.23 2.19 1.37.26.14.42.12.57-.07.16-.19.66-.77.84-1.03.18-.26.35-.22.6-.13.24.09 1.55.73 1.82.86.26.14.43.2.5.31.06.13.06.68-.18 1.36z" />
      </svg>
      Contacter DreamTouch
    </a>
  );
}
