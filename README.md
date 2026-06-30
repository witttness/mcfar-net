# McFarland Summer Social v0.0.1

Event website for the **McFarland Summer Social** – Saturday, July 25, 2026 · St. Louis, MO.

Built with [Eleventy](https://www.11ty.dev/) (static site) and [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/) (RSVP API), designed for deployment to [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/).

---

## Project Structure

```
mcfar-net/
├── src/                    # Eleventy source files
│   ├── _layouts/           # HTML layouts (base.njk)
│   ├── _includes/          # Shared partials (if added)
│   ├── css/                # Stylesheets
│   │   └── style.css
│   ├── js/                 # Client-side scripts
│   │   └── rsvp.js
│   └── index.njk           # Home page
├── api/                    # Azure Functions
│   ├── rsvp/
│   │   ├── function.json   # Function binding config
│   │   └── index.js        # RSVP handler
│   ├── host.json
│   ├── package.json
│   └── local.settings.json.example
├── .github/workflows/      # GitHub Actions CI/CD
├── .eleventy.js            # Eleventy config
├── staticwebapp.config.json
├── package.json
└── README.md
```

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) v4
- [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite) (local Azure Storage emulator) or a real Azure Storage account

### 1. Install dependencies

```bash
# Install Eleventy (root)
npm install

# Install API dependencies
cd api && npm install && cd ..
```

### 2. Run the Eleventy site locally

```bash
npm run dev
```

The site will be available at `http://localhost:8080`. Eleventy watches for changes and auto-reloads.

### 3. Run Azure Functions locally

In a separate terminal:

```bash
# Copy the example settings file
cp api/local.settings.json.example api/local.settings.json

# Edit api/local.settings.json and fill in your storage credentials
# (or use "UseDevelopmentStorage=true" with Azurite running)

cd api
func start
```

The API will be available at `http://localhost:7071/api/rsvp`.

> **Note:** When running both together, the Eleventy dev server proxies `/api/*` requests to the Functions host automatically via Azure Static Web Apps CLI (optional). Alternatively you can use [SWA CLI](https://azure.github.io/static-web-apps-cli/) for a unified local experience:
>
> ```bash
> npx @azure/static-web-apps-cli start _site --api-location api --run "npm run build"
> ```

---

## Environment Variables

The Azure Function uses the following environment variables. Set them in `api/local.settings.json` for local development and in your Azure Static Web App's Application Settings for production.

| Variable | Required | Description |
|---|---|---|
| `AZURE_STORAGE_ACCOUNT_NAME` | ✅ | Azure Storage account name |
| `AZURE_STORAGE_ACCOUNT_KEY` | ✅ | Azure Storage account access key |
| `AZURE_TABLE_NAME` | optional | Table name for RSVPs (default: `rsvps`) |

**Never commit real credentials to source control.**  
Copy `api/local.settings.json.example` to `api/local.settings.json` (already in `.gitignore`) and fill in your values.

---

## Deploying to Azure

### Option A – Azure Static Web Apps (recommended)

1. **Create an Azure Static Web App** in the [Azure Portal](https://portal.azure.com) or with the Azure CLI:

   ```bash
   az staticwebapp create \
     --name mcfar-summer-social \
     --resource-group my-rg \
     --source https://github.com/witttness/mcfar-net \
     --branch main \
     --app-location "/" \
     --api-location "api" \
     --output-location "_site"
   ```

2. **Add the deployment token** to your GitHub repository secrets as `AZURE_STATIC_WEB_APPS_API_TOKEN`.

3. **Configure Application Settings** in the Azure Portal under your Static Web App → Configuration → Application settings:
   - `AZURE_STORAGE_ACCOUNT_NAME`
   - `AZURE_STORAGE_ACCOUNT_KEY`
   - `AZURE_TABLE_NAME` (optional, defaults to `rsvps`)

4. **Push to `main`** – the GitHub Actions workflow (`.github/workflows/azure-static-web-apps.yml`) will build and deploy automatically.

### Option B – Manual build + Azure Blob Static Website

```bash
npm run build        # outputs to _site/
# Upload _site/ contents to your Azure Blob static website container
# Deploy api/ as an Azure Function App
```

---

## RSVP API

**Endpoint:** `POST /api/rsvp`

**Request body (JSON):**

```json
{
  "name":        "Jane Smith",         // required
  "contactInfo": "jane@example.com",   // required (email or phone)
  "attending":   3,                    // required (integer ≥ 1)
  "guestNames":  "John, Lily",         // optional
  "bringing":    "potato salad",       // optional
  "notes":       "we have a stroller"  // optional
}
```

**Success response (200):**

```json
{ "success": true, "message": "RSVP received! See you on July 25th 🎉" }
```

**Validation error response (400):**

```json
{ "error": "Please fix the following: name: Name is required." }
```

---

## License

Private – McFarland family use only.
