# 数查一点通页面 - 后端API需求文档

## 概述
根据实际数据样本和用户需求，重新设计API接口结构。数据源包含：姓名、性别、院校、手机号、二级单位等字段，支持按地区、公司类型、学历层次进行精确查询。

## 实际数据样本分析
```
姓名    性别    院校    手机号    二级单位
白*晖    男    东南大学    188****3722    江苏
白*廷    男    华北电力大学 (保定)    152****5800    江苏
柏*音    男    南京理工大学    166****2615    江苏
```

数据特点：
- 包含个人基本信息（姓名、性别、手机号）
- 院校信息（用于判断学历层次）
- 地区信息（省份）
- 二级单位信息

## 1. 基础数据查询接口

### 1.1 获取可用选项数据
**接口路径**: `GET /api/recruitment/options`
**描述**: 获取所有可用的查询选项
**返回数据**:
```json
{
  "provinces": [
    "江苏", "广东", "北京", "上海", "四川", "重庆", 
    "浙江", "山东", "河南", "湖北", "湖南", "安徽",
    "河北", "山西", "辽宁", "吉林", "黑龙江", "江西", 
    "福建", "海南", "贵州", "云南", "陕西", "甘肃", 
    "青海", "台湾", "内蒙古", "广西", "西藏", "宁夏", "新疆"
  ],
  "cities": {
    "江苏": ["南京", "苏州", "无锡", "常州", "南通", "镇江", "扬州", "盐城", "淮安", "宿迁", "连云港", "徐州", "泰州"],
    "广东": ["广州", "深圳", "佛山", "东莞", "中山", "珠海", "惠州", "江门", "肇庆"]
  }
}
```

### 1.2 按省份获取城市列表
**接口路径**: `GET /api/recruitment/cities/{province}`
**参数**: 
- `province`: 省份名称
**返回数据**:
```json
{
  "cities": ["南京", "苏州", "无锡", "常州", "南通", "镇江", "扬州", "盐城", "淮安", "宿迁", "连云港", "徐州", "泰州"],
  "count": 13
}
```

### 1.3 按省份和城市获取区县列表
**接口路径**: `GET /api/recruitment/counties/{province}/{city}`
**参数**: 
- `province`: 省份名称
- `city`: 城市名称  
**返回数据**:
```json
{
  "counties": ["玄武区", "秦淮区", "建邺区", "鼓楼区", "浦口区", "栖霞区", "雨花台区", "江宁区", "六合区", "溧水区", "高淳区"],
  "count": 11
}
```

## 2. 数据查询接口

### 2.1 网申结果查询
**接口路径**: `POST /api/recruitment/query`
**描述**: 根据条件查询网申录取结果
**请求参数**:
```json
{
  "company_type": "国网|南网",           // 可选：公司类型
  "batch": "一批|二批|三批",              // 可选：批次（仅国网有效）
  "province": "省份名称",                // 可选：省份
  "city": "城市名称",                    // 可选：城市
  "county": "区县名称",                  // 可选：区县
  "bachelor_level": "985本|211本|省内双一流本|省外双一流本|省内双非一本|省外双非一本|省内二本|省外二本|民办本|专升本|专科", // 可选：本科层次
  "master_level": "985硕|211硕|省内双一流硕|省外双一流硕|省内双非硕|省外双非硕" // 可选：硕士层次
}
```
**返回数据**:
```json
{
  "success": true,
  "data": [
    {
      "name": "白**",                    // 脱敏姓名
      "gender": "男|女",                 // 性别
      "school": "东南大学",               // 院校名称
      "phone": "188****3722",           // 脱敏手机号
      "province": "江苏",                // 省份（二级单位显示为省份）
      "company_type": "国网|南网",        // 公司类型
      "batch": "一批|二批|三批",           // 批次
      "education_level": "本科|硕士",     // 学历层次（根据院校推断）
      "bachelor_level": "985本",         // 本科层次（如果是本科）
      "master_level": "985硕",           // 硕士层次（如果是硕士）
      "city": "南京",                    // 城市（如有）
      "county": "玄武区",                // 区县（如有）
      "admission_status": "录取",         // 录取状态
      "is_cost_effective": true,         // 是否性价比推荐
      "cost_effective_reason": "该地区录取率较高，竞争相对较小", // 性价比推荐原因
      "created_at": "2024-03-15"        // 申请时间
    }
  ],
  "total": 1500,
  "statistics": {
    "total_applications": 10000,
    "total_admissions": 7500,
    "overall_admission_rate": 0.75,
    "by_province": {
      "江苏": {
        "apply_count": 2000,
        "admission_count": 1600,
        "admission_rate": 0.8
      }
    },
    "by_education_level": {
      "bachelor": {
        "apply_count": 6000,
        "admission_count": 4200,
        "admission_rate": 0.7
      },
      "master": {
        "apply_count": 4000,
        "admission_count": 3300,
        "admission_rate": 0.825
      }
    },
    "by_gender": {
      "male": {
        "apply_count": 6000,
        "admission_count": 4500,
        "admission_rate": 0.75
      },
      "female": {
        "apply_count": 4000,
        "admission_count": 3000,
        "admission_rate": 0.75
      }
    }
  }
}
```

## 3. 数据分析接口

### 3.1 数据统计分析
**接口路径**: `GET /api/recruitment/analytics`
**描述**: 获取录取数据的统计分析
**请求参数**: 同查询接口
**返回数据**:
```json
{
  "success": true,
  "data": {
    "province_distribution": [
      {
        "name": "江苏",
        "value": 1600,
        "rate": 0.8,
        "rank": 1
      }
    ],
    "education_level_stats": [
      {
        "level": "bachelor",
        "count": 4200,
        "rate": 0.7,
        "percentage": 0.56
      },
      {
        "level": "master", 
        "count": 3300,
        "rate": 0.825,
        "percentage": 0.44
      }
    ],
    "gender_distribution": [
      {
        "gender": "male",
        "count": 4500,
        "rate": 0.75,
        "percentage": 0.6
      },
      {
        "gender": "female",
        "count": 3000,
        "rate": 0.75,
        "percentage": 0.4
      }
    ],
    "department_ranking": [
      {
        "department": "电力调度控制中心",
        "admission_count": 800,
        "apply_count": 1000,
        "rate": 0.8
      }
    ]
  }
}
```

## 4. 数据字典接口

### 4.1 获取二级单位列表
**接口路径**: `GET /api/recruitment/departments`
**返回数据**:
```json
{
  "departments": [
    "电力调度控制中心",
    "供电服务中心", 
    "电力营销部",
    "运维检修部",
    "发展策划部",
    "安全监察部",
    "人力资源部",
    "财务资产部"
  ]
}
```

## 5. 系统统计接口

### 5.1 获取首页统计数据
**接口路径**: `GET /api/recruitment/statistics`
**返回数据**:
```json
{
  "total_records": 15000,      // 总录取记录数
  "provinces": 31,             // 覆盖省份数
  "policy_rules": 156,         // 政策规则数
  "last_update": "2024年3月"   // 最后更新时间
}
```

## 数据库设计建议

### 主要数据表结构

#### 1. 录取记录表 (recruitment_records)
```sql
CREATE TABLE recruitment_records (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,                    -- 姓名（已脱敏）
  gender ENUM('男', '女') NOT NULL,              -- 性别
  school VARCHAR(100) NOT NULL,                 -- 院校名称
  phone VARCHAR(20),                            -- 手机号（已脱敏）
  province VARCHAR(20) NOT NULL,                -- 省份
  city VARCHAR(20),                             -- 城市
  county VARCHAR(50),                           -- 区县
  company_type ENUM('国网', '南网') NOT NULL,    -- 公司类型
  batch ENUM('一批', '二批', '三批'),             -- 批次
  education_level ENUM('本科', '硕士') NOT NULL, -- 学历层次
  bachelor_level VARCHAR(50),                   -- 本科层次
  master_level VARCHAR(50),                     -- 硕士层次
  admission_status ENUM('录取', '未录取') DEFAULT '录取', -- 录取状态（默认录取）
  apply_date DATE,                              -- 申请时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_province (province),
  INDEX idx_city (city),
  INDEX idx_county (county),
  INDEX idx_company_type (company_type),
  INDEX idx_batch (batch),
  INDEX idx_education_level (education_level),
  INDEX idx_bachelor_level (bachelor_level),
  INDEX idx_master_level (master_level),
  INDEX idx_gender (gender),
  INDEX idx_school (school),
  INDEX idx_admission_status (admission_status)
);
```

#### 2. 统计汇总表 (recruitment_statistics)
```sql
CREATE TABLE recruitment_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  province VARCHAR(20),
  city VARCHAR(20),
  county VARCHAR(50),
  company_type ENUM('国网', '南网'),
  batch ENUM('一批', '二批', '三批'),
  education_level ENUM('本科', '硕士'),
  bachelor_level VARCHAR(50),
  master_level VARCHAR(50),
  gender ENUM('男', '女'),
  total_count INT DEFAULT 0,               -- 总申请人数
  admission_count INT DEFAULT 0,           -- 录取人数
  admission_rate DECIMAL(5,4),            -- 录取率
  stat_date DATE,                         -- 统计日期
  
  UNIQUE KEY unique_stat (province, city, county, company_type, batch, education_level, bachelor_level, master_level, gender, stat_date)
);
```

#### 3. 院校学历层次映射表 (school_level_mapping)
```sql
CREATE TABLE school_level_mapping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_name VARCHAR(100) NOT NULL,       -- 院校名称
  education_level ENUM('本科', '硕士') NOT NULL, -- 学历层次
  bachelor_level VARCHAR(50),              -- 本科层次分类
  master_level VARCHAR(50),                -- 硕士层次分类
  province VARCHAR(20),                    -- 院校所在省份
  is_985 BOOLEAN DEFAULT FALSE,            -- 是否985
  is_211 BOOLEAN DEFAULT FALSE,            -- 是否211
  is_double_first BOOLEAN DEFAULT FALSE,   -- 是否双一流
  
  UNIQUE KEY unique_school (school_name, education_level),
  INDEX idx_school_name (school_name),
  INDEX idx_education_level (education_level)
);
```

## 性价比推荐算法

### 算法说明
在查询结果中，系统会自动标记性价比较高的地区/单位。算法逻辑如下：

1. **录取率权重(40%)**：录取人数/申请人数，录取率越高分数越高
2. **竞争程度权重(30%)**：申请人数，人数越少竞争越小分数越高  
3. **地区偏好权重(20%)**：根据历史数据，某些地区相对容易录取
4. **学历匹配度权重(10%)**：根据用户选择的学历层次匹配难度

### 标记规则
- 综合得分 >= 80分：标记为"性价比推荐"
- 每次查询结果中，性价比推荐的数量不超过总结果的30%
- 优先推荐录取率高且申请人数相对较少的地区

## 注意事项

1. **数据隐私**: 确保不暴露个人敏感信息，所有返回数据应为聚合统计结果
2. **性能优化**: 建议对常用查询条件建立索引，考虑缓存机制
3. **数据完整性**: 确保录取率计算准确，处理除零错误
4. **API限流**: 考虑对查询接口进行适当的限流保护
5. **数据更新**: 提供数据更新机制，确保统计数据实时性
6. **性价比算法**: 后端需要实现性价比推荐算法，为符合条件的记录设置is_cost_effective=true

## 开发优先级

1. **P0 (高优先级)**: 基础查询接口、省份列表接口、统计数据接口
2. **P1 (中优先级)**: 数据分析接口、二级单位列表接口

请按照以上需求进行后端开发，如有疑问请及时沟通。