# API Examples

## Health Check

```bash
curl http://localhost:3002/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T20:30:00.000Z",
  "config": {
    "dryRun": true,
    "spreadsheetId": "13CYoUh8BpVi4dOjeXrU1NFIt9PTVpKKhrdQGpggYzZ4",
    "sheetName": "Leads"
  }
}
```

## Get All Leads

```bash
curl http://localhost:3002/api/leads
```

Response:
```json
{
  "success": true,
  "count": 5,
  "leads": [
    {
      "rowIndex": 2,
      "email": "jan.kowalski@firma.pl",
      "firma": "Firma XYZ",
      "website_url": "https://firma-xyz.pl",
      "imie": "Jan",
      "generuj": true,
      "status": "sekwencja",
      "research_notes": "{...}",
      "step1_subject": "Firma XYZ - wydajność strony WWW",
      "step1_sent_date": "2025-11-12T10:15:00.000Z"
    }
  ]
}
```

## Get Leads To Process

```bash
curl http://localhost:3002/api/leads/to-process
```

Response:
```json
{
  "success": true,
  "count": 2,
  "leads": [...]
}
```

## Get Rate Limits

```bash
curl http://localhost:3002/api/rate-limits
```

Response:
```json
{
  "success": true,
  "stats": {
    "hourly": {
      "used": 3,
      "limit": 10,
      "resetAt": "2025-11-12T21:00:00.000Z"
    },
    "daily": {
      "used": 15,
      "limit": 50,
      "resetAt": "2025-11-13T00:00:00.000Z"
    }
  }
}
```

## Scheduler Status

```bash
curl http://localhost:3002/api/scheduler/status
```

Response:
```json
{
  "success": true,
  "status": {
    "running": true,
    "isProcessing": false,
    "cronExpression": "*/5 * * * *",
    "intervalMinutes": 5,
    "timezone": "Europe/Warsaw"
  }
}
```

## Start Scheduler

```bash
curl -X POST http://localhost:3002/api/scheduler/start
```

Response:
```json
{
  "success": true,
  "message": "Scheduler started"
}
```

## Stop Scheduler

```bash
curl -X POST http://localhost:3002/api/scheduler/stop
```

Response:
```json
{
  "success": true,
  "message": "Scheduler stopped"
}
```

## Run Now (Manual Trigger)

```bash
curl -X POST http://localhost:3002/api/scheduler/run-now
```

Response:
```json
{
  "success": true,
  "message": "Manual run triggered"
}
```

## Process Research Only

```bash
curl -X POST http://localhost:3002/api/process/research
```

Response:
```json
{
  "success": true,
  "message": "Processed 3 research tasks",
  "count": 3
}
```

## Process Sequence Generation Only

```bash
curl -X POST http://localhost:3002/api/process/sequences
```

Response:
```json
{
  "success": true,
  "message": "Generated 3 sequences",
  "count": 3
}
```

## Process Sending Only

```bash
curl -X POST http://localhost:3002/api/process/send
```

Response:
```json
{
  "success": true,
  "message": "Sent 2 emails",
  "count": 2
}
```

## Check Replies Only

```bash
curl -X POST http://localhost:3002/api/process/check-replies
```

Response:
```json
{
  "success": true,
  "message": "Found 1 replies",
  "count": 1
}
```

## Error Response Example

```json
{
  "success": false,
  "error": "Outside sending hours (9:00-18:00, Mon-Fri)"
}
```
