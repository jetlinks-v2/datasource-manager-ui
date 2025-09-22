import { moduleRegistry } from '@/utils/module-registry'
import registerSetting from './register'
import { name } from './package.json'

const routerModules = import.meta.glob('./views/DataSource/**/index.vue')

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
    'system/DataSource': {
      children:[
        {
          code: 'Detail',
          url: '/Detail/:id',
          name: '数据源详情',
          component: () => import('./views/DataSource/Detail/index.vue')
        }
      ]
    }
  }
}

const register = () => {
  moduleRegistry.register(name, registerSetting)
}

export default {
  getAsyncRoutesMap,
  getExtraRoutesMap,
  register
}
