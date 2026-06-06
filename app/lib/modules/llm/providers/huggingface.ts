import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class HuggingFaceProvider extends BaseProvider {
  name = 'HuggingFace';
  getApiKeyLink = 'https://huggingface.co/settings/tokens';

  config = {
    apiTokenKey: 'HuggingFace_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'Qwen/Qwen2.5-Coder-32B-Instruct',
      label: 'Qwen2.5-Coder-32B-Instruct (HuggingFace)',
      provider: 'HuggingFace',
      maxTokenAllowed: 8000,
    },
    {
      name: '01-ai/Yi-1.5-34B-Chat',
      label: 'Yi-1.5-34B-Chat (HuggingFace)',
      provider: 'HuggingFace',
      maxTokenAllowed: 8000,
    },
    {
      name: 'codellama/CodeLlama-34b-Instruct-hf',
      label: 'CodeLlama-34b-Instruct (HuggingFace)',
      provider: 'HuggingFace',
      maxTokenAllowed: 8000,
    },
    {
      name: 'NousResearch/Hermes-3-Llama-3.1-8B',
      label: 'Hermes-3-Llama-3.1-8B (HuggingFace)',
      provider: 'HuggingFace',
      maxTokenAllowed: 8000,
    },
    {
      name: 'Qwen/Qwen2.5-Coder-32B-Instruct',
      label: 'Qwen2.5-Coder-32B-Instruct (HuggingFace)',
      provider: 'HuggingFace',
      maxTokenAllowed: 8000,
    },
    {
      name: 'Qwen/Qwen2.5-72B-Instruct',
      label: 'Qwen2.5-72B-Instruct (HuggingFace)',
      provider: 'HuggingFace',
      maxTokenAllowed: 8000,
    },
    {
      name: 'meta-llama/Llama-3.1-70B-Instruct',
      label: 'Llama-3.1-70B-Instruct (HuggingFace)',
      provider: 'HuggingFace',
      maxTokenAllowed: 8000,
    },
    {
      name: 'meta-llama/Llama-3.1-405B',
      label: 'Llama-3.1-405B (HuggingFace)',
      provider: 'HuggingFace',
      maxTokenAllowed: 8000,
    },
    {
      name: '01-ai/Yi-1.5-34B-Chat',
      label: 'Yi-1.5-34B-Chat (HuggingFace)',
      provider: 'HuggingFace',
      maxTokenAllowed: 8000,
    },
    {
      name: 'codellama/CodeLlama-34b-Instruct-hf',
      label: 'CodeLlama-34b-Instruct (HuggingFace)',
      provider: 'HuggingFace',
      maxTokenAllowed: 8000,
    },
    {
      name: 'NousResearch/Hermes-3-Llama-3.1-8B',
      label: 'Hermes-3-Llama-3.1-8B (HuggingFace)',
      provider: 'HuggingFace',
      maxTokenAllowed: 8000,
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
      defaultApiTokenKey: 'HuggingFace_API_KEY',
    });

    if (!apiKey) {
      return [];
    }

    const response = await fetch(`https://router.huggingface.co/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: this.createTimeoutSignal(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models from HuggingFace API: ${response.status} ${response.statusText}`);
    }

    const res = (await response.json()) as any;

    if (!res.data || !Array.isArray(res.data)) {
      throw new Error('Invalid response format from HuggingFace API');
    }

    const staticModelIds = this.staticModels.map((m) => m.name);

    const data = res.data.filter((model: any) => model.object === 'model' && !staticModelIds.includes(model.id));

    return data.map((m: any) => {
      let contextWindow = 8000;
      let maxCompletionTokens = 4096;

      if (typeof m.max_context_length === 'number' && m.max_context_length > 0) {
        contextWindow = m.max_context_length;
      } else if (typeof m.context_window === 'number' && m.context_window > 0) {
        contextWindow = m.context_window;
      } else if (m.id?.includes('Llama-3.1')) {
        contextWindow = 128000;
      } else if (m.id?.includes('Llama-3')) {
        contextWindow = 8192;
      } else if (m.id?.includes('Qwen2.5')) {
        contextWindow = 32000;
      } else if (m.id?.includes('Mixtral')) {
        contextWindow = 32768;
      }

      if (typeof m.max_output_tokens === 'number' && m.max_output_tokens > 0) {
        maxCompletionTokens = Math.min(m.max_output_tokens, 16000);
      }

      const displayName = m.id?.split('/').pop()?.replace(/-/g, ' ') || m.id;

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
      defaultApiTokenKey: 'HuggingFace_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openai = createOpenAI({
      baseURL: 'https://api-inference.huggingface.co/v1/',
      apiKey,
    });

    return openai(model);
  }
}
