import { createRouter, createWebHistory } from 'vue-router'

// 路由表：全部使用小写路径（vue-router 的路径匹配大小写敏感）
// 页面组件一律懒加载，减小首屏包体积
const routes =[
    {
        path:'/',
        name:'Home',
        component:()=>import('../views/Home.vue')
    },
    {
        path:'/chat',
        name:'Chat',
        component:()=>import('../views/Chat.vue')
    },
    {
        path:'/profile',
        name:'Profile',
        component:()=>import('../views/Profile.vue')
    },
    {
        path:'/detail',
        name:'Detail',
        component:()=>import('../views/Detail.vue')
    },
    {
        path:'/favorites',
        name:'Favorites',
        component:()=>import('../views/Favorites.vue')
    },
    {
        path:'/history',
        name:'History',
        component:()=>import('../views/History.vue')
    },
    {
        path:'/settings',
        name:'Settings',
        component:()=>import('../views/Settings.vue')
    }
]


const router = createRouter({
    history:createWebHistory(),
    routes
})

export default router
