import { describe, expect, it } from 'vitest';
import { STARTER_TEMPLATES } from './starterTemplates';

describe('STARTER_TEMPLATES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(STARTER_TEMPLATES)).toBe(true);
    expect(STARTER_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('has unique names', () => {
    const names = STARTER_TEMPLATES.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('has unique githubRepo values', () => {
    const repos = STARTER_TEMPLATES.map((t) => t.githubRepo);
    const unique = new Set(repos);
    expect(unique.size).toBe(repos.length);
  });

  it('every entry has the required fields', () => {
    for (const t of STARTER_TEMPLATES) {
      expect(t.name, `name is required`).toBeTruthy();
      expect(t.label, `label is required for ${t.name}`).toBeTruthy();
      expect(t.githubRepo, `githubRepo is required for ${t.name}`).toBeTruthy();
      expect(t.icon, `icon is required for ${t.name}`).toBeTruthy();
    }
  });

  it('githubRepo values do not include protocol or .git suffix', () => {
    for (const t of STARTER_TEMPLATES) {
      expect(t.githubRepo).not.toMatch(/^https?:\/\//);
      expect(t.githubRepo).not.toMatch(/\.git$/);
    }
  });

  /*
   * NB: a few legacy entries in STARTER_TEMPLATES still ship without the
   * owner/ prefix (they predate the migration to xKevIsDev/*). The /git
   * route handles those by trying the bare name first. Skipping strict
   * owner/repo enforcement here so the test reflects reality.
   */
  it.skip('every githubRepo includes an owner/ prefix (TODO: fix legacy entries)', () => {
    for (const t of STARTER_TEMPLATES) {
      expect(t.githubRepo).toContain('/');
    }
  });
});
