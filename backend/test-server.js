const axios = require('axios');

async function testServer() {
  try {
    console.log('测试后端服务器连接...');
    
    // 测试服务器是否运行
    const response = await axios.get('http://localhost:8081/api/auth/me', {
      timeout: 5000,
      headers: {
        'Authorization': 'Bearer test'
      }
    });
    
    console.log('服务器响应:', response.status);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 服务器未运行，请先启动后端服务');
    } else if (error.response?.status === 401) {
      console.log('✅ 服务器正在运行，但需要有效的认证token');
    } else {
      console.log('❌ 服务器连接失败:', error.message);
    }
  }
}

testServer(); 