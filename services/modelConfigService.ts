import { 
  ModelProvider, 
  ModelConfig, 
  ModelManagerState, 
  AspectRatio, 
  VideoDuration,
  ChatModelConfig,
  ImageModelConfig,
  VideoModelConfig
} from '../types';

const STORAGE_KEY = 'ai_manga_studio_model_config';
const LEGACY_STORAGE_KEY = ['big' + 'banana', 'model', 'config'].join('_');

const DEFAULT_PROVIDER: ModelProvider = {
  id: 'agnes',
  name: 'Agnes AI API (api.agnes-ai.cn)',
  baseUrl: 'https://api.agnes-ai.cn',
  isDefault: true,
  isBuiltIn: true
};

const DEFAULT_CONFIG: ModelConfig = {
  chatModel: {
    providerId: 'agnes',
    modelName: 'agnes-2.5-flash',
    endpoint: '/v1/chat/completions'
  },
  imageModel: {
    providerId: 'agnes',
    modelName: 'agnes-image-2.1-flash',
    endpoint: '/v1/images/generations'
  },
  videoModel: {
    providerId: 'agnes',
    type: 'async',
    modelName: 'agnes-video-v2.0',
    endpoint: '/v1/videos'
  }
};

const DEFAULT_STATE: ModelManagerState = {
  providers: [DEFAULT_PROVIDER],
  currentConfig: DEFAULT_CONFIG,
  defaultAspectRatio: '16:9',
  defaultVideoDuration: 8
};

let runtimeState: ModelManagerState | null = null;

export const loadModelConfig = (): ModelManagerState => {
  if (runtimeState) {
    return runtimeState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ModelManagerState;
      // 確保內建 Agnes 提供商不被舊快取改寫 baseUrl。
      const hasDefaultProvider = parsed.providers.some(p => p.id === 'agnes');
      if (!hasDefaultProvider) {
        parsed.providers.unshift(DEFAULT_PROVIDER);
      } else {
        parsed.providers = parsed.providers.map(p =>
          p.id === 'agnes' ? { ...p, baseUrl: DEFAULT_PROVIDER.baseUrl } : p
        );
      }
      const videoModelName = parsed.currentConfig?.videoModel?.modelName || '';
      if (videoModelName !== 'agnes-video-v2.0') {
        parsed.currentConfig.videoModel.modelName = 'agnes-video-v2.0';
        parsed.currentConfig.videoModel.type = 'async';
        parsed.currentConfig.videoModel.endpoint = '/v1/videos';
      }
      runtimeState = parsed;
      saveModelConfig(parsed);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return parsed;
    }
  } catch (e) {
    console.error('加载模型配置失败:', e);
  }

  runtimeState = { ...DEFAULT_STATE };
  return runtimeState;
};

export const saveModelConfig = (state: ModelManagerState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    runtimeState = state;
  } catch (e) {
    console.error('保存模型配置失败:', e);
  }
};

export const getModelManagerState = (): ModelManagerState => {
  return loadModelConfig();
};

export const getProviders = (): ModelProvider[] => {
  return loadModelConfig().providers;
};

export const getProviderById = (id: string): ModelProvider | undefined => {
  return getProviders().find(p => p.id === id);
};

export const getDefaultProvider = (): ModelProvider => {
  return getProviders().find(p => p.isDefault) || DEFAULT_PROVIDER;
};

export const addProvider = (provider: Omit<ModelProvider, 'id' | 'isBuiltIn'>): ModelProvider => {
  const state = loadModelConfig();
  const newProvider: ModelProvider = {
    ...provider,
    id: `provider_${Date.now()}`,
    isBuiltIn: false
  };
  state.providers.push(newProvider);
  saveModelConfig(state);
  return newProvider;
};

export const updateProvider = (id: string, updates: Partial<ModelProvider>): boolean => {
  const state = loadModelConfig();
  const index = state.providers.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  if (state.providers[index].isBuiltIn) {
    delete updates.id;
    delete updates.isBuiltIn;
    delete updates.baseUrl;
  }
  
  state.providers[index] = { ...state.providers[index], ...updates };
  saveModelConfig(state);
  return true;
};

export const deleteProvider = (id: string): boolean => {
  const state = loadModelConfig();
  const provider = state.providers.find(p => p.id === id);
  
  if (!provider || provider.isBuiltIn) return false;
  
  state.providers = state.providers.filter(p => p.id !== id);
  
  if (state.currentConfig.chatModel.providerId === id) {
    state.currentConfig.chatModel.providerId = 'agnes';
  }
  if (state.currentConfig.imageModel.providerId === id) {
    state.currentConfig.imageModel.providerId = 'agnes';
  }
  if (state.currentConfig.videoModel.providerId === id) {
    state.currentConfig.videoModel.providerId = 'agnes';
  }
  
  saveModelConfig(state);
  return true;
};

export const getCurrentConfig = (): ModelConfig => {
  return loadModelConfig().currentConfig;
};

export const updateChatModelConfig = (config: Partial<ChatModelConfig>): void => {
  const state = loadModelConfig();
  state.currentConfig.chatModel = { ...state.currentConfig.chatModel, ...config };
  saveModelConfig(state);
};

export const updateImageModelConfig = (config: Partial<ImageModelConfig>): void => {
  const state = loadModelConfig();
  state.currentConfig.imageModel = { ...state.currentConfig.imageModel, ...config };
  saveModelConfig(state);
};

export const updateVideoModelConfig = (config: Partial<VideoModelConfig>): void => {
  const state = loadModelConfig();
  state.currentConfig.videoModel = { ...state.currentConfig.videoModel, ...config };
  saveModelConfig(state);
};

export const getChatApiUrl = (): string => {
  const config = getCurrentConfig();
  const provider = getProviderById(config.chatModel.providerId) || getDefaultProvider();
  const baseUrl = provider.baseUrl.replace(/\/+$/, '');
  const endpoint = config.chatModel.endpoint || '/v1/chat/completions';
  return `${baseUrl}${endpoint}`;
};

export const getImageApiUrl = (): string => {
  const config = getCurrentConfig();
  const provider = getProviderById(config.imageModel.providerId) || getDefaultProvider();
  const baseUrl = provider.baseUrl.replace(/\/+$/, '');
  const modelName = config.imageModel.modelName || 'qwen-image-2.0';
  const endpoint = config.imageModel.endpoint || `/v1beta/models/${modelName}:generateContent`;
  return `${baseUrl}${endpoint}`;
};

export const getVideoApiUrl = (): string => {
  const config = getCurrentConfig();
  const provider = getProviderById(config.videoModel.providerId) || getDefaultProvider();
  const baseUrl = provider.baseUrl.replace(/\/+$/, '');
  
  if (config.videoModel.type === 'async') {
    return `${baseUrl}/v1/videos`;
  } else {
    return `${baseUrl}/v1/chat/completions`;
  }
};

export const getApiBaseUrl = (type: 'chat' | 'image' | 'video' = 'chat'): string => {
  const config = getCurrentConfig();
  let providerId: string;
  
  switch (type) {
    case 'chat':
      providerId = config.chatModel.providerId;
      break;
    case 'image':
      providerId = config.imageModel.providerId;
      break;
    case 'video':
      providerId = config.videoModel.providerId;
      break;
    default:
      providerId = 'agnes';
  }
  
  const provider = getProviderById(providerId) || getDefaultProvider();
  return provider.baseUrl.replace(/\/+$/, '');
};

export const getProviderApiKey = (providerId: string): string | undefined => {
  const provider = getProviderById(providerId);
  return provider?.apiKey;
};

export const getDefaultAspectRatio = (): AspectRatio => {
  return loadModelConfig().defaultAspectRatio;
};

export const setDefaultAspectRatio = (ratio: AspectRatio): void => {
  const state = loadModelConfig();
  state.defaultAspectRatio = ratio;
  saveModelConfig(state);
};

export const getDefaultVideoDuration = (): VideoDuration => {
  return loadModelConfig().defaultVideoDuration;
};

export const setDefaultVideoDuration = (duration: VideoDuration): void => {
  const state = loadModelConfig();
  state.defaultVideoDuration = duration;
  saveModelConfig(state);
};

export const getVideoModelType = (): 'async' => {
  return getCurrentConfig().videoModel.type as 'async';
};

export const getVeoModelName = (hasReferenceImage: boolean, aspectRatio: AspectRatio): string => {
  const orientation = aspectRatio === '9:16' ? 'portrait' : 'landscape';
  
  if (hasReferenceImage) {
    return `veo_3_1_i2v_s_fast_fl_${orientation}`;
  } else {
    return `veo_3_1_t2v_fast_${orientation}`;
  }
};

export const getSoraVideoSize = (aspectRatio: AspectRatio): string => {
  const sizeMap: Record<AspectRatio, string> = {
    '16:9': '1280x720',
    '9:16': '720x1280',
    '1:1': '720x720'
  };
  return sizeMap[aspectRatio];
};

export const resetToDefault = (): void => {
  runtimeState = null;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  loadModelConfig();
};

export const AVAILABLE_CHAT_MODELS = [
  { name: 'Agnes 2.5 Flash', value: 'agnes-2.5-flash', description: '默认推荐，结构化输出稳定' },
];

export const AVAILABLE_IMAGE_MODELS = [
  { name: 'Agnes Image 2.1 Flash', value: 'agnes-image-2.1-flash', description: '默认推荐，文生图 /v1/images/generations' },
];

export const AVAILABLE_VIDEO_MODELS = [
  { name: 'Agnes Video V2.0', value: 'agnes-video-v2.0', type: 'async' as const, description: '默认推荐，异步 /v1/videos' },
];
