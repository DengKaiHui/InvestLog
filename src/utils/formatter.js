/**
 * 数据格式化工具
 */

// 格式化数字为货币格式
export function formatCurrency(num, decimals = 2) {
    return Number(num).toLocaleString('en-US', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
    });
}

// 格式化日期时间
export function formatDateTime(date = new Date()) {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 格式化日期
export function formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
}

// 计算股数
export function calculateShares(total, price) {
    if (!total || !price || price === 0) return 0;
    return (total / price).toFixed(4);
}

// 获取盈亏样式类名
export function getProfitClass(value) {
    if (value === '--' || value === 0) return 'profit-neutral';
    return value > 0 ? 'profit-positive' : 'profit-negative';
}