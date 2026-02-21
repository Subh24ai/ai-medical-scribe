import { delay, generateId, copyToClipboard } from '../utils';

// Add delay
await delay(1000);

// Generate unique ID
const id = generateId();

// Copy to clipboard
const success = await copyToClipboard('prescription link');