export interface DesignSystemDefinition {
  id: string;
  name: string;
  description: string;
  promptFragment: string; // System prompt text to inject
  components: { name: string; description: string; api: string }[];
}
