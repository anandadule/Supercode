import { atom } from 'nanostores';

export type AgentMode = 'standard' | 'max';

export const agentMode = atom<AgentMode>('standard');

export function toggleAgentMode() {
  agentMode.set(agentMode.get() === 'standard' ? 'max' : 'standard');
}
