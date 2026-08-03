# Migration Helper Scripts

## Files

- `verify-dump-files.sh`
- `verify-dump-files.ps1`
- `verify-candidate-host.sh`

## Rules

- These scripts are local operator helpers only.
- They do not upload files.
- They do not connect to databases.
- They do not modify dump files.
- They do not install packages.

## Typical Usage

### Bash

```bash
./scripts/migration/verify-dump-files.sh roles.sql schema.sql data.sql
```

### PowerShell

```powershell
.\scripts\migration\verify-dump-files.ps1 -Files roles.sql, schema.sql, data.sql
```

### Candidate host diagnostics

```bash
./scripts/migration/verify-candidate-host.sh
```