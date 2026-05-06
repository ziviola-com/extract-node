# @ziviola/extract

Official Node.js SDK for the [Ziviola Extract](https://ziviola.com) document extraction API. Extracts Markdown or structured JSON from PDFs, DOCX, PPTX, images, and more.

## Install

```bash
npm install @ziviola/extract
# or
pnpm add @ziviola/extract
```

## Zero-config quick start

Set `ZIVIOLA_EXTRACT_API_KEY` in your environment, then:

```typescript
import { ZiviolaExtract } from '@ziviola/extract';

const ziviola = new ZiviolaExtract();
```

## Sync extraction

Extract content from a single document in one call:

```typescript
import { ZiviolaExtract } from '@ziviola/extract';

const ziviola = new ZiviolaExtract();

// Extract as Markdown (default)
const result = await ziviola.extract('./invoice.pdf');
const markdown = await result.toText();
console.log(markdown);
await result.toFile('./invoice.md');

// Extract as JSON
const jsonResult = await ziviola.extract('./invoice.pdf', { outputFormat: 'json' });
const data = await jsonResult.toJson();
console.log(data);
```

## Async job — extract multiple documents

```typescript
const handle = await (await ziviola.createJob({ outputFormat: 'md' }))
  .attachFile('./contract.pdf')
  .attachFile('./slides.pptx')
  .start();

const result = await handle.wait({
  onProgress: (s) => console.log(`Status: ${s.status}`),
});

for (const doc of result.documents) {
  console.log(`${doc.filename} — ${doc.url}`);
}
```

## Partial success handling

```typescript
if (result.failed.length > 0) {
  for (const fail of result.failed) {
    console.warn(`${fail.filename}: ${fail.error}`);
  }
}
```

## Error handling

```typescript
import {
  ZiviolaExtract,
  AuthenticationError,
  ValidationError,
  JobFailedError,
} from '@ziviola/extract';

try {
  const result = await ziviola.extract('./file.pdf');
  console.log(await result.toText());
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (err instanceof ValidationError) {
    console.error('Validation:', err.message);
  } else if (err instanceof JobFailedError) {
    console.error(`Job ${err.jobId} failed:`, err.errorMessage);
  } else {
    throw err;
  }
}
```

## Webhook verification

```typescript
import { verifyWebhookSignature } from '@ziviola/extract';

app.post('/webhooks/extract', express.raw({ type: '*/*' }), (req, res) => {
  const valid = verifyWebhookSignature({
    payload: req.body,
    signature: req.headers['x-webhook-signature'],
    secret: process.env.ZIVIOLA_WEBHOOK_SECRET,
  });
  if (!valid) return res.sendStatus(400);
  res.sendStatus(200);
});
```

## Mock client (testing)

```typescript
import { MockZiviolaExtract } from '@ziviola/extract';

const client = new MockZiviolaExtract();
client.mock('POST', '/api/v1/extract/jobs', { jobId: 'test-job-1' });
client.reset();
```

## Supported input formats

`pdf`, `docx`, `pptx`, `xlsx`, `png`, `jpeg`, `tiff`, `bmp`, `webp`, `html`

## Environment variables

| Variable | Purpose |
|---|---|
| `ZIVIOLA_EXTRACT_API_KEY` | API key (zero-config fallback) |

## Requirements

- Node.js 18+

## License

MIT
