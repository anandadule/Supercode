import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class PerplexityProvider extends BaseProvider {
  name = 'Perplexity';
  getApiKeyLink = 'https://www.perplexity.ai/settings/api';

  config = {
    apiTokenKey: 'PERPLEXITY_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'sonar',
      label: 'Sonar',
      provider: 'Perplexity',
      maxTokenAllowed: 8192,
    },
    {
      name: 'sonar-pro',
      label: 'Sonar Pro',
      provider: 'Perplexity',
      maxTokenAllowed: 8192,
    },
    {
      name: 'sonar-reasoning-pro',
      label: 'Sonar Reasoning Pro',
      provider: 'Perplexity',
      maxTokenAllowed: 8192,
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
      defaultApiTokenKey: 'PERPLEXITY_API_KEY',
    });

    if (!apiKey) {
      return [];
    }

    const response = await fetch(`https://api.perplexity.ai/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: this.createTimeoutSignal(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models from Perplexity API: ${response.status} ${response.statusText}`);
    }

    const res = (await response.json()) as any;

    if (!res.data || !Array.isArray(res.data)) {
      throw new Error('Invalid response format from Perplexity API');
    }

    const staticModelIds = this.staticModels.map((m) => m.name);

    const data = res.data.filter((model: any) => model.object === 'model' && !staticModelIds.includes(model.id));

    return data.map((m: any) => {
      let contextWindow = 8192;
      const maxCompletionTokens = 8192;

      if (typeof m.context_window === 'number' && m.context_window > 0) {
        contextWindow = m.context_window;
      } else if (m.id?.includes('sonar-reasoning')) {
        contextWindow = 127000;
      } else if (m.id?.includes('sonar-pro')) {
        contextWindow = 200000;
      } else if (m.id?.includes('sonar')) {
        contextWindow = 127000;
      } else if (m.id?.includes('llama-3.1')) {
        contextWindow = 127000;
      }

      return {
        name: m.id,
        label: `${m.id} (${Math.floor(contextWindow / 1000)}k context)`,
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
      defaultApiTokenKey: 'PERPLEXITY_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const perplexity = createOpenAI({
      baseURL: 'https://api.perplexity.ai/',
      apiKey,
    });

    return perplexity(model);
  }
}
