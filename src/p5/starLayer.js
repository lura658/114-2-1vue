import p5 from "p5"

export default function createStars(container) {
  return new p5((p) => {
    let stars = []

    class Star {
      constructor() {
        this.x = p.random(p.windowWidth)
        this.y = p.random(p.windowHeight)
        this.size = p.random(1, 2.5)
        this.alpha = p.random(100, 255)
      }

      update() {
        this.alpha += p.random(-5, 5)
        this.alpha = p.constrain(this.alpha, 80, 255)
      }

      draw() {
        p.noStroke()
        p.fill(255, this.alpha)
        p.circle(this.x, this.y, this.size)
      }
    }

    p.setup = () => {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight)
      canvas.parent(container)

      for (let i = 0; i < 200; i++) {
        stars.push(new Star())
      }
    }

    p.draw = () => {
      p.clear() // ⭐ 透明背景（關鍵）
      stars.forEach(s => {
        s.update()
        s.draw()
      })
    }

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight)
    }
  })
}