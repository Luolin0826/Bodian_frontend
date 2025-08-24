#!/usr/bin/env node

/**
 * 测试新的data-search搜索接口
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testSearchAPI() {
  console.log('🚀 测试新的data-search接口...\n');

  // 测试1: 基本搜索 - 国网四川
  console.log('📊 测试1: 搜索国网四川数据');
  try {
    const response = await makeRequest('POST', '/api/v1/data-search/search', {
      company: '国网',
      secondary_unit: '四川',
      page: 1,
      limit: 10
    });
    
    console.log(`状态码: ${response.status}`);
    if (response.status === 200) {
      const data = response.data;
      console.log(`✅ 成功！找到 ${data.total_records} 条记录`);
      console.log(`分页信息: 第${data.current_page}页，共${data.total_pages}页`);
      console.log(`性别分布:`, JSON.stringify(data.gender_distribution || {}));
      console.log(`学校层次分布:`, JSON.stringify(data.school_level_distribution || {}));
      console.log(`返回结果数量: ${data.results ? data.results.length : 0}`);
    } else {
      console.log(`❌ 失败: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试2: 二级单位列表 - 国网
  console.log('📋 测试2: 获取国网二级单位');
  try {
    const response = await makeRequest('GET', '/api/v1/data-search/secondary-units?company_type=' + encodeURIComponent('国网'));
    
    console.log(`状态码: ${response.status}`);
    if (response.status === 200) {
      const units = response.data.data || response.data;
      console.log(`✅ 成功！找到 ${units.length} 个二级单位`);
      console.log('前5个单位:');
      units.slice(0, 5).forEach(unit => {
        console.log(`  - ${unit.unit_name} (${unit.region}) - ${unit.recruitment_count}人`);
      });
    } else {
      console.log(`❌ 失败: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试3: 搜索特定学校
  console.log('📚 测试3: 搜索清华大学相关数据');
  try {
    const response = await makeRequest('POST', '/api/v1/data-search/search', {
      company: '国网',
      university_name: '清华大学',
      page: 1,
      limit: 5
    });
    
    console.log(`状态码: ${response.status}`);
    if (response.status === 200) {
      const data = response.data;
      console.log(`✅ 成功！找到 ${data.total_records} 条清华大学相关记录`);
      if (data.results && data.results.length > 0) {
        console.log('样本数据:');
        data.results.slice(0, 3).forEach(result => {
          console.log(`  - ${result.name} (${result.gender}) - ${result.university} - ${result.secondary_unit}`);
        });
      }
    } else {
      console.log(`❌ 失败: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
  }

  console.log('\n🎉 测试完成！');
}

testSearchAPI().catch(console.error);