import type { DesignSystemDefinition } from './types';
import { shadcnDesignSystem } from './shadcn';
import { materialUIDesignSystem } from './material-ui';

export const designSystems: DesignSystemDefinition[] = [shadcnDesignSystem, materialUIDesignSystem];

export type { DesignSystemDefinition } from './types';
