"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  BrainCircuit,
  GraduationCap,
  HandHeart,
  BookOpen,
  Users,
  Settings,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const configNavItems: NavItem[] = [
  { label: "Modelos", href: "/config/models", icon: BrainCircuit },
  { label: "Agentes", href: "/config/agents", icon: Bot },
  { label: "Apoios", href: "/config/supports", icon: HandHeart },
  { label: "Disciplinas", href: "/config/subjects", icon: BookOpen },
  { label: "Anos/Séries", href: "/config/grade-levels", icon: GraduationCap },
];

const managementNavItems: NavItem[] = [
  { label: "Usuários", href: "/users", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/config" className="flex items-center gap-2 font-semibold">
          <Settings className="h-5 w-5" />
          <span>Painel Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Configurações
        </p>
        {configNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}

        <Separator className="my-4" />

        <p className="mb-2 px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Gestão
        </p>
        {managementNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
