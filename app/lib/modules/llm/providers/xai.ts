import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class XAIProvider extends BaseProvider {
  name = 'xAI';
  getApiKeyLink = 'https://docs.x.ai/docs/quickstart#creating-an-api-key';

  config = {
    apiTokenKey: 'XAI_API_KEY',
  };

  staticModels: ModelInfo[] = [
    { name: 'grok-4', label: 'xAI Grok 4', provider: 'xAI', maxTokenAllowed: 256000 },
    { name: 'grok-4-07-09', label: 'xAI Grok 4 (07-09)', provider: 'xAI', maxTokenAllowed: 256000 },
    { name: 'grok-3-mini', label: 'xAI Grok 3 Mini', provider: 'xAI', maxTokenAllowed: 131000 },
    { name: 'grok-3-mini-fast', label: 'xAI Grok 3 Mini Fast', provider: 'xAI', maxTokenAllowed: 131000 },
    { name: 'grok-code-fast-1', label: 'xAI Grok Code Fast 1', provider: 'xAI', maxTokenAllowed: 131000 },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'XAI_API_KEY',
    });

    if (!apiKey) {
      throw `Missing Api Key configuration for ${this.name} provider`;
    }

    const response = await fetch(`https://api.x.ai/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: this.createTimeoutSignal(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models from xAI API: ${response.status} ${response.statusText}`);
    }

    const res = (await response.json()) as any;

    if (!res.data || !Array.isArray(res.data)) {
      throw new Error('Invalid response format from xAI API');
    }

    const staticModelIds = this.staticModels.map((m) => m.name);

    const data = res.data.filter((model: any) => model.object === 'model' && !staticModelIds.includes(model.id));

    return data.map((m: any) => {
      let contextWindow = 131000;
      let maxCompletionTokens = 8192;

      if (typeof m.context_window === 'number' && m.context_window > 0) {
        contextWindow = m.context_window;
      } else if (typeof m.max_tokens === 'number' && m.max_tokens > 0) {
        contextWindow = m.max_tokens;
      } else if (m.id?.includes('grok-4')) {
        contextWindow = 256000;
      } else if (m.id?.includes('grok-3')) {
        contextWindow = 131000;
      } else if (m.id?.includes('grok-2')) {
        contextWindow = 32768;
      }

      if (typeof m.max_output_tokens === 'number' && m.max_output_tokens > 0) {
        maxCompletionTokens = Math.min(m.max_output_tokens, 32000);
      }

      const displayName = (m.id?.replace(/^grok-/, 'Grok-').replace(/^Grok-/, 'Grok ') || m.id).replace(/-/g, ' ');

      return {
        name: m.id,
        label: `${displayName} (${Math.floor(contextWindow / 1000)}k context)`,
        provider: this.name,
        maxTokenAllowed: contextWindow,
        maxCompletionTokens,
      };
    });
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'XAI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openai = createOpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey,
    });

    return openai(model);
  }
}
