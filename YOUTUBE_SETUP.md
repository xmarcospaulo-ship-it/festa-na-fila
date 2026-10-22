# Configuração do player do YouTube

A busca é executada no servidor. Configure a variável secreta `YOUTUBE_API_KEY` no ambiente de execução do projeto (Lovable Cloud/servidor). Não use uma variável `VITE_*` para a chave.

1. No Google Cloud Console, habilite **YouTube Data API v3**.
2. Crie uma chave de API e restrinja-a à YouTube Data API v3.
3. Cadastre-a como segredo de servidor chamado `YOUTUBE_API_KEY`.
4. Aplique `drizzle/migrations/0002_youtube_player_sync.sql` no projeto Supabase antes de publicar.

Alguns vídeos podem não permitir incorporação, mesmo quando aparecem na busca. Navegadores também podem bloquear autoplay com som; isso depende das permissões de reprodução do navegador.
