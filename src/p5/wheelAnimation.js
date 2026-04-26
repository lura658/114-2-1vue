import p5 from 'p5'

export function createWheelSketch(container, items) {
  let rotation = 0
  let isSpinning = false
  let spinStartTime = 0
  let selectedIndex = 0
  let sketchInstance = null

  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#0ea5e9', '#ec4899']

  function getItemColor(idx) {
    return colors[idx % colors.length]
  }

  function drawWheel(p) {
    const radius = Math.min(p.width, p.height) / 2 - 30
    const sliceAngle = (2 * Math.PI) / items.length
    const centerX = p.width / 2
    const centerY = p.height / 2

    p.push()
    p.translate(centerX, centerY)
    p.rotate(rotation)

    // 绘制扇形
    for (let i = 0; i < items.length; i++) {
      const startAngle = i * sliceAngle
      const endAngle = (i + 1) * sliceAngle
      const midAngle = (startAngle + endAngle) / 2

      p.fill(getItemColor(i))
      p.stroke(255)
      p.strokeWeight(3)
      p.beginShape()
      p.vertex(0, 0)
      p.arc(0, 0, radius * 2, radius * 2, startAngle, endAngle, p.PIE)
      p.endShape()

      // 绘制文字
      p.fill(255)
      p.textAlign(p.CENTER, p.CENTER)
      p.textSize(13)
      p.textFont('Arial')
      p.noStroke()
      
      const textRadius = radius * 0.65
      const textX = Math.cos(midAngle) * textRadius
      const textY = Math.sin(midAngle) * textRadius

      p.push()
      p.translate(textX, textY)
      p.rotate(midAngle + Math.PI / 2)
      p.text(items[i], 0, 0)
      p.pop()
    }

    p.pop()

    // 绘制外边框
    p.stroke(100, 150, 200)
    p.strokeWeight(3)
    p.noFill()
    p.circle(centerX, centerY, radius * 2)

    // 绘制指针（中心装饰）
    p.fill(59, 130, 246)
    p.stroke(255)
    p.strokeWeight(2)
    p.triangle(centerX - 15, 30, centerX + 15, 30, centerX, 50)
    
    // 中心圆
    p.fill(255)
    p.circle(centerX, centerY, 15)
  }

  function createConfetti() {
    // 创建彩纸特效
    const confettiCount = 60
    const centerX = container.offsetLeft + container.clientWidth / 2
    const centerY = container.offsetTop + container.clientHeight / 2

    for (let i = 0; i < confettiCount; i++) {
      const angle = (Math.PI * 2 * i) / confettiCount
      const speed = 4 + Math.random() * 10
      const vx = Math.cos(angle) * speed
      const vy = Math.sin(angle) * speed - 2

      const div = document.createElement('div')
      div.style.position = 'fixed'
      div.style.width = (8 + Math.random() * 12) + 'px'
      div.style.height = (8 + Math.random() * 12) + 'px'
      div.style.left = centerX + 'px'
      div.style.top = centerY + 'px'
      div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      div.style.borderRadius = Math.random() > 0.5 ? '50%' : '0'
      div.style.pointerEvents = 'none'
      div.style.zIndex = '999'
      div.style.opacity = '1'
      document.body.appendChild(div)

      let px = centerX
      let py = centerY
      let veloX = vx
      let veloY = vy
      const gravity = 0.25
      const startTime = Date.now()

      const animate = () => {
        px += veloX
        py += veloY
        veloY += gravity
        veloX *= 0.99

        const elapsed = Date.now() - startTime
        const alpha = Math.max(0, 1 - elapsed / 2000)

        div.style.left = px + 'px'
        div.style.top = py + 'px'
        div.style.opacity = alpha.toString()

        if (elapsed < 2000) {
          requestAnimationFrame(animate)
        } else {
          div.remove()
        }
      }

      animate()
    }
  }

  sketchInstance = new p5((p) => {
    p.setup = function () {
      const size = Math.min(600, window.innerWidth - 80)
      p.createCanvas(size, size)
    }

    p.draw = function () {
      p.background('#0f1419')
      drawWheel(p)

      // 更新旋转
      if (isSpinning) {
        const elapsed = Date.now() - spinStartTime
        const totalDuration = 4000 // 4秒总时间

        if (elapsed >= totalDuration) {
          // 旋转完成
          isSpinning = false
          
          // 计算选中的项
          const normalizedRotation = (rotation % (Math.PI * 2)) / (Math.PI * 2)
          selectedIndex = Math.floor((items.length - normalizedRotation * items.length) % items.length)
          if (selectedIndex < 0) selectedIndex += items.length
          
          // 触发事件
          const event = new CustomEvent('wheelSpinEnd', { detail: selectedIndex })
          window.dispatchEvent(event)
          
          // 播放彩纸特效
          createConfetti()
        } else {
          // 缓动：快速开始，然后逐渐减速（easeOut）
          const progress = elapsed / totalDuration
          const easeProgress = 1 - Math.pow(1 - progress, 3)

          // 总旋转15圈
          const totalRotation = Math.PI * 2 * 15
          rotation = totalRotation * easeProgress
        }
      }
    }

    p.windowResized = function () {
      if (container && container.parentElement) {
        const size = Math.min(600, window.innerWidth - 80)
        if (p.width !== size) {
          p.resizeCanvas(size, size)
        }
      }
    }
  }, container)

  return {
    spin(rotations = 15) {
      if (!isSpinning) {
        isSpinning = true
        spinStartTime = Date.now()
      }
    },
    reset() {
      rotation = 0
      isSpinning = false
    },
    remove() {
      if (sketchInstance) {
        sketchInstance.remove()
        sketchInstance = null
      }
    }
  }
}
