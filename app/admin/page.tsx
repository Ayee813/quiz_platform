import { cookies } from "next/headers";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { CreateQuizDialog } from "@/app/admin/create-quiz-dialog";
import { QuizCard } from "@/app/admin/quiz-card";
import { SignOutButton } from "@/app/admin/sign-out-button";
import type { Quiz } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*, questions(count)")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          <h1 className="text-lg font-bold">ແຜງຄວບຄຸມຜູ້ດູແລລະບົບ</h1>
        </div>
        <SignOutButton />
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">ແບບທົດສອບຂອງທ່ານ</h2>
        <CreateQuizDialog />
      </div>

      {!quizzes || quizzes.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
          ຍັງບໍ່ມີແບບທົດສອບ, ກົດ &quot;ສ້າງແບບທົດສອບໃໝ່&quot; ເພື່ອເລີ່ມຕົ້ນ
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(quizzes as (Quiz & { questions: { count: number }[] })[]).map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} questionCount={quiz.questions[0]?.count ?? 0} />
          ))}
        </div>
      )}
    </main>
  );
}
