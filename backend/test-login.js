const axios = require('axios');

async function testLogin() {
  try {
    console.log('测试登录接口...');
    
    // 测试登录请求
    const loginData = {
      email: 'test@example.com',
      password: '123456'
    };
    
    console.log('发送登录请求:', loginData);
    
    const response = await axios.post('http://localhost:8081/api/auth/login', loginData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 登录成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', response.data);
    
  } catch (error) {
    console.error('❌ 登录失败');
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else {
      console.error('错误信息:', error.message);
    }
  }
}

testLogin(); 