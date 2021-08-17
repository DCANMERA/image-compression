/********************************** 图片压缩 ***********************************/

// 压缩开始下标
let index = 0

/**
 * 判断图片大小是否满足需求
 * @param {string} imagePath 存储路径
 * @param {number} limitSize 限制大小
 * @param {Function} lessCallBack 未限制大小回调
 * @param {Function} moreCallBack 超过限制大小回调
 */
function imageSizeIsLessLimitSize(imagePath, limitSize, lessCallBack, moreCallBack) {
  wx.getFileInfo({
    filePath: imagePath,
    success(res) {
      console.log('压缩前图片大小:', res.size / 1024, 'kb')
      console.log()
      if (res.size > 1024 * limitSize) {
        moreCallBack()
      } else {
        lessCallBack()
      }
    }
  })
}

/**
 * 获取画布图片 利用cavas进行压缩 每次压缩都需要ctx.draw() wx.canvasToTempFilePath()连用
 * @param {number} canvasId 绘制canvas存储的id
 * @param {string} imagePath 存储路径
 * @param {number} imageW 图层宽
 * @param {number} imageH 图层高
 * @param {Function} getImgsuccess 绘制成功后回调
 */
function getCanvasImage(canvasId, imagePath, imageW, imageH, getImgsuccess) {
  const ctx = wx.createCanvasContext(canvasId)
  ctx.drawImage(imagePath, 0, 0, imageW, imageH)
  ctx.draw(
    false,
    setTimeout(function () {
      // 一定要加定时器，因为ctx.draw()应用到canvas是有个时间的
      wx.canvasToTempFilePath({
        canvasId: canvasId,
        x: 0,
        y: 0,
        width: imageW,
        height: imageH,
        quality: 1,
        success: function (res) {
          getImgsuccess(res.tempFilePath)
        }
      })
    }, 200)
  )
}

/**
 * 主调用方法
 * 获取小于限制大小的Image, limitSize默认为100KB，递归调用。
 * @param {number} canvasId 绘制canvas存储的id
 * @param {array} tempFilePaths 存储路径
 * @param {number} limitSize 限制大小
 * @param {number} drawWidth 绘制canvas的宽
 * @param {Function} callBack 压缩后的回调
 */
function getLessLimitSizeImage(canvasId, tempFilePaths, limitSize = 100, drawWidth, callBack) {
  if (index >= tempFilePaths.length) {
    index = 0
    return
  }
  imageSizeIsLessLimitSize(
    tempFilePaths[index],
    limitSize,
    lessRes => {
      callBack(tempFilePaths[index], index)
      index++
      getLessLimitSizeImage(
        canvasId,
        tempFilePaths,
        limitSize,
        drawWidth * 0.95,
        callBack
      )
    },
    moreRes => {
      wx.getImageInfo({
        src: tempFilePaths[index],
        success: function (imageInfo) {
          const maxSide = Math.max(imageInfo.width, imageInfo.height)
          // 画板的宽高默认是windowWidth
          const windowW = drawWidth
          let scale = 1
          if (maxSide > windowW) {
            scale = windowW / maxSide
          }
          const imageW = Math.trunc(imageInfo.width * scale)
          const imageH = Math.trunc(imageInfo.height * scale)
          console.log('调用压缩', imageW, imageH)
          console.log()
          getCanvasImage(canvasId, tempFilePaths[index], imageW, imageH, pressImgPath => {
            tempFilePaths[index] = pressImgPath
            getLessLimitSizeImage(
              canvasId,
              tempFilePaths,
              limitSize,
              drawWidth * 0.95,
              callBack
            )
          })
        }
      })
    }
  )
}

/**
 * 图片转basee64 io操作 使用异步方式
 * @param {string} img 图片路径
 * @returns {Promise}
 */
function getBase64(img) {
  return new Promise(function (resolve, reject) {
    const FSM = wx.getFileSystemManager()
    FSM.readFile({
      filePath: img,
      encoding: 'base64',
      success(data) {
        resolve(data)
      }
    })
  })
}

/**
 * 图片压缩上传
 * @param {Object} options 需要字段 {maxLength: 最大上传长度, maxSize: 最大限制大小KB, dWidth: 手机宽度}
 * @param {Function} callback 
 */
function chooseImage(options, callback) {
  wx.chooseImage({
    count: options.maxLength,
    success: function (res) {
      getLessLimitSizeImage('canvas', res.tempFilePaths, options.maxSize, options.dWidth, function (path, i) {
        wx.getFileInfo({
          filePath: path,
          success(result) {
            const before = parseInt(res.tempFiles[i].size / 1024)
            const after = parseInt(result.size / 1024)
            callback && callback({
              path,
              size: [before, after],
              bpp: Number(before / after).toFixed(2)
            })
          }
        })
      })
    },
    fail: function(err) {
      console.log(err)
    }
  })
}

export {
  getLessLimitSizeImage,
  imageSizeIsLessLimitSize,
  getCanvasImage,
  getBase64,
  chooseImage
}
