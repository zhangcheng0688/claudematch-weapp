// pages/index/index.js — 首页：落地页 + 等候名单
const { request, sendOTP } = require('../../utils/request')

Page({
  data: {
    stats: { waitlist_count: 0, real_signups: 0 },
    waitlistEmail: '',
    waitlistSubmitting: false,
    waitlistDone: false,
    features: [
      {
        id: 1,
        icon: '\uD83E\uDD16',
        title: 'AI 深度理解',
        desc: '不只是标签——AI 理解你的思考方式、兴趣深度和合作风格，帮你找到真正契合的人'
      },
      {
        id: 2,
        icon: '\uD83C\uDFAF',
        title: '三维匹配',
        desc: '商务合作、约会交友、本地伙伴 —— 一套 AI 画像覆盖你生活的全部场景'
      },
      {
        id: 3,
        icon: '\uD83D\uDCCB',
        title: '智能会面计划',
        desc: '匹配成功后 AI 自动生成话题建议和会面提纲，帮你迈出第一步'
      },
      {
        id: 4,
        icon: '\uD83D\uDD12',
        title: '隐私优先',
        desc: '你的数据只有你能控制，随时可调整授权范围'
      },
    ],
  },

  onLoad() {
    this.fetchStats()
  },

  async fetchStats() {
    try {
      const res = await request({ url: '/stats', auth: false })
      this.setData({ stats: res.data || res })
    } catch (err) {
      // 静默失败
    }
  },

  onWaitlistEmailInput(e) {
    this.setData({ waitlistEmail: e.detail.value })
  },

  async submitWaitlist() {
    const { waitlistEmail } = this.data
    if (!waitlistEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitlistEmail)) {
      wx.showToast({ title: '请输入有效的邮箱', icon: 'none' })
      return
    }

    this.setData({ waitlistSubmitting: true })

    try {
      await request({
        url: '/waitlist',
        method: 'POST',
        data: { email: waitlistEmail },
        auth: false,
      })

      this.setData({
        waitlistDone: true,
        waitlistSubmitting: false,
      })
      wx.showToast({ title: '已加入等候名单', icon: 'success' })
      this.fetchStats()
    } catch (err) {
      this.setData({ waitlistSubmitting: false })
      const msg = err?.message || '提交失败'
      wx.showToast({ title: msg, icon: 'none' })
    }
  },

  goToAuth() {
    wx.navigateTo({ url: '/pages/auth/auth' })
  },

  goToMatch() {
    const app = getApp()
    if (app.checkLogin()) {
      wx.switchTab({ url: '/pages/match/match' })
    } else {
      wx.navigateTo({ url: '/pages/auth/auth' })
    }
  },
})
