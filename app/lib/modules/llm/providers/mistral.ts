import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createMistral } from '@ai-sdk/mistral';

export default class MistralProvider extends BaseProvider {
  name = 'Mistral';
  getApiKeyLink = 'https://console.mistral.ai/api-keys/';

  config = {
    apiTokenKey: 'MISTRAL_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'open-mistral-7b',
      label: 'Mistral 7B',
      provider: 'Mistral',
      maxTokenAllowed: 8000,
      maxCompletionTokens: 8192,
    },
    {
      name: 'open-mixtral-8x7b',
      label: 'Mistral 8x7B',
      provider: 'Mistral',
      maxTokenAllowed: 8000,
      maxCompletionTokens: 8192,
    },
    {
      name: 'open-mixtral-8x22b',
      label: 'Mistral 8x22B',
      provider: 'Mistral',
      maxTokenAllowed: 8000,
      maxCompletionTokens: 8192,
    },
    {
      name: 'open-codestral-mamba',
      label: 'Codestral Mamba',
      provider: 'Mistral',
      maxTokenAllowed: 8000,
      maxCompletionTokens: 8192,
    },
    {
      name: 'open-mistral-nemo',
      label: 'Mistral Nemo',
      provider: 'Mistral',
      maxTokenAllowed: 8000,
      maxCompletionTokens: 8192,
    },
    {
      name: 'ministral-8b-latest',
      label: 'Mistral 8B',
      provider: 'Mistral',
      maxTokenAllowed: 8000,
      maxCompletionTokens: 8192,
    },
    {
      name: 'mistral-small-latest',
      label: 'Mistral Small',
      provider: 'Mistral',
      maxTokenAllowed: 8000,
      maxCompletionTokens: 8192,
    },
    {
      name: 'codestral-latest',
      label: 'Codestral',
      provider: 'Mistral',
      maxTokenAllowed: 8000,
      maxCompletionTokens: 8192,
    },
    {
      name: 'mistral-large-latest',
      label: 'Mistral Large Latest',
      provider: 'Mistral',
      maxTokenAllowed: 8000,
      maxCompletionTokens: 8192,
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
      defaultApiTokenKey: 'MISTRAL_API_KEY',
    });

    if (!apiKey) {
      return [];
    }

    const response = await fetch(`https://api.mistral.ai/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: this.createTimeoutSignal(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models from Mistral API: ${response.status} ${response.statusText}`);
    }

    const res = (await response.json()) as any;

    if (!res.data || !Array.isArray(res.data)) {
      throw new Error('Invalid response format from Mistral API');
    }

    const staticModelIds = this.staticModels.map((m) => m.name);

    const data = res.data.filter((model: any) => model.object === 'model' && !staticModelIds.includes(model.id));

    return data.map((m: any) => {
      let contextWindow = 8000;
      let maxCompletionTokens = 8192;

      if (typeof m.max_context_length === 'number' && m.max_context_length > 0) {
        contextWindow = m.max_context_length;
      } else if (m.id?.includes('mistral-large')) {
        contextWindow = 128000;
      } else if (m.id?.includes('mistral-small')) {
        contextWindow = 32000;
      } else if (m.id?.includes('codestral')) {
        contextWindow = 32000;
      } else if (m.id?.includes('nemo')) {
        contextWindow = 128000;
      } else if (m.id?.includes('pixtral')) {
        contextWindow = 128000;
      }

      if (m.capabilities?.completion_chat && typeof m.capabilities.completion_chat.max_tokens === 'number') {
        maxCompletionTokens = Math.min(m.capabilities.completion_chat.max_tokens, 32000);
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
      defaultApiTokenKey: 'MISTRAL_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const mistral = createMistral({
      apiKey,
    });

    return mistral(model);
  }
}
