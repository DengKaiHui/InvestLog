/**
 * 主应用逻辑
 */
import { useConfig } from './composables/useConfig.js';
import { useRecords } from './composables/useRecords.js';
import { usePosition } from './composables/usePosition.js';
import { useChart } from './composables/useChart.js';
import { storage, STORAGE_KEYS } from './utils/storage.js';
import { formatCurrency } from './utils/formatter.js';

const { createApp, ref, computed, onMounted, nextTick } = Vue;

const App = {
    setup() {
        // 隐私模式
        const isPrivacyMode = ref(false);
        
        // 配置管理
        const configModule = useConfig(Vue);
        
        // 图表管理
        const chartModule = useChart(Vue, null, isPrivacyMode); // records会在后面传入
        
        // 记录管理（需要传入config和updateChart）
        const recordsModule = useRecords(
            Vue,
            configModule.config,
            chartModule.updateChart,
            null // refreshPrices会在后面传入
        );
        
        // 持仓盈亏管理
        const positionModule = usePosition(Vue, recordsModule.records);
        
        // 更新记录模块的refreshPrices引用
        const originalAddRecord = recordsModule.addRecord;
        recordsModule.addRecord = function() {
            originalAddRecord();
            setTimeout(() => positionModule.refreshPrices(), 500);
        };
        
        // 计算总资产
        const totalAssetUSD = computed(() => {
            const sum = recordsModule.records.value.reduce((acc, item) => acc + item.total, 0);
            return formatCurrency(sum);
        });
        
        const totalAssetCNY = computed(() => {
            const sum = recordsModule.records.value.reduce((acc, item) => acc + item.total, 0);
            return formatCurrency(sum * (configModule.config.value.exchangeRate || 7.25));
        });
        
        // 切换隐私模式
        function togglePrivacy() {
            isPrivacyMode.value = !isPrivacyMode.value;
            chartModule.updateChart();
        }
        
        // 卡片拖动排序
        function initDraggable() {
            const container = document.getElementById('draggable-container');
            if (!container) return;
            
            const savedOrder = storage.get(STORAGE_KEYS.CARD_ORDER);
            if (savedOrder) {
                // 恢复保存的顺序
                savedOrder.forEach((cardId, index) => {
                    const card = container.querySelector(`[data-card="${cardId}"]`);
                    if (card) {
                        container.appendChild(card);
                    }
                });
            }
            
            // 初始化Sortable
            Sortable.create(container, {
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'sortable-ghost',
                onEnd: function() {
                    // 保存新的顺序
                    const cards = container.querySelectorAll('.draggable-card');
                    const order = Array.from(cards).map(card => card.dataset.card);
                    storage.set(STORAGE_KEYS.CARD_ORDER, order);
                }
            });
        }
        
        // 生命周期
        onMounted(() => {
            // 加载数据
            configModule.loadConfig();
            recordsModule.loadRecords();
            positionModule.loadPrices();
            
            // 获取汇率
            configModule.fetchExchangeRate();
            
            // 初始化图表和拖动
            nextTick(() => {
                chartModule.initChart();
                initDraggable();
                
                // 自动刷新价格
                if (recordsModule.records.value.length > 0) {
                    setTimeout(() => positionModule.refreshPrices(), 1000);
                }
            });
        });
        
        return {
            // 配置相关
            ...configModule,
            
            // 记录相关
            ...recordsModule,
            
            // 持仓相关
            ...positionModule,
            
            // 图表相关
            ...chartModule,
            
            // 其他
            isPrivacyMode,
            togglePrivacy,
            totalAssetUSD,
            totalAssetCNY
        };
    }
};

// 创建并挂载应用
const app = createApp(App);
app.use(ElementPlus);

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.mount('#app');