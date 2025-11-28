/**
 * 图表管理 Composable
 */
export function useChart(Vue, records, isPrivacyMode) {
    const { ref, onMounted, nextTick } = Vue;
    
    const chartDom = ref(null);
    let myChart = null;
    
    // 初始化图表
    function initChart() {
        if (!chartDom.value) return;
        myChart = echarts.init(chartDom.value);
        updateChart();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            if (myChart) {
                myChart.resize();
            }
        });
    }
    
    // 更新图表数据
    function updateChart() {
        if (!myChart) return;
        if (!records || !records.value) return;
        
        // 聚合数据
        const agg = {};
        records.value.forEach(item => {
            agg[item.name] = (agg[item.name] || 0) + item.total;
        });
        
        const data = Object.keys(agg).map(k => ({
            name: k,
            value: agg[k]
        }));
        
        // 配置图表选项
        const option = {
            color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'],
            tooltip: {
                trigger: 'item',
                formatter: (params) => {
                    if (isPrivacyMode.value) {
                        return `${params.name}: **** (${params.percent}%)`;
                    }
                    return `${params.name}: $${params.value.toFixed(2)} (${params.percent}%)`;
                }
            },
            legend: {
                bottom: '0%',
                left: 'center'
            },
            series: [{
                type: 'pie',
                radius: ['50%', '80%'],
                center: ['50%', '45%'],
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                data: data.length > 0 ? data : [{ name: '暂无数据', value: 1 }]
            }]
        };
        
        myChart.setOption(option, true);
    }
    
    return {
        chartDom,
        initChart,
        updateChart
    };
}