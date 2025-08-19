/**
 * 本地存储工具类
 */
class Storage {
      private prefix: string
    
      constructor(prefix = 'app_') {
        this.prefix = prefix
      }
    
      // 设置存储
      set(key: string, value: any, expire?: number) {
        const data = {
          value,
          expire: expire ? Date.now() + expire * 1000 : null
        }
        localStorage.setItem(this.prefix + key, JSON.stringify(data))
      }
    
      // 获取存储
      get<T = any>(key: string): T | null {
        const item = localStorage.getItem(this.prefix + key)
        if (!item) return null
    
        try {
          const data = JSON.parse(item)
          // 检查是否过期
          if (data.expire && data.expire < Date.now()) {
            this.remove(key)
            return null
          }
          return data.value
        } catch {
          return null
        }
      }
    
      // 移除存储
      remove(key: string) {
        localStorage.removeItem(this.prefix + key)
      }
    
      // 清空存储
      clear() {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key)
          }
        })
      }
    }
    
    export default new Storage()