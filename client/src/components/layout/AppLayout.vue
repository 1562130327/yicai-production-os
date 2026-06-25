<template>
  <div class="app-layout">
    <AppTopBar />
    <main class="main">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <BaseToast />
  </div>
</template>

<script setup lang="ts">
import AppTopBar from './AppTopBar.vue'
import BaseToast from '@/components/common/BaseToast.vue'
</script>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
}

.main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}
</style>
