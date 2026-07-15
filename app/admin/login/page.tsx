"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/admin");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-secondary/30 to-transparent p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <ShieldCheck className="size-10 text-primary" />
        <h1 className="text-xl font-bold">ເຂົ້າສູ່ລະບົບຜູ້ດູແລ</h1>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <h2 className="text-sm font-medium text-muted-foreground">ໃຊ້ອີເມວ ແລະ ລະຫັດຜ່ານຂອງທ່ານ</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                ອີເມວ
              </label>
              <Input
                id="email"
                type="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                ລະຫັດຜ່ານ
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="h-11">
              {loading ? <Loader2 className="animate-spin" /> : <LogIn />}
              ເຂົ້າສູ່ລະບົບ
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
