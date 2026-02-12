# Tarefa 17.0: Professor — Sistema de Feedback (Avaliação + Comentário)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar o sistema de feedback onde o professor avalia (0–5 estrelas) e comenta cada questão adaptada. Os feedbacks são persistidos vinculados à adaptação, questão original e agente, alimentando o fluxo de evolução de agentes.

<requirements>
- Campo de avaliação de 0 a 5 estrelas por questão adaptada (PRD F7.5)
- Campo de texto para comentário por questão adaptada (PRD F7.6)
- Mensagem informando que comentários ajudam a melhorar futuras adaptações (PRD F7.7)
- Persistir feedback vinculado à adaptação (PRD F7.8)
- Feedback pode ser enviado a qualquer momento (save ao sair do campo ou botão explícito)
- API Route para salvar feedback
- Exibir feedback já salvo ao revisitar a página de resultado
</requirements>

## Subtarefas

- [ ] 17.1 Criar componente `StarRating` (Client Component) com 5 estrelas clicáveis (0 = nenhuma selecionada)
- [ ] 17.2 Criar componente `FeedbackForm` (Client Component) com StarRating + Textarea + botão salvar
- [ ] 17.3 Integrar `FeedbackForm` no componente `AdaptationCard` da tarefa 16.0
- [ ] 17.4 Criar/atualizar API Route `app/api/exams/[id]/feedback/route.ts` (POST: salvar rating + comment por adaptationId)
- [ ] 17.5 Implementar schema Zod para validação de feedback (`lib/validations/feedback.ts`)
- [ ] 17.6 Carregar feedbacks existentes ao renderizar a página de resultado (join na query do Server Component)
- [ ] 17.7 Exibir mensagem informativa: "Seus comentários ajudam nosso sistema a melhorar futuras adaptações"
- [ ] 17.8 Implementar feedback visual ao salvar (toast de sucesso)
- [ ] 17.9 Testes unitários: componente StarRating, schema Zod

## Detalhes de Implementação

Referir-se à seção **"Modelos de Dados"** da `techspec.md` para a tabela `feedbacks`.

O feedback é salvo por adaptação (uma adaptação = uma questão × um apoio):

```typescript
// POST /api/exams/[id]/feedback
interface FeedbackPayload {
  adaptationId: string;
  rating: number; // 0-5
  comment?: string;
}
```

A query de resultado (tarefa 16.0) deve ser estendida para incluir feedbacks:

```typescript
const { data: exam } = await supabase
  .from("exams")
  .select(`
    *,
    subjects(name),
    grade_levels(name),
    questions(
      *,
      adaptations(
        *,
        supports(name),
        feedbacks(*)
      )
    )
  `)
  .eq("id", params.id)
  .single();
```

Componente StarRating:

```typescript
"use client";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star === value ? 0 : star)}
          className={star <= value ? "text-yellow-400" : "text-gray-300"}
        >
          ★
        </button>
      ))}
    </div>
  );
}
```

Usar componentes Shadcn UI: `Textarea`, `Button`, `Card`.
Usar `lucide-react`: `Star` icon.

## Critérios de Sucesso

- Professor pode avaliar de 0 a 5 estrelas cada adaptação
- Professor pode comentar cada adaptação
- Feedback salvo corretamente na tabela `feedbacks`
- Feedback existente é exibido ao revisitar a página
- Mensagem informativa exibida na página
- Toast de confirmação ao salvar feedback

## Arquivos relevantes

- `app/(auth)/exams/[id]/result/_components/FeedbackForm.tsx`
- `app/(auth)/exams/[id]/result/_components/StarRating.tsx`
- `app/api/exams/[id]/feedback/route.ts`
- `lib/validations/feedback.ts`
