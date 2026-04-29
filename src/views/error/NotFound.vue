<template>
  <div class="nf-page">
    <div class="nf-inner">
      <div class="code">404</div>
      <h2>Page not found</h2>
      <p class="text-muted">The page you're looking for doesn't exist or has been moved.</p>
      <router-link to="/" class="home-btn">
        <el-icon><HomeFilled /></el-icon>
        <span>Go home</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped lang="scss">
.nf-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
}
.nf-inner {
  text-align: center;
  max-width: 440px;
}
.code {
  font-size: 120px;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 12px;
}
h2 {
  font-size: 24px;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
  font-weight: 700;
}
p { margin: 0 0 24px; font-size: 15px; }
.home-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  background: #6366f1;
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: background 0.15s;
  &:hover { background: #4f46e5; }
}
</style>
