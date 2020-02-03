export default {
  // 神策分析注册在APP全局函数中的变量名，在非app.js中可以通过getApp().sensors(你这里定义的名字来使用)
  name: 'sensors',
  // 神策分析数据接收地址
  server_url:'',
  //默认使用队列发数据时候，两条数据发送间的最大间隔
  send_timeout: 1000,
  // 发送事件的时间使用客户端时间还是服务端时间
  use_client_time: false,
  // 是否允许控制台打印查看埋点数据（建议开启查看）
  show_log: true,
  // 是否允许修改onShareMessage里return的path，用来增加（用户id，分享层级，当前的path），在app onshow中自动获取这些参数来查看具体分享来源，层级等
  allow_amend_share_path : true,
  max_string_length: 300,
  datasend_timeout: 3000,
  source_channel:[],
  autoTrack:{
    appLaunch: true, //是否采集 $MPLaunch 事件，true 代表开启。
    appShow:true, //是否采集 $MPShow 事件，true 代表开启。
    appHide:true //是否采集 $MPHide 事件，true 代表开启。
  },
  //是否允许将最近一次站外渠道信息保存到 wxStorage 中
  is_persistent_save: false
  // 是否集成了插件！重要！
//    is_plugin: false
};