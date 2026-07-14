import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { QuizEditor } from "@/app/admin/quizzes/[id]/edit/quiz-editor";
import type { QuestionWithOptions, Quiz } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", id).maybeSingle();
  if (!quiz) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("*, answer_options(*)")
    .eq("quiz_id", id)
    .order("order_index", { ascending: true });

  const sortedQuestions = ((questions as QuestionWithOptions[]) ?? []).map((q) => ({
    ...q,
    answer_options: [...q.answer_options].sort((a, b) => a.order_index - b.order_index),
  }));

  return <QuizEditor quiz={quiz as Quiz} initialQuestions={sortedQuestions} />;
}
