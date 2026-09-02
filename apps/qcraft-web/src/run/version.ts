/**
 * App identity for the run manifest.
 *
 * `APP_VERSION` is a literal rather than an import of package.json so the
 * bundle does not carry the whole dev-dependency list to state one string.
 * `tests/manifest.test.ts` reads package.json and asserts the two agree, which
 * is the same shape as the ENGINE_DEFAULTS pin: drift breaks a test instead of
 * silently mislabelling every exported report.
 */

export const APP_NAME = 'Q-CRAFT Explorer';

/** Keep in step with `version` in apps/qcraft-web/package.json. */
export const APP_VERSION = '0.3.0';
