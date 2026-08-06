/**
 * Runs once before every test file.
 *
 * The jest-dom import adds DOM-aware assertions like toBeInTheDocument and
 * toHaveAttribute to Vitest's expect, which read far better in failure output
 * than manually poking at element properties.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library renders into a real container appended to document.body.
// Without this, components pile up across tests and queries start matching
// leftovers from earlier ones.
afterEach(() => {
  cleanup();
});
