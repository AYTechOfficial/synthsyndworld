import { Icon } from "./ui";
import { SSDY } from "../ssdy";

type Props = {
  size?: "sm" | "md" | "lg";
  label?: string;
  mobileLabel?: string;
  className?: string;
  block?: boolean;
};

/**
 * The single, canonical $SSDY call-to-action.
 * Opens the creator's pump.fun token page in a new tab.
 */
export default function PumpButton({
  size = "md",
  label = "Buy $SSDY on pump.fun",
  mobileLabel,
  className = "",
  block = false,
}: Props) {
  return (
    <a
      href={SSDY.pumpUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn-pump${size === "sm" ? " btn-sm" : size === "lg" ? " btn-lg" : ""}${block ? " btn-block" : ""}${className ? " " + className : ""}`}
      aria-label={`${label} — opens in a new tab`}
    >
      <span className="pump-glyph" aria-hidden="true">
        <Icon name="pump" size={size === "lg" ? 17 : 15} strokeWidth={2} />
      </span>
      <span className="pump-label">{label}</span>
      {mobileLabel && <span className="pump-label-mobile">{mobileLabel}</span>}
      <Icon name="external" size={size === "lg" ? 14 : 12} strokeWidth={1.8} />
    </a>
  );
}
