#!/usr/bin/env bash
# deploy.sh — Deploy Bike Fit static website to Azure Blob Storage
#
# Usage:
#   ./deploy.sh
#
# Environment variables (all optional, defaults shown):
#   RESOURCE_GROUP    — Azure resource group name          (default: bikefit-rg)
#   LOCATION          — Azure region                       (default: westeurope)
#   STORAGE_ACCOUNT   — Storage account name, must be globally unique,
#                       3–24 lowercase alphanumeric chars   (default: auto-generated)
#
# Prerequisites:
#   - Azure CLI (az) installed and logged in  (az login)
#   - Correct subscription selected           (az account set --subscription <id>)

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────

RESOURCE_GROUP="${RESOURCE_GROUP:-bikefit-rg}"
LOCATION="${LOCATION:-westeurope}"

# Storage account name must be globally unique and 3–24 lowercase alphanumeric.
# Default: "bikefit" + 8-char hex digest of the resource group name so that
# repeated runs with the same RESOURCE_GROUP reuse the same storage account.
if [ -z "${STORAGE_ACCOUNT:-}" ]; then
  _suffix=$(echo -n "${RESOURCE_GROUP}" | md5sum | cut -c1-8)
  STORAGE_ACCOUNT="bikefit${_suffix}"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Helpers ───────────────────────────────────────────────────────────────────

info()    { echo "[INFO]  $*"; }
success() { echo "[OK]    $*"; }
warn()    { echo "[WARN]  $*" >&2; }
die()     { echo "[ERROR] $*" >&2; exit 1; }

# ── Preflight checks ──────────────────────────────────────────────────────────

command -v az >/dev/null 2>&1 || die "Azure CLI (az) not found. Install from https://aka.ms/installazurecli"

az account show >/dev/null 2>&1 || die "Not logged in to Azure. Run: az login"

info "Deployment configuration:"
info "  Resource Group  : ${RESOURCE_GROUP}"
info "  Location        : ${LOCATION}"
info "  Storage Account : ${STORAGE_ACCOUNT}"
echo

# ── Resource Group ────────────────────────────────────────────────────────────

if az group show --name "${RESOURCE_GROUP}" >/dev/null 2>&1; then
  info "Resource group '${RESOURCE_GROUP}' already exists — skipping creation."
else
  info "Creating resource group '${RESOURCE_GROUP}' in '${LOCATION}'..."
  az group create \
    --name "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --output none
  success "Resource group created."
fi

# ── Storage Account ───────────────────────────────────────────────────────────

if az storage account show \
     --name "${STORAGE_ACCOUNT}" \
     --resource-group "${RESOURCE_GROUP}" >/dev/null 2>&1; then
  info "Storage account '${STORAGE_ACCOUNT}' already exists — skipping creation."
else
  info "Creating storage account '${STORAGE_ACCOUNT}'..."
  az storage account create \
    --name "${STORAGE_ACCOUNT}" \
    --resource-group "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --allow-blob-public-access true \
    --output none
  success "Storage account created."
fi

# ── Static Website Hosting ────────────────────────────────────────────────────

info "Enabling static website hosting..."
az storage blob service-properties update \
  --account-name "${STORAGE_ACCOUNT}" \
  --static-website \
  --index-document index.html \
  --404-document index.html \
  --auth-mode key \
  --output none
success "Static website hosting enabled."

# ── Upload Site Files ─────────────────────────────────────────────────────────

info "Uploading site files to \$web container..."

_upload() {
  # Usage: _upload <source-dir> <destination> [extra az args...]
  local src="$1" dest="$2"; shift 2
  az storage blob upload-batch \
    --account-name "${STORAGE_ACCOUNT}" \
    --source "${src}" \
    --destination "${dest}" \
    --overwrite \
    --auth-mode key \
    --output none \
    "$@"
}

_upload "${SCRIPT_DIR}"      "\$web" --pattern "index.html"
_upload "${SCRIPT_DIR}/css"  "\$web/css"
_upload "${SCRIPT_DIR}/js"   "\$web/js"

success "Site files uploaded."

# ── Print Endpoint ────────────────────────────────────────────────────────────

ENDPOINT=$(az storage account show \
  --name "${STORAGE_ACCOUNT}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "primaryEndpoints.web" \
  --output tsv)

echo
success "Deployment complete!"
echo "  URL: ${ENDPOINT}"
