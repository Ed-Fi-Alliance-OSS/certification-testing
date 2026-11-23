# How to use with Bruno CLI

This steps assume you have already downloaded and extracted the SIS artifact ZIP.

## Steps to configure and execute scenarios

1. Open any comandline terminal (e.g. Command Prompt, PowerShell, Terminal).
2. Navidate to the folder where you downloaded and extracted the SIS artifact ZIP (`<extracted-zip-location>`).
3. Run `npm i` in the extracted `<extracted-zip-location>/` and `<extracted-zip-location>/SIS` folders.
4. Configure environment variables.
5. Configure collection variables.
6. Configure scenario parameters.
7. Execute scenarios.

> Avoid `path too long` issues by moving the extracted folder to a location with a short path, such as `C:/bruno`. You can name the root folder anything you like, except for the `bruno/` subfolder since it contains the Bruno CLI and dependencies.

## Steps to configure environment variables

1) Rename the file `<extracted-zip-location>/SIS/.env.example` as `.env`.
2) Edit the `.env` file with your credentials:

```env
EDFI_CLIENT_ID=YourClientId
EDFI_CLIENT_SECRET=YourClientSecret
```

## Steps to configure collection variables

1) The collection variables files are stored under `<extracted-zip-location>/SIS/environments/`.
2) Create a copy of the `api.ed-fi.org` template.
3) Edit or remove the `apiVersion` and `baseUrl`.
4) Edit `resourceBaseUrl` to point at your ODS API resources URL.
5) Edit `oauthUrl` to point at your ODS API oauth URL.

Those environment files define:

- `apiVersion`: set to match your API version (optional)
- `baseUrl`: your Ed‑Fi API base, e.g., `https://api.ed-fi.org` (optional)
- `resourceBaseUrl`: derived data endpoint
- `oauthUrl`: derived OAuth token endpoint
- `edFiClientName`, `edFiClientId`, `edFiClientSecret`: read credentials from your `.env` file.

## Edit scenario parameters

All scenarios are configured with parameter placeholders. You need to update the desired parameters before execution. For example, the `<extracted-zip-location>\SIS\v4\Student\Students\01 - Check first Student is valid.bru` scenario has the following request definition:

```bru
get {
  url: {{resourceBaseUrl}}/ed-fi/students?studentUniqueId=[ENTER FIRST STUDENT UNIQUE ID]
  body: none
  auth: inherit
}

params:query {
  studentUniqueId: [ENTER FIRST STUDENT UNIQUE ID]
}
```

You need to replace the placeholder `[ENTER FIRST STUDENT UNIQUE ID]` with an actual `studentUniqueId` value from your API. For example:

```bru
get {
  url: {{resourceBaseUrl}}/ed-fi/students?studentUniqueId=604824
  body: none
  auth: inherit
}

params:query {
  studentUniqueId: 604824
}
```

## Run scenarios

Yo run a scenario, use the `bru run` command with the scenario path and environment. For example:

From the `<extracted-zip-location>/SIS` folder, run:

`bru run "v4/Student/Students/01 - Check first Student is valid.bru" --env "certification.ed-fi.org" --reporter-json report.json`

> Command options will difer based on the bruno CLI version. The above example is based on Bruno CLI v2.1.0. Check the [Bruno CLI documentation](https://docs.usebruno.com/bru-cli/overview).

### Other references

- [Command options](https://docs.usebruno.com/bru-cli/commandOptions)
- [Generating Reports](https://docs.usebruno.com/bru-cli/builtInReporters)
- [Running a Collection](https://docs.usebruno.com/bru-cli/runCollection)
- Deeper understanding about [Bruno CLI](https://deepwiki.com/usebruno/bruno/2.2-command-line-interface)