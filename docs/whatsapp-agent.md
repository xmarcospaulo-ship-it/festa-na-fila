# Agente de pedidos por WhatsApp — Festa na Fila

## Fluxo planejado

1. O convidado manda o nome da música para o número oficial do agente.
2. O agente responde com uma pesquisa pública do YouTube, sem chamar a YouTube Data API.
3. O convidado escolhe o vídeo e responde com o link.
4. O backend valida o domínio e extrai o ID do vídeo.
5. O backend adiciona o pedido à fila do evento correspondente e confirma somente depois que o banco aceitar o pedido.

## Estado deste branch

Este branch contém os helpers sem API para:
- criar uma URL pública de pesquisa do YouTube;
- extrair IDs de links oficiais comuns do YouTube;
- converter um ID validado para o formato `Track` já usado pela fila;
- testes unitários dessas regras.

A integração com a WhatsApp Cloud API ainda não está ativa. Não há webhook, envio/recebimento real de mensagens nem associação persistente entre número de telefone e festa neste primeiro commit.

## Próximos passos para ativar o agente

1. Criar um app Meta e configurar a WhatsApp Cloud API e o webhook HTTPS.
2. Implementar a verificação GET do webhook e validar a assinatura das notificações POST.
3. Persistir o estado da conversa e associar o número do convidado ao código da festa, sem confiar em códigos arbitrários enviados por terceiros.
4. Enviar mensagens pela API oficial usando token e Phone Number ID guardados exclusivamente como segredos do servidor.
5. Adicionar idempotência para não processar o mesmo webhook mais de uma vez, além de limites anti-spam.
6. Conectar a inclusão à função SQL pública `add_party_request`, verificando o formato real da RPC e as regras de segurança do banco.
7. Configurar as mensagens de teste da Meta e validar build, testes e o fluxo ponta a ponta.

## Variáveis esperadas na integração futura

- `WHATSAPP_VERIFY_TOKEN`: segredo escolhido para a verificação do webhook.
- `WHATSAPP_ACCESS_TOKEN`: token de acesso da Meta, apenas no servidor.
- `WHATSAPP_PHONE_NUMBER_ID`: ID do número remetente registrado na Cloud API.
- `WHATSAPP_APP_SECRET`: segredo do app Meta, usado para verificar a assinatura do webhook.

Não colocar esses valores no código, no frontend, nem em commits do Git. A disponibilidade de um número de teste não significa que o agente já está pronto para receber mensagens públicas.
