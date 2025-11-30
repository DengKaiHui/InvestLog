/**
 * 投资看板后端服务
 * - 股票价格查询
 * - 数据库操作（SQLite）
 * - CSV 导入导出
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, transactionDB, configDB, priceCacheDB } from './database.js';
import { importCSV, exportCSV, validateCSV } from './csv-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Alpha Vantage API Key
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || 'demo';
// Finnhub API Key
const FINNHUB_KEY = process.env.FINNHUB_KEY || 'demo';

// 配置 multer 用于文件上传
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('只支持 CSV 文件'));
        }
    }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 初始化数据库
initDatabase();

console.log('✓ 后端服务初始化完成');

// ================== 健康检查 ==================
app.get('/api/health', (req, res) => {
    const transactionCount = transactionDB.getAll().length;
    res.json({
        success: true,
        status: 'running',
        uptime: process.uptime(),
        database: 'connected',
        transactionCount,
        message: '服务运行正常'
    });
});

// ================== 交易记录 API ==================

// 获取所有交易记录
app.get('/api/transactions', (req, res) => {
    try {
        const records = transactionDB.getAll();
        res.json({
            success: true,
            data: records,
            count: records.length
        });
    } catch (error) {
        console.error('获取交易记录失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 获取持仓汇总
app.get('/api/transactions/summary', (req, res) => {
    try {
        const summary = transactionDB.getSummary();
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('获取持仓汇总失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 根据 ID 获取交易记录
app.get('/api/transactions/:id', (req, res) => {
    try {
        const record = transactionDB.getById(req.params.id);
        if (record) {
            res.json({
                success: true,
                data: record
            });
        } else {
            res.status(404).json({
                success: false,
                message: '记录不存在'
            });
        }
    } catch (error) {
        console.error('获取交易记录失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 添加交易记录
app.post('/api/transactions', (req, res) => {
    try {
        const { name, symbol, date, total, price, shares } = req.body;
        
        // 验证必填字段
        if (!name || !date || !total || !price) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段'
            });
        }
        
        const record = {
            name,
            symbol: symbol || name,
            date,
            total: parseFloat(total),
            price: parseFloat(price),
            shares: shares !== undefined ? parseFloat(shares) : (parseFloat(total) / parseFloat(price))
        };
        
        const id = transactionDB.create(record);
        
        res.json({
            success: true,
            id,
            message: '记录添加成功'
        });
    } catch (error) {
        console.error('添加交易记录失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 批量添加交易记录
app.post('/api/transactions/batch', (req, res) => {
    try {
        const { records } = req.body;
        
        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({
                success: false,
                message: '记录数组不能为空'
            });
        }
        
        const count = transactionDB.createBatch(records);
        
        res.json({
            success: true,
            count,
            message: `成功添加 ${count} 条记录`
        });
    } catch (error) {
        console.error('批量添加交易记录失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 更新交易记录
app.put('/api/transactions/:id', (req, res) => {
    try {
        const { name, symbol, date, total, price, shares } = req.body;
        
        const record = {
            name,
            symbol: symbol || name,
            date,
            total: parseFloat(total),
            price: parseFloat(price),
            shares: shares !== undefined ? parseFloat(shares) : (parseFloat(total) / parseFloat(price))
        };
        
        const success = transactionDB.update(req.params.id, record);
        
        if (success) {
            res.json({
                success: true,
                message: '记录更新成功'
            });
        } else {
            res.status(404).json({
                success: false,
                message: '记录不存在'
            });
        }
    } catch (error) {
        console.error('更新交易记录失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 删除交易记录
app.delete('/api/transactions/:id', (req, res) => {
    try {
        const success = transactionDB.delete(req.params.id);
        
        if (success) {
            res.json({
                success: true,
                message: '记录删除成功'
            });
        } else {
            res.status(404).json({
                success: false,
                message: '记录不存在'
            });
        }
    } catch (error) {
        console.error('删除交易记录失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 清空所有交易记录
app.delete('/api/transactions', (req, res) => {
    try {
        const count = transactionDB.deleteAll();
        res.json({
            success: true,
            count,
            message: `已清空 ${count} 条记录`
        });
    } catch (error) {
        console.error('清空交易记录失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================== CSV 导入导出 API ==================

// 导出 CSV
app.get('/api/export/csv', async (req, res) => {
    try {
        const csv = await exportCSV();
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="investlog_${Date.now()}.csv"`);
        res.send('\ufeff' + csv); // 添加 BOM 以支持中文
    } catch (error) {
        console.error('导出 CSV 失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 导入 CSV（验证）
app.post('/api/import/csv/validate', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请上传 CSV 文件'
            });
        }
        
        const csvContent = req.file.buffer.toString('utf-8');
        const result = await validateCSV(csvContent);
        
        res.json(result);
    } catch (error) {
        console.error('验证 CSV 失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 导入 CSV（执行）
app.post('/api/import/csv', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请上传 CSV 文件'
            });
        }
        
        const csvContent = req.file.buffer.toString('utf-8');
        const append = req.body.append === 'true' || req.body.append === true;
        
        const result = await importCSV(csvContent, append);
        
        res.json(result);
    } catch (error) {
        console.error('导入 CSV 失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================== 配置 API ==================

// 获取配置
app.get('/api/config/:key', (req, res) => {
    try {
        const value = configDB.get(req.params.key);
        res.json({
            success: true,
            data: value
        });
    } catch (error) {
        console.error('获取配置失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 获取所有配置
app.get('/api/config', (req, res) => {
    try {
        const config = configDB.getAll();
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('获取配置失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 设置配置
app.post('/api/config', (req, res) => {
    try {
        const { key, value } = req.body;
        
        if (!key) {
            return res.status(400).json({
                success: false,
                message: '缺少配置键'
            });
        }
        
        configDB.set(key, value);
        
        res.json({
            success: true,
            message: '配置保存成功'
        });
    } catch (error) {
        console.error('设置配置失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================== 股票价格 API ==================

/**
 * 方法1: Yahoo Finance 直接 API (推荐)
 */
async function fetchPriceFromYahooWeb(symbol) {
    try {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Referer': 'https://finance.yahoo.com/',
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.chart?.result?.[0]) {
            const meta = data.chart.result[0].meta;
            const price = meta.regularMarketPrice || meta.previousClose;
            
            if (price && price > 0) {
                return { price, source: 'Yahoo Web' };
            }
        }
        
        return null;
    } catch (error) {
        console.error(`  Yahoo Web API 失败: ${error.message}`);
        return null;
    }
}

/**
 * 智能获取股票价格
 */
async function fetchStockPrice(symbol, retries = 1) {
    console.log(`📊 获取 ${symbol} 价格...`);
    
    // 先检查数据库缓存
    const cached = priceCacheDB.get(symbol);
    if (cached) {
        const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
        if (cacheAge < 30 * 60 * 1000) { // 30分钟内
            console.log(`↻ 使用缓存: ${symbol} = $${cached.price}`);
            return cached.price;
        }
    }
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) {
            const waitTime = attempt * 2;
            console.log(`⏳ 等待 ${waitTime} 秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
        
        const result = await fetchPriceFromYahooWeb(symbol);
        if (result) {
            console.log(`✓ ${symbol} = $${result.price}`);
            // 更新数据库缓存
            priceCacheDB.set(symbol, result.price);
            return result.price;
        }
    }
    
    console.error(`✗ ${symbol} 获取失败`);
    return null;
}

// 获取单个股票价格
app.get('/api/price/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const { force } = req.query;
    
    try {
        // 如果不强制刷新，先查缓存
        if (!force) {
            const cached = priceCacheDB.get(symbol);
            if (cached) {
                const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
                if (cacheAge < 30 * 60 * 1000) {
                    return res.json({
                        success: true,
                        symbol,
                        price: cached.price,
                        cached: true,
                        lastUpdate: cached.updated_at
                    });
                }
            }
        }
        
        const price = await fetchStockPrice(symbol);
        
        if (price !== null) {
            res.json({
                success: true,
                symbol,
                price,
                cached: false,
                lastUpdate: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                message: `无法获取 ${symbol} 的价格`
            });
        }
    } catch (error) {
        console.error('获取价格失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 批量获取股票价格
app.post('/api/prices', async (req, res) => {
    const { symbols, force } = req.body;
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
        return res.status(400).json({
            success: false,
            message: '请提供股票代码数组'
        });
    }
    
    try {
        const results = {};
        
        for (const symbol of symbols) {
            const price = await fetchStockPrice(symbol, 0);
            if (price !== null) {
                results[symbol] = {
                    price,
                    lastUpdate: new Date().toISOString()
                };
            } else {
                results[symbol] = {
                    price: null,
                    error: '获取失败'
                };
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        res.json({
            success: true,
            results
        });
    } catch (error) {
        console.error('批量获取价格失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================== 启动服务器 ==================

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 投资看板服务已启动`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`💾 数据存储: SQLite (data/investlog.db)`);
    console.log(`📊 功能模块:`);
    console.log(`  - 交易记录管理 (CRUD)`);
    console.log(`  - CSV 导入/导出`);
    console.log(`  - 股票价格查询`);
    console.log(`  - 配置管理`);
    console.log(`${'='.repeat(60)}\n`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到终止信号，正在关闭服务器...');
    process.exit(0);
});
