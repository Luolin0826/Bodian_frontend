#!/usr/bin/env node

/**
 * 测试后端新的unit_statistics数据结构
 */

import http from 'http';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
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

async function testUnitStats() {
  console.log('🏢 测试二级单位统计数据结构...\n');

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
      
      // 检查新的unit_statistics数据结构
      if (data.unit_statistics) {
        console.log('\n🏢 二级单位统计数据结构:');
        console.log('可用性:', data.unit_statistics.available);
        console.log('覆盖单位数:', data.unit_statistics.covered_units);
        console.log('总单位数:', data.unit_statistics.total_units);
        
        if (data.unit_statistics.units && data.unit_statistics.units.length > 0) {
          console.log('\n📊 单位详细信息 (前5个):');
          data.unit_statistics.units.slice(0, 5).forEach((unit, i) => {
            console.log(`\n${i + 1}. ${unit.unit_name}`);
            console.log(`   地区: ${unit.region}`);
            console.log(`   录取人数: ${unit.recruitment_count}`);
            console.log(`   占比: ${unit.percentage?.toFixed(2) || 'N/A'}%`);
          });
          
          console.log(`\n📈 单位统计Top 10:`);
          const top10 = data.unit_statistics.units
            .sort((a, b) => b.recruitment_count - a.recruitment_count)
            .slice(0, 10);
            
          top10.forEach((unit, i) => {
            console.log(`   ${i + 1}. ${unit.unit_name} (${unit.region}) - ${unit.recruitment_count}人 (${unit.percentage?.toFixed(2) || 'N/A'}%)`);
          });
        }
      } else {
        console.log('❌ 未找到 unit_statistics 数据');
        
        // 检查是否还有旧的数据结构
        console.log('\n🔍 检查其他相关数据字段:');
        console.log('company_distribution 存在:', !!data.statistics?.company_distribution);
        console.log('school_statistics 存在:', !!data.school_statistics);
        
        if (data.statistics?.company_distribution) {
          console.log('\n🏢 公司分布数据 (旧结构):');
          Object.entries(data.statistics.company_distribution).forEach(([company, count]) => {
            console.log(`   ${company}: ${count}人`);
          });
        }
      }
    } else {
      console.log(`❌ API失败: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
  }
}

testUnitStats().catch(console.error);