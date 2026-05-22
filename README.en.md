# 🚀 LinkedIn Command Center — `linked-publisher`

<div align="right">

🌐 **Language / Idioma:** [Español](./README.md) &nbsp;|&nbsp; English

</div>

> Turns any technical Markdown article into a bilingual LinkedIn post — ready to publish — using **Google Gemini** and **GitHub Actions**. No Zapier, no Make, no third-party platforms.

---

## How it works in 30 seconds

```
You paste a URL  →  GitHub Actions downloads the article
→  Gemini generates the copy  →  A GitHub Issue is created
→  You review, edit, and publish on LinkedIn
```

**There is no automatic publishing.** You always have the final say.

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Step 1 — Get your Gemini API Key](#-step-1--get-your-gemini-api-key)
3. [Step 2 — Configure the GitHub Secret](#-step-2--configure-the-github-secret)
4. [Step 3 — Create repository labels](#️-step-3--create-repository-labels)
5. [Step 4 — Prepare your article URL](#-step-4--prepare-your-article-url)
6. [Step 5 — Run the workflow](#️-step-5--run-the-workflow)
7. [Step 6 — Review your Approval Room](#-step-6--review-your-approval-room)
8. [Step 7 — Publish on LinkedIn](#-step-7--publish-on-linkedin)
9. [Troubleshooting](#-troubleshooting)
10. [Architecture & Security](#️-architecture--security)

---

## ✅ Prerequisites

Before you start, make sure you have:

- [ ] A **GitHub** account (you already have one if you're reading this).
- [ ] Access to **[Google AI Studio](https://aistudio.google.com/)** to generate a free API Key.
- [ ] A **Markdown** article accessible via a public URL (GitHub, Gist, etc.).

> **You don't need to install anything on your computer.** All processing runs in the GitHub cloud.

---

## 🔑 Step 1 — Get your Gemini API Key

1. Open **[Google AI Studio](https://aistudio.google.com/apikey)** in your browser.

2. Click the **"Create API key"** button.

   > If it's your first time, it may ask you to create or select a Google Cloud project. Pick any or create a new one with any name.

3. Copy the generated key. It looks like:
   ```
   AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

4. **Save it somewhere safe** (like a password manager). You'll need it in the next step.

> ⚠️ **Important:** Never paste this key directly into code or into any file in the repository. We'll handle it securely in the next step.

---

## 🔒 Step 2 — Configure the GitHub Secret

This is the most important step to keep your credentials safe.

1. Go to your repository on GitHub:
   ```
   https://github.com/beyondnetcode/linkedin-publisher
   ```

2. Click the **`Settings`** tab (last tab in the top menu).

3. In the left sidebar, expand **`Secrets and variables`** → click **`Actions`**.

4. Click the green **`New repository secret`** button.

5. Fill in the form exactly like this:

   | Field | Value |
   |-------|-------|
   | **Name** | `GEMINI_API_KEY` |
   | **Secret** | *Paste the key you copied in Step 1* |

6. Click **`Add secret`**.

7. ✅ You'll see `GEMINI_API_KEY` listed in the secrets table. Done.

> The `GITHUB_TOKEN` **does not need to be configured**. GitHub generates it automatically on every workflow run.

---

## 🏷️ Step 3 — Create repository labels

Labels let you easily filter all your drafts. You only need to do this **once**.

1. Go to the **`Issues`** tab of your repository.

2. Click the **`Labels`** button (next to the search bar).

3. Click **`New label`** and create the first label:

   | Field | Value |
   |-------|-------|
   | **Label name** | `linkedin-draft` |
   | **Color** | `#0077B5` *(LinkedIn blue)* |

4. Click **`Create label`**.

5. Repeat to create the second label:

   | Field | Value |
   |-------|-------|
   | **Label name** | `pending-review` |
   | **Color** | `#FFA500` *(orange)* |

6. ✅ Both labels are ready. All drafts will be tagged automatically.

> **What if I skip this step?** The workflow will still work, but you'll see a warning in the logs. The Issue will be created without labels.

---

## 🔗 Step 4 — Prepare your article URL

The workflow needs the **raw** URL of your Markdown article. This URL returns the plain text content, which is what Gemini reads.

### If your article is on GitHub

1. Navigate to the `.md` file in your repository.
2. Click the **`Raw`** button (top-right corner of the code viewer).
3. Copy the URL from the browser address bar. It will look like:
   ```
   https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/article.md
   ```

### If your article is in a GitHub Gist

1. Open your Gist at `https://gist.github.com/YOUR_USER/GIST_ID`.
2. Click **`Raw`** in the top-right corner of the file.
3. Copy the URL. It will look like:
   ```
   https://gist.githubusercontent.com/YOUR_USER/GIST_ID/raw/article.md
   ```

### If your article is on any other server

Any URL that returns plain Markdown text will work, as long as it's **public and accessible without authentication**.

> ⚠️ **Common mistake:** Pasting the GitHub page URL (with the visual interface) instead of the raw URL. If the URL contains `github.com/USER/REPO/blob/`, that's the rendered view — you need the one with `raw.githubusercontent.com`.

---

## ▶️ Step 5 — Run the workflow

1. Go to the **`Actions`** tab of your repository.

2. In the left panel, click **`📝 LinkedIn Post Drafter`**.

3. You'll see a yellow banner saying *"This workflow has a `workflow_dispatch` event trigger."* Click the **`Run workflow`** button on the right.

4. A small form will appear. Fill it in:

   | Field | What to enter |
   |-------|--------------|
   | **Use workflow from** | `Branch: main` (leave as is) |
   | **Public (raw) URL of the Markdown article** | Paste the URL from Step 4 |

5. Click the green **`Run workflow`** button.

6. The page will refresh and you'll see a new run with a spinning yellow circle (⏳ in progress).

7. Click on that run to see real-time logs. You'll see messages like:
   ```
   📄 Downloading article from: https://raw.githubusercontent.com/...
   ✅ Article downloaded successfully (4821 characters).
   🤖 Sending article to Gemini (gemini-2.5-pro)...
   ✅ Response received from Gemini (1203 characters).
   ✅ Gemini JSON validated: post_es ✓ | post_en ✓ | prompt_imagen ✓
   📋 Creating GitHub Issue as Approval Room...
   ✅ Issue created successfully: https://github.com/beyondnetcode/linkedin-publisher/issues/1
   ```

8. When finished, the circle turns green (✅). The entire process takes **20 to 40 seconds**.

---

## 📬 Step 6 — Review your Approval Room

1. Go to the **`Issues`** tab of your repository.

2. You'll see a new Issue created automatically with the title:
   ```
   📝 [LinkedIn Draft] article-name
   ```

3. Open it. You'll find three sections:

   ---

   ### 📝 Spanish Version
   The complete LinkedIn-ready post in Spanish. Includes the opening hook, body, and closing call to action.

   ---

   ### 🌐 English Version
   The same post adapted to English, optimized for English-speaking audiences.

   ---

   ### 🖼️ Image Generation Prompt
   A code block ready to copy and paste into your preferred image tool (Midjourney, DALL·E 3, Adobe Firefly, Google Imagen, etc.). The prompt already specifies:
   - Hyperrealistic photographic style
   - 4:5 aspect ratio (vertical, perfect for LinkedIn)
   - No text or artificial 3D elements

   ---

   ### ✅ Review Checklist
   A verification list to make sure the post meets your standards before publishing.

4. **Edit the Issue** if you want to adjust any text. Click the pencil icon (✏️) in the Issue body.

5. When satisfied, close the Issue by marking it as **`Closed as completed`**.

---

## 📤 Step 7 — Publish on LinkedIn

1. **Copy** the post text (Spanish, English, or both) from the Issue.

2. **Generate the image** using the prompt from the Issue in your preferred tool.
   - [Midjourney](https://www.midjourney.com/) — Paste the prompt in Discord with `/imagine`
   - [DALL·E 3](https://openai.com/dall-e-3) — In ChatGPT Plus, ask it to generate the image with the prompt
   - [Adobe Firefly](https://firefly.adobe.com/) — Paste the prompt in "Text to image"
   - [Google Imagen](https://imagen.research.google/) — Available in Google AI Studio

3. On LinkedIn, click **"Start a post"**.

4. Paste the post text.

5. Attach the generated image (recommended format: JPG or PNG, 4:5 ratio).

6. Publish. 🎉

---

## 🔧 Troubleshooting

### ❌ Workflow fails with "Required environment variable not found: GEMINI_API_KEY"

**Cause:** The secret is not configured or has a different name.

**Solution:**
1. Go to `Settings` → `Secrets and variables` → `Actions`.
2. Verify the secret is named **exactly** `GEMINI_API_KEY` (case-sensitive).
3. If it doesn't exist, create it following [Step 2](#-step-2--configure-the-github-secret).

---

### ❌ Workflow fails with "HTTP 404" when downloading the article

**Cause:** The article URL is incorrect or the file is not public.

**Solution:**
1. Open the URL in your browser. You should see the plain Markdown text.
2. Make sure you're using the **raw** URL (see [Step 4](#-step-4--prepare-your-article-url)).
3. Verify the repository or Gist is **public**.

---

### ❌ Workflow fails with "Could not parse Gemini response"

**Cause:** Gemini returned an unexpected response (can happen with very short or very long articles).

**Solution:**
1. Verify the article has substantial content (minimum 300 words).
2. Re-run the workflow — Gemini occasionally fails intermittently.
3. If it persists, check the full logs in the `Actions` tab to see Gemini's exact response.

---

### ❌ The Issue is created but has no labels

**Cause:** The `linkedin-draft` or `pending-review` labels don't exist in the repository.

**Solution:** Create them following [Step 3](#️-step-3--create-repository-labels). This doesn't affect the Issue content, only its categorization.

---

### ❌ I don't see the "Actions" tab in my repository

**Cause:** GitHub Actions may be disabled.

**Solution:**
1. Go to `Settings` → `Actions` → `General`.
2. Select **"Allow all actions and reusable workflows"**.
3. Save changes.

---

## 🏗️ Architecture & Security

### Data flow

```
[You] ──workflow_dispatch──▶ [GitHub Actions]
                                   │
                         fetch(ARTICLE_URL)
                                   │
                                   ▼
                         [External server]
                         Plain text .md article
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
                         [Issue in your repository]
                                   │
                                   ▼
                               [You] ✅ review and publish
```

### Credential security

| Credential | Where it lives | Appears in logs? | Leaves the repo? |
|---|---|---|---|
| `GEMINI_API_KEY` | GitHub Encrypted Secret | ❌ Never | ❌ Never |
| `GITHUB_TOKEN` | Generated by Actions per run | ❌ Never | ❌ Never |

### Project structure

```
linked-publisher/
├── .github/
│   └── workflows/
│       └── draft.yml       ← Defines the workflow (trigger, permissions, steps)
├── scripts/
│   └── generate.js         ← Main engine: fetch → Gemini → Issue
├── .gitignore              ← Excludes node_modules and .env from the repo
├── package.json            ← Dependencies and ESM configuration
├── README.md               ← Manual in Spanish
└── README.en.md            ← This manual (English)
```

### Stack & dependencies

| | Technology | Version |
|---|---|---|
| **Runtime** | Node.js 22 LTS | `v22.16.0` |
| **AI** | Google Gemini 2.5 Pro | — |
| **CI/CD** | GitHub Actions | — |

| npm Package | Version | Purpose |
|---|---|---|
| `@google/genai` | `^0.7.0` | Official Google Gemini client |
| `@actions/github` | `^6.0.0` | GitHub API client (Octokit) |
| `@actions/core` | `^1.10.1` | Logging and error handling in Actions |
| `node-fetch` | `^3.3.2` | HTTP article download |

---

<div align="center">

Made with ☕ and Gemini · [beyondnetcode](https://github.com/beyondnetcode)

</div>
