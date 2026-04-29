<template>
  <div class="page-header">
    <div class="info">
      <h2 class="page-title">{{ title }}</h2>
      <p class="page-subtitle" v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div class="actions">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: String,
})
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}
.info { min-width: 0; }
.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--rd-text);
  letter-spacing: -0.02em;
}
.page-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--rd-muted);
}
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
