# How to use in Ed-Fi Admin App

1. Download the ZIP (e.g. "sis-v2.1.0.zip")
2. Verify the checksum (see section below — do not skip this step).
3. Extract the ZIP.
4. Run `npm ci` in the extracted `bruno/` folder.
5. Configure Admin App to execute scenarios from `./SIS`.

## Download and verify from Node.js

The following example uses only Node.js built-in modules for download and
checksum verification. Extraction requires a library such as `adm-zip`.

### Step 1 — Read the metadata to get the exact filename and expected checksum

```js
const VERSION = 'v2.1.0'; // pin to a specific release tag
const BASE_URL = 'https://github.com/Ed-Fi-Alliance-OSS/certification-testing/releases/download';

const metadata = await fetch(`${BASE_URL}/${VERSION}/sis-${VERSION}.metadata.json`)
.then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.status}`);
    return res.json();
});

// metadata.zipFileName  → "sis-v2.1.0.zip"
// metadata.sha256       → expected SHA-256 hex string (64 chars)
```

### Step 2 — Download the ZIP into memory

```js
const zipResponse = await fetch(`${BASE_URL}/${VERSION}/${metadata.zipFileName}`);
if (!zipResponse.ok) throw new Error(`Failed to download ZIP: ${zipResponse.status}`);

const zipBuffer = Buffer.from(await zipResponse.arrayBuffer());
```

### Step 3 — Verify the SHA-256 checksum

```js
import crypto from 'node:crypto';

const actualHash = crypto.createHash('sha256').update(zipBuffer).digest('hex');

if (actualHash !== metadata.sha256) {
throw new Error(
    `Checksum mismatch!\n  expected: ${metadata.sha256}\n  actual:   ${actualHash}`
);
}

console.log('Checksum verified ✓');
```

Only continue to extraction after this passes. A mismatch means the
download is corrupted or was tampered with — abort and retry from a fresh download.

### Step 4 — Extract and install

```js
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import AdmZip from 'adm-zip'; // npm install adm-zip

const EXTRACT_DIR = './sis-artifact';

fs.writeFileSync('sis-artifact.zip', zipBuffer);

const zip = new AdmZip('sis-artifact.zip');
zip.extractAllTo(EXTRACT_DIR, /* overwrite */ true);

// Install the exact dependency versions from the artifact's package-lock.json
execSync('npm ci --no-audit --no-fund', {
cwd: `${EXTRACT_DIR}/bruno`,
stdio: 'inherit',
});
```

After `npm ci` completes, the Bruno CLI is available at
`${EXTRACT_DIR}/bruno/node_modules/.bin/bru` and the SIS scenarios
are under `${EXTRACT_DIR}/bruno/SIS/`.