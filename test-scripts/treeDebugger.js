// 树形组件调试工具
export const TreeDebugger = {
  // 检查树节点结构
  checkTreeStructure(treeData) {
    console.log('=== 树结构检查 ===')
    console.log('树数据总数:', treeData?.length || 0)
    
    if (treeData && treeData.length > 0) {
      treeData.forEach((node, index) => {
        console.log(`节点 ${index}:`, {
          key: node.key,
          title: node.title,
          isLeaf: node.isLeaf,
          hasChildren: !!node.children,
          childrenType: typeof node.children,
          childrenLength: node.children?.length || 0,
          region_id: node.region_id,
          region_level: node.region_level
        })
      })
    }
  },

  // 检查展开状态
  checkExpandedState(expandedKeys, selectedKeys) {
    console.log('=== 展开状态检查 ===')
    console.log('已展开节点:', expandedKeys)
    console.log('已选中节点:', selectedKeys)
  },

  // 检查API响应
  checkAPIResponse(apiName, response) {
    console.log(`=== ${apiName} API响应检查 ===`)
    console.log('响应状态:', response?.success)
    console.log('数据条目:', response?.data?.regions?.length || 0)
    console.log('原始数据:', response)
  },

  // 模拟树节点点击
  simulateNodeClick(nodeKey) {
    console.log(`=== 模拟点击节点: ${nodeKey} ===`)
    // 查找页面中的树组件
    const treeElement = document.querySelector('.ant-tree')
    if (treeElement) {
      const nodeElement = treeElement.querySelector(`[data-key="${nodeKey}"]`)
      if (nodeElement) {
        const expandButton = nodeElement.querySelector('.ant-tree-switcher')
        if (expandButton) {
          expandButton.click()
          console.log('已触发展开按钮点击')
        } else {
          console.log('未找到展开按钮')
        }
      } else {
        console.log('未找到对应节点元素')
      }
    } else {
      console.log('未找到树组件')
    }
  },

  // 检查Ant Design组件状态
  checkAntTreeState() {
    console.log('=== Ant Design树组件状态 ===')
    const treeElements = document.querySelectorAll('.ant-tree-treenode')
    console.log('DOM中的树节点数量:', treeElements.length)
    
    treeElements.forEach((element, index) => {
      const isExpanded = element.querySelector('.ant-tree-switcher-open')
      const isClosed = element.querySelector('.ant-tree-switcher-close')
      const title = element.querySelector('.ant-tree-title')?.textContent
      
      console.log(`DOM节点 ${index}:`, {
        title: title,
        isExpanded: !!isExpanded,
        isClosed: !!isClosed,
        hasChildren: !!(isExpanded || isClosed)
      })
    })
  }
}

// 全局注册调试工具
if (typeof window !== 'undefined') {
  window.TreeDebugger = TreeDebugger
}