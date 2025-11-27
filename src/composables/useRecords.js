/**
 * 记录管理 Composable
 */
import { storage, STORAGE_KEYS } from '../utils/storage.js';
import { formatDate, calculateShares } from '../utils/formatter.js';
import { analyzeImageWithGemini, analyzeImageWithOpenAI } from '../utils/api.js';

export function useRecords(Vue, config, updateChart, refreshPrices) {
    const { ref, computed } = Vue;
    
    const form = ref({
        name: '',
        date: formatDate(),
        total: undefined,
        price: undefined
    });
    
    const records = ref([]);
    const analyzing = ref(false);
    
    // 计算股数
    const calculatedShares = computed(() => {
        return calculateShares(form.value.total, form.value.price);
    });
    
    // 加载记录
    function loadRecords() {
        const savedData = storage.get(STORAGE_KEYS.INVEST_DATA, []);
        records.value = savedData;
    }
    
    // 保存记录
    function saveRecords() {
        storage.set(STORAGE_KEYS.INVEST_DATA, records.value);
        updateChart();
    }
    
    // 添加记录
    function addRecord() {
        if (!form.value.name || !form.value.total || !form.value.price) {
            ElementPlus.ElMessage.warning('请填写完整信息');
            return;
        }
        
        records.value.unshift({
            name: form.value.name,
            date: form.value.date,
            total: Number(form.value.total),
            price: Number(form.value.price),
            shares: calculatedShares.value
        });
        
        saveRecords();
        form.value.name = '';
        form.value.total = undefined;
        form.value.price = undefined;
        ElementPlus.ElMessage.success('已记录');
        
        // 自动刷新价格
        setTimeout(() => refreshPrices(), 500);
    }
    
    // 删除记录
    function deleteRecord(index) {
        records.value.splice(index, 1);
        saveRecords();
    }
    
    // 清空所有记录
    function clearAll() {
        if (confirm('确定清空？')) {
            records.value = [];
            saveRecords();
        }
    }
    
    // 处理图片上传
    function handleImageUpload(file) {
        if (!config.value.apiKey) {
            ElementPlus.ElMessage.error('请配置 Key');
            return;
        }
        
        const reader = new FileReader();
        reader.readAsDataURL(file.raw);
        reader.onload = async () => analyzeImage(reader.result);
    }
    
    // AI图片识别
    async function analyzeImage(base64Full) {
        analyzing.value = true;
        try {
            let jsonRes = '';
            
            if (config.value.provider === 'gemini') {
                const base64Data = base64Full.split(',')[1];
                jsonRes = await analyzeImageWithGemini(base64Data, config.value);
            } else {
                jsonRes = await analyzeImageWithOpenAI(base64Full, config.value);
            }
            
            const items = JSON.parse(jsonRes.replace(/```json/g, '').replace(/```/g, '').trim());
            let count = 0;
            
            (Array.isArray(items) ? items : [items]).forEach(item => {
                if (item.assetName && item.totalAmount) {
                    const price = Number(item.unitPrice) || (item.totalAmount / item.shares) || 0;
                    const total = Number(item.totalAmount);
                    if (total > 0) {
                        records.value.unshift({
                            name: item.assetName,
                            date: item.date || formatDate(),
                            total: total,
                            price: price,
                            shares: calculateShares(total, price)
                        });
                        count++;
                    }
                }
            });
            
            saveRecords();
            ElementPlus.ElMessage.success(`录入 ${count} 条`);
            
            // 自动刷新价格
            setTimeout(() => refreshPrices(), 500);
        } catch (error) {
            ElementPlus.ElMessage.error(error.message);
        } finally {
            analyzing.value = false;
        }
    }
    
    return {
        form,
        records,
        analyzing,
        calculatedShares,
        loadRecords,
        addRecord,
        deleteRecord,
        clearAll,
        handleImageUpload
    };
}