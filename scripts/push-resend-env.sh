#!/usr/bin/env bash
# Push RESEND_API_KEY to the linked Vercel project (northium/northiumcu).
# Usage: ./scripts/push-resend-env.sh re_your_key_here

set -euo pipefail

KEY="${1:-}"
if [ -z "$KEY" ]; then
  echo "Usage: ./scripts/push-resend-env.sh re_your_api_key"
  exit 1
fi

for env in production preview development; do
  printf '%s' "$KEY" | vercel env add RESEND_API_KEY "$env" --force
  printf '%s' "helpdesk@northiumcu.com" | vercel env add RESEND_FROM_EMAIL "$env" --force
done

echo "RESEND_API_KEY and RESEND_FROM_EMAIL set for production, preview, and development."
echo "Run: vercel --prod"
