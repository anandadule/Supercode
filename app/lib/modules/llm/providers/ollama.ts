import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { logger } from '~/utils/logger';

interface OllamaModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: OllamaModelDetails;
}

export interface OllamaApiResponse {
  models: OllamaModel[];
}

export default class OllamaProvider extends BaseProvider {
  name = 'Ollama';
  getApiKeyLink = 'https://ollama.com/settings/keys';
  labelForGetApiKey = 'Get Ollama API Key';
  icon = 'i-ph:cloud-arrow-down';

  config = {
    baseUrlKey: 'OLLAMA_API_BASE_URL',
    apiTokenKey: 'OLLAMA_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'gpt-oss:120b-cloud',
      label: 'GPT-OSS 120B Cloud',
      provider: 'Ollama',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },
    {
      name: 'gpt-oss:20b-cloud',
      label: 'GPT-OSS 20B Cloud',
      provider: 'Ollama',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },
    {
      name: 'deepseek-v3.1:671b-cloud',
      label: 'DeepSeek V3.1 671B Cloud',
      provider: 'Ollama',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },
    {
      name: 'deepseek-r1:671b-cloud',
      label: 'DeepSeek R1 671B Cloud',
      provider: 'Ollama',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },
    {
      name: 'qwen3-coder:480b-cloud',
      label: 'Qwen3 Coder 480B Cloud',
      provider: 'Ollama',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },
    {
      name: 'qwen3-vl:235b-cloud',
      label: 'Qwen3 VL 235B Cloud',
      provider: 'Ollama',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },
    {
      name: 'llama4:400b-cloud',
      label: 'Llama 4 400B Cloud',
      provider: 'Ollama',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },
    {
      name: 'llama4:90b-cloud',
      label: 'Llama 4 90B Cloud',
      provider: 'Ollama',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },
  ];

  getDefaultNumCtx(serverEnv?: Env): number {
    const envRecord = this.convertEnvToRecord(serverEnv);

    return envRecord.DEFAULT_NUM_CTX ? parseInt(envRecord.DEFAULT_NUM_CTX, 10) : 32768;
  }

  private _resolveConfig(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): { baseUrl: string; apiKey?: string } {
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'OLLAMA_API_BASE_URL',
      defaultApiTokenKey: 'OLLAMA_API_KEY',
    });

    if (!baseUrl) {
      throw new Error('No baseUrl found for Ollama provider');
    }

    return {
      baseUrl: this.resolveDockerUrl(baseUrl, serverEnv),
      apiKey,
    };
  }

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const { baseUrl, apiKey } = this._resolveConfig(apiKeys, settings, serverEnv);

    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        signal: this.createTimeoutSignal(),
        ...(apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as Partial<OllamaApiResponse>;

      if (!data.models || !Array.isArray(data.models)) {
        logger.warn('Ollama returned an unexpected response shape');
        return [];
      }

      return data.models.map((model: OllamaModel) => ({
        name: model.name,
        label: `${model.name} (${model.details.parameter_size})`,
        provider: this.name,
        maxTokenAllowed: 8000,
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        logger.warn('Ollama model fetch timed out — is Ollama running?');

        return [];
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        logger.warn(`Ollama not reachable at ${baseUrl} — is Ollama running?`);

        return [];
      }

      logger.error('Error fetching Ollama models:', error);

      return [];
    }
  }

  getModelInstance: (options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { apiKeys, providerSettings, serverEnv, model } = options;
    const envRecord = this.convertEnvToRecord(serverEnv);

    const { baseUrl, apiKey } = this._resolveConfig(apiKeys, providerSettings?.[this.name], envRecord);

    logger.debug('Ollama Base Url used: ', baseUrl);

    const ollamaProvider = createOllama({
      baseURL: `${baseUrl}/api`,
      ...(apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : {}),
    });

    return ollamaProvider(model, {
      numCtx: this.getDefaultNumCtx(serverEnv),
    });
  };
}
