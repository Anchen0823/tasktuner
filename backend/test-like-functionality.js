const axios = require('axios');

const API_BASE_URL = 'http://localhost:8081/api';

async function testLikeFunctionality() {
  try {
    console.log('🔄 开始测试点赞功能...');
    
    // 简单测试：直接访问已存在的笔记
    console.log('1️⃣ 测试获取已发布笔记...');
    const response = await axios.get(`${API_BASE_URL}/notes/published`);
    console.log('✅ 获取已发布笔记成功，数量:', response.data.length);
    
    if (response.data.length > 0) {
      const noteId = response.data[0].id;
      console.log('2️⃣ 测试笔记详情，ID:', noteId);
      
      const noteResponse = await axios.get(`${API_BASE_URL}/notes/${noteId}`);
      console.log('✅ 笔记详情:', {
        title: noteResponse.data.title,
        likeCount: noteResponse.data.likeCount,
        isLiked: noteResponse.data.isLiked
      });
    }

    console.log('🎉 基础测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testLikeFunctionality(); 