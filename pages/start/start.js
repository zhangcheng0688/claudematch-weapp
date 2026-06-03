// pages/start/start.js — 引导用户填写AI资料
const { request } = require('../../utils/request')

Page({
  data: {
    step: 1,
    totalSteps: 3,
    loading: false,
    generated: false,
    profileResult: null,
    update: '',
    enjoyment: '',
    craving: '',
  },

  onUpdateInput(e) {
    this.setData({ update: e.detail.value })
  },

  onEnjoymentInput(e) {
    this.setData({ enjoyment: e.detail.value })
  },

  onCravingInput(e) {
    this.setData({ craving: e.detail.value })
  },

  nextStep() {
    const { step, update, enjoyment } = this.data
    if (step === 1 && !update.trim()) {
      wx.showToast({ title: '请填写内容', icon: 'none' })
      return
    }
    if (step === 2 && !enjoyment.trim()) {
      wx.showToast({ title: '请填写内容', icon: 'none' })
      return
    }
    if (step < this.data.totalSteps) {
      this.setData({ step: step + 1 })
    } else {
      this.submitProfile()
    }
  },

  prevStep() {
    if (this.data.step > 1) {
      this.setData({ step: this.data.step - 1 })
    }
  },

  async submitProfile() {
    const { update, enjoyment, craving } = this.data
    if (!craving.trim()) {
      wx.showToast({ title: '请填写内容', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const res = await request({
        url: '/ai/generate-profile',
        method: 'POST',
        data: { update, enjoyment, craving },
        auth: true,
      })

      this.setData({
        loading: false,
        generated: true,
        profileResult: res?.profile || res?.data || res,
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: err?.message || '生成失败', icon: 'none' })
    }
  },

  goToMatch() {
    wx.switchTab({ url: '/pages/match/match' })
  },

  skip() {
    wx.switchTab({ url: '/pages/match/match' })
  },
})
