"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { Profile } from "@/lib/types/auth";

interface TeacherHeaderProps {
  profile: Profile;
}

export function TeacherHeader({ profile }: TeacherHeaderProps) {
  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "PR";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <Link href="/dashboard" className="text-lg font-semibold">
        Adapte Minha Prova
      </Link>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={profile.avatar_url ?? undefined}
              alt={profile.full_name ?? "Professor"}
            />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:inline">
            {profile.full_name ?? "Professor"}
          </span>
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
