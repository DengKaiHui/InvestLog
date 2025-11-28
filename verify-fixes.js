/**
 * 验证修复脚本
 * 在浏览器控制台中运行此脚本以验证所有修复
 */

console.log('=== 开始验证修复 ===\n');

// 1. 验证饼图
console.log('1. 验证饼图：');
const chartDom = document.querySelector('[data-card-id="right-1"] [style*="height: 350px"]');
if (chartDom) {
    console.log('✅ 找到图表DOM元素');
    const chartInstance = echarts.getInstanceByDom(chartDom);
    if (chartInstance) {
        console.log('✅ ECharts实例已初始化');
        const option = chartInstance.getOption();
        if (option && option.series && option.series[0] && option.series[0].data) {
            console.log('✅ 图表数据:', option.series[0].data);
        } else {
            console.log('❌ 图表数据为空');
        }
    } else {
        console.log('❌ ECharts实例未初始化');
    }
} else {
    console.log('❌ 未找到图表DOM元素');
}

// 2. 验证持仓盈亏背景色
console.log('\n2. 验证持仓盈亏背景色：');
const positionCard = document.querySelector('.position-table');
if (positionCard) {
    const bgColor = window.getComputedStyle(positionCard).backgroundColor;
    console.log('持仓盈亏卡片背景色:', bgColor);
    if (bgColor === 'rgb(255, 255, 255)' || bgColor === '#ffffff') {
        console.log('✅ 背景色为白色');
    } else {
        console.log('❌ 背景色不是白色，当前为:', bgColor);
    }
} else {
    console.log('❌ 未找到持仓盈亏卡片');
}

// 3. 验证卡片拖动
console.log('\n3. 验证卡片拖动配置：');
const leftCards = document.querySelectorAll('[data-card="left"] .modern-card');
const rightCards = document.querySelectorAll('[data-card="right"] .modern-card');

console.log(`左侧卡片数量: ${leftCards.length}`);
leftCards.forEach((card, index) => {
    const cardId = card.dataset.cardId;
    const handle = card.querySelector('.drag-handle');
    console.log(`  卡片${index + 1}: ID=${cardId}, 拖拽手柄=${handle ? '存在' : '不存在'}`);
});

console.log(`右侧卡片数量: ${rightCards.length}`);
rightCards.forEach((card, index) => {
    const cardId = card.dataset.cardId;
    const handle = card.querySelector('.drag-handle');
    console.log(`  卡片${index + 1}: ID=${cardId}, 拖拽手柄=${handle ? '存在' : '不存在'}`);
});

// 4. 检查localStorage中的卡片顺序
console.log('\n4. 检查保存的卡片顺序：');
const leftOrder = localStorage.getItem('cardOrderLeft');
const rightOrder = localStorage.getItem('cardOrderRight');
console.log('左侧顺序:', leftOrder ? JSON.parse(leftOrder) : '未保存');
console.log('右侧顺序:', rightOrder ? JSON.parse(rightOrder) : '未保存');

// 5. 检查投资记录数据
console.log('\n5. 检查投资记录数据：');
const investData = localStorage.getItem('investData');
if (investData) {
    const data = JSON.parse(investData);
    console.log(`记录数量: ${data.length}`);
    if (data.length > 0) {
        console.log('示例记录:', data[0]);
    }
} else {
    console.log('暂无投资记录');
}

console.log('\n=== 验证完成 ===');
console.log('\n建议测试：');
console.log('1. 添加一条记录，观察饼图是否更新');
console.log('2. 拖动左侧或右侧的卡片，刷新页面后检查顺序是否保持');
console.log('3. 检查持仓盈亏表格的背景色和文字颜色是否清晰');
