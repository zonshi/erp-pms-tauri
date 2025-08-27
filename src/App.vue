<script setup lang="ts"></script>

<template>
  <main class="container">
    <RouterView />
  </main>
</template>

<style scoped>
.container {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>