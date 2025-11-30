/**
 * 记录管理 Composable
 */
import { formatDate, calculateShares } from '../utils/formatter.js';
import { 
    analyzeImageWithGemini, 
    analyzeImageWithOpenAI,
    fetchAllTransactions,
    createTransaction,
    createTransactionsBatch,
    deleteTransaction,
    deleteAllTransactions,
    exportToCSV,
    importFromCSV
} from '../utils/api.js';

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
    const showImportDialog = ref(false);
    const importMode = ref('append'); // 'append' 或 'replace'
    
    // 计算股数
    const calculatedShares = computed(() => {
        return calculateShares(form.value.total, form.value.price);
    });
    
    // 加载记录
    async function loadRecords() {
        try {
            const data = await fetchAllTransactions();
            records.value = data.map(record => ({
                id: record.id,
                name: record.name,
                symbol: record.symbol,
                date: record.date,
                total: record.total,
                price: record.price,
                shares: record.shares
            }));
        } catch (error) {
            console.error('加载记录失败:', error);
            ElementPlus.ElMessage.error('加载记录失败');
        }
    }
    
    // 添加记录
    async function addRecord() {
        if (!form.value.name || !form.value.total || !form.value.price) {
            ElementPlus.ElMessage.warning('请填写完整信息');
            return;
        }
        
        try {
            const record = {
                name: form.value.name,
                symbol: form.value.name,
                date: form.value.date,
                total: Number(form.value.total),
                price: Number(form.value.price),
                shares: calculatedShares.value
            };
            
            await createTransaction(record);
            await loadRecords(); // 重新加载数据
            
            if (updateChart && typeof updateChart === 'function') {
                updateChart();
            }
            
            form.value.name = '';
            form.value.total = undefined;
            form.value.price = undefined;
            ElementPlus.ElMessage.success('已记录');
            
            // 自动刷新价格
            if (refreshPrices && typeof refreshPrices === 'function') {
                setTimeout(() => refreshPrices(), 500);
            }
        } catch (error) {
            console.error('添加记录失败:', error);
            ElementPlus.ElMessage.error('添加记录失败');
        }
    }
    
    // 删除记录
    async function deleteRecord(index) {
        try {
            const record = records.value[index];
            if (!record.id) {
                ElementPlus.ElMessage.error('无效的记录 ID');
                return;
            }
            
            await deleteTransaction(record.id);
            await loadRecords(); // 重新加载数据
            
            if (updateChart && typeof updateChart === 'function') {
                updateChart();
            }
        } catch (error) {
            console.error('删除记录失败:', error);
            ElementPlus.ElMessage.error('删除记录失败');
        }
    }
    
    // 清空所有记录
    async function clearAll() {
        if (confirm('确定清空所有记录？')) {
            try {
                await deleteAllTransactions();
                await loadRecords(); // 重新加载数据
                
                if (updateChart && typeof updateChart === 'function') {
                    updateChart();
                }
                
                ElementPlus.ElMessage.success('已清空');
            } catch (error) {
                console.error('清空记录失败:', error);
                ElementPlus.ElMessage.error('清空记录失败');
            }
        }
    }
    
    // 导出 CSV
    async function exportCSV() {
        try {
            await exportToCSV();
            ElementPlus.ElMessage.success('导出成功');
        } catch (error) {
            console.error('导出失败:', error);
            ElementPlus.ElMessage.error('导出失败');
        }
    }
    
    // 处理导入 CSV
    async function handleImportCSV(file) {
        try {
            const append = importMode.value === 'append';
            const result = await importFromCSV(file.raw, append);
            
            await loadRecords(); // 重新加载数据
            
            if (updateChart && typeof updateChart === 'function') {
                updateChart();
            }
            
            ElementPlus.ElMessage.success(
                `导入成功: ${result.imported} 条记录${result.deleted > 0 ? `, 清空了 ${result.deleted} 条旧记录` : ''}`
            );
            
            showImportDialog.value = false;
            
            // 自动刷新价格
            if (refreshPrices && typeof refreshPrices === 'function') {
                setTimeout(() => refreshPrices(), 500);
            }
        } catch (error) {
            console.error('导入失败:', error);
            ElementPlus.ElMessage.error(`导入失败: ${error.message}`);
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
            const recordsToAdd = [];
            
            (Array.isArray(items) ? items : [items]).forEach(item => {
                if (item.assetName && item.totalAmount) {
                    const price = Number(item.unitPrice) || (item.totalAmount / item.shares) || 0;
                    const total = Number(item.totalAmount);
                    if (total > 0) {
                        recordsToAdd.push({
                            name: item.assetName,
                            symbol: item.assetName,
                            date: item.date || formatDate(),
                            total: total,
                            price: price,
                            shares: calculateShares(total, price)
                        });
                    }
                }
            });
            
            if (recordsToAdd.length > 0) {
                await createTransactionsBatch(recordsToAdd);
                await loadRecords(); // 重新加载数据
                
                if (updateChart && typeof updateChart === 'function') {
                    updateChart();
                }
                
                ElementPlus.ElMessage.success(`录入 ${recordsToAdd.length} 条`);
                
                // 自动刷新价格
                if (refreshPrices && typeof refreshPrices === 'function') {
                    setTimeout(() => refreshPrices(), 500);
                }
            } else {
                ElementPlus.ElMessage.warning('未识别到有效数据');
            }
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
        showImportDialog,
        importMode,
        loadRecords,
        addRecord,
        deleteRecord,
        clearAll,
        exportCSV,
        handleImportCSV,
        handleImageUpload
    };
}