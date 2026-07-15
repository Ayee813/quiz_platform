"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { MusicSettings } from "@/app/admin/quizzes/[id]/edit/music-settings";
import type { AnswerOption, QuestionType, QuestionWithOptions, Quiz } from "@/lib/types";

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "ຫຼາຍຕົວເລືອກ",
  true_false: "ຖືກ/ຜິດ",
  type_answer: "ພິມຄຳຕອບ",
};

function defaultOptionsFor(type: QuestionType): Omit<AnswerOption, "id" | "question_id">[] {
  if (type === "true_false") {
    return [
      { order_index: 0, label: "ຖືກຕ້ອງ", is_correct: true },
      { order_index: 1, label: "ບໍ່ຖືກຕ້ອງ", is_correct: false },
    ];
  }
  if (type === "type_answer") {
    return [{ order_index: 0, label: "", is_correct: true }];
  }
  return [
    { order_index: 0, label: "", is_correct: true },
    { order_index: 1, label: "", is_correct: false },
    { order_index: 2, label: "", is_correct: false },
    { order_index: 3, label: "", is_correct: false },
  ];
}

export function QuizEditor({
  quiz: initialQuiz,
  initialQuestions,
}: {
  quiz: Quiz;
  initialQuestions: QuestionWithOptions[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [quiz, setQuiz] = useState(initialQuiz);
  const [questions, setQuestions] = useState(initialQuestions);
  const [addingQuestion, setAddingQuestion] = useState(false);

  const saveQuizField = async (patch: Partial<Quiz>) => {
    setQuiz((prev) => ({ ...prev, ...patch }));
    const { error } = await supabase.from("quizzes").update(patch).eq("id", quiz.id);
    if (error) toast.error("ບັນທຶກບໍ່ສຳເລັດ: " + error.message);
  };

  const addQuestion = async () => {
    setAddingQuestion(true);
    try {
      const orderIndex = questions.length;
      const { data: question, error } = await supabase
        .from("questions")
        .insert({
          quiz_id: quiz.id,
          order_index: orderIndex,
          type: "multiple_choice",
          body: "ຄຳຖາມໃໝ່",
          time_limit_seconds: 20,
          points_base: 1000,
        })
        .select("*")
        .single();

      if (error || !question) throw new Error(error?.message ?? "ສ້າງຄຳຖາມບໍ່ສຳເລັດ");

      const optionRows = defaultOptionsFor("multiple_choice").map((o) => ({
        ...o,
        question_id: question.id,
      }));
      const { data: options, error: optionsError } = await supabase
        .from("answer_options")
        .insert(optionRows)
        .select("*");

      if (optionsError) throw new Error(optionsError.message);

      setQuestions((prev) => [...prev, { ...question, answer_options: options ?? [] }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ສ້າງຄຳຖາມບໍ່ສຳເລັດ");
    } finally {
      setAddingQuestion(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    const prev = questions;
    setQuestions((qs) => qs.filter((q) => q.id !== id));
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) {
      toast.error("ລຶບບໍ່ສຳເລັດ: " + error.message);
      setQuestions(prev);
    }
  };

  const moveQuestion = async (id: string, direction: -1 | 1) => {
    const index = questions.findIndex((q) => q.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= questions.length) return;

    const reordered = [...questions];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const withIndexes = reordered.map((q, i) => ({ ...q, order_index: i }));
    setQuestions(withIndexes);

    const a = withIndexes[index];
    const b = withIndexes[targetIndex];
    const { error } = await supabase.from("questions").upsert([
      { id: a.id, order_index: a.order_index },
      { id: b.id, order_index: b.order_index },
    ]);
    if (error) toast.error("ຈັດລຳດັບບໍ່ສຳເລັດ: " + error.message);
  };

  const updateQuestion = (id: string, patch: Partial<QuestionWithOptions>) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6 pb-24">
      <Link href="/admin" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        ກັບໄປແຜງຄວບຄຸມ
      </Link>

      <Card>
        <CardHeader>
          <h1 className="text-lg font-bold">ແກ້ໄຂແບບທົດສອບ</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="quiz-title">ຫົວຂໍ້</Label>
            <Input
              id="quiz-title"
              value={quiz.title}
              onChange={(e) => setQuiz((p) => ({ ...p, title: e.target.value }))}
              onBlur={(e) => saveQuizField({ title: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="quiz-description">ຄຳອະທິບາຍ</Label>
            <Textarea
              id="quiz-description"
              rows={2}
              value={quiz.description ?? ""}
              onChange={(e) => setQuiz((p) => ({ ...p, description: e.target.value }))}
              onBlur={(e) => saveQuizField({ description: e.target.value || null })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium">ເຜີຍແຜ່ແບບທົດສອບ</span>
              <span className="text-xs text-muted-foreground">ເປີດເພື່ອໃຫ້ສາມາດເລີ່ມເກມໄດ້</span>
            </div>
            <Switch
              checked={quiz.is_published}
              onCheckedChange={(checked) => saveQuizField({ is_published: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <MusicSettings quizId={quiz.id} initialBackgroundTrackId={quiz.background_track_id} />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">ຄຳຖາມ ({questions.length})</h2>
        <Button size="sm" onClick={addQuestion} disabled={addingQuestion}>
          {addingQuestion ? <Loader2 className="animate-spin" /> : <Plus />}
          ເພີ່ມຄຳຖາມ
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((question, i) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={i}
            total={questions.length}
            supabase={supabase}
            onChange={(patch) => updateQuestion(question.id, patch)}
            onDelete={() => deleteQuestion(question.id)}
            onMove={(dir) => moveQuestion(question.id, dir)}
          />
        ))}
        {questions.length === 0 && (
          <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
            ຍັງບໍ່ມີຄຳຖາມ, ກົດ &quot;ເພີ່ມຄຳຖາມ&quot; ເພື່ອເລີ່ມຕົ້ນ
          </div>
        )}
      </div>
    </main>
  );
}

function QuestionEditor({
  question,
  index,
  total,
  supabase,
  onChange,
  onDelete,
  onMove,
}: {
  question: QuestionWithOptions;
  index: number;
  total: number;
  supabase: ReturnType<typeof createClient>;
  onChange: (patch: Partial<QuestionWithOptions>) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const saveField = async (patch: Record<string, unknown>) => {
    const { error } = await supabase.from("questions").update(patch).eq("id", question.id);
    if (error) toast.error("ບັນທຶກບໍ່ສຳເລັດ: " + error.message);
  };

  const changeType = async (type: QuestionType) => {
    onChange({ type });
    await saveField({ type });

    // Replace options wholesale to match the new question type's shape.
    await supabase.from("answer_options").delete().eq("question_id", question.id);
    const rows = defaultOptionsFor(type).map((o) => ({ ...o, question_id: question.id }));
    const { data: options, error } = await supabase.from("answer_options").insert(rows).select("*");
    if (error) {
      toast.error("ອັບເດດຕົວເລືອກບໍ່ສຳເລັດ: " + error.message);
      return;
    }
    onChange({ answer_options: options ?? [] });
  };

  const addOption = async () => {
    const orderIndex = question.answer_options.length;
    const { data, error } = await supabase
      .from("answer_options")
      .insert({ question_id: question.id, order_index: orderIndex, label: "", is_correct: false })
      .select("*")
      .single();
    if (error || !data) {
      toast.error("ເພີ່ມຕົວເລືອກບໍ່ສຳເລັດ");
      return;
    }
    onChange({ answer_options: [...question.answer_options, data] });
  };

  const updateOption = (optionId: string, patch: Partial<AnswerOption>) => {
    onChange({
      answer_options: question.answer_options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
    });
  };

  const saveOption = async (optionId: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("answer_options").update(patch).eq("id", optionId);
    if (error) toast.error("ບັນທຶກຕົວເລືອກບໍ່ສຳເລັດ: " + error.message);
  };

  const setCorrectOption = async (optionId: string) => {
    const updated = question.answer_options.map((o) => ({ ...o, is_correct: o.id === optionId }));
    onChange({ answer_options: updated });
    await Promise.all(
      updated.map((o) => supabase.from("answer_options").update({ is_correct: o.is_correct }).eq("id", o.id)),
    );
  };

  const deleteOption = async (optionId: string) => {
    const remaining = question.answer_options.filter((o) => o.id !== optionId);
    onChange({ answer_options: remaining });
    const { error } = await supabase.from("answer_options").delete().eq("id", optionId);
    if (error) toast.error("ລຶບຕົວເລືອກບໍ່ສຳເລັດ: " + error.message);
  };

  const minOptions = question.type === "type_answer" ? 1 : 2;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">ຄຳຖາມ {index + 1}</Badge>
          <span className="text-xs text-muted-foreground">{QUESTION_TYPE_LABELS[question.type]}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={index === total - 1} onClick={() => onMove(1)}>
            <ArrowDown className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>ຄຳຖາມ</Label>
          <Textarea
            rows={2}
            value={question.body}
            onChange={(e) => onChange({ body: e.target.value })}
            onBlur={(e) => saveField({ body: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label>ປະເພດ</Label>
            <Select value={question.type} onValueChange={(v) => changeType(v as QuestionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>ເວລາ (ວິນາທີ)</Label>
            <Input
              type="number"
              min={5}
              max={120}
              value={question.time_limit_seconds}
              onChange={(e) => onChange({ time_limit_seconds: Number(e.target.value) })}
              onBlur={(e) => saveField({ time_limit_seconds: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>ຄະແນນພື້ນຖານ</Label>
            <Input
              type="number"
              min={0}
              step={100}
              value={question.points_base}
              onChange={(e) => onChange({ points_base: Number(e.target.value) })}
              onBlur={(e) => saveField({ points_base: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>ຮູບພາບ URL (ບໍ່ບັງຄັບ)</Label>
          <Input
            value={question.image_url ?? ""}
            onChange={(e) => onChange({ image_url: e.target.value })}
            onBlur={(e) => saveField({ image_url: e.target.value || null })}
            placeholder="https://..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>ຄຳອະທິບາຍ (ສະແດງຫຼັງເປີດເຜີຍຄຳຕອບ)</Label>
          <Textarea
            rows={2}
            value={question.explanation ?? ""}
            onChange={(e) => onChange({ explanation: e.target.value })}
            onBlur={(e) => saveField({ explanation: e.target.value || null })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>ຕົວເລືອກ ແລະ ຄຳຕອບທີ່ຖືກຕ້ອງ</Label>

          {question.type === "type_answer" ? (
            <Input
              value={question.answer_options[0]?.label ?? ""}
              placeholder="ຄຳຕອບທີ່ຖືກຕ້ອງ"
              onChange={(e) =>
                question.answer_options[0] &&
                updateOption(question.answer_options[0].id, { label: e.target.value })
              }
              onBlur={(e) =>
                question.answer_options[0] && saveOption(question.answer_options[0].id, { label: e.target.value })
              }
            />
          ) : (
            <RadioGroup
              value={question.answer_options.find((o) => o.is_correct)?.id ?? ""}
              onValueChange={setCorrectOption}
              className="flex flex-col gap-2"
            >
              {question.answer_options.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <RadioGroupItem value={option.id} />
                  <Input
                    value={option.label}
                    disabled={question.type === "true_false"}
                    onChange={(e) => updateOption(option.id, { label: e.target.value })}
                    onBlur={(e) => saveOption(option.id, { label: e.target.value })}
                    className="flex-1"
                  />
                  {question.type === "multiple_choice" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      disabled={question.answer_options.length <= minOptions}
                      onClick={() => deleteOption(option.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === "multiple_choice" && question.answer_options.length < 6 && (
            <Button variant="outline" size="sm" className="w-fit" onClick={addOption}>
              <Plus />
              ເພີ່ມຕົວເລືອກ
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
