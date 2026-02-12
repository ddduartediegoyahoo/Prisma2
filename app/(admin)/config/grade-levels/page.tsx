import { ConfigEntityManager } from "../../_components/ConfigEntityManager";

export default function GradeLevelsPage() {
  return (
    <ConfigEntityManager
      title="Anos/Séries"
      description="Gerencie os anos e séries disponíveis para os professores."
      apiPath="/api/admin/grade-levels"
      queryKey="admin-grade-levels"
      nameLabel="Nome do ano/série"
      namePlaceholder="Ex: 6º Ano - Ensino Fundamental"
      nameRequiredMessage="O nome do ano/série é obrigatório."
      createSuccessMessage="Ano/Série criado com sucesso!"
    />
  );
}
