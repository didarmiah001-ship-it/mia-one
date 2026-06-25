import {
  ShoppingBasket, Droplets, Coffee, Cookie, Home, Smartphone,
  Shirt, Sparkles, Package, LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  ShoppingBasket,
  Droplets,
  Coffee,
  Cookie,
  Home,
  Smartphone,
  Shirt,
  Sparkles,
  Package,
};

export function CategoryIcon({ name, size, className, style }: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} style={style} />;
}
