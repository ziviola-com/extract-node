/**
 * Example 01: Synchronous document extraction (Markdown and JSON output)
 */
import {
  ZiviolaExtract,
  ValidationError,
  AuthenticationError,
} from '@ziviola/extract';

async function main() {
  // Zero-config: reads ZIVIOLA_EXTRACT_API_KEY from environment
  const ziviola = new ZiviolaExtract();

  // Extract as Markdown (default)
  try {
    const result = await ziviola.extract('./invoice.pdf');
    const markdown = await result.toText();
    console.log('Extracted Markdown:\n', markdown);
    await result.toFile('./invoice.md');
    console.log('Saved to invoice.md');
  } catch (err) {
    if (err instanceof AuthenticationError) {
      console.error('Invalid API key');
    } else if (err instanceof ValidationError) {
      console.error('Validation error:', err.message);
    } else {
      throw err;
    }
  }

  // Extract as JSON
  try {
    const result = await ziviola.extract('./invoice.pdf', { outputFormat: 'json' });
    const data = await result.toJson();
    console.log('Extracted JSON:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('JSON extraction error:', err);
  }
}

main().catch(console.error);
