import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/party/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Festa na Fila — a fila de músicas da sua festa" },
      { name: "description", content: "Convidados pedem músicas pelo celular e tudo entra numa fila compartilhada. Sem instalar nada." },
      { property: "og:title", content: "Festa na Fila" },
      { property: "og:description", content: "Crie uma festa, compartilhe o código e deixe a galera montar a playlist." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-16 pt-12 text-center sm:pt-24">
        <p className="text-6xl">🪩</p>
        <h1 className="mt-6 text-5xl font-extrabold leading-tight sm:text-7xl">
          <span className="text-party">Festa</span> na Fila
        </h1>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground">
          Conecte o celular na caixa de som, compartilhe o código e deixe os convidados escolherem a próxima música — direto do navegador.
        </p>
        <div className="mt-10 grid w-full max-w-md gap-3">
          <Link to="/anfitriao" className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-glow transition hover:brightness-110">
            🎉 Criar festa
          </Link>
          <Link to="/entrar" className="inline-flex min-h-16 items-center justify-center rounded-2xl border border-border bg-secondary text-lg font-semibold transition hover:bg-muted">
            Entrar em uma festa
          </Link>
        </div>
        <ul className="mt-14 grid w-full gap-3 text-left sm:grid-cols-3">
          {[
            ["📱", "Sem app", "Tudo pelo navegador do celular."],
            ["🙌", "Sem cadastro", "Convidado só escolhe um apelido."],
            ["🎛️", "Anfitrião no controle", "Só ele toca, pausa e ajusta o volume."],
          ].map(([icon, t, d]) => (
            <li key={t} className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="text-2xl">{icon}</p>
              <p className="mt-2 font-semibold">{t}</p>
              <p className="text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
