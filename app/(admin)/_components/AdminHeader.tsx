"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { Profile } from "@/lib/types/auth";

interface AdminHeaderProps {
  profile: Profile;
}

export function AdminHeader({ profile }: AdminHeaderProps) {
  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={profile.avatar_url ?? undefined}
              alt={profile.full_name ?? "Admin"}
            />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-medium leading-none">
              {profile.full_name ?? "Administrador"}
            </span>
            <span className="text-xs text-muted-foreground">
              {profile.email}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/logout" title="Sair">
            <LogOut className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
