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
        
        // 记录管理（先创建，以便传递给图表）
        const recordsModule = useRecords(
            Vue,
            configModule.config,
            null, // updateChart会在后面传入
            null // refreshPrices会在后面传入
        );
        
        // 图表管理（传入records引用）
        const chartModule = useChart(Vue, recordsModule.records, isPrivacyMode);
        
        // 持仓盈亏管理
        const positionModule = usePosition(Vue, recordsModule.records);
        
        // 更新记录模块的回调函数引用
        const originalAddRecord = recordsModule.addRecord;
        recordsModule.addRecord = function() {
            originalAddRecord();
            chartModule.updateChart();
            setTimeout(() => positionModule.refreshPrices(), 500);
        };
        
        const originalDeleteRecord = recordsModule.deleteRecord;
        recordsModule.deleteRecord = function(index) {
            originalDeleteRecord(index);
            chartModule.updateChart();
        };
        
        const originalClearAll = recordsModule.clearAll;
        recordsModule.clearAll = function() {
            originalClearAll();
            chartModule.updateChart();
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
            const leftColumn = document.querySelector('[data-card="left"]');
            const rightColumn = document.querySelector('[data-card="right"]');
            
            if (!leftColumn || !rightColumn) return;
            
            // 为左侧卡片容器创建拖动
            const leftCards = leftColumn.querySelectorAll('.modern-card');
            leftCards.forEach((card, index) => {
                if (!card.dataset.cardId) {
                    card.dataset.cardId = `left-${index}`;
                }
            });
            
            // 为右侧卡片容器创建拖动
            const rightCards = rightColumn.querySelectorAll('.modern-card');
            rightCards.forEach((card, index) => {
                if (!card.dataset.cardId) {
                    card.dataset.cardId = `right-${index}`;
                }
            });
            
            // 恢复保存的顺序
            const savedLeftOrder = storage.get(STORAGE_KEYS.CARD_ORDER_LEFT);
            const savedRightOrder = storage.get(STORAGE_KEYS.CARD_ORDER_RIGHT);
            
            if (savedLeftOrder && savedLeftOrder.length > 0) {
                savedLeftOrder.forEach(cardId => {
                    const card = leftColumn.querySelector(`[data-card-id="${cardId}"]`);
                    if (card) {
                        leftColumn.appendChild(card);
                    }
                });
            }
            
            if (savedRightOrder && savedRightOrder.length > 0) {
                savedRightOrder.forEach(cardId => {
                    const card = rightColumn.querySelector(`[data-card-id="${cardId}"]`);
                    if (card) {
                        rightColumn.appendChild(card);
                    }
                });
            }
            
            // 初始化左侧拖动
            Sortable.create(leftColumn, {
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'sortable-ghost',
                onEnd: function() {
                    const cards = leftColumn.querySelectorAll('.modern-card');
                    const order = Array.from(cards).map(card => card.dataset.cardId);
                    storage.set(STORAGE_KEYS.CARD_ORDER_LEFT, order);
                }
            });
            
            // 初始化右侧拖动
            Sortable.create(rightColumn, {
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'sortable-ghost',
                onEnd: function() {
                    const cards = rightColumn.querySelectorAll('.modern-card');
                    const order = Array.from(cards).map(card => card.dataset.cardId);
                    storage.set(STORAGE_KEYS.CARD_ORDER_RIGHT, order);
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