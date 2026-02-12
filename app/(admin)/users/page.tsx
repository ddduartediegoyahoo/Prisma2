"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ShieldBan, ShieldCheck } from "lucide-react";
import type { Profile } from "@/lib/types/auth";

const API_PATH = "/api/admin/users";
const QUERY_KEY = "admin-users";

export default function UsersPage() {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    user: Profile | null;
    action: "block" | "unblock";
  }>({ isOpen: false, user: null, action: "block" });

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<Profile[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const res = await fetch(API_PATH);
      if (!res.ok) throw new Error("Erro ao carregar usuários.");
      return res.json();
    },
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, blocked }: { id: string; blocked: boolean }) => {
      const res = await fetch(`${API_PATH}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          typeof err.error === "string"
            ? err.error
            : "Erro ao atualizar usuário."
        );
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(
        variables.blocked
          ? "Usuário bloqueado com sucesso."
          : "Usuário desbloqueado com sucesso."
      );
      setConfirmDialog({ isOpen: false, user: null, action: "block" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openConfirmDialog = (user: Profile, action: "block" | "unblock") => {
    setConfirmDialog({ isOpen: true, user, action });
  };

  const handleConfirm = () => {
    if (!confirmDialog.user) return;
    toggleBlockMutation.mutate({
      id: confirmDialog.user.id,
      blocked: confirmDialog.action === "block",
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return <Badge>Admin</Badge>;
    }
    return <Badge variant="secondary">Professor</Badge>;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
        <p className="mt-2 text-muted-foreground">
          Gerencie os usuários registrados no sistema.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <p className="text-muted-foreground">
            Nenhum usuário registrado ainda.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]" />
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="w-[100px]">Role</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className={user.blocked ? "opacity-60" : ""}
                >
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.avatar_url ?? undefined}
                        alt={user.full_name ?? "Usuário"}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email ?? "—"}
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.blocked ? "destructive" : "default"}
                    >
                      {user.blocked ? "Bloqueado" : "Ativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.blocked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfirmDialog(user, "unblock")}
                      >
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Desbloquear
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfirmDialog(user, "block")}
                      >
                        <ShieldBan className="mr-1 h-3 w-3" />
                        Bloquear
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => {
          if (!open)
            setConfirmDialog({ isOpen: false, user: null, action: "block" });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === "block"
                ? "Bloquear Usuário"
                : "Desbloquear Usuário"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "block"
                ? `Tem certeza que deseja bloquear o acesso de "${confirmDialog.user?.full_name ?? "este usuário"}"? O usuário não poderá acessar o sistema.`
                : `Tem certeza que deseja desbloquear o acesso de "${confirmDialog.user?.full_name ?? "este usuário"}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({
                  isOpen: false,
                  user: null,
                  action: "block",
                })
              }
            >
              Cancelar
            </Button>
            <Button
              variant={
                confirmDialog.action === "block" ? "destructive" : "default"
              }
              onClick={handleConfirm}
              disabled={toggleBlockMutation.isPending}
            >
              {toggleBlockMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {confirmDialog.action === "block" ? "Bloquear" : "Desbloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
