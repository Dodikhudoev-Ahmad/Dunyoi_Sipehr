import {
  Compass,
  Route,
  Luggage,
  Headset,
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  Car,
  Bus,
  Train,
  Ship,
  Map,
  MapPin,
  Navigation,
  FileText,
  ClipboardCheck,
  Shield,
  ShieldCheck,
  CreditCard,
  Wallet,
  Receipt,
  Phone,
  Mail,
  MessageCircle,
  MessageSquare,
  Users,
  UserCheck,
  LifeBuoy,
  Briefcase,
  Backpack,
  Umbrella,
  Sun,
  Bed,
  Home,
  Key,
  Clock,
  Calendar,
  CalendarDays,
  Star,
  Heart,
  CheckCircle,
  Award,
  Gift,
  Globe,
  Globe2,
  Wifi,
  Coffee,
  Utensils,
  Camera,
  type LucideIcon,
} from 'lucide-react'

/**
 * A curated, name-keyed subset of lucide-react's ~1500 icons — not the whole package. The
 * admin "Services" form lets an operator type any icon name freely (ServiceFormPage.tsx), so
 * this needs to stay dynamic; a full `import * as Icons from 'lucide-react'` did that too, but
 * a namespace import with dynamic property access defeats Rollup's tree-shaking entirely
 * (it can't prove which exports are unused), which is why `vendor-icons` was ~635KB — the
 * *entire* icon package shipped to every public visitor for the sake of ~4 icons actually in
 * use. Explicit named imports here keep this list tree-shakeable while covering the icons a
 * travel-agency admin would realistically pick (transport, documents, support, amenities).
 * To add one: import it above and add an entry below — same case as the export name.
 */
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  Compass,
  Route,
  Luggage,
  Headset,
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  Car,
  Bus,
  Train,
  Ship,
  Map,
  MapPin,
  Navigation,
  FileText,
  ClipboardCheck,
  Shield,
  ShieldCheck,
  CreditCard,
  Wallet,
  Receipt,
  Phone,
  Mail,
  MessageCircle,
  MessageSquare,
  Users,
  UserCheck,
  LifeBuoy,
  Briefcase,
  Backpack,
  Umbrella,
  Sun,
  Bed,
  Home,
  Key,
  Clock,
  Calendar,
  CalendarDays,
  Star,
  Heart,
  CheckCircle,
  Award,
  Gift,
  Globe,
  Globe2,
  Wifi,
  Coffee,
  Utensils,
  Camera,
}

/** Unknown/unmatched names (typo, or an icon outside the curated set) fall back to Compass —
 * same fallback behavior as before this change, just against a bounded name list now. */
export function resolveServiceIcon(name: string): LucideIcon {
  const normalized = name.trim()
  const pascal = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
  return SERVICE_ICONS[pascal] ?? SERVICE_ICONS[normalized] ?? Compass
}
