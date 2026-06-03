// pages/match-detail/match-detail.js — 匹配详情 + 会面计划
const { request } = require('../../utils/request')

Page({
  data: {
    matchId: '',
    match: null,
    meetPlan: null,
    loading: true,
    generating: false,
  },

  onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ matchId: id })
    this.loadDetail()

    // 尝试获取会面计划
    this.loadMeetPlan()
  },

  async loadDetail() {
    try {
      // 从全局匹配列表获取或请求详情
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      let match = null

      if (prevPage && prevPage.data.matches) {
        match = prevPage.data.matches.find(m => m.id == this.data.matchId)
      }

      if (match) {
        this.setData({ match, loading: false })
      } else {
        this.setData({
          match: { id: this.data.matchId },
          loading: false,
        })
      }
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  async generateMeetPlan() {
    this.setData({ generating: true })

    try {
      const res = await request({
        url: '/ai/meet-plan',
        method: 'POST',
        data: { matchId: this.data.matchId },
        auth: true,
      })

      this.setData({
        meetPlan: res?.plan || res?.data || res,
        generating: false,
      })
      wx.showToast({ title: '会面计划已生成', icon: 'success' })
    } catch (err) {
      this.setData({ generating: false })
      wx.showToast({ title: err?.message || '生成失败', icon: 'none' })
    }
  },

  async loadMeetPlan() {
    // 如果后端有独立的 meet-plan 查询接口则调用
  },
})
