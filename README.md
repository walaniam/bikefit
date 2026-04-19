# 🚵 Bike Fit — MTB Geometry Visualizer

A lightweight, browser-only tool for mountain bike geometry visualization and fit calculation. No backend, no build step — just open `index.html` in any browser or serve it from a static host.

## Features

- **Interactive SVG diagram** — real-time visualization of bike geometry as you adjust parameters
- **Bike geometry inputs** — head tube, seat tube, top tube, reach, stack, wheelbase, chainstay, BB drop, stem
- **Rider body inputs** — height, leg length, arm length
- **Fit comparison table** — actual geometry vs. recommended values for your body dimensions, with pass/warn/fail status
- **Zero dependencies at runtime** — all JS is vanilla; [Pico CSS](https://picocss.com/) is loaded from a CDN for styling

## Running Locally

No installation needed. Open `index.html` directly in a browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Or serve with any static server, e.g.:
python3 -m http.server 8080
```

Then navigate to `http://localhost:8080`.

## Project Structure

```
bikefit/
├── index.html              # Single-page app entry point
├── css/
│   └── style.css           # App-specific styles (Pico CSS loaded from CDN)
├── js/
│   ├── defaults.js         # Default bike geometry & rider measurements
│   ├── bikeGeometry.js     # Geometry calculations
│   ├── fittingEngine.js    # Fit recommendation logic
│   ├── riderGeometry.js    # Rider body model
│   ├── renderer.js         # SVG rendering
│   └── app.js              # App bootstrap & UI wiring
└── deploy.sh               # Azure deployment script
```

## Deploying to Azure

The site is hosted as an **Azure Blob Storage static website** — a cost-effective option ideal for low-traffic static content (cost is typically a few cents per month).

### Prerequisites

- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- Logged in: `az login`
- Target subscription selected: `az account set --subscription <subscription-id>`

### Deploy

```bash
./deploy.sh
```

The script is idempotent — running it again updates the deployed files without recreating existing resources.

On success it prints the public URL, e.g.:

```
[OK]    Deployment complete!
  URL: https://bikefitbikefitrg.z6.web.core.windows.net/
```

### Configuration

All settings have sensible defaults. Override via environment variables before running the script:

| Variable         | Default                        | Description                                                  |
|------------------|--------------------------------|--------------------------------------------------------------|
| `RESOURCE_GROUP` | `bikefit-rg`                   | Azure resource group that will contain the storage account   |
| `LOCATION`       | `westeurope`                   | Azure region for the resource group and storage account      |
| `STORAGE_ACCOUNT`| auto-derived from `RESOURCE_GROUP` | Storage account name — must be globally unique, 3–24 lowercase alphanumeric chars |

Example with custom values:

```bash
RESOURCE_GROUP=my-rg LOCATION=northeurope STORAGE_ACCOUNT=mybikefitsite ./deploy.sh
```

### What the script does

1. Creates the resource group if it does not exist
2. Creates a `Standard_LRS` storage account if it does not exist
3. Enables static website hosting with `index.html` as both the index and 404 document
4. Uploads `index.html`, `css/`, and `js/` to the `$web` container
5. Prints the public HTTPS endpoint

### Estimated cost

| Resource                     | SKU          | Estimated cost (low traffic) |
|------------------------------|--------------|------------------------------|
| Storage account (LRS)        | Standard_LRS | ~$0.02 / GB stored / month   |
| Blob storage operations      | —            | < $0.01 / month              |
| Egress (same-region free)    | —            | negligible                   |

For a site of this size (< 1 MB) with low traffic, the total monthly cost is effectively **< $0.05**.

### Teardown

To remove all resources:

```bash
az group delete --name "${RESOURCE_GROUP:-bikefit-rg}" --yes --no-wait
```

## License

[MIT](LICENSE)