<template>
  <div class="bg-wrapper">
    <!-- Canvas for elegant animated background -->
    <canvas ref="canvasRef" class="background-canvas"></canvas>
    
    <!-- 漸層遮罩 (不阻擋滑鼠點擊) -->
    <div class="overlay"></div>

    <!-- UI -->
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"

const canvasRef = ref(null)
let animationId = null
let particles = []
let time = 0

class Particle {
  constructor(x, y, width, height) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 0.5
    this.vy = (Math.random() - 0.5) * 0.5
    this.radius = Math.random() * 3 + 1.5
    this.opacity = Math.random() * 0.6 + 0.5
    this.width = width
    this.height = height
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    
    // 邊界反彈
    if (this.x - this.radius < 0 || this.x + this.radius > this.width) {
      this.vx = -this.vx
      this.x = Math.max(this.radius, Math.min(this.width - this.radius, this.x))
    }
    if (this.y - this.radius < 0 || this.y + this.radius > this.height) {
      this.vy = -this.vy
      this.y = Math.max(this.radius, Math.min(this.height - this.radius, this.y))
    }
  }

  draw(ctx) {
    ctx.fillStyle = `rgba(100, 200, 255, ${this.opacity})`
    ctx.shadowColor = `rgba(100, 200, 255, 1)`
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 初始化背景
const initBackground = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  
  // 初始化粒子
  particles = []
  const particleCount = 60
  for (let i = 0; i < particleCount; i++) {
    particles.push(
      new Particle(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        canvas.width,
        canvas.height
      )
    )
  }
  
  animate()
}

// 動畫循環
const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  // 深色漸層背景
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#0a0e27')
  gradient.addColorStop(0.5, '#0f1432')
  gradient.addColorStop(1, '#150a3a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // 添加微妙的徑向漸層
  const radialGradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) * 0.7
  )
  radialGradient.addColorStop(0, 'rgba(59, 130, 246, 0.08)')
  radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radialGradient
  ctx.fillRect(0, 0, width, height)

  // 更新並繪製粒子
  particles.forEach(particle => {
    particle.update()
    particle.draw(ctx)
  })

  // 繪製粒子之間的連線（如果太近）
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)'
  ctx.lineWidth = 2
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 200) {
        ctx.globalAlpha = (1 - distance / 200) * 0.8
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.stroke()
      }
    }
  }
  
  ctx.globalAlpha = 1.0
  ctx.shadowBlur = 0

  time += 0.016
  animationId = requestAnimationFrame(animate)
}

// 處理窗口大小變化
const handleResize = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  
  // 更新粒子的容器尺寸
  particles.forEach(p => {
    p.width = canvas.width
    p.height = canvas.height
  })
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  setTimeout(initBackground, 0)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

</script>


<style scoped>
.bg-wrapper {
  position: absolute;
  inset: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.background-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(0,0,0,0.2), rgba(0,0,0,0.8));
  z-index: 2;
  pointer-events: none;
}

.content {
  position: relative;
  z-index: 3;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>