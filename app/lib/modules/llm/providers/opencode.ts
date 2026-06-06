import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class OpenCodeProvider extends BaseProvider {
  name = 'OpenCode';
  getApiKeyLink = 'https://opencode.ai/zen';

  config = {
    apiTokenKey: 'OPENCODE_ZEN_API_KEY',
    baseUrl: 'https://opencode.ai/zen/v1',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'gpt-5.5',
      label: 'GPT 5.5',
      provider: 'OpenCode',
      maxTokenAllowed: 131072,
    },
    {
      name: 'gpt-5-nano',
      label: 'GPT 5 Nano',
      provider: 'OpenCode',
      maxTokenAllowed: 262144,
    },
    {
      name: 'gpt-5-mini',
      label: 'GPT 5 Mini',
      provider: 'OpenCode',
      maxTokenAllowed: 131072,
    },
    {
      name: 'gpt-oss-120b',
      label: 'GPT-OSS 120B',
      provider: 'OpenCode',
      maxTokenAllowed: 131072,
    },
    {
      name: 'devstral-2-123b-instruct-2512',
      label: 'Devstral 2 123B',
      provider: 'OpenCode',
      maxTokenAllowed: 131072,
    },
    {
      name: 'deepseek-r1',
      label: 'DeepSeek R1',
      provider: 'OpenCode',
      maxTokenAllowed: 131072,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'OPENCODE_ZEN_API_KEY',
    });

    if (!apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${baseUrl || 'https://opencode.ai/zen/v1'}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: this.createTimeoutSignal(5000),
      });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as any;
      const staticModelIds = this.staticModels.map((m) => m.name);

      return (data.data || [])
        .filter((model: any) => !staticModelIds.includes(model.id))
        .map((m: any) => ({
          name: m.id,
          label: `${m.id} (Dynamic)`,
          provider: this.name,
          maxTokenAllowed: 128000,
        }));
    } catch {
      return [];
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'OPENCODE_ZEN_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const opencode = createOpenAI({
      baseURL: baseUrl || 'https://opencode.ai/zen/v1',
      apiKey,
      compatibility: 'compatible',
    });

    return opencode(model);
  }
}
