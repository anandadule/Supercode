import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { logger } from '~/utils/logger';

export default class NvidiaProvider extends BaseProvider {
  name = 'Nvidia';
  getApiKeyLink = 'https://build.nvidia.com/';

  config = {
    apiTokenKey: 'NVIDIA_API_KEY',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'nvidia/llama-3.1-nemotron-70b-instruct',
      label: 'Llama 3.1 Nemotron 70B Instruct',
      provider: 'Nvidia',
      maxTokenAllowed: 131072,
    },
    {
      name: 'meta/llama-3.1-405b-instruct',
      label: 'Llama 3.1 405B Instruct',
      provider: 'Nvidia',
      maxTokenAllowed: 131072,
    },
    {
      name: 'meta/llama-3.1-70b-instruct',
      label: 'Llama 3.1 70B Instruct',
      provider: 'Nvidia',
      maxTokenAllowed: 131072,
    },
    {
      name: 'meta/llama-3.1-8b-instruct',
      label: 'Llama 3.1 8B Instruct',
      provider: 'Nvidia',
      maxTokenAllowed: 131072,
    },
    {
      name: 'mistralai/mistral-7b-instruct-v0.3',
      label: 'Mistral 7B Instruct v0.3',
      provider: 'Nvidia',
      maxTokenAllowed: 32768,
    },
    {
      name: 'google/gemma-2-27b-it',
      label: 'Gemma 2 27B IT',
      provider: 'Nvidia',
      maxTokenAllowed: 8192,
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
      serverEnv,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'NVIDIA_API_KEY',
    });

    if (!apiKey) {
      return [];
    }

    const url = (baseUrl || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');

    try {
      const response = await fetch(`${url}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: this.createTimeoutSignal(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { data?: Array<{ id: string }> };

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((m) => ({
        name: m.id,
        label: m.id,
        provider: this.name,
        maxTokenAllowed: 131072,
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        logger.warn('Nvidia model fetch timed out');
        return [];
      }

      logger.error('Error fetching Nvidia models:', error);

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
      defaultApiTokenKey: 'NVIDIA_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const nvidia = createOpenAI({
      baseURL: baseUrl || 'https://integrate.api.nvidia.com/v1',
      apiKey,
      compatibility: 'compatible',
    });

    return nvidia(model);
  }
}
