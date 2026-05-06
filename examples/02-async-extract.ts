/**
 * Example 02: Async extraction job — extract multiple documents
 */
import { ZiviolaExtract } from '@ziviola/extract';

async function main() {
  const ziviola = new ZiviolaExtract();

  const handle = await (await ziviola
    .createJob({ outputFormat: 'md' }))
    .attachFile('./contract.pdf')
    .attachFile('./slides.pptx')
    .start();

  console.log('Extraction job started:', handle.jobId);

  const result = await handle.wait({
    onProgress: (status) => {
      console.log(`Status: ${status.status} — ${status.inputs.length} inputs`);
    },
  });

  console.log(`Job completed: ${result.status}`);
  for (const doc of result.documents) {
    console.log(`  ${doc.filename} — ${doc.url}`);
  }

  if (result.failed.length > 0) {
    console.warn('Failed inputs:');
    for (const fail of result.failed) {
      console.warn(`  ${fail.filename}: ${fail.error}`);
    }
  }
}

main().catch(console.error);
