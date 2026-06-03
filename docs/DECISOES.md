# Decisões do projeto agentes.grupototum.com

## D-028 — cloudflared 2024.x+ NÃO recarrega ingress via SIGHUP em locally-managed tunnels
**Data:** 2026-06-03
**Contexto:** Editar `/home/totum/.cloudflared/config.yml` + `kill -HUP <pid>` parecia funcionar (sem erro), mas as novas rules de ingress NÃO entram em vigor — apenas as carregadas no startup do processo. Diagnóstico levou ~12h até bater.

**Detecção:**
- Sintoma: `curl -I https://NOVO_HOSTNAME` → 404 `cf-cache-status: DYNAMIC` (edge CF acerta, tunnel não tem rota)
- Confirmação: comparar `stat -c %y config.yml` vs `ps -o lstart= -p $(pgrep cloudflared)` — se config foi modificado DEPOIS do start do processo, ingress está stale
- Versão observada: cloudflared 2026.5.2 (mas comportamento existe desde ~2024)

**Decisão:** Para mudar ingress, SEMPRE fazer restart graceful (novo processo com `--config` sobe, espera registrar ≥2 conexões edge, depois `kill` do antigo). Documentar como runbook.

**Runbook restart graceful:**
```bash
OLD=$(pgrep -u totum -f 'cloudflared tunnel run' | head -1)
su -l totum -c "nohup /home/totum/cloudflared tunnel --config /home/totum/.cloudflared/config.yml run <TUNNEL_UUID> > /home/totum/cloudflared-permanent.log 2>&1 &"
# wait até ver ≥2 'Registered tunnel connection' no log
for i in $(seq 1 10); do
  sleep 2
  R=$(tail -50 /home/totum/cloudflared-permanent.log | grep -c 'Registered tunnel connection')
  [ $R -ge 2 ] && break
done
kill $OLD
```

**Impacto:** ~3-5s de blip em todas as hostnames do tunnel (no caso, `os.grupotchutum.com` + `agentes.grupototum.com`). Cliente Cloudflare faz retry automático.

---

## D-027 — Keycloak issuer não pode ser loopback se OAuth Authorization Code envolve browser
**Data:** 2026-06-03
**Contexto:** O brief original do projeto assumiu `KEYCLOAK_ISSUER=http://127.0.0.1:8180/realms/totum`. Funciona pra discovery server-side, mas falha no browser do user no momento do redirect pra `authorization_endpoint`.

**Decisão pendente:** expor KC via `auth.grupototum.com` (CNAME → mesmo cloudflared tunnel) com ingress bloqueando `/admin/*` por path matching. Requer:
- KC com `KC_HOSTNAME=auth.grupototum.com` + `KC_PROXY=edge`
- Atualizar `KEYCLOAK_ISSUER` no `.env`
- redirectUri no client `agentes-ui` já está OK (`https://agentes.grupototum.com/api/auth/callback`)

---

## D-026 — App agentes-ui roda como root (não user totum)
**Data:** 2026-06-02
**Contexto:** O CLI `openclaw` (que o backend chama via `child_process.spawn` em `lib/gateway.ts`) está em `/root/.nvm/versions/node/v22.22.3/bin/openclaw`, inacessível ao user `totum`.

**Alternativas consideradas:**
- (a) Rodar como root — escolhido, app é trusted (autenticada via KC SSO)
- (b) Wrapper sudoers em `/usr/local/bin/openclaw` — viola D-012 (não tocar em /root)
- (c) Reinstalar openclaw global pra user totum — duplica binary, divergência de versão

**Decisão:** (a). pm2 `agentes-ui` roda como root. Cloudflared continua como totum.

---

## D-025 — Gateway openclaw via CLI `openclaw agent --json` (não HTTP REST)
**Data:** 2026-06-02
**Contexto:** Brief original assumiu `POST /v1/agents/{id}/message` no openclaw-gateway. Esse endpoint não existe. Documentado em `/root/.openclaw/docs/GATEWAY_API_FOR_AGENTES_UI.md`.

**Decisão:** `lib/gateway.ts` faz `spawn("openclaw", ["agent", "--agent", id, "--message", text, "--json"])`. Args via array (zero shell injection). Timeout 90s pra acomodar Cascata Circular (15-45s típico). Parse: `result.meta.finalAssistantVisibleText`.

**V2:** migrar pra WebSocket `ws://127.0.0.1:18789` (streaming, sem cold start ~2-5s do spawn).
