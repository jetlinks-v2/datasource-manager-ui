const routerModules = import.meta.glob('./views/DataSource/**/index.vue')
import i18n from "@/locales";

const getAsyncRoutesMap = () => {
    const modules = {}
    Object.keys(routerModules).forEach(item => {
        const code = item.replace('./views/', '').replace('/index.vue', '')
        const key = `system/${code}`
        modules[key] = routerModules[item]
    })

    return modules
}

const getExtraRoutesMap = () => {
    return {
        // [`${MODULE_CODE}/Product`]: {
        //     children: [
        //         {
        //             code: 'Detail',
        //             url: '/detail:id',
        //             name: '详情信息',
        //             component: () => import('./views/Product/Detail/index.vue')
        //         }
        //     ]
        // }
        'system/DataSource': {
            children: [
                {
                    code: 'Management',
                    name: i18n.global.t('datasource-manager-ui.index.024689-0'),
                    url: '/management:id',
                    component: () => import('./views/DataSource/Management/index.vue')
                }
            ]
        },
    }
}

export default {
    getAsyncRoutesMap,
    getExtraRoutesMap
}
