# Guia de publicação — Padaria Villa Reis

Três caminhos, do mais recomendado ao mais restrito. Escolha um.

---

## Decisão rápida

| Preciso de… | Escolha |
| --- | --- |
| Upload de foto **e vídeo** pelo painel, custo baixo | Railway/Render/Fly com volume, storage `local` |
| Vercel (grátis, deploy automático) | Vercel + Supabase Storage ou Cloudflare R2 |
| Controle total, servidor próprio | VPS com Nginx + PM2 |

O ponto que decide é o **storage**: o Next.js roda em qualquer lugar, mas
arquivo enviado pelo administrador só sobrevive onde há disco persistente ou um
storage externo configurado.

---

## Opção 1 — Railway (ou Render/Fly) com volume

1. Crie o projeto a partir do repositório.
2. Adicione um banco **PostgreSQL** pelo próprio painel do provedor.
3. Em `prisma/schema.prisma`, troque `provider = "sqlite"` por
   `provider = "postgresql"`.
4. Crie um **volume** montado em `/app/storage`.
5. Variáveis de ambiente:

   ```env
   DATABASE_URL=<a URL do PostgreSQL do provedor>
   AUTH_SECRET=<64 caracteres aleatórios>
   NEXT_PUBLIC_SITE_URL=https://seudominio.com.br
   STORAGE_DRIVER=local
   UPLOAD_DIR=/app/storage/uploads
   ADMIN_EMAIL=voce@suapadaria.com.br
   ADMIN_PASSWORD=<senha forte>
   ```

6. Comandos:

   ```bash
   # build
   npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
   # start
   npm start
   ```

7. Primeiro deploy: rode `npm run seed` uma vez pelo console do provedor.

Custo típico: US$ 5 a 10 por mês, com banco e volume.

---

## Opção 2 — Vercel + Supabase Storage

A Vercel é serverless: **o disco é apagado a cada requisição**. Por isso o
storage externo é obrigatório.

1. Crie um projeto no [Supabase](https://supabase.com) (plano gratuito serve).
2. Em **Storage**, crie o bucket `villa-reis` e marque como **público**.
3. Em **Settings → API**, copie a URL do projeto e a `service_role key`.
4. Use o PostgreSQL do próprio Supabase como banco (Settings → Database →
   Connection string, modo *Session pooler*).
5. Na Vercel, configure:

   ```env
   DATABASE_URL=postgresql://...
   AUTH_SECRET=...
   NEXT_PUBLIC_SITE_URL=https://seudominio.com.br
   STORAGE_DRIVER=supabase
   SUPABASE_URL=https://xxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_BUCKET=villa-reis
   ```

6. Build command: `prisma generate && prisma migrate deploy && next build`.

**Limitação:** a Vercel recusa requisições acima de 4,5 MB, então o envio de
vídeo pelo painel não funciona nessa hospedagem. Fotos até 4,5 MB funcionam
normalmente. Se vídeo for importante, use a Opção 1 ou 3.

---

## Opção 3 — VPS própria (Ubuntu)

```bash
# dependências
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx postgresql

# aplicação
git clone <seu-repositorio> /var/www/villa-reis
cd /var/www/villa-reis
cp .env.example .env && nano .env      # ajuste as variáveis
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run build

# processo permanente
sudo npm i -g pm2
pm2 start npm --name villa-reis -- start
pm2 startup && pm2 save
```

Nginx (`/etc/nginx/sites-available/villa-reis`):

```nginx
server {
    server_name padariavillareis.com.br www.padariavillareis.com.br;
    client_max_body_size 210M;          # necessário para upload de vídeo

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/villa-reis /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d padariavillareis.com.br -d www.padariavillareis.com.br
```

### Backup

Dois itens precisam de backup, e são independentes:

```bash
# banco
pg_dump villareis | gzip > /backup/villareis-$(date +%F).sql.gz
# arquivos
tar czf /backup/uploads-$(date +%F).tar.gz /var/www/villa-reis/storage/uploads
```

Coloque os dois em um cron diário e envie para fora do servidor.

---

## Checklist depois de publicar

- [ ] Trocar a senha do administrador
- [ ] Preencher Configurações com WhatsApp, endereço e horários reais
- [ ] Substituir o banner e as fotos de demonstração por fotos da padaria
- [ ] Conferir `NEXT_PUBLIC_SITE_URL` com o domínio definitivo
- [ ] Testar um pedido de verdade do celular até o WhatsApp
- [ ] Enviar `https://seudominio.com.br/sitemap.xml` ao Google Search Console
- [ ] Cadastrar a padaria no Google Meu Negócio com o mesmo endereço do site
- [ ] Configurar o backup do banco e da pasta de uploads
