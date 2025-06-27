const routerModules = import.meta.glob('./views/dataSource/**/index.vue')

const getAsyncRoutesMap = () => {
  const modules = {}
  Object.keys(routerModules).forEach((item) => {
    const code = item.replace('./views/', '').replace('/index.vue', '')
    const key = `system/${code}`
    modules[key] = routerModules[item]
  })
  return modules
}

const getExtraRoutesMap = () => {
  return {
    'system/dataSource': [
      {
        code: 'Detail',
        url: '/Detail/:id',
        name: '数据源详情',
        component: () => import('./views/dataSource/detail/index.vue')
      }
    ]
  }
}

export default {
  getAsyncRoutesMap,
  getExtraRoutesMap
}
