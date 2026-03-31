import logoEscuro from "@/assets/logo-jrp.png";
import logoClaro from "@/assets/logo-claro.png";
import { useTheme } from "@/hooks/useTheme";

interface LogoProps {
  className?: string;
  alt?: string;
}

const Logo = ({ className, alt = "JRP Logo" }: LogoProps) => {
  const { isDark } = useTheme();
  return (
    <img
      src={isDark ? logoClaro : logoEscuro}
      alt={alt}
      className={className}
    />
  );
};

export default Logo;
