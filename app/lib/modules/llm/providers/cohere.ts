import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createCohere } from '@ai-sdk/cohere';

export default class CohereProvider extends BaseProvider {
  name = 'Cohere';
  getApiKeyLink = 'https://dashboard.cohere.com/api-keys';

  config = {
    apiTokenKey: 'COHERE_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'command-r-plus-08-2024',
      label: 'Command R plus Latest',
      provider: 'Cohere',
      maxTokenAllowed: 4096,
      maxCompletionTokens: 4000,
    },
    {
      name: 'command-r-08-2024',
      label: 'Command R Latest',
      provider: 'Cohere',
      maxTokenAllowed: 4096,
      maxCompletionTokens: 4000,
    },
    {
      name: 'command-r-plus',
      label: 'Command R plus',
      provider: 'Cohere',
      maxTokenAllowed: 4096,
      maxCompletionTokens: 4000,
    },
    { name: 'command-r', label: 'Command R', provider: 'Cohere', maxTokenAllowed: 4096, maxCompletionTokens: 4000 },
    { name: 'command', label: 'Command', provider: 'Cohere', maxTokenAllowed: 4096, maxCompletionTokens: 4000 },
    {
      name: 'command-nightly',
      label: 'Command Nightly',
      provider: 'Cohere',
      maxTokenAllowed: 4096,
      maxCompletionTokens: 4000,
    },
    {
      name: 'command-light',
      label: 'Command Light',
      provider: 'Cohere',
      maxTokenAllowed: 4096,
      maxCompletionTokens: 4000,
    },
    {
      name: 'command-light-nightly',
      label: 'Command Light Nightly',
      provider: 'Cohere',
      maxTokenAllowed: 4096,
      maxCompletionTokens: 4000,
    },
    {
      name: 'c4ai-aya-expanse-8b',
      label: 'c4AI Aya Expanse 8b',
      provider: 'Cohere',
      maxTokenAllowed: 4096,
      maxCompletionTokens: 4000,
    },
    {
      name: 'c4ai-aya-expanse-32b',
      label: 'c4AI Aya Expanse 32b',
      provider: 'Cohere',
      maxTokenAllowed: 4096,
      maxCompletionTokens: 4000,
    },
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
      defaultApiTokenKey: 'COHERE_API_KEY',
    });

    if (!apiKey) {
      return [];
    }

    const response = await fetch(`https://api.cohere.ai/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: this.createTimeoutSignal(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models from Cohere API: ${response.status} ${response.statusText}`);
    }

    const res = (await response.json()) as any;

    if (!res.models || !Array.isArray(res.models)) {
      throw new Error('Invalid response format from Cohere API');
    }

    const staticModelIds = this.staticModels.map((m) => m.name);

    const data = res.models.filter((model: any) => !staticModelIds.includes(model.name));

    return data.map((m: any) => {
      let contextWindow = 4096;
      let maxCompletionTokens = 4000;

      if (typeof m.context_window === 'number' && m.context_window > 0) {
        contextWindow = m.context_window;
      } else if (m.name?.includes('command-r-plus')) {
        contextWindow = 128000;
      } else if (m.name?.includes('command-r')) {
        contextWindow = 128000;
      } else if (m.name?.includes('command')) {
        contextWindow = 4096;
      } else if (m.name?.includes('aya')) {
        contextWindow = 8192;
      }

      if (typeof m.max_tokens === 'number' && m.max_tokens > 0) {
        maxCompletionTokens = Math.min(m.max_tokens, 4000);
      }

      const displayName = m.name?.replace(/-[0-9]{4,}$/, '') || m.name;

      return {
        name: m.name,
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
      defaultApiTokenKey: 'COHERE_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const cohere = createCohere({
      apiKey,
    });

    return cohere(model);
  }
}
