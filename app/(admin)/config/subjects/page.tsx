import { ConfigEntityManager } from "../../_components/ConfigEntityManager";

export default function SubjectsPage() {
  return (
    <ConfigEntityManager
      title="Disciplinas"
      description="Gerencie as disciplinas disponíveis para os professores."
      apiPath="/api/admin/subjects"
      queryKey="admin-subjects"
      nameLabel="Nome da disciplina"
      namePlaceholder="Ex: Matemática"
      nameRequiredMessage="O nome da disciplina é obrigatório."
      createSuccessMessage="Disciplina criada com sucesso!"
    />
  );
}
