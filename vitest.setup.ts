import { expect, afterEach } from 'vitest';
import * as matching from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

expect.extend(matching);

afterEach(() => {
  cleanup();
});
