import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createExamSchema } from "@/lib/validations/exams";

const MAX_PDF_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(request: Request) {
  const supabase = await createClient();

  // #region agent log
  // DEBUG: Log cookies present in the request (H-A, H-B)
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const authCookies = allCookies.filter((c) => c.name.includes("-auth-token"));
  console.error(
    `[DEBUG-EXAM] cookies_present: total=${allCookies.length}, auth_token_cookies=${authCookies.length}, auth_cookie_names=${JSON.stringify(authCookies.map((c) => ({ name: c.name, valueLen: c.value.length })))}`
  );
  fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/exams/route.ts:POST',message:'cookies_present',data:{total:allCookies.length,authCount:authCookies.length,authNames:authCookies.map(c=>({name:c.name,valueLen:c.value.length}))},timestamp:Date.now(),hypothesisId:'H-A,H-B'})}).catch(()=>{});
  // #endregion

  // 1. Verify authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // #region agent log
  // DEBUG: Log getUser() result (H-A, H-D)
  console.error(
    `[DEBUG-EXAM] getUser_result: user=${user ? user.id : 'null'}, error=${authError ? JSON.stringify({ message: authError.message, status: authError.status }) : 'none'}`
  );
  fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/exams/route.ts:POST',message:'getUser_result',data:{userId:user?.id??null,error:authError?{message:authError.message,status:authError.status}:null},timestamp:Date.now(),hypothesisId:'H-A,H-D'})}).catch(()=>{});
  // #endregion

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // 2. Parse FormData
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const subjectId = formData.get("subjectId") as string;
  const gradeLevelId = formData.get("gradeLevelId") as string;
  const topic = (formData.get("topic") as string) || undefined;
  const supportIdsRaw = formData.get("supportIds") as string;

  let supportIds: string[];
  try {
    supportIds = JSON.parse(supportIdsRaw);
  } catch {
    return NextResponse.json(
      { error: "Formato inválido para apoios selecionados." },
      { status: 400 }
    );
  }

  // 3. Validate with Zod
  const parsed = createExamSchema.safeParse({
    subjectId,
    gradeLevelId,
    topic,
    supportIds,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // 4. Validate PDF file
  if (!file) {
    return NextResponse.json(
      { error: "Selecione um arquivo PDF." },
      { status: 400 }
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "O arquivo deve ser um PDF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json(
      { error: "O arquivo deve ter no máximo 25 MB." },
      { status: 400 }
    );
  }

  // 5. Create exam record (status: uploading)
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .insert({
      user_id: user.id,
      subject_id: parsed.data.subjectId,
      grade_level_id: parsed.data.gradeLevelId,
      topic: parsed.data.topic ?? null,
      pdf_path: "", // Will be updated after upload
      status: "uploading",
    })
    .select()
    .single();

  if (examError || !exam) {
    return NextResponse.json(
      { error: examError?.message ?? "Erro ao criar exame." },
      { status: 500 }
    );
  }

  // 6. Upload PDF to Supabase Storage
  const pdfPath = `${user.id}/${exam.id}.pdf`;
  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("exams")
    .upload(pdfPath, fileBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    // Clean up the exam record
    await supabase.from("exams").delete().eq("id", exam.id);
    return NextResponse.json(
      { error: `Erro no upload: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // 7. Update exam with pdf_path
  await supabase
    .from("exams")
    .update({ pdf_path: pdfPath })
    .eq("id", exam.id);

  // 8. Create exam_supports records
  const examSupports = parsed.data.supportIds.map((supportId) => ({
    exam_id: exam.id,
    support_id: supportId,
  }));

  const { error: supportsError } = await supabase
    .from("exam_supports")
    .insert(examSupports);

  if (supportsError) {
    // Non-fatal — exam is still valid, log the error
    console.error("Error creating exam_supports:", supportsError.message);
  }

  // 9. Update status to 'extracting'
  await supabase
    .from("exams")
    .update({ status: "extracting" })
    .eq("id", exam.id);

  // 10. Invoke Edge Function (non-blocking, graceful failure)
  try {
    await supabase.functions.invoke("extract-questions", {
      body: { examId: exam.id },
    });
  } catch (error) {
    // Edge Function may not be deployed yet — don't fail the request
    console.error("Edge Function invoke error:", error);
  }

  return NextResponse.json({ id: exam.id }, { status: 201 });
}
