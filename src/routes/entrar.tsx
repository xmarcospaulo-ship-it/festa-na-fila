import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BigButton, Card, Header } from "@/components/party/ui";
import { DEMO_PARTY, ENDED_CODE } from "@/lib/mock-data";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar em uma festa — Festa na Fila" },
      { name: "description", content: "Digite o código da festa e escolha um apelido para pedir músicas." },
      { property: "og:title", content: "Entrar em uma festa — Festa na Fila" },
      { property: "og:description", content: "Digite o código e comece a pedir músicas." },
    ],
  }),
  component: Entrar,
});

const inputCls =
  "min-h-14 w-full rounded-2xl border border-input bg-secondary px-4 text-lg outline-none focus:ring-2 focus:ring-ring";

function Entrar() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [nick, setNick] = useState("");
  const valid = code.trim().length >= 4 && nick.trim().length >= 2;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-md px-4 pt-8">
        <Card>
          <h1 className="text-3xl font-bold">Entrar na festa</h1>
          <p className="mt-1 text-muted-foreground">Sem cadastro. Só o código e um apelido.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!valid) return;
              navigate({ to: "/festa/$codigo", params: { codigo: code.trim().toUpperCase() }, search: { apelido: nick.trim() } });
            }}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Código da festa</span>
              <input
                className={`${inputCls} font-display uppercase tracking-[0.3em]`}
                value={code}
                onChange={(e) => setCode(e.target.value.slice(0, 6))}
                placeholder="EX: FESTA1"
                autoCapitalize="characters"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Seu apelido</span>
              <input className={inputCls} value={nick} onChange={(e) => setNick(e.target.value.slice(0, 20))} placeholder="Como a galera te chama?" />
            </label>
            <BigButton type="submit" disabled={!valid} className="w-full">Entrar 🎶</BigButton>
          </form>
          <p className="mt-5 text-xs text-muted-foreground">
            Demonstração: use <b className="text-foreground">{DEMO_PARTY.code}</b> para uma festa ativa ou{" "}
            <b className="text-foreground">{ENDED_CODE}</b> para ver uma festa encerrada.
          </p>
        </Card>
      </main>
    </div>
  );
}
