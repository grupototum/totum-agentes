# Decisões deste projeto (agentes.grupototum.com)

> Numeração alinhada com DECISOES.md canonical em `/Users/israellemos/Documents/Pixel Systems/vps-totum/DECISOES.md`.
> D-025/D-026/D-027/D-028 originais ficam no canonical. Aqui só registro novas descobertas.

## D-029 — Keycloak issuer NÃO pode ser loopback se OAuth flow envolve browser
**Decidido em:** 2026-06-03
**Contexto:** Brief original do projeto agentes-ui assumiu `KEYCLOAK_ISSUER=http://127.0.0.1:8180/realms/totum`. Funciona pra discovery server-side, mas quebra no browser do user no redirect pra `authorization_endpoint` — browser não consegue resolver loopback do servidor.

**Decisão:** expor KC via `auth.grupototum.com` (mesmo tunnel cloudflared) com path-block `/admin`, `/metrics`, `/health` no ingress. KC já estava em modo proxy compatível (`KC_PROXY=edge` + `KC_HOSTNAME_STRICT=false`) — não precisou restart do container. Cloudflare Zero Trust → Public Hostname registra o domínio no edge (em tunnel locally-managed, **CNAME no DNS sozinho não basta** — precisa do Public Hostname pro edge rotear pro tunnel; descoberta operacional: sem isso, edge responde 503 "Cloudflare reached but couldn't route").

**Impacto:** issuer no id_token vira `https://auth.grupototum.com/realms/totum`. App agentes-ui precisa `KEYCLOAK_ISSUER` apontar pra esse valor (não loopback) — senão `oauth4webapi.processAuthorizationCodeResponse` falha validação de issuer.

**Surface area exposta no auth.grupototum.com:**
- ✅ `/realms/*` — discovery, authorization, token, userinfo, account
- ✅ `/resources/*` — assets do tema KC (CSS, fontes)
- ✅ `/js/*` — JS do KC (validação client-side)
- ❌ `/admin` — bloqueado (admin console)
- ❌ `/metrics` — bloqueado (Prometheus)
- ❌ `/health` — bloqueado (healthcheck interno)
- ❌ `/` raiz e qualquer outro path — fallback 404

Admin continua acessível apenas via loopback (`http://127.0.0.1:8180/admin` da VPS, via SSH ou ssh-tunnel).
