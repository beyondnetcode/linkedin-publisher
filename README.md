# 🚀 Centro de Mando LinkedIn — linked-publisher

Automatiza la creación de posts de LinkedIn a partir de artículos técnicos en Markdown usando Google Gemini y GitHub Actions, con una arquitectura **Human-in-the-Loop**.

## ✨ Características

- **Sin plataformas de terceros** — Todo corre en tu infraestructura de GitHub.
- **Credenciales seguras** — Solo usa GitHub Secrets nativos.
- **Bilingüe** — Genera el post en español e inglés simultáneamente.
- **Prompt de imagen incluido** — Listo para usar en Midjourney, DALL·E o Imagen.
- **Sala de Aprobación** — Revisa y edita antes de publicar, sin automatismo ciego.

## 📐 Arquitectura

```
Usuario (GitHub UI)
    │
    ▼  workflow_dispatch + article_url
┌──────────────────────────────┐
│   GitHub Actions (draft.yml) │
│  ┌────────────────────────┐  │
│  │  scripts/generate.js   │  │
│  │                        │  │
│  │  1. fetch(article_url) │  │
│  │  2. Gemini API call    │  │
│  │  3. Parse JSON         │  │
│  │  4. Create Issue       │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
    │
    ▼
GitHub Issue (Sala de Aprobación)
    │
    ▼  Revisión humana
Usuario publica en LinkedIn
```

## 🗂️ Estructura del Proyecto

```
linked-publisher/
├── .github/
│   └── workflows/
│       └── draft.yml          # Workflow de GitHub Actions
├── scripts/
│   └── generate.js            # Motor principal (Gemini + GitHub API)
├── .gitignore
├── package.json
└── README.md
```

## ⚙️ Configuración Inicial

### 1. Clonar y preparar el repositorio

```bash
git clone https://github.com/TU_USUARIO/linked-publisher.git
cd linked-publisher
npm install
```

### 2. Configurar el Secret de Gemini

1. Ve a tu repositorio en GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Crea un nuevo secret llamado `GEMINI_API_KEY`.
3. Pega tu clave de API de Google Gemini (obtenida en [Google AI Studio](https://aistudio.google.com/)).

> El `GITHUB_TOKEN` es nativo de GitHub Actions. **No requiere configuración adicional.**

### 3. Crear las etiquetas del repositorio (opcional pero recomendado)

Para que el Issue se etiquete correctamente, crea estas dos etiquetas en tu repo:
- `linkedin-draft` (color sugerido: `#0077B5`)
- `pending-review` (color sugerido: `#FFA500`)

## 🚦 Uso

1. Ve a tu repositorio → **Actions** → **📝 LinkedIn Post Drafter**.
2. Haz clic en **Run workflow**.
3. Pega la URL **raw** de tu artículo Markdown (ej: `https://raw.githubusercontent.com/...`).
4. Haz clic en **Run workflow** para ejecutar.
5. En ~30 segundos, aparecerá un nuevo **Issue** en tu repositorio con:
   - 📝 Post en español listo para copiar/pegar.
   - 🌐 Post en inglés listo para copiar/pegar.
   - 🖼️ Prompt para generar la imagen de portada.
   - ✅ Checklist de revisión editorial.

## 🔐 Seguridad

| Credencial      | Almacenamiento         | Exposición |
|-----------------|------------------------|------------|
| `GEMINI_API_KEY`| GitHub Encrypted Secret | ❌ Nunca en logs |
| `GITHUB_TOKEN`  | Nativo de Actions       | ❌ Nunca en logs |

## 📋 Output de Gemini

El script fuerza a Gemini a retornar **exclusivamente** este JSON:

```json
{
  "post_es": "Texto del post en español...",
  "post_en": "LinkedIn post text in English...",
  "prompt_imagen": "Hyperrealistic photo of a software architect... --ar 4:5"
}
```

## 🛠️ Tecnologías

- **Runtime**: Node.js 20+ (ESM)
- **AI**: Google Gemini 2.5 Pro (`@google/genai`)
- **CI/CD**: GitHub Actions
- **GitHub API**: Octokit (`@actions/github`)
- **HTTP**: `node-fetch`
