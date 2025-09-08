#!/usr/bin/env node

/**
 * 前后端联调测试脚本
 * 测试数据查询系统的完整功能
 */

import axios from 'axios';

// 配置
const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3007';

// 测试用例
const testCases = [
  {
    name: '8字段筛选主接口测试',
    url: `${BACKEND_URL}/api/v1/recruitment/district-policies`,
    method: 'GET',
    params: {
      province: '四川',
      page: 1,
      limit: 5
    }
  },
  {
    name: '学校名称模糊搜索测试',
    url: `${BACKEND_URL}/api/v1/recruitment/schools/search`,
    method: 'GET', 
    params: {
      query: '工程',
      limit: 5
    }
  },
  {
    name: '性价比推荐算法测试',
    url: `${BACKEND_URL}/api/v1/recruitment/cost-effective-recommendations`,
    method: 'GET',
    params: {
      limit: 5,
      region_type: 'all'
    }
  },
  {
    name: '详细统计分析测试',
    url: `${BACKEND_URL}/api/v1/recruitment/detailed-statistics`,
    method: 'GET',
    params: {
      province: '四川',
      page: 1,
      limit: 3
    }
  }
];

// 测试函数
async function runTests() {
  console.log('🚀 开始前后端联调测试...\n');
  
  let successCount = 0;
  let totalCount = testCases.length;

  for (const testCase of testCases) {
    try {
      console.log(`📋 测试: ${testCase.name}`);
      console.log(`🌐 URL: ${testCase.url}`);
      console.log(`📊 参数:`, testCase.params);
      
      const startTime = Date.now();
      const response = await axios({
        method: testCase.method,
        url: testCase.url,
        params: testCase.params,
        timeout: 10000
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ 成功! 响应时间: ${duration}ms`);
      console.log(`📦 数据样本:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
      console.log('─'.repeat(60));
      
      successCount++;
      
    } catch (error) {
      console.log(`❌ 失败!`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   错误信息: ${error.response.data?.error || error.response.statusText}`);
      } else {
        console.log(`   网络错误: ${error.message}`);
      }
      console.log('─'.repeat(60));
    }
  }
  
  // 测试前端可访问性
  try {
    console.log(`🌐 测试前端可访问性: ${FRONTEND_URL}`);
    const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
    if (frontendResponse.status === 200) {
      console.log(`✅ 前端服务正常运行`);
      successCount += 0.5; // 加半分
    }
  } catch (error) {
    console.log(`❌ 前端服务访问失败: ${error.message}`);
  }
  
  console.log('\n📈 测试结果汇总:');
  console.log(`   成功: ${Math.floor(successCount)} / ${totalCount}`);
  console.log(`   成功率: ${Math.round((successCount / totalCount) * 100)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 所有测试通过! 前后端联调成功!');
  } else {
    console.log('\n⚠️  部分测试失败，请检查具体错误信息');
  }
}

// 运行测试
runTests().catch(console.error);