<template>
  <el-dialog v-model="visible" title="Change password" width="460" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
      <el-form-item label="Current password" prop="old_password">
        <el-input v-model="form.old_password" type="password" show-password placeholder="For OIDC users without a password, enter any 4-20 chars" />
      </el-form-item>
      <el-form-item label="New password" prop="new_password">
        <el-input v-model="form.new_password" type="password" show-password />
      </el-form-item>
      <el-form-item label="Confirm new password" prop="confirmPwd">
        <el-input v-model="form.confirmPwd" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">Cancel</el-button>
      <el-button type="primary" :loading="loading" @click="submit">Update password</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { changeCurPwd } from '@/api/user'
import { useUserStore } from '@/store/user'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const form = reactive({ old_password: '', new_password: '', confirmPwd: '' })
const formRef = ref(null)
const loading = ref(false)
const userStore = useUserStore()

const rules = {
  old_password: [{ required: true, message: 'Required', trigger: 'blur' }],
  new_password: [
    { required: true, message: 'Required', trigger: 'blur' },
    { min: 4, message: 'At least 4 characters', trigger: 'blur' },
    { validator: (_, v, cb) => v === form.old_password ? cb(new Error('Must differ from current password')) : cb(), trigger: 'blur' },
  ],
  confirmPwd: [
    { required: true, message: 'Required', trigger: 'blur' },
    { validator: (_, v, cb) => v === form.new_password ? cb() : cb(new Error('Passwords do not match')), trigger: 'blur' },
  ],
}

async function submit () {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  const res = await changeCurPwd(form).catch(() => false)
  loading.value = false
  if (!res) return
  ElMessageBox.alert('Password updated. Please sign in again.', 'Done', {
    confirmButtonText: 'OK',
    callback: () => {
      userStore.logout()
      window.location.reload()
    },
  })
}
</script>
