#!/usr/bin/env node

/**
 * 模拟API服务器
 * 用于测试前端功能
 */

import http from 'http';
import url from 'url';

const PORT = 5000;

// 模拟数据
const mockData = {
  'district-policies': {
    data_analysis: {
      total_records: 20,
      gender_distribution: { '男': 12, '女': 8 },
      school_type_distribution: { '985': 3, '211': 5, '普通本科': 8, '专科(学院)': 4 },
      company_distribution: [
        { company: '四川省电力公司', count: 15 },
        { company: '成都供电公司', count: 5 }
      ]
    },
    policy_analysis: {
      policies: [
        {
          province: '四川',
          city: '成都',
          company: '成都供电公司',
          data_level: '区县详情',
          salary_info: { bachelor_salary: '8-12万' },
          basic_requirements: { cet_requirement: '四级' },
          is_cost_effective: true,
          cost_effective_reason: '录取人数多，竞争相对较小',
          hierarchy_level: {
            level: '区县详情',
            priority: 1,
            description: '具体区县政策详情'
          }
        }
      ],
      total_policies: 1
    }
  },
  'cost-effective-recommendations': {
    algorithm_version: 'v1.0',
    total_analyzed: 10,
    recommendations: [
      {
        province: '四川',
        city: '成都',
        cost_effectiveness_score: 85.5,
        recommendation_reasons: ['录取人数多(15人)', '薪资待遇良好(8-12万)', '基本要求相对宽松'],
        recruitment_count: 15,
        bachelor_salary: '8-12万',
        data_level: '区县详情'
      },
      {
        province: '四川',
        city: '绵阳',
        cost_effectiveness_score: 78.2,
        recommendation_reasons: ['竞争相对较小', '发展潜力大'],
        recruitment_count: 8,
        bachelor_salary: '7-10万',
        data_level: '市级汇总'
      }
    ],
    evaluation_criteria: {
      factors: ['录取难度', '薪资待遇', '基本要求', '发展潜力'],
      scoring_method: '多维度加权综合评分'
    }
  },
  'schools/search': {
    query: '工程',
    schools: [
      { school_name: '四川大学', school_type: '985', recruitment_count: 10 },
      { school_name: '电子科技大学', school_type: '985', recruitment_count: 8 },
      { school_name: '西南交通大学', school_type: '211', recruitment_count: 6 }
    ]
  },
  'detailed-statistics': {
    data_analysis: {
      total_records: 20,
      gender_distribution: { '男': 12, '女': 8 },
      school_type_distribution: { '985': 3, '211': 5, '普通本科': 8, '专科(学院)': 4 },
      company_distribution: [
        { company: '四川省电力公司', count: 15 },
        { company: '成都供电公司', count: 5 }
      ]
    },
    detailed_statistics: [
      { name: '张**', gender: '男', school: '四川大学', school_type: '985', province: '四川' },
      { name: '李**', gender: '女', school: '电子科技大学', school_type: '985', province: '四川' }
    ],
    pagination: {
      current_page: 1,
      total_pages: 7,
      total_count: 20
    }
  },
  'options': {
    provinces: [
      '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
      '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
      '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
      '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆'
    ],
    cities: {
      '四川': ['成都', '绵阳', '德阳', '南充', '宜宾', '自贡'],
      '广东': ['广州', '深圳', '珠海', '汕头', '佛山', '韶关'],
      '江苏': ['南京', '无锡', '徐州', '常州', '苏州', '南通']
    },
    school_levels: [
      '985工程', '211工程', '双一流', '重点大学', '普通本科', '专科院校'
    ],
    company_types: ['国网', '南网'],
    success: true
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);
  
  // 路由处理
  try {
    let responseData = null;
    
    if (pathname.includes('/api/v1/recruitment/district-policies')) {
      responseData = mockData['district-policies'];
    } else if (pathname.includes('/api/v1/recruitment/cost-effective-recommendations')) {
      responseData = mockData['cost-effective-recommendations'];
    } else if (pathname.includes('/api/v1/recruitment/schools/search')) {
      responseData = mockData['schools/search'];
    } else if (pathname.includes('/api/v1/recruitment/detailed-statistics')) {
      responseData = mockData['detailed-statistics'];
    } else if (pathname.includes('/api/v1/recruitment/options')) {
      responseData = mockData['options'];
    } else if (pathname.includes('/api/v1/recruitment/health')) {
      responseData = { status: 'ok', message: '服务正常运行' };
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: '接口未找到' }));
      return;
    }
    
    res.writeHead(200);
    res.end(JSON.stringify(responseData, null, 2));
    
  } catch (error) {
    console.error('服务器错误:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: '内部服务器错误' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Mock API服务器启动成功!`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   可用接口:`);
  console.log(`   - GET /api/v1/recruitment/district-policies`);
  console.log(`   - GET /api/v1/recruitment/cost-effective-recommendations`);
  console.log(`   - GET /api/v1/recruitment/schools/search`);
  console.log(`   - GET /api/v1/recruitment/detailed-statistics`);
  console.log(`   - GET /api/v1/recruitment/health`);
  console.log(`\n按 Ctrl+C 停止服务器`);
});

process.on('SIGINT', () => {
  console.log('\n👋 服务器已停止');
  process.exit(0);
});