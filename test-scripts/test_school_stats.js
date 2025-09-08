#!/usr/bin/env node

/**
 * 测试学校统计数据结构
 */

import http from 'http';

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

async function testSchoolStats() {
  console.log('📊 测试学校统计数据结构...\n');

  try {
    const response = await makeRequest('POST', '/api/v1/data-search/search', {
      company: '国网',
      page: 1,
      limit: 10
    });
    
    if (response.status === 200) {
      const data = response.data;
      
      console.log('✅ API响应成功');
      console.log('📊 总记录数:', data.total_records);
      
      // 检查学校统计数据结构
      if (data.school_statistics && data.school_statistics.schools) {
        console.log('\n🏫 学校统计数据结构:');
        console.log('学校总数:', data.school_statistics.schools.length);
        
        // 显示前3个学校的数据结构
        console.log('\n📝 前3个学校数据样本:');
        data.school_statistics.schools.slice(0, 3).forEach((school, i) => {
          console.log(`\n${i + 1}. ${school.school_name}`);
          console.log(`   类型: ${school.school_type || 'N/A'}`);
          console.log(`   层次: ${school.school_level || 'N/A'}`);
          console.log(`   录取人数: ${school.recruitment_count}`);
          console.log(`   占比: ${school.percentage ? school.percentage.toFixed(1) : 'N/A'}%`);
        });
        
        // 检查是否有详细统计数据
        console.log('\n🔍 检查其他数据字段:');
        console.log('detailed_statistics 存在:', !!data.detailed_statistics);
        console.log('statistics 存在:', !!data.statistics);
        console.log('company_distribution 存在:', !!data.statistics?.company_distribution);
        
        if (data.statistics?.company_distribution) {
          console.log('\n🏢 公司分布数据:');
          Object.entries(data.statistics.company_distribution).forEach(([company, count]) => {
            console.log(`   ${company}: ${count}人`);
          });
        }
      } else {
        console.log('❌ 未找到 school_statistics.schools 数据');
      }
    } else {
      console.log(`❌ API失败: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
  }
}

testSchoolStats().catch(console.error);