import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  const { theme } = useTheme();

  const src = theme === "dark" ? "/logo_claro.png" : "/logo_jrp.png";

  return (
    <img
      src={src}
      alt="Pamplona Alfaiataria"
      className={cn("object-contain", className)}
    />
  );
}
