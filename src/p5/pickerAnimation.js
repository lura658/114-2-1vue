import p5 from 'p5'

export default function createSketch(container) {
  new p5((p) => {
    let balls = []
    let isAnimating = false
    let selectedIndex = -1

    class Ball {
      constructor(x, y, vx, vy, label, colors) {
        this.x = x
        this.y = y
        this.vx = vx
        this.vy = vy
        this.label = label
        this.radius = 25
        this.colorIndex = Math.floor(Math.random() * colors.length)
        this.colors = colors
      }

      display() {
        p.push()
        p.fill(this.colors[this.colorIndex])
        p.stroke(255)
        p.strokeWeight(2)
        p.circle(this.x, this.y, this.radius * 2)

        p.fill(255)
        p.textAlign(p.CENTER, p.CENTER)
        p.textSize(10)
        p.text(this.label, this.x, this.y)
        p.pop()
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.vy += 0.3 // 重力

        // 邊界反彈
        if (this.x - this.radius < 0 || this.x + this.radius > 400) {
          this.vx *= -0.8
          this.x = p.constrain(this.x, this.radius, 400 - this.radius)
        }
        if (this.y - this.radius < 0 || this.y + this.radius > 250) {
          this.vy *= -0.8
          this.y = p.constrain(this.y, this.radius, 250 - this.radius)
        }

        // 速度衰減
        this.vx *= 0.99
        this.vy *= 0.99
      }
    }

    p.setup = () => {
      p.createCanvas(400, 250).parent(container)
    }

    p.draw = () => {
      p.background(15, 20, 25)

      if (isAnimating && balls.length > 0) {
        balls.forEach((ball) => {
          ball.update()
          ball.display()
        })

        // 檢查是否停止動畫
        let totalSpeed = balls.reduce((sum, ball) => sum + Math.abs(ball.vx) + Math.abs(ball.vy), 0)
        if (totalSpeed < 0.5) {
          isAnimating = false
        }
      } else if (balls.length > 0) {
        balls.forEach((ball) => {
          ball.display()
        })
      }
    }

    // 公開方法供Vue調用
    window.startPickAnimation = (items) => {
      balls = []
      const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']
      
      items.forEach((item, index) => {
        const x = p.random(50, 350)
        const y = p.random(50, 150)
        const vx = p.random(-8, 8)
        const vy = p.random(-10, -2)
        balls.push(new Ball(x, y, vx, vy, (index + 1).toString(), colors))
      })
      
      isAnimating = true
    }

    window.resetAnimation = () => {
      balls = []
      isAnimating = false
    }
  })
}

