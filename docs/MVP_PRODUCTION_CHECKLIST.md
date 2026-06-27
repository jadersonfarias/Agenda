# Checklist de Produção — MVP MarcaCerta

Use este checklist em um ambiente de homologação com configuração equivalente à produção.

## 1. Variáveis e secrets

- [ ] Configurar `DATABASE_URL`.
- [ ] Configurar `NEXT_PUBLIC_API_URL`.
- [ ] Configurar `API_URL`.
- [ ] Configurar `NEXTAUTH_URL`.
- [ ] Configurar `FRONTEND_URL`.
- [ ] Configurar `ALLOWED_ORIGINS` somente com domínios confiáveis.
- [ ] Configurar `HOST`.
- [ ] Gerar `NEXTAUTH_SECRET` forte e exclusivo.
- [ ] Gerar `JWT_SECRET` forte, exclusivo e diferente do `NEXTAUTH_SECRET`.
- [ ] Configurar `NEXT_PUBLIC_PIX_KEY`.
- [ ] Configurar `NEXT_PUBLIC_SUPPORT_WHATSAPP`.
- [ ] Confirmar `NEXT_PUBLIC_BASIC_PRICE` e `NEXT_PUBLIC_PRO_PRICE`.
- [ ] Verificar que nenhum secret real foi commitado.

## 2. Banco e migrations

- [ ] Criar banco PostgreSQL exclusivo do ambiente.
- [ ] Habilitar SSL quando exigido pelo provedor.
- [ ] Fazer backup antes de migrations em banco com dados.
- [ ] Executar `npm --workspace=backend run prisma:generate`.
- [ ] Aplicar migrations com o processo apropriado do ambiente.
- [ ] Confirmar que todas as migrations estão aplicadas.
- [ ] Validar índices e conexão do backend.

## 3. Seed e credenciais de desenvolvimento

- [ ] Não executar `npm run seed` em produção.
- [ ] Não publicar usuários, e-mails ou senhas da seed.
- [ ] Remover dados fictícios de homologação antes de liberar o ambiente.
- [ ] Confirmar que `Demo@12345` não funciona em nenhuma conta de produção.

## 4. CORS, domínio e rede

- [ ] Apontar DNS do frontend e da API.
- [ ] Ativar HTTPS.
- [ ] Confirmar `NEXTAUTH_URL` e `FRONTEND_URL` com HTTPS e sem barra final indevida.
- [ ] Confirmar que `ALLOWED_ORIGINS` não contém curingas ou domínios desnecessários.
- [ ] Testar chamadas browser → API no domínio final.
- [ ] Testar proxy `/backend` caso seja usado em produção.

## 5. Validação automatizada

Executar sem erros:

```bash
npm --workspace=frontend run lint
npm --workspace=frontend exec tsc -- --noEmit
npm --workspace=frontend run build
npm --workspace=backend run test
npm --workspace=backend run build
git diff --check
```

- [ ] Revisar também os avisos do ESLint; eles não devem ser ignorados indefinidamente.
- [ ] Executar `npm audit --omit=dev`.
- [ ] Corrigir vulnerabilidades runtime altas/moderadas com upgrades controlados.
- [ ] Não usar `npm audit fix --force` sem revisar breaking changes e repetir toda a regressão.

## 6. Fluxo público real

- [ ] Criar uma conta em `/signup`.
- [ ] Fazer login.
- [ ] Configurar o horário do negócio.
- [ ] Criar serviço com descrição, preço e duração.
- [ ] Copiar o link público no painel.
- [ ] Abrir `/b/[slug]` em janela anônima.
- [ ] Confirmar que o serviço e a descrição aparecem.
- [ ] Criar uma reserva real.
- [ ] Confirmar que o horário reservado deixa de ficar disponível.
- [ ] Abrir `/appointments/[token]`.
- [ ] Consultar a reserva em `/meus-agendamentos`.
- [ ] Cancelar a reserva pública por token.
- [ ] Confirmar que nenhum dado de outro cliente é exposto.

## 7. Demo

- [ ] Abrir `/demo`.
- [ ] Percorrer todas as quatro etapas.
- [ ] Confirmar os avisos de dados fictícios.
- [ ] Confirmar que a ação final não cria `Customer` nem `Appointment` no banco.
- [ ] Confirmar que a demo não altera disponibilidade real.

## 8. Painel admin

- [ ] Entrar no `/admin`.
- [ ] Confirmar negócio atual e troca de business quando houver mais de um.
- [ ] Ver agenda e filtros de status/responsável.
- [ ] Atribuir responsável como `OWNER`/`ADMIN`.
- [ ] Marcar agendamento como concluído.
- [ ] Confirmar atualização do financeiro.
- [ ] Editar e excluir serviços permitidos.
- [ ] Confirmar que serviços com appointments vinculados não são excluídos.
- [ ] Criar convite e aceitar com usuário novo.
- [ ] Alterar/remover membro permitido.

## 9. Permissões

- [ ] `OWNER` acessa agenda, serviços, equipe, financeiro e configurações.
- [ ] `ADMIN` acessa agenda, serviços, financeiro e configurações conforme regra atual.
- [ ] `ADMIN` não gerencia equipe quando a UI/regra atual bloquear.
- [ ] `STAFF` vê apenas a agenda permitida na UI.
- [ ] `STAFF` lista somente appointments atribuídos a ele.
- [ ] `STAFF` não altera appointment de outro responsável.
- [ ] Usuário do Business A não acessa dados do Business B.
- [ ] Usuário comum não acessa `/admin-master` nem `/platform/*`.
- [ ] Fluxos de equipe aceitam apenas `ADMIN` e `STAFF`; signup continua criando o `OWNER` inicial.

## 10. Assinatura vencida

- [ ] Testar `TRIALING` dentro do prazo.
- [ ] Testar o período de tolerância de 1 dia.
- [ ] Testar `PAST_DUE`.
- [ ] Testar `CANCELED`.
- [ ] Confirmar que leituras continuam disponíveis.
- [ ] Confirmar bloqueio de criar/editar/excluir serviço.
- [ ] Confirmar bloqueio de horários, convites e memberships.
- [ ] Confirmar bloqueio de criação, status, responsável e cancelamento de appointment.
- [ ] Confirmar mensagem amigável de plano expirado.

## 11. Admin Master

- [ ] Entrar com platform admin em `/admin-master`.
- [ ] Confirmar que usuário comum é redirecionado/bloqueado.
- [ ] Navegar pela paginação sem carregar todas as páginas.
- [ ] Ativar ou renovar plano.
- [ ] Marcar plano como vencido.
- [ ] Cancelar assinatura.
- [ ] Confirmar atualização do painel admin do cliente.

## 12. Sessão expirada

- [ ] Testar token expirado no `/admin`.
- [ ] Testar token expirado no `/admin-master`.
- [ ] Confirmar redirecionamento para `/login?reason=session-expired`.
- [ ] Confirmar mensagem amigável.
- [ ] Confirmar que o erro técnico do JWT não aparece ao usuário.

## 13. Mobile e navegadores

- [ ] Testar smartphone pequeno.
- [ ] Testar tablet.
- [ ] Testar desktop.
- [ ] Testar Chrome/Edge e Safari ou Firefox.
- [ ] Validar modais, calendários, dropdowns e rolagem.
- [ ] Validar botões, foco, teclado e mensagens de erro.

## 14. Observabilidade e backup

- [ ] Registrar erros do backend sem incluir senha, token ou dados sensíveis.
- [ ] Configurar logs de deploy e reinício.
- [ ] Configurar monitoramento simples de disponibilidade da API/frontend.
- [ ] Definir alerta para erro 5xx e indisponibilidade.
- [ ] Configurar backup automático do PostgreSQL.
- [ ] Testar restauração de um backup.
- [ ] Definir retenção e responsável pelos backups.

## 15. Pode ficar para depois do MVP

- Gateway de pagamento e conciliação automática Pix.
- Upload de comprovante.
- Foto de perfil manual.
- Resumo diário por e-mail.
- Notificações automáticas por WhatsApp/e-mail.
- Cliente escolher profissional.
- CRUD administrativo de bloqueios manuais.
- Relatórios avançados e exportações.
- Automação de cobrança, fidelidade e lista de espera.
