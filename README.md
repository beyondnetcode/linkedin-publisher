# 🚀 Centro de Mando LinkedIn — `linked-publisher`

> Convierte cualquier artículo técnico en Markdown en un post de LinkedIn bilingüe, listo para publicar, usando **Google Gemini** y **GitHub Actions** — sin depender de Zapier, Make ni ninguna plataforma de terceros.

---

## ¿Cómo funciona en 30 segundos?

```
Tú pegas una URL  →  GitHub Actions descarga el artículo
→  Gemini genera el copy  →  Se crea un Issue en tu repo
→  Tú revisas, editas y publicas en LinkedIn
```

**Nunca hay publicación automática.** Siempre tienes la última palabra.

---

## 📋 Índice

1. [Requisitos previos](#-requisitos-previos)
2. [Paso 1 — Conseguir tu API Key de Gemini](#-paso-1--conseguir-tu-api-key-de-gemini)
3. [Paso 2 — Configurar el Secret en GitHub](#-paso-2--configurar-el-secret-en-github)
4. [Paso 3 — Crear las etiquetas del repositorio](#-paso-3--crear-las-etiquetas-del-repositorio)
5. [Paso 4 — Preparar la URL de tu artículo](#-paso-4--preparar-la-url-de-tu-artículo)
6. [Paso 5 — Lanzar el workflow](#-paso-5--lanzar-el-workflow)
7. [Paso 6 — Revisar tu Sala de Aprobación](#-paso-6--revisar-tu-sala-de-aprobación)
8. [Paso 7 — Publicar en LinkedIn](#-paso-7--publicar-en-linkedin)
9. [Solución de problemas](#-solución-de-problemas)
10. [Arquitectura y seguridad](#-arquitectura-y-seguridad)

---

## ✅ Requisitos previos

Antes de empezar, asegúrate de tener:

- [ ] Una cuenta en **GitHub** (ya la tienes si ves este repo).
- [ ] Acceso a **[Google AI Studio](https://aistudio.google.com/)** para generar una API Key gratuita.
- [ ] Un artículo en formato **Markdown** accesible por URL pública (en GitHub, un Gist, etc.).

> **No necesitas instalar nada en tu computadora.** Todo el procesamiento ocurre en la nube de GitHub.

---

## 🔑 Paso 1 — Conseguir tu API Key de Gemini

1. Abre **[Google AI Studio](https://aistudio.google.com/apikey)** en tu navegador.

2. Haz clic en el botón **"Create API key"**.

   > Si es tu primera vez, puede pedirte crear o seleccionar un proyecto de Google Cloud. Selecciona cualquiera o crea uno nuevo con el nombre que prefieras.

3. Copia la clave generada. Tiene el formato:
   ```
   AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

4. **Guárdala en un lugar seguro** (como un gestor de contraseñas). La necesitarás en el siguiente paso.

> ⚠️ **Importante:** Nunca pegues esta clave directamente en el código ni en un archivo del repositorio. La manejaremos de forma segura en el siguiente paso.

---

## 🔒 Paso 2 — Configurar el Secret en GitHub

Este es el paso más importante para mantener tus credenciales seguras.

1. Ve a tu repositorio en GitHub:
   ```
   https://github.com/beyondnetcode/linkedin-publisher
   ```

2. Haz clic en la pestaña **`Settings`** (la última pestaña del menú superior).

3. En el menú lateral izquierdo, despliega **`Secrets and variables`** → haz clic en **`Actions`**.

4. Haz clic en el botón verde **`New repository secret`**.

5. Rellena el formulario exactamente así:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `GEMINI_API_KEY` |
   | **Secret** | *Pega aquí la clave que copiaste en el Paso 1* |

6. Haz clic en **`Add secret`**.

7. ✅ Verás `GEMINI_API_KEY` listado en la tabla de secrets. Listo.

> El `GITHUB_TOKEN` **no necesitas configurarlo**. GitHub lo genera automáticamente en cada ejecución del workflow.

---

## 🏷️ Paso 3 — Crear las etiquetas del repositorio

Las etiquetas permiten filtrar fácilmente todos tus borradores. Solo necesitas hacerlo **una vez**.

1. Ve a la pestaña **`Issues`** de tu repositorio.

2. Haz clic en el botón **`Labels`** (junto al buscador).

3. Haz clic en **`New label`** y crea la primera etiqueta:

   | Campo | Valor |
   |-------|-------|
   | **Label name** | `linkedin-draft` |
   | **Color** | `#0077B5` *(azul LinkedIn)* |

4. Haz clic en **`Create label`**.

5. Repite para crear la segunda etiqueta:

   | Campo | Valor |
   |-------|-------|
   | **Label name** | `pending-review` |
   | **Color** | `#FFA500` *(naranja)* |

6. ✅ Ya tienes las dos etiquetas. Todos los borradores aparecerán marcados automáticamente.

> **¿Qué pasa si me salto este paso?** El workflow igual funcionará, pero verás un warning en los logs indicando que las etiquetas no existen. El Issue se creará sin etiquetas.

---

## 🔗 Paso 4 — Preparar la URL de tu artículo

El workflow necesita la URL **raw** (texto plano) de tu artículo Markdown. Esta URL devuelve el contenido sin renderizar, que es lo que Gemini puede leer.

### Si tu artículo está en GitHub

1. Navega al archivo `.md` en tu repositorio.
2. Haz clic en el botón **`Raw`** (esquina superior derecha del visor de código).
3. Copia la URL de la barra del navegador. Tendrá este formato:
   ```
   https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/articulo.md
   ```

### Si tu artículo está en un GitHub Gist

1. Abre tu Gist en `https://gist.github.com/TU_USUARIO/ID_DEL_GIST`.
2. Haz clic en **`Raw`** en la esquina superior derecha del archivo.
3. Copia la URL. Tendrá este formato:
   ```
   https://gist.githubusercontent.com/TU_USUARIO/ID_DEL_GIST/raw/articulo.md
   ```

### Si tu artículo está en cualquier otro servidor

Cualquier URL que devuelva texto Markdown plano funcionará, siempre que sea **pública y accesible sin autenticación**.

> ⚠️ **Error frecuente:** Pegar la URL de la página de GitHub (con la interfaz visual) en lugar de la URL raw. Si la URL contiene `github.com/TU_USUARIO/REPO/blob/`, eso es la vista renderizada — necesitas la que contiene `raw.githubusercontent.com`.

---

## ▶️ Paso 5 — Lanzar el workflow

1. Ve a la pestaña **`Actions`** de tu repositorio.

2. En el panel izquierdo, haz clic en **`📝 LinkedIn Post Drafter`**.

3. Verás un banner amarillo que dice *"This workflow has a `workflow_dispatch` event trigger."*. Haz clic en el botón **`Run workflow`** que aparece a la derecha.

4. Se desplegará un pequeño formulario. Rellénalo:

   | Campo | Qué poner |
   |-------|-----------|
   | **Use workflow from** | `Branch: master` (déjalo como está) |
   | **URL pública (raw) del artículo en Markdown** | Pega aquí la URL del Paso 4 |

5. Haz clic en el botón verde **`Run workflow`**.

6. La página se actualizará y verás una nueva ejecución con un círculo amarillo girando (⏳ en progreso).

7. Haz clic sobre esa ejecución para ver los logs en tiempo real. Verás mensajes como:
   ```
   📄 Descargando artículo desde: https://raw.githubusercontent.com/...
   ✅ Artículo descargado correctamente (4821 caracteres).
   🤖 Enviando artículo a Gemini (gemini-2.5-pro)...
   ✅ Respuesta recibida de Gemini (1203 caracteres).
   ✅ JSON de Gemini validado: post_es ✓ | post_en ✓ | prompt_imagen ✓
   📋 Creando Issue en GitHub como Sala de Aprobación...
   ✅ Issue creado exitosamente: https://github.com/beyondnetcode/linkedin-publisher/issues/1
   ```

8. Al terminar, el círculo se volverá verde (✅). El proceso completo tarda entre **20 y 40 segundos**.

---

## 📬 Paso 6 — Revisar tu Sala de Aprobación

1. Ve a la pestaña **`Issues`** de tu repositorio.

2. Verás un nuevo Issue creado automáticamente con el título:
   ```
   📝 [LinkedIn Draft] nombre-del-articulo
   ```

3. Ábrelo. Encontrarás tres secciones:

   ---

   ### 📝 Versión en Español
   El post completo listo para LinkedIn en español. Incluye el gancho inicial, el desarrollo y el cierre con llamada a la acción.

   ---

   ### 🌐 Versión en Inglés
   La misma versión adaptada al inglés, optimizada para audiencias anglófonas.

   ---

   ### 🖼️ Prompt para Generación de Imagen
   Un bloque de código listo para copiar y pegar en tu herramienta de imágenes preferida (Midjourney, DALL·E 3, Adobe Firefly, Google Imagen, etc.). El prompt ya especifica:
   - Estilo fotográfico hiperrealista
   - Relación de aspecto 4:5 (vertical, perfecta para LinkedIn)
   - Sin texto ni elementos 3D artificiales

   ---

   ### ✅ Checklist de Revisión
   Una lista de verificación para asegurarte de que el post cumple con tus estándares antes de publicar.

4. **Edita el Issue** si quieres ajustar algún texto. Haz clic en el ícono de lápiz (✏️) del cuerpo del Issue.

5. Cuando estés satisfecho, cierra el Issue marcándolo como **`Closed as completed`**.

---

## 📤 Paso 7 — Publicar en LinkedIn

1. **Copia** el texto del post (español, inglés, o ambos) del Issue.

2. **Genera la imagen** usando el prompt del Issue en tu herramienta preferida.
   - [Midjourney](https://www.midjourney.com/) — Pega el prompt en Discord con `/imagine`
   - [DALL·E 3](https://openai.com/dall-e-3) — En ChatGPT Plus, pide que genere la imagen con el prompt
   - [Adobe Firefly](https://firefly.adobe.com/) — Pega el prompt en "Text to image"
   - [Google Imagen](https://imagen.research.google/) — Disponible en Google AI Studio

3. En LinkedIn, haz clic en **"Crear una publicación"**.

4. Pega el texto del post.

5. Adjunta la imagen generada (formato recomendado: JPG o PNG, relación 4:5).

6. Publica. 🎉

---

## 🔧 Solución de problemas

### ❌ El workflow falla con "Variable de entorno requerida no encontrada: GEMINI_API_KEY"

**Causa:** El secret no está configurado o tiene un nombre diferente.

**Solución:**
1. Ve a `Settings` → `Secrets and variables` → `Actions`.
2. Verifica que el secret se llame **exactamente** `GEMINI_API_KEY` (respeta mayúsculas).
3. Si no existe, créalo siguiendo el [Paso 2](#-paso-2--configurar-el-secret-en-github).

---

### ❌ El workflow falla con "HTTP 404" al descargar el artículo

**Causa:** La URL del artículo no es correcta o el archivo no es público.

**Solución:**
1. Abre la URL en tu navegador. Debes ver el texto plano del Markdown.
2. Asegúrate de usar la URL **raw** (ver [Paso 4](#-paso-4--preparar-la-url-de-tu-artículo)).
3. Verifica que el repositorio o Gist sea **público**.

---

### ❌ El workflow falla con "No se pudo parsear la respuesta de Gemini"

**Causa:** Gemini devolvió una respuesta inesperada (puede ocurrir con artículos muy cortos o muy largos).

**Solución:**
1. Verifica que el artículo tenga contenido sustancial (mínimo 300 palabras).
2. Vuelve a lanzar el workflow — Gemini a veces falla intermitentemente.
3. Si persiste, revisa los logs completos en la pestaña `Actions` para ver la respuesta exacta de Gemini.

---

### ❌ El Issue se crea pero no tiene etiquetas

**Causa:** Las etiquetas `linkedin-draft` o `pending-review` no existen en el repositorio.

**Solución:** Créalas siguiendo el [Paso 3](#️-paso-3--crear-las-etiquetas-del-repositorio). No afecta el contenido del Issue, solo su categorización.

---

### ❌ No veo la pestaña "Actions" en mi repositorio

**Causa:** GitHub Actions puede estar deshabilitado.

**Solución:**
1. Ve a `Settings` → `Actions` → `General`.
2. Selecciona **"Allow all actions and reusable workflows"**.
3. Guarda los cambios.

---

## 🏗️ Arquitectura y seguridad

### Flujo de datos

```
[Tú] ──workflow_dispatch──▶ [GitHub Actions]
                                   │
                         fetch(ARTICLE_URL)
                                   │
                                   ▼
                         [Servidor externo]
                         Artículo .md en texto plano
                                   │
                         Gemini API (GEMINI_API_KEY)
                                   │
                                   ▼
                         [Google Gemini 2.5 Pro]
                         JSON: post_es, post_en, prompt_imagen
                                   │
                         GitHub API (GITHUB_TOKEN)
                                   │
                                   ▼
                         [Issue en tu repositorio]
                                   │
                                   ▼
                               [Tú] ✅ revisas y publicas
```

### Seguridad de credenciales

| Credencial | Dónde vive | ¿Aparece en logs? | ¿Sale del repo? |
|---|---|---|---|
| `GEMINI_API_KEY` | GitHub Encrypted Secret | ❌ Nunca | ❌ Nunca |
| `GITHUB_TOKEN` | Generado por Actions por ejecución | ❌ Nunca | ❌ Nunca |

### Estructura del proyecto

```
linked-publisher/
├── .github/
│   └── workflows/
│       └── draft.yml       ← Define el workflow (trigger, permisos, pasos)
├── scripts/
│   └── generate.js         ← Motor principal: fetch → Gemini → Issue
├── .gitignore              ← Excluye node_modules y .env del repo
├── package.json            ← Dependencias y configuración ESM
└── README.md               ← Este manual
```

### Dependencias utilizadas

| Paquete | Versión | Propósito |
|---|---|---|
| `@google/genai` | `^0.7.0` | Cliente oficial de Google Gemini |
| `@actions/github` | `^6.0.0` | Cliente de GitHub API (Octokit) |
| `@actions/core` | `^1.10.1` | Logging y manejo de errores en Actions |
| `node-fetch` | `^3.3.2` | Descarga del artículo por HTTP |

---

<div align="center">

Hecho con ☕ y Gemini · [beyondnetcode](https://github.com/beyondnetcode)

</div>
