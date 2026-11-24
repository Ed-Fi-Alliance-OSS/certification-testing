/**
 * IMPORTANT:
 * Duplicate of SIS/utils.js (see that file for notes). Keep in sync.
 */


/**
 * validateDependency
 * Ensures a required environment variable is present before executing a request.
 * If missing, it throws a descriptive error instructing the user which prior step to run.
 *
 * @param {object} bru - Bruno runtime object (provides getEnvVar, etc.).
 * @param {string} variableName - Name of the environment variable to validate.
 * @param {string} dependencyName - Human-friendly name of the prerequisite request / step.
 * @param {object} [opts] - Optional settings.
 * @param {boolean} [opts.throwOnMissing=true] - Whether to throw (default) or just log a warning.
 * @param {string} [opts.actionHint] - Optional extra hint appended to the message.
 *
 * @returns {boolean} true if variable exists; false otherwise (only when throwOnMissing = false)
 */
function validateDependency(bru, variableName, dependencyName, opts = {}) {
  const { throwOnMissing = true, actionHint } = opts;
  const value = getVar(bru, variableName);
  if (value !== undefined && value !== null && value !== '') {
    return true;
  }

  const baseMsg = `Run "${dependencyName}" first to populate it. Missing required variable "${variableName}". `;
  const fullMsg = actionHint ? `${baseMsg} \n\n > ${actionHint}` : baseMsg;

  if (throwOnMissing) {
    console.error(fullMsg);
    throw new Error(fullMsg);
  } else {
    console.warn(fullMsg);
    return false;
  }
}

// Descriptor helpers -------------------------------------------------
function extractDescriptor(value) {
  // keeps pop logic centralized and token standarized 
  return typeof value === 'string' ? value.split('#').pop() : value;
}

function mapDescriptors(items, accessorFn) {
  // keeps map logic centralized
  if (!Array.isArray(items)) return [];
  return items.map(it => extractDescriptor(accessorFn(it)));
}

function joinDescriptors(items) {
  // keeps join logic centralized and token standarized
  if (!Array.isArray(items)) return '';
  return items.join(', ');
}

// just wrappers around bru methods for consistency and centralization
function getVar(bru, key) {
  return bru.getVar(key);
}

function setVar(bru, key, value) {
  bru.setVar(key, value);
}

function wipeVar(bru, key) {
  bru.deleteVar(key);
}

// Variable helpers -----------------------------------------------------
function getVars(bru, keys = []) {
  if (!Array.isArray(keys) || keys.length === 0) return {};
  return Object.fromEntries(keys.map(k => [k, getVar(bru, k)]));
} 

function setVars(bru, kv, entityName = null) {
  Object.entries(kv).forEach(([k, v]) => setVar(bru, k, v));
  if (entityName) setVarsMessage(entityName);
}

function setVarsMessage(entityName) {
  console.log(`${entityName} data was cached correctly.`);
}

function wipeVars(bru, keys, entityName = null, throwError = false) {
  keys.forEach(k => wipeVar(bru, k));
  if (entityName) wipeVarsWarning(entityName);
  if (throwError) throwNotFoundOrSpecificError(entityName);
}

function wipeVarsWarning(entityName) {
  console.warn(`${entityName} cached data was wiped because no record was found or multiple records were returned. Please check the input "Params".`);
}

function throwNotFoundOrSpecificError(entityName) {
  throw new Error(`No ${entityName} found, or multiple records were returned. Check your parameters and try again.`);
}

// Single item picker --------------------------------------------------
function pickSingle(arr) {
  return Array.isArray(arr) && arr.length === 1 ? arr[0] : null;
}

// ID generators -----------------------------------------------------
function generateId() {
  const base = 1000010000;
  const maxIncrement = 899999999;
  return (base + Math.floor(Math.random() * maxIncrement)).toString();
}

// Descriptor URI encoder -------------------------------------------------
// Accepts either a full descriptor URI (uri://...#Code Value) or just the raw code value.
// Returns a properly percent-encoded descriptor URI safe for inclusion as a query param.
// Rules:
//  - Preserve the prefix up to and excluding '#'
//  - Encode '#', spaces and any other reserved characters after '#'
//  - If no '#', treat input as a raw code value and require a prefix argument (optional later enhancement)
function encodeDescriptorUri(rawDescriptor) {
  if (typeof rawDescriptor !== 'string' || rawDescriptor.trim() === '') return rawDescriptor;
  // If already encoded (%23 present), assume it's fine.
  if (/%23/.test(rawDescriptor)) return rawDescriptor;
  // Split into prefix + codeValue
  const parts = rawDescriptor.split('#');
  if (parts.length === 1) {
    // No '#': raw might just be the code value; we can't safely build without knowing the namespace.
    // Return unchanged; caller can decide.
    return rawDescriptor;
  }
  const prefix = parts.slice(0, -1).join('#'); // In case multiple '#'
  const codeValue = parts[parts.length - 1];
  // Encode codeValue; also encode '#'
  const encodedCode = encodeURIComponent(codeValue);
  return `${prefix}%23${encodedCode}`;
}

// Extracts rawDescriptor from query string and encode it
function encodeDescriptorParameter(originalUrl, parameterName, defaultDescriptorValue = '') {
  let rawDescriptor = defaultDescriptorValue;
  
  if (originalUrl.includes('?')) {
    const queryString = originalUrl.split('?')[1];
    const parts = queryString.split('&');

    for (const p of parts) {
      const [key, value] = p.split('=');

      if (key === parameterName && value) {
        // To avoid double enconding
        try { rawDescriptor = decodeURIComponent(value); } catch { rawDescriptor = value; }
        break;
      }
    }
  }
  const encodedDescriptor = rawDescriptor.includes('#') && !/%23/.test(rawDescriptor) ? encodeDescriptorUri(rawDescriptor) : rawDescriptor;
  return encodedDescriptor;
}

// Change expectation helper ------------------------------------------
function expectChanged(previous, current, label, isMessageOverrode = false) {
  const message = isMessageOverrode ? label : `${label} changed`;
  test(message, () => {
    expect(current).not.equals(previous);
  });
}

// Positive (equality) expectation helper --------------------------------
function expectUnchanged(previous, current, label, isMessageOverrode = false) {
  const message = isMessageOverrode ? label : `${label} unchanged`;
  test(message, () => {
    expect(current).equals(previous);
  });
}

// Natural-key lookup helpers (used by MTSS/Reset). Keep identical to bruno/MTSS/utils.js;
// bruno/tests-unit/lookup-helpers.test.cjs enforces it.
// GETs {{resourceBaseUrl}}/<resourcePath>?<query> from a script and returns the array body.
// Throws when the request fails or the body is not a list, so a broken lookup fails the step
// instead of looking like "no record found".
async function fetchRecords(bru, resourcePath, query) {
  const qs = Object.entries(query || {})
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `${bru.getEnvVar('resourceBaseUrl')}/${resourcePath}${qs ? `?${qs}` : ''}`;
  // bru.sendRequest does not inherit the collection's bearer auth, so send the token explicitly.
  const headers = { Authorization: `Bearer ${bru.getEnvVar('edFiCertToken')}` };
  let records = null;
  let failure = null;
  try {
    await bru.sendRequest({ url, method: 'GET', headers }, (err, res) => {
      if (err) {
        const status = err.response && err.response.status;
        failure = status ? `HTTP ${status}` : (err.message || String(err));
        return;
      }
      const data = res && res.data;
      if (Array.isArray(data)) records = data;
      else failure = 'the response is not a list';
    });
  } catch (e) {
    failure = (e && e.message) || String(e);
  }
  if (!records) {
    throw new Error(`Lookup of ${resourcePath} failed (${failure || 'no response'}). Check the token, the base URL and your API client permissions, then run this step again.`);
  }
  return records;
}

// Looks up a record by natural key and returns its current id. fallbackId is used only when
// the lookup succeeds and finds nothing (already deleted); more than one match throws.
async function resolveCurrentId(bru, resourcePath, query, fallbackId) {
  const records = await fetchRecords(bru, resourcePath, query);
  if (records.length === 0) return fallbackId;
  if (records.length > 1) {
    throw new Error(`Lookup of ${resourcePath} matched ${records.length} records instead of one; the natural key is ambiguous.`);
  }
  return records[0].id;
}


module.exports = {
  fetchRecords,
  resolveCurrentId,
  validateDependency,
  extractDescriptor,
  mapDescriptors,
  joinDescriptors,
  getVar,
  getVars,
  setVar,
  setVars,
  setVarsMessage,
  wipeVar,
  wipeVars,
  wipeVarsWarning,
  pickSingle,
  generateId,
  expectChanged,
  expectUnchanged,
  throwNotFoundOrSpecificError,
  encodeDescriptorUri,
  encodeDescriptorParameter
};
