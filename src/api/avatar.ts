import request from './request'

// 头像分类接口
export interface AvatarCategory {
  animals: string[]
  characters: string[]
  emojis: string[]
}

// 头像列表响应接口
export interface AvatarListResponse {
  categories: AvatarCategory
  total_count: number
}

// 单个头像响应接口
export interface AvatarResponse {
  id: string
  data_url: string
  category: string
}

// 头像分类信息响应接口
export interface CategoriesResponse {
  animals: {
    name: string
    count: number
    description: string
  }
  characters: {
    name: string
    count: number
    description: string
  }
  emojis: {
    name: string
    count: number
    description: string
  }
}

// API 方法

// 获取所有头像列表
export const getAvatarList = (): Promise<{ code: number; message: string; data: AvatarListResponse }> => {
  return request.get('/api/v1/avatars/list')
}

// 获取头像分类信息
export const getAvatarCategories = (): Promise<{ code: number; message: string; data: CategoriesResponse }> => {
  return request.get('/api/v1/avatars/categories')
}

// 根据ID获取单个头像
export const getAvatarById = (avatarId: string): Promise<{ code: number; message: string; data: AvatarResponse }> => {
  return request.get(`/api/v1/avatars/${avatarId}`)
}

// 预定义头像ID列表（与后端保持一致）
export const AVATAR_IDS = {
  // 动物系列
  ANIMALS: [
    'cat',      // 可爱小猫
    'dog',      // 忠诚小狗
    'bear',     // 憨厚小熊
    'rabbit',   // 萌萌小兔
    'panda',    // 呆萌熊猫
    'fox'       // 聪明小狐
  ],
  
  // 角色系列
  CHARACTERS: [
    'robot',    // 酷炫机器人
    'princess', // 优雅公主
    'superhero',// 超级英雄
    'ninja',    // 神秘忍者
    'pirate',   // 勇敢海盗
    'astronaut' // 太空宇航员
  ],
  
  // 表情系列
  EMOJIS: [
    'smile',    // 开心笑脸
    'wink',     // 俏皮眨眼
    'cool',     // 酷炫墨镜
    'shy',      // 害羞脸红
    'happy',    // 超级开心
    'playful'   // 调皮捣蛋
  ]
}

// 默认头像ID
export const DEFAULT_AVATAR_ID = 'cat'

// 检查是否为头像ID（而非完整URL）
export const isAvatarId = (value: string): boolean => {
  if (!value) return false
  
  // 如果是完整的URL或data URL，返回false
  if (value.startsWith('http') || value.startsWith('data:')) {
    return false
  }
  
  // 检查是否在预定义的头像ID列表中
  const allIds = [
    ...AVATAR_IDS.ANIMALS,
    ...AVATAR_IDS.CHARACTERS,
    ...AVATAR_IDS.EMOJIS
  ]
  
  return allIds.includes(value)
}

// 获取头像的显示URL（处理ID转换）
export const getAvatarDisplayUrl = async (avatarValue?: string): Promise<string> => {
  if (!avatarValue) {
    // 没有头像时，获取默认头像
    try {
      const response = await getAvatarById(DEFAULT_AVATAR_ID)
      // 获取响应中的data_url字段
      const dataUrl = response.data.data_url
      if (!dataUrl) {
        console.error('响应中缺少data_url字段:', response)
        throw new Error('Invalid response format')
      }
      return dataUrl
    } catch (error) {
      console.error('获取默认头像失败:', error)
      // 返回一个简单的默认头像
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMiIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIyNSIgY3k9IjE1IiByPSIyIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Im0xNSAyNSBhNSA1IDAgMCAwIDEwIDAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPg=='
    }
  }
  
  // 如果是完整的URL，直接返回
  if (avatarValue.startsWith('http') || avatarValue.startsWith('data:')) {
    return avatarValue
  }
  
  // 如果是头像ID，获取对应的数据URL
  if (isAvatarId(avatarValue)) {
    try {
      const response = await getAvatarById(avatarValue)
      // 获取响应中的data_url字段
      const dataUrl = response.data.data_url
      if (!dataUrl) {
        console.error(`头像 ${avatarValue} 响应中缺少data_url字段:`, response)
        throw new Error('Invalid response format')
      }
      return dataUrl
    } catch (error) {
      console.error(`获取头像 ${avatarValue} 失败:`, error)
      // 如果获取失败，返回默认头像（避免无限递归）
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMiIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIyNSIgY3k9IjE1IiByPSIyIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Im0xNSAyNSBhNSA1IDAgMCAwIDEwIDAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPg=='
    }
  }
  
  // 不是已知格式，返回默认头像（避免无限递归）
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMiIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIyNSIgY3k9IjE1IiByPSIyIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Im0xNSAyNSBhNSA1IDAgMCAwIDEwIDAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPg=='
}