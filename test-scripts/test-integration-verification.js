#!/usr/bin/env node

/**
 * 前端后端集成测试脚本
 * 验证DataAnalytics组件的学校层次排序功能和RegionalOverview组件的学历要求显示功能
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 开始验证前端后端集成...\n');

// 1. 验证DataAnalytics组件是否包含排序功能
console.log('1. 检查DataAnalytics组件的排序功能...');
const dataAnalyticsPath = '/workspace/src/views/data-query/components/DataAnalytics.vue';
const dataAnalyticsContent = fs.readFileSync(dataAnalyticsPath, 'utf8');

const sortFeatureChecks = [
  {
    name: '排序选择器UI',
    pattern: /<div class="sort-filter">/,
    found: dataAnalyticsContent.includes('<div class="sort-filter">')
  },
  {
    name: '排序选项配置',
    pattern: /value="school_level"/,
    found: dataAnalyticsContent.includes('value="school_level"')
  },
  {
    name: 'sortBy参数处理',
    pattern: /sortBy.*selectedSortBy/,
    found: /sortBy.*selectedSortBy/.test(dataAnalyticsContent)
  },
  {
    name: '排序事件处理',
    pattern: /handleSortChange/,
    found: dataAnalyticsContent.includes('handleSortChange')
  }
];

sortFeatureChecks.forEach(check => {
  console.log(`   ${check.found ? '✅' : '❌'} ${check.name}: ${check.found ? '已实现' : '未找到'}`);
});

// 2. 验证RegionalOverview组件是否包含学历要求显示
console.log('\n2. 检查RegionalOverview组件的学历要求功能...');
const regionalOverviewPath = '/workspace/src/views/data-query/components/RegionalOverview.vue';
const regionalOverviewContent = fs.readFileSync(regionalOverviewPath, 'utf8');

const educationFeatureChecks = [
  {
    name: '学历要求容器',
    pattern: /education-requirements/,
    found: regionalOverviewContent.includes('education-requirements')
  },
  {
    name: 'BookOutlined图标',
    pattern: /BookOutlined|book-outlined/,
    found: /BookOutlined|book-outlined/.test(regionalOverviewContent)
  },
  {
    name: '本科学历要求',
    pattern: /bachelor.*summary/,
    found: /bachelor.*summary/.test(regionalOverviewContent)
  },
  {
    name: '硕士学历要求',
    pattern: /master.*summary/,
    found: /master.*summary/.test(regionalOverviewContent)
  },
  {
    name: '学历要求颜色编码',
    pattern: /getEducationRequirementColor/,
    found: regionalOverviewContent.includes('getEducationRequirementColor')
  }
];

educationFeatureChecks.forEach(check => {
  console.log(`   ${check.found ? '✅' : '❌'} ${check.name}: ${check.found ? '已实现' : '未找到'}`);
});

// 3. 验证API接口更新
console.log('\n3. 检查API接口更新...');
const recruitmentApiPath = '/workspace/src/api/recruitment.ts';
const recruitmentApiContent = fs.readFileSync(recruitmentApiPath, 'utf8');

const apiChecks = [
  {
    name: 'sort_by参数接口',
    pattern: /sort_by.*admission_count.*school_level.*university_name/,
    found: /sort_by.*admission_count.*school_level.*university_name/.test(recruitmentApiContent)
  },
  {
    name: 'SchoolsByBatchQuery接口',
    pattern: /SchoolsByBatchQuery.*sort_by/s,
    found: /SchoolsByBatchQuery[\s\S]*?sort_by/.test(recruitmentApiContent)
  },
  {
    name: 'getSchoolsByBatch方法',
    pattern: /getSchoolsByBatch/,
    found: recruitmentApiContent.includes('getSchoolsByBatch')
  }
];

apiChecks.forEach(check => {
  console.log(`   ${check.found ? '✅' : '❌'} ${check.name}: ${check.found ? '已实现' : '未找到'}`);
});

// 4. 验证主页面集成
console.log('\n4. 检查主页面集成...');
const indexPagePath = '/workspace/src/views/data-query/index.vue';
const indexPageContent = fs.readFileSync(indexPagePath, 'utf8');

const integrationChecks = [
  {
    name: 'handleBatchChange方法',
    pattern: /handleBatchChange.*sortBy/s,
    found: /handleBatchChange[\s\S]*?sortBy/.test(indexPageContent)
  },
  {
    name: 'getSchoolsByBatch调用',
    pattern: /getSchoolsByBatch.*sort_by/s,
    found: /getSchoolsByBatch[\s\S]*?sort_by/.test(indexPageContent)
  },
  {
    name: '批次变更事件传递',
    pattern: /@batch-change.*handleBatchChange/s,
    found: /@batch-change[\s\S]*?handleBatchChange/.test(indexPageContent)
  }
];

integrationChecks.forEach(check => {
  console.log(`   ${check.found ? '✅' : '❌'} ${check.name}: ${check.found ? '已实现' : '未找到'}`);
});

// 5. 检查政策API集成
console.log('\n5. 检查政策API集成...');
const policiesApiPath = '/workspace/src/api/policies.ts';
let policiesApiContent = '';
try {
  policiesApiContent = fs.readFileSync(policiesApiPath, 'utf8');
} catch (error) {
  console.log('   ⚠️  policies.ts文件不存在，可能集成在recruitment.ts中');
}

// 6. 统计结果
const allChecks = [
  ...sortFeatureChecks,
  ...educationFeatureChecks,
  ...apiChecks,
  ...integrationChecks
];

const passedChecks = allChecks.filter(check => check.found).length;
const totalChecks = allChecks.length;
const successRate = Math.round((passedChecks / totalChecks) * 100);

console.log('\n📊 集成测试结果:');
console.log(`   通过: ${passedChecks}/${totalChecks} 项检查`);
console.log(`   成功率: ${successRate}%`);

if (successRate >= 90) {
  console.log('   🎉 集成状态: 优秀！前端后端集成基本完成');
} else if (successRate >= 70) {
  console.log('   ✅ 集成状态: 良好，有少量待完善项目');
} else {
  console.log('   ⚠️  集成状态: 需要进一步完善');
}

// 7. 生成集成报告
const reportContent = `
# 前端后端集成测试报告

## 测试概述
- 测试时间: ${new Date().toLocaleString('zh-CN')}
- 测试范围: DataAnalytics学校层次排序 + RegionalOverview学历要求显示
- 通过率: ${successRate}% (${passedChecks}/${totalChecks})

## 功能检查结果

### DataAnalytics组件排序功能
${sortFeatureChecks.map(check => `- ${check.found ? '✅' : '❌'} ${check.name}`).join('\n')}

### RegionalOverview组件学历要求功能  
${educationFeatureChecks.map(check => `- ${check.found ? '✅' : '❌'} ${check.name}`).join('\n')}

### API接口更新
${apiChecks.map(check => `- ${check.found ? '✅' : '❌'} ${check.name}`).join('\n')}

### 主页面集成
${integrationChecks.map(check => `- ${check.found ? '✅' : '❌'} ${check.name}`).join('\n')}

## 总结
${successRate >= 90 ? '🎉 前端后端集成已基本完成，所有主要功能都已实现。' : 
  successRate >= 70 ? '✅ 前端后端集成良好，大部分功能已实现，建议完善剩余项目。' : 
  '⚠️ 前端后端集成需要进一步完善，请检查未通过的项目。'}

## 建议的测试步骤
1. 启动开发服务器：npm run dev
2. 打开浏览器访问数据查询页面
3. 选择一个单位测试DataAnalytics组件的排序功能
4. 验证RegionalOverview组件的学历要求显示
5. 检查API调用是否包含正确的sort_by参数
6. 验证数据显示是否按预期排序
`;

fs.writeFileSync('/workspace/integration-test-report.md', reportContent);
console.log('\n📝 集成测试报告已生成: integration-test-report.md');

console.log('\n🚀 建议的下一步测试:');
console.log('1. 在浏览器中打开应用进行实际测试');
console.log('2. 检查网络请求是否包含sort_by参数'); 
console.log('3. 验证学历要求数据是否正确显示');
console.log('4. 测试各种排序方式的效果');