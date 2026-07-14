"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";

export function CreateQuizDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ກະລຸນາເຂົ້າສູ່ລະບົບ");

      const { data, error } = await supabase
        .from("quizzes")
        .insert({ owner_id: user.id, title: title.trim(), description: description.trim() || null })
        .select("id")
        .single();

      if (error || !data) throw new Error(error?.message ?? "ສ້າງແບບທົດສອບບໍ່ສຳເລັດ");

      setOpen(false);
      router.push(`/admin/quizzes/${data.id}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ສ້າງແບບທົດສອບບໍ່ສຳເລັດ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus />
            ສ້າງແບບທົດສອບໃໝ່
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ສ້າງແບບທົດສອບໃໝ່</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="quiz-title" className="text-sm font-medium">
              ຫົວຂໍ້
            </label>
            <Input
              id="quiz-title"
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ຄວາມປອດໄພທາງໄຊເບີເບື້ອງຕົ້ນ"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="quiz-description" className="text-sm font-medium">
              ຄຳອະທິບາຍ (ບໍ່ບັງຄັບ)
            </label>
            <Textarea
              id="quiz-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? <Loader2 className="animate-spin" /> : <Plus />}
              ສ້າງ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
