import { chooseImage } from '../../utils/compressImage'
const app = getApp()

Page({
  data: {
    motto: '点击上传',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'),
    images: []
  },
  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },
  getUserProfile(e) {
    wx.getUserProfile({
      desc: '展示用户信息',
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  getUserInfo(e) {
    console.log(e)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  handleUploadImg() {
    const _this = this
    const maxLength = 9
    const maxSize = 100
    const dWidth = wx.getSystemInfoSync().windowWidth
    if (this.data.images.length < maxLength) {
      chooseImage({ maxSize, dWidth, maxLength }, function (result) {
        wx.showLoading({ title: '上传中...' })
        _this.data.images.push(result)
        _this.setData({ images: _this.data.images }, () => {
          wx.hideLoading()
          wx.showToast({
            title: '上传成功',
            icon: 'success',
            duration: 2000
          })
        })
      })
    } else {
      wx.showToast({
        title: '最多九张',
        icon: 'error',
        duration: 2000
      })
    }
  }
})
