/**
 * 配置管理 Composable
 */
import { storage, STORAGE_KEYS } from '../utils/storage.js';
import { fetchExchangeRate as apiFetchExchangeRate, fetchGeminiModels } from '../utils/api.js';

export function useConfig(Vue) {
    const { ref } = Vue;
    
    const showConfig = ref(false);
    const rateLoading = ref(false);
    const testing = ref(false);
    const availableModels = ref([]);
    
    const config = ref({
        provider: 'gemini',
        geminiBaseUrl: 'https://generativelanguage.googleapis.com',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gemini-1.5-flash',
        exchangeRate: 7.25
    });
    
    // 加载配置
    function loadConfig() {
        const savedConfig = storage.get(STORAGE_KEYS.AI_CONFIG);
        if (savedConfig) {
            config.value = { ...config.value, ...savedConfig };
        }
    }
    
    // 保存配置
    function saveConfig() {
        storage.set(STORAGE_KEYS.AI_CONFIG, config.value);
        showConfig.value = false;
        ElementPlus.ElMessage.success('配置已保存');
    }
    
    // 获取汇率
    async function fetchExchangeRate() {
        rateLoading.value = true;
        try {
            const rate = await apiFetchExchangeRate();
            config.value.exchangeRate = rate;
            ElementPlus.ElMessage.success('汇率已更新');
            storage.set(STORAGE_KEYS.AI_CONFIG, config.value);
        } catch (error) {
            ElementPlus.ElMessage.warning('汇率更新失败');
        } finally {
            rateLoading.value = false;
        }
    }
    
    // 获取模型列表
    async function fetchModels() {
        testing.value = true;
        availableModels.value = [];
        try {
            const models = await fetchGeminiModels(config.value.geminiBaseUrl, config.value.apiKey);
            availableModels.value = models;
            ElementPlus.ElMessage.success(`找到 ${models.length} 个模型`);
            if (!config.value.model && models.length > 0) {
                config.value.model = models[0];
            }
        } catch (error) {
            ElementPlus.ElMessage.error(error.message);
        } finally {
            testing.value = false;
        }
    }
    
    return {
        showConfig,
        rateLoading,
        testing,
        availableModels,
        config,
        loadConfig,
        saveConfig,
        fetchExchangeRate,
        fetchModels
    };
}