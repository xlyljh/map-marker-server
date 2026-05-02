const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'markers.json');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 初始化数据文件
function initDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, '[]', 'utf8');
        console.log('✅ 创建数据文件: markers.json');
    }
}

// 安全读取JSON文件
function safeReadMarkers() {
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(content);
        if (!Array.isArray(data)) {
            console.error('数据格式错误，重置为空白数组');
            return [];
        }
        return data;
    } catch (err) {
        console.error('读取数据文件失败:', err.message);
        fs.writeFileSync(DATA_FILE, '[]', 'utf8');
        return [];
    }
}

// 安全写入JSON文件
function safeWriteMarkers(markers) {
    try {
        const jsonContent = JSON.stringify(markers, null, 2);
        fs.writeFileSync(DATA_FILE, jsonContent, 'utf8');
        return true;
    } catch (err) {
        console.error('写入数据失败:', err);
        return false;
    }
}

// 读取所有标记
app.get('/api/markers', (req, res) => {
    try {
        const markers = safeReadMarkers();
        res.json(markers);
    } catch (err) {
        console.error('读取数据失败:', err);
        res.status(500).json({ error: '读取数据失败' });
    }
});

// 保存所有标记
app.post('/api/markers', (req, res) => {
    try {
        const markers = req.body;
        if (!Array.isArray(markers)) {
            return res.status(400).json({ error: '数据格式错误，需要数组' });
        }
        if (safeWriteMarkers(markers)) {
            console.log('✅ 保存成功:', markers.length, '个标记');
            res.json({ success: true, count: markers.length });
        } else {
            res.status(500).json({ error: '保存数据失败' });
        }
    } catch (err) {
        console.error('保存数据失败:', err);
        res.status(500).json({ error: '保存数据失败' });
    }
});

// 添加单个标记
app.post('/api/markers/add', (req, res) => {
    try {
        const newMarker = req.body;
        const markers = safeReadMarkers();
        markers.push(newMarker);
        if (safeWriteMarkers(markers)) {
            res.json({ success: true, marker: newMarker });
        } else {
            res.status(500).json({ error: '添加标记失败' });
        }
    } catch (err) {
        console.error('添加标记失败:', err);
        res.status(500).json({ error: '添加标记失败' });
    }
});

// 更新单个标记
app.put('/api/markers/:id', (req, res) => {
    try {
        const markerId = req.params.id;
        const updatedMarker = req.body;
        let markers = safeReadMarkers();

        const index = markers.findIndex(m => m.id === markerId);
        if (index === -1) {
            return res.status(404).json({ error: '标记不存在' });
        }

        markers[index] = updatedMarker;
        if (safeWriteMarkers(markers)) {
            res.json({ success: true, marker: updatedMarker });
        } else {
            res.status(500).json({ error: '更新标记失败' });
        }
    } catch (err) {
        console.error('更新标记失败:', err);
        res.status(500).json({ error: '更新标记失败' });
    }
});

// 删除单个标记
app.delete('/api/markers/:id', (req, res) => {
    try {
        const markerId = req.params.id;
        let markers = safeReadMarkers();

        const initialLength = markers.length;
        markers = markers.filter(m => m.id !== markerId);

        if (markers.length === initialLength) {
            return res.status(404).json({ error: '标记不存在' });
        }

        if (safeWriteMarkers(markers)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '删除标记失败' });
        }
    } catch (err) {
        console.error('删除标记失败:', err);
        res.status(500).json({ error: '删除标记失败' });
    }
});

// 启动服务器
function startServer() {
    initDataFile();

    app.listen(PORT, '0.0.0.0', () => {
        console.log('='.repeat(60));
        console.log(`🗺️  地图标记服务已启动！`);
        console.log(`📡 本地访问: http://localhost:${PORT}`);
        console.log(`🌐 局域网访问: http://${getLocalIP()}:${PORT}`);
        console.log(`📁 数据文件: ${DATA_FILE}`);
        console.log('='.repeat(60));
    });
}

// 获取本地IP地址
function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

startServer();
