/**
 * 配置管理 Composable
 */
import { 
    fetchExchangeRate as apiFetchExchangeRate, 
    fetchGeminiModels,
    getConfig as apiGetConfig,
    saveConfig as apiSaveConfig
} from '../utils/api.js';

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
    async function loadConfig() {
        try {
            const savedConfig = await apiGetConfig('ai_config');
            if (savedConfig) {
                config.value = { ...config.value, ...savedConfig };
            }
            
            // 从 localStorage 加载汇率
            const cachedRate = localStorage.getItem('exchange_rate');
            if (cachedRate) {
                config.value.exchangeRate = parseFloat(cachedRate);
                console.log(`使用缓存汇率: 1 USD = ${cachedRate} CNY`);
            } else {
                // 如果没有缓存，自动获取汇率
                await fetchExchangeRate(true);
            }
        } catch (error) {
            console.error('加载配置失败:', error);
        }
    }
    
    // 保存配置
    async function saveConfig() {
        try {
            await apiSaveConfig('ai_config', config.value);
            showConfig.value = false;
            ElementPlus.ElMessage.success('配置已保存');
        } catch (error) {
            console.error('保存配置失败:', error);
            ElementPlus.ElMessage.error('保存配置失败');
        }
    }
    
    // 获取汇率
    async function fetchExchangeRate(silent = false) {
        rateLoading.value = true;
        try {
            const rate = await apiFetchExchangeRate();
            config.value.exchangeRate = rate;
            
            // 保存到 localStorage
            localStorage.setItem('exchange_rate', rate.toString());
            
            if (!silent) {
                ElementPlus.ElMessage.success('汇率已更新');
            }
            await apiSaveConfig('ai_config', config.value);
        } catch (error) {
            if (!silent) {
                ElementPlus.ElMessage.warning('汇率更新失败');
            }
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