const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        const tunnel = await localtunnel({ 
            port: 3000,
            max_retries: 5
        });
        const output = `公网地址: ${tunnel.url}\n创建时间: ${new Date().toLocaleString('zh-CN')}\n`;
        console.log(output);
        fs.writeFileSync(path.join(__dirname, 'tunnel_url.txt'), output, 'utf8');
        
        tunnel.on('close', () => {
            console.log('隧道已关闭');
        });
    } catch (err) {
        console.error('隧道创建失败:', err.message);
        fs.writeFileSync(path.join(__dirname, 'tunnel_url.txt'), '失败: ' + err.message, 'utf8');
    }
})();
