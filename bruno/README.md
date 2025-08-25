# Bruno API Testing Collection

Welcome! 👋 This folder holds our Bruno collections used for API certification and functional verification. If you're new to Bruno or just ramping on this repo, this guide gives you the “why”, the “how”, and a few power‑user tips to keep you moving fast.

---

## 1. What Is This?
We use [Bruno](https://docs.usebruno.com/) as our source-controlled API client. Everything lives as plain text `.bru` files, so reviews, diffs, and history are first‑class. No opaque exports. No surprise state.

**Primary goals of this collection:**
1. Validate Ed-Fi API behavior for certification scenarios
2. Provide reproducible test flows (auth → lookup → assert)
3. Enable richer scripting via Developer Mode (see below)

---

## 2. Safe Mode vs Developer Mode (Enable This!)
Bruno ships with two JavaScript sandbox modes:

| Mode | Use Case | Capabilities |
|------|----------|--------------|
| Safe (default) | Quick manual pokes | Limited JS, no external libs |
| Developer | Our standard | Full JS, modules (lodash, moment, etc.) |

Turn on Developer Mode:
1. Open Bruno → Preferences → General
2. Switch **Safe Mode** OFF
3. Re-run a request with a script to confirm (no errors about restricted APIs)

> 🔐 Why it matters: All advanced scripting, utility functions, external libs, and richer assertions in this repo assume Developer Mode. In Safe Mode some tests silently underperform or fail.

---

## 3. External Libraries (Superpower Section)
Developer Mode lets us `require` a curated set of external libs. Common ones we use (or plan to):

| Library | Purpose | Example |
|---------|---------|---------|
| lodash | Collection + object utilities | `_.map(records, 'id')` |
| moment | Date/time formatting | `moment().format('YYYY-MM-DD')` |
| uuid | Unique IDs for correlation | `uuidv4()` |
| crypto-js | Hashing/signatures | `CryptoJS.SHA256(payload)` |
| faker | Synthetic test data | `faker.person.fullName()` |

### Lodash Example
```javascript
const _ = require('lodash');
const users = res.data;
const active = _.filter(users, { status: 'active' });
bru.setEnvVar('activeUserCount', active.length);
```

### Mixed Example
```javascript
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require('crypto-js');

bru.setEnvVar('today', moment().format('YYYY-MM-DD'));
bru.setEnvVar('traceId', uuidv4());
bru.setEnvVar('payloadSig', CryptoJS.SHA256('demo').toString());
```

> 💡 Tip: Keep library usage purposeful; prefer native JS (e.g. `Array.prototype.reduce`) when simple—minimizes mental overhead.

Relevant docs: [External Libraries](https://docs.usebruno.com/testing/script/external-libraries)

---

## 4. Script Lifecycle (Where Code Runs)
We leverage both **pre-request** and **post-response** scripts.

### Pre‑Request (Auth, Setup, Chaining)
```javascript
await bru.sendRequest({
    url: `${bru.getEnvVar('baseUrl')}/oauth/token`,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: {
        grant_type: 'client_credentials',
        client_id: bru.getEnvVar('clientId'),
        client_secret: bru.getEnvVar('clientSecret')
    }
}, (err, res) => {
    if (err) console.log('Auth error', err);
    else bru.setEnvVar('accessToken', res.data.access_token);
});
```

### Post‑Response (Assertions, Extraction, Flow)
```javascript
test('Status is 200', () => {
    expect(res.getStatus()).to.equal(200);
});

const body = res.getBody();
const latest = bru.findLatestByModifiedDate(body);

test('Latest record exists', () => {
    expect(latest).to.not.be.null;
    expect(latest.id).to.not.be.empty;
});

bru.setEnvVar('recordId', latest.id);
```

### Shared Utility Functions (Defined at collection level)
```javascript
bru.findLatestByModifiedDate = data => Array.isArray(data) && data.length
    ? data.reduce((acc, cur) => !acc || cur._lastModifiedDate > acc._lastModifiedDate ? cur : acc, null)
    : null;

bru.findLatestByDateProperty = (data, prop) => Array.isArray(data) && data.length
    ? data.reduce((acc, cur) => !acc || cur[prop] > acc[prop] ? cur : acc, null)
    : null;
```

Docs: [Script Flow](https://docs.usebruno.com/testing/script/script-flow) • [Request Object](https://docs.usebruno.com/testing/script/request/request-object) • [Response Object](https://docs.usebruno.com/testing/script/response/response-object)

---

## 5. Assertions (Chai Style)
Under the hood Bruno wires in Chai (`expect`) in Developer Mode.
```javascript
test('Response has id + name', () => {
    const data = res.getBody();
    expect(data).to.have.property('id');
    expect(data.name).to.be.a('string');
});

test('Array not empty', () => {
    const arr = res.getBody();
    expect(arr).to.be.an('array').with.length.greaterThan(0);
});
```
Docs: [Assertions](https://docs.usebruno.com/testing/tests/assertions)

> ✅ Keep tests meaningful. Avoid asserting trivial echoes (e.g. status 200 only) unless it guards a failure mode.

---

## 6. Reporting & Automation
We use the Bruno CLI for repeatable batch runs and artifact generation.

Install once:
```bash
npm install -g @usebruno/cli
```

Run with reports:
```bash
bru run \
    --env-file "environments/certification.ed-fi.org.bru" \
    --reporter-json results.json \
    --reporter-html results.html \
    --reporter-junit results.xml
```

Other patterns:
```bash
# Tag‑scoped
bru run --tags "smoke,critical" --reporter-html smoke.html

# Skip sensitive headers
bru run --reporter-html report.html --reporter-skip-headers "Authorization" "X-Api-Key"
```

Formats: JSON (machine), HTML (human), JUnit (CI).  
Docs: [CLI Overview](https://docs.usebruno.com/bru-cli/overview) • [Reporters](https://docs.usebruno.com/bru-cli/builtInReporters) • [Command Options](https://docs.usebruno.com/bru-cli/commandOptions)

---

## 7. Variables & Environments
We keep environment definition `.bru` files under `environments/`.

Common variable sources:
| Scope | When to use | Example |
|-------|-------------|---------|
| Environment | Per environment (base URLs, credentials) | `baseUrl`, `clientId` |
| Collection  | Shared constants | Utility function seeds |
| Runtime     | Script-calculated | `recordId`, `accessToken` |

Docs: [Variables Overview](https://docs.usebruno.com/variables/overview) • [Environment Vars](https://docs.usebruno.com/variables/environment-variables) • [Dynamic Vars](https://docs.usebruno.com/testing/script/dynamic-variables)

> 🧪 Prefer deriving IDs dynamically (like we do with `generateUniqueId`) over hard-coding GUIDs—reduces brittle failures.

---

## 8. Contributing Workflow
1. Pick or create a scenario folder logically (follow: data standard version / domain grouping / Entity grouping / Numbered Test)
2. Add the request `.bru` file
3. Write pre-request script (auth / fetch / derive IDs)
4. Write meaningful assertions or post-response assertions for complex scenarios
5. Re-run locally via CLI with reporters
6. Commit (GPG-signed) & push
7. Open a small PR for feedback

Quality checklist:
- Assertions cover correctness, not just existence
- No unused environment variables added
- External libs only where native JS is verbose
- Sensitive tokens NOT printed (avoid `console.log(accessToken)` in final form)

---

## 9. Style & Patterns
| Topic | Guideline |
|-------|-----------|
| Naming | Prefix test titles with scenario step numbers (keeps report ordering stable) |
| Logs | Keep them concise; remove noisy experimental logs before commit |
| Fail Messages | Provide actionable expectation text (what was expected + what was found) |
| Chaining | Always set next-step IDs via `bru.setEnvVar` right after validation |
| Utilities | Add cross-request helpers only at collection level, not per request |


## 10. Quick FAQ (Seed)
| Question | Answer |
|----------|--------|
| My script says a module is blocked | You’re likely still in Safe Mode—disable it. |
| Tests pass in GUI but fail in CLI | Confirm same environment file + Developer Mode assumptions. |
| Report missing request | It may lack tests and you used `--tests-only`. Remove that flag or add assertions. |
| Missing variable error | Check environment file spelling + that pre-request sets it before use. |

We’ll expand this as patterns emerge.

---

## 11. Reference Links
Official Docs: [Bruno](https://docs.usebruno.com/) • [Sandbox Modes](https://docs.usebruno.com/get-started/javascript-sandbox) • [External Libraries](https://docs.usebruno.com/testing/script/external-libraries)

Scripting: [Assertions](https://docs.usebruno.com/testing/tests/assertions) • [Script Flow](https://docs.usebruno.com/testing/script/script-flow) • [Request Object](https://docs.usebruno.com/testing/script/request/request-object) • [Response Object](https://docs.usebruno.com/testing/script/response/response-object)

CLI & Automation: [CLI Overview](https://docs.usebruno.com/bru-cli/overview) • [Reporters](https://docs.usebruno.com/bru-cli/builtInReporters) • [Options](https://docs.usebruno.com/bru-cli/commandOptions) • [GitHub Actions](https://docs.usebruno.com/bru-cli/gitHubCLI)

Variables & Advanced: [Environment Vars](https://docs.usebruno.com/variables/environment-variables) • [Dynamic Vars](https://docs.usebruno.com/testing/script/dynamic-variables) • [Whitelisting Modules](https://docs.usebruno.com/testing/script/whitelisting-modules)

---

## 12. Final Note
This documentation is intentionally iterative. Add what you learn. If you see repetition in scripts, consolidate it. Small improvements compound quickly in shared API suites.

Happy testing. 🧪

— The Engineering Team

> *Certification Context:* These suites are tailored for Ed‑Fi certification flows—be sure you select the correct environment before execution.

