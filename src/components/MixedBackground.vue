<template>
  <div class="bg-wrapper">
    <!-- ⭐ 星空 -->
    <div ref="starRef" class="stars"></div>

    <!-- ☁️ 雲層 -->
    <div ref="vantaRef" class="clouds"></div>
    
    <!-- 🌑 漸層遮罩 (不阻擋滑鼠點擊) -->
    <div class="overlay"></div>

    <!-- UI -->
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import * as THREE from "three"
import Clouds2 from "vanta/src/vanta.clouds2" // 替換回可用的路徑
import createStars from "../p5/starLayer"

const starRef = ref(null)
const vantaRef = ref(null)

let vantaEffect = null
let p5Instance = null

onMounted(() => {
  // ⭐ 繪製星星
  if (starRef.value) {
    p5Instance = createStars(starRef.value)
  }

  // ☁️ 繪製雲層
  if (vantaRef.value) {
    vantaEffect = Clouds2({
      el: vantaRef.value,
      THREE: THREE,
      mouseControls: true,
      touchControls: true,
      skyColor: 0x070a1a,
      cloudColor: 0x1a1f4d,
      cloudShadowColor: 0x000000,
      sunColor: 0x111133,
      sunGlareColor: 0x000000,
      speed: 0.6,
      zoom: 0.9
    })
  }
})

onUnmounted(() => {
  if (vantaEffect) vantaEffect.destroy()
  if (p5Instance) p5Instance.remove() // 清除 p5，避免切換頁面時造成記憶體洩漏
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
.stars {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.clouds {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.6; /* 讓星星透出來 */
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