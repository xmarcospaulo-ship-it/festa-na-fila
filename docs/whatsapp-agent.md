# Agente de pedidos por WhatsApp — Festa na Fila

## Fluxo planejado

1. O convidado manda o nome da música para o número oficial do agente.
2. O agente responde com uma pesquisa pública do YouTube, sem chamar a YouTube Data API.
3. O convidado escolhe o vídeo e responde com o link.
4. O backend valida o domínio e extrai o ID do vídeo.
5. O backend adiciona o pedido à fila do evento correspondente e confirma somente depois que o banco aceitar o pedido.

## Estado deste branch

Implementado até agora:
- Helpers para criar uma URL pública de pesquisa do YouTube sem consumir a cota de pesquisa da API.
- Validação de links oficiais comuns e extração do ID do vídeo.
- Conversão de um ID validado para o formato `Track` usado pela fila.
- Testes unitários para os helpers.
- Endpoint de webhook em `/api/whatsapp`:
  - GET: verifica o token e devolve o desafio solicitado pela Meta.
  - POST: exige assinatura `X-Hub-Signature-256` válida, valida o JSON e confirma o recebimento.
  - Logs não incluem conteúdo das mensagens nem números de telefone.

**Ainda não é um agente pronto para convidados.** O webhook recebe e valida notificações, mas ainda não envia respostas, não guarda o estado da conversa, não associa telefone à festa e não adiciona músicas à fila. Os testes/build ainda precisam ser executados em CI.

## Configuração do webhook na Meta

Configure a URL HTTPS pública:
`https://SEU-DOMINIO/api/whatsapp`

Use `WHATSAPP_VERIFY_TOKEN` como o token de verificação definido por você no servidor e informe o mesmo valor no painel da Meta. Assine o campo de webhook `messages` na configuração do produto WhatsApp.

O GET retorna o valor `hub.challenge` somente quando o modo é `subscribe` e o token coincide. O POST valida HMAC-SHA256 sobre o corpo bruto usando o segredo do app Meta. Sem `WHATSAPP_APP_SECRET`, o endpoint recusa POSTs; essa falha fechada é intencional.

## Variáveis de ambiente do servidor

- `WHATSAPP_VERIFY_TOKEN`: segredo aleatório escolhido para a verificação GET.
- `WHATSAPP_APP_SECRET`: segredo do app Meta usado para verificar a assinatura dos POSTs.
- `WHATSAPP_ACCESS_TOKEN`: token de acesso da Meta para enviar mensagens (ainda não utilizado).
- `WHATSAPP_PHONE_NUMBER_ID`: ID do número remetente da Cloud API (ainda não utilizado).

Não coloque esses valores no código, no frontend, nem em commits do Git. Não use o token temporário da Meta como configuração permanente de produção.

## Próximos passos

1. Testar build e testes em CI e ajustar o endpoint conforme o runtime de deploy.
2. Configurar app Meta, webhook HTTPS, token de verificação, segredo do app e assinatura de `messages`.
3. Implementar envio de mensagens pela Cloud API.
4. Persistir o estado da conversa e associar com segurança o telefone ao código da festa.
5. Adicionar idempotência para evitar processar o mesmo webhook mais de uma vez e limites anti-spam.
6. Integrar à RPC `add_party_request` depois de conferir o formato e as regras de segurança do banco.
7. Testar o fluxo completo com o número de teste da Meta antes de liberar para convidados.
