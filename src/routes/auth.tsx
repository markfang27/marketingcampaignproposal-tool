import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "登录 · Pitch Copilot" },
      {
        name: "description",
        content:
          "登录 Pitch Copilot，保存属于你自己的客户提案记录与行业知识库资料，随时回看、导出或删除。",
      },
      { property: "og:title", content: "登录 · Pitch Copilot" },
      {
        property: "og:description",
        content: "登录后你的提案记录与知识库资料只属于你自己。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      if (!result.data.session) {
        setError("注册成功，请查收邮件完成验证后再登录。");
        return;
      }
      await navigate({ to: "/" });
    } catch (err) {
      console.error("auth failed", err);
      setError(
        mode === "signin"
          ? "登录失败，请检查邮箱和密码是否正确。"
          : "注册失败，请确认邮箱格式，密码至少 6 位。",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold text-primary">PITCH COPILOT</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
          {mode === "signin" ? "登录工作台" : "创建账号"}
        </h1>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <Label className="mb-2 block text-xs font-semibold">邮箱</Label>
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <Label className="mb-2 block text-xs font-semibold">密码</Label>
            <Input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {mode === "signin" ? "登录" : "注册并登录"}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
          >
            {mode === "signin" ? "还没有账号？去注册" : "已有账号？去登录"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void navigate({ to: "/" })}
          >
            先随便看看
          </Button>
        </div>
      </div>
    </main>
  );
}
