/**
 * Copyright IBM Corp. 2018, 2025
 * SPDX-License-Identifier: MPL-2.0
 */

import { run } from '@ember/runloop';

export default function destroyApp(application) {
  run(application, 'destroy');
}
