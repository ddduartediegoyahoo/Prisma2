# Tarefa 4.0: Admin — Layout & Navegação

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Criar o layout administrativo com sidebar de navegação, header com informações do usuário logado e botão de logout. Este layout é compartilhado por todas as páginas do painel admin.

<requirements>
- Layout `app/(admin)/layout.tsx` com sidebar e header
- Sidebar com links para: Configurações (Modelos, Agentes, Apoios, Disciplinas, Anos/Séries) e Usuários
- Header exibindo nome e avatar do admin logado + botão de logout
- Sidebar com indicação visual da página ativa (highlight no item de menu)
- Design desktop-first, moderno e minimalista usando Shadcn UI + Tailwind CSS
- Página de configurações (`app/(admin)/config/page.tsx`) como overview com cards para cada seção
</requirements>

## Subtarefas

- [ ] 4.1 Criar `app/(admin)/layout.tsx` com Server Component que busca profile do admin
- [ ] 4.2 Criar componente `AdminSidebar` (`app/(admin)/_components/AdminSidebar.tsx`) com links de navegação usando `lucide-react` icons
- [ ] 4.3 Criar componente `AdminHeader` (`app/(admin)/_components/AdminHeader.tsx`) com avatar, nome e logout
- [ ] 4.4 Criar `app/(admin)/config/page.tsx` com cards de overview para cada seção de configuração
- [ ] 4.5 Criar páginas placeholder para cada rota admin (models, agents, supports, subjects, grade-levels, users)

## Detalhes de Implementação

Referir-se à seção **"Estrutura do App Router"** da `techspec.md` para as rotas `(admin)`.

A sidebar deve conter:
- **Configurações** (seção colapsável ou grupo)
  - Modelos (`/config/models`)
  - Agentes (`/config/agents`)
  - Apoios (`/config/supports`)
  - Disciplinas (`/config/subjects`)
  - Anos/Séries (`/config/grade-levels`)
- **Usuários** (`/users`)

Usar componentes Shadcn UI: `Button`, `Separator`, `Tooltip`.
Usar `usePathname()` do Next.js para highlight do item ativo (Client Component para sidebar).

## Critérios de Sucesso

- Layout admin renderiza com sidebar e header em todas as rotas `/config/*` e `/users`
- Sidebar indica corretamente a página ativa
- Navegação entre páginas é fluida (sem full page reload)
- Logout funciona a partir do header
- Design consistente e acessível (contraste, foco por teclado)

## Arquivos relevantes

- `app/(admin)/layout.tsx`
- `app/(admin)/_components/AdminSidebar.tsx`
- `app/(admin)/_components/AdminHeader.tsx`
- `app/(admin)/config/page.tsx`
