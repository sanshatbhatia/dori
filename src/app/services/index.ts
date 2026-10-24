/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Which backend the app talks to. This build only has the demo provider (test mode): there is no
// production backend configured, so the app always runs in demo mode and says so on screen.

import type { DoriApi } from './api';
import { demoBackend } from './devBackend';

export const api: DoriApi = demoBackend;
export const IS_DEMO = api.mode === 'demo';
export { demoBackend };
