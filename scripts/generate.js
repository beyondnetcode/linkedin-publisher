/**
 * =============================================================================
 * scripts/generate.js — Motor Principal del Centro de Mando
 * =============================================================================
 *
 * Responsabilidades:
 *   1. Descargar el artículo Markdown desde la URL provista (ARTICLE_URL).
 *   2. Llamar a la API de Google Gemini (gemini-2.5-pro) con un System Prompt
 *      especializado para forzar una respuesta JSON estructurada.
 *   3. Parsear y validar el JSON retornado por Gemini.
 *   4. Crear un Issue en el repositorio actual vía GitHub API, usando el Issue
 *      como "Sala de Aprobación" antes de publicar en LinkedIn.
 *
 * Variables de entorno requeridas (inyectadas por el workflow):
 *   - GEMINI_API_KEY  : Clave de API de Google Gemini.
 *   - GITHUB_TOKEN    : Token nativo de GitHub Actions.
 *   - ARTICLE_URL     : URL pública (raw) del artículo en Markdown.
 *   - GITHUB_REPOSITORY : Provisto automáticamente por GitHub Actions (owner/repo).
 * =============================================================================
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";

// ─── Constantes ──────────────────────────────────────────────────────────────

/**
 * Modelo de Gemini a utilizar.
 * Configurable vía variable de entorno GEMINI_MODEL.
 * Default: gemini-2.5-flash (disponible en free tier).
 * Alternativa de pago: gemini-2.5-pro (requiere billing activo).
 */
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/**
 * System Prompt especializado para el Director de Comunicación.
 * Instruye a Gemini a devolver ÚNICAMENTE un objeto JSON bien formado.
 */
const SYSTEM_PROMPT = `Eres un Director de Comunicación Audiovisual y Arquitecto de Software con 15 años de experiencia. Transforma artículos técnicos en posts de LinkedIn de alto impacto. Devuelve ÚNICAMENTE un objeto JSON con las claves 'post_es', 'post_en' y 'prompt_imagen'. Reglas: Párrafos de máximo 2 líneas, gancho provocativo al inicio, sin enlaces externos en el texto. El prompt_imagen debe ser en inglés, estilo fotográfico hiperrealista cotidiano, sin texto ni gráficos 3D, especificando relación de aspecto 4:5 (vertical).`;

// ─── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Lee una variable de entorno requerida.
 * Lanza un error descriptivo si no está definida.
 *
 * @param {string} name - Nombre de la variable de entorno.
 * @returns {string} Valor de la variable.
 */
function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable de entorno requerida no encontrada: "${name}". ` +
        `Verifica que esté configurada en los secrets del repositorio o en el workflow.`
    );
  }
  return value;
}

/**
 * Descarga el contenido de una URL y lo retorna como texto plano.
 * Valida que la URL sea accesible antes de continuar.
 *
 * @param {string} url - URL pública del artículo Markdown (raw).
 * @returns {Promise<string>} Contenido del artículo en texto plano.
 */
async function fetchArticle(url) {
  core.info(`📄 Descargando artículo desde: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `No se pudo descargar el artículo. ` +
        `HTTP ${response.status} (${response.statusText}) — URL: ${url}`
    );
  }

  const text = await response.text();

  if (!text || text.trim().length === 0) {
    throw new Error(
      `El artículo descargado está vacío. Verifica que la URL apunte al contenido raw correcto.`
    );
  }

  core.info(`✅ Artículo descargado correctamente (${text.length} caracteres).`);
  return text;
}

/**
 * Llama a la API de Google Gemini con el artículo y el System Prompt.
 * Fuerza la respuesta en formato JSON estricto mediante responseMimeType.
 *
 * @param {string} apiKey     - Clave de API de Google Gemini.
 * @param {string} articleText - Texto completo del artículo Markdown.
 * @returns {Promise<{post_es: string, post_en: string, prompt_imagen: string}>}
 */
/**
 * Espera un tiempo determinado (ms) antes de continuar.
 * Usado para backoff exponencial en reintentos.
 *
 * @param {number} ms - Milisegundos a esperar.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Llama a la API de Google Gemini con reintentos automáticos.
 * Implementa backoff exponencial para errores 429 (rate limit).
 *
 * @param {string} apiKey      - Clave de API de Google Gemini.
 * @param {string} articleText - Texto completo del artículo Markdown.
 * @param {number} attempt     - Número de intento actual (para recursión).
 * @returns {Promise<{post_es: string, post_en: string, prompt_imagen: string}>}
 */
async function generateWithGemini(apiKey, articleText, attempt = 1) {
  const MAX_ATTEMPTS = 4;
  const BASE_DELAY_MS = 15000; // 15 segundos base

  core.info(`🤖 Enviando artículo a Gemini (${GEMINI_MODEL}) — intento ${attempt}/${MAX_ATTEMPTS}...`);

  try {
  // Inicializar el cliente de Gemini con la API Key
  const genAI = new GoogleGenAI({ apiKey });

  // Construir el prompt de usuario con el artículo
  const userPrompt = `Aquí está el artículo técnico para transformar:\n\n---\n\n${articleText}`;

  const result = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    config: {
      // System Prompt: define el rol y las reglas de formato
      systemInstruction: SYSTEM_PROMPT,
      // Forzar respuesta JSON — Gemini garantiza un JSON válido como salida
      responseMimeType: "application/json",
      // Temperatura baja para respuestas más consistentes y predecibles
      temperature: 0.7,
    },
  });

  // Extraer el texto de la respuesta
  const rawText = result.text;

  if (!rawText || rawText.trim().length === 0) {
    throw new Error(
      `Gemini retornó una respuesta vacía. ` +
        `Verifica que la GEMINI_API_KEY sea válida y el modelo esté disponible.`
    );
  }

  core.info(`✅ Respuesta recibida de Gemini (${rawText.length} caracteres).`);

  // Parsear el JSON retornado por Gemini
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (parseError) {
    throw new Error(
      `No se pudo parsear la respuesta de Gemini como JSON.\n` +
        `Error de parseo: ${parseError.message}\n` +
        `Respuesta recibida:\n${rawText}`
    );
  }

  // Validar que las tres claves requeridas estén presentes y no vacías
  const requiredKeys = ["post_es", "post_en", "prompt_imagen"];
  for (const key of requiredKeys) {
    if (!parsed[key] || typeof parsed[key] !== "string" || parsed[key].trim() === "") {
      throw new Error(
        `La respuesta de Gemini no contiene la clave requerida "${key}" o está vacía. ` +
          `Claves recibidas: ${Object.keys(parsed).join(", ")}`
      );
    }
  }

  core.info(`✅ JSON de Gemini validado: post_es ✓ | post_en ✓ | prompt_imagen ✓`);
  return parsed;

  } catch (error) {
    const isRateLimit =
      error.message?.includes("429") ||
      error.message?.includes("RESOURCE_EXHAUSTED") ||
      error.message?.includes("Too Many Requests");

    if (isRateLimit && attempt < MAX_ATTEMPTS) {
      // Calcular tiempo de espera con backoff exponencial + jitter aleatorio
      const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 5000;
      const delaySec = Math.round(delayMs / 1000);

      core.warning(
        `⚠️ Rate limit (429) de Gemini detectado. ` +
        `Esperando ${delaySec}s antes del intento ${attempt + 1}/${MAX_ATTEMPTS}...`
      );

      await sleep(delayMs);
      return generateWithGemini(apiKey, articleText, attempt + 1);
    }

    // Si no es rate limit o se agotaron los intentos, propagar el error
    if (isRateLimit) {
      throw new Error(
        `❌ Límite de cuota de Gemini agotado después de ${MAX_ATTEMPTS} intentos.\n\n` +
        `El modelo "${GEMINI_MODEL}" puede no estar disponible en el free tier.\n\n` +
        `Soluciones:\n` +
        `  1. Usa el modelo gratuito: configura GEMINI_MODEL=gemini-2.5-flash en el workflow.\n` +
        `  2. Activa facturación en Google Cloud para usar gemini-2.5-pro.\n` +
        `  3. Espera unos minutos y vuelve a ejecutar el workflow.\n\n` +
        `Más info: https://ai.google.dev/gemini-api/docs/rate-limits`
      );
    }

    throw error;
  }
}

/**
 * Formatea el cuerpo del Issue de GitHub con los tres bloques de contenido.
 * Usa Markdown enriquecido para facilitar la revisión visual.
 *
 * @param {string} articleUrl    - URL del artículo fuente.
 * @param {string} postEs        - Versión del post en español.
 * @param {string} postEn        - Versión del post en inglés.
 * @param {string} promptImagen  - Prompt para generación de imagen.
 * @returns {string} Cuerpo del Issue formateado en Markdown.
 */
function buildIssueBody(articleUrl, postEs, postEn, promptImagen) {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";

  return `
## 🚀 Sala de Aprobación — Post de LinkedIn

> **Artículo fuente:** [${articleUrl}](${articleUrl})
> **Generado:** ${timestamp} por Gemini \`${GEMINI_MODEL}\`

---

## 📝 Versión en Español

${postEs}

---

## 🌐 Versión en Inglés

${postEn}

---

## 🖼️ Prompt para Generación de Imagen

> Copia este prompt en tu herramienta de generación de imágenes (Midjourney, DALL·E, Imagen, etc.)

\`\`\`
${promptImagen}
\`\`\`

---

## ✅ Checklist de Revisión

- [ ] El gancho inicial es suficientemente provocativo
- [ ] Los párrafos no exceden 2 líneas
- [ ] No hay enlaces externos en el texto
- [ ] El tono es apropiado para mi audiencia en LinkedIn
- [ ] El prompt de imagen describe correctamente la escena deseada

---

*Generado automáticamente por el **Centro de Mando LinkedIn** · [linked-publisher](https://github.com/${process.env.GITHUB_REPOSITORY})*
`.trim();
}

/**
 * Crea un Issue en el repositorio de GitHub actual.
 * El Issue actúa como "Sala de Aprobación" para revisar los textos antes de publicar.
 *
 * @param {string} githubToken - Token de autenticación de GitHub Actions.
 * @param {string} articleUrl  - URL del artículo (para el título del Issue).
 * @param {string} body        - Cuerpo del Issue en Markdown.
 * @returns {Promise<string>} URL del Issue creado.
 */
async function createGitHubIssue(githubToken, articleUrl, body) {
  core.info(`📋 Creando Issue en GitHub como Sala de Aprobación...`);

  // Inicializar el cliente de GitHub (Octokit)
  const octokit = github.getOctokit(githubToken);

  // Extraer owner y repo del repositorio actual desde la variable de entorno
  const [owner, repo] = getRequiredEnv("GITHUB_REPOSITORY").split("/");

  // Generar un título descriptivo usando el dominio/path de la URL del artículo
  const urlObject = new URL(articleUrl);
  const articleSlug = urlObject.pathname.split("/").filter(Boolean).pop() || "articulo";
  const issueTitle = `📝 [LinkedIn Draft] ${articleSlug}`;

  const { data: issue } = await octokit.rest.issues.create({
    owner,
    repo,
    title: issueTitle,
    body,
    // Etiquetas para filtrar fácilmente los borradores en el repositorio
    labels: ["linkedin-draft", "pending-review"],
  });

  core.info(`✅ Issue creado exitosamente: ${issue.html_url}`);
  return issue.html_url;
}

// ─── Función Principal ────────────────────────────────────────────────────────

/**
 * Orquesta el flujo completo:
 *   Fetch artículo → Gemini → Parsear JSON → Crear Issue
 */
async function main() {
  try {
    core.info("🚀 Iniciando Centro de Mando LinkedIn...");
    core.info("─".repeat(60));

    // ── 1. Leer variables de entorno requeridas ───────────────────────────
    const geminiApiKey = getRequiredEnv("GEMINI_API_KEY");
    const githubToken = getRequiredEnv("GITHUB_TOKEN");
    const articleUrl = getRequiredEnv("ARTICLE_URL");

    core.info(`🔗 URL del artículo: ${articleUrl}`);

    // ── 2. Descargar el artículo Markdown ─────────────────────────────────
    const articleText = await fetchArticle(articleUrl);

    // ── 3. Generar posts con Gemini ────────────────────────────────────────
    const { post_es, post_en, prompt_imagen } = await generateWithGemini(
      geminiApiKey,
      articleText
    );

    // ── 4. Construir el cuerpo del Issue ───────────────────────────────────
    const issueBody = buildIssueBody(articleUrl, post_es, post_en, prompt_imagen);

    // ── 5. Crear el Issue en GitHub ────────────────────────────────────────
    const issueUrl = await createGitHubIssue(githubToken, articleUrl, issueBody);

    // ── 6. Publicar el enlace como output del workflow ─────────────────────
    core.info("─".repeat(60));
    core.info("✅ ¡Proceso completado exitosamente!");
    core.info(`👉 Revisa tu Sala de Aprobación: ${issueUrl}`);

    // Exponer la URL del Issue como output del step de GitHub Actions
    core.setOutput("issue_url", issueUrl);
    core.notice(`📋 Borrador listo para revisión: ${issueUrl}`);
  } catch (error) {
    // Reportar el error de forma estructurada en el log de GitHub Actions
    core.error(`❌ Error durante la generación del post:`);
    core.setFailed(error.message);
    process.exit(1);
  }
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────
main();
