/**
 * 本地存储工具
 */

export const storage = {
    // 保存数据
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`保存数据失败 [${key}]:`, error);
            return false;
        }
    },

    // 获取数据
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error(`读取数据失败 [${key}]:`, error);
            return defaultValue;
        }
    },

    // 删除数据
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`删除数据失败 [${key}]:`, error);
            return false;
        }
    },

    // 清空所有数据
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }
};

// 存储键名常量
export const STORAGE_KEYS = {
    INVEST_DATA: 'investData',
    AI_CONFIG: 'aiConfigV9',
    STOCK_PRICES: 'stockPrices',
    LAST_UPDATE_TIME: 'lastUpdateTime',
    CARD_ORDER: 'cardOrder',
    CARD_ORDER_LEFT: 'cardOrderLeft',
    CARD_ORDER_RIGHT: 'cardOrderRight'
};