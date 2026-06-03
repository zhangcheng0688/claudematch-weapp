// pages/auth/auth.js — 登录/注册（邮箱 + 6位OTP验证码）
const { sendOTP, verifyOTP } = require('../../utils/request')

Page({
  data: {
    step: 'email', // 'email' | 'otp'
    email: '',
    otp: '',
    loading: false,
    error: '',
    countdown: 0,
  },

  onLoad() {
    // 如果已登录，直接返回
    const app = getApp()
    if (app.checkLogin()) {
      wx.switchTab({ url: '/pages/match/match' })
    }
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value, error: '' })
  },

  onOtpInput(e) {
    // 限制6位数字
    let val = e.detail.value.replace(/[^0-9]/g, '').slice(0, 6)
    this.setData({ otp: val, error: '' })

    // 自动验证
    if (val.length === 6) {
      this.verifyOTP()
    }
  },

  async sendOTP() {
    const { email } = this.data
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.setData({ error: '请输入有效邮箱' })
      return
    }

    this.setData({ loading: true, error: '' })

    try {
      await sendOTP(email)
      this.setData({
        step: 'otp',
        loading: false,
        countdown: 60,
      })
      this.startCountdown()
      wx.showToast({ title: '验证码已发送', icon: 'success' })
    } catch (err) {
      this.setData({
        loading: false,
        error: err?.message || '发送失败，请重试',
      })
    }
  },

  async verifyOTP() {
    const { email, otp } = this.data
    if (otp.length !== 6) return

    this.setData({ loading: true, error: '' })

    try {
      const res = await verifyOTP(email, otp)
      // 登录成功
      getApp().globalData.isLoggedIn = true
      getApp().globalData.user = res.user

      wx.showToast({ title: '登录成功', icon: 'success' })

      // 判断是否需要引导填写资料
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/start/start' })
      }, 800)
    } catch (err) {
      this.setData({
        loading: false,
        error: err?.message || '验证码错误，请重试',
        otp: '',
      })
    }
  },

  resendOTP() {
    if (this.data.countdown > 0) return
    this.sendOTP()
  },

  startCountdown() {
    const timer = setInterval(() => {
      const countdown = this.data.countdown - 1
      this.setData({ countdown })
      if (countdown <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  },

  goBack() {
    if (this.data.step === 'otp') {
      this.setData({ step: 'email', otp: '', error: '' })
    } else {
      wx.navigateBack()
    }
  },
})
