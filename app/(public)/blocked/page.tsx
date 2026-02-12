import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { LogOut, ShieldX } from "lucide-react";

export default function BlockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Acesso Bloqueado
          </CardTitle>
          <CardDescription>
            Sua conta foi bloqueada por um administrador. Se você acredita que
            isso é um erro, entre em contato com o suporte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/logout">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
