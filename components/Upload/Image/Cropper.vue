<template>
  <Modal
    :title="title || $t('DataSource.Upload.100044-1')"
    open
    :width="400"
    @cancel="cancel"
    @ok="ok"
    :confirmLoading="loading"
  >
    <div style="height: 300px; width: 100%">
      <vue-cropper
        ref="cropper"
        :img="img"
        :fixed-box="true"
        :autoCrop="true"
        :auto-crop-width="width"
        :auto-crop-height="height"
        outputType="jpg"
      ></vue-cropper>
    </div>
  </Modal>
</template>

<script setup lang="ts" name="UploadCropper">
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'
import { fileUpload } from '@datasource-manager-ui/api/comm'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = defineProps({
  img: {
    type: String
  },
  title: {
    type: String,
    default: ''
  },
  width: {
    type: Number,
    default: 200
  },
  height: {
    type: Number,
    default: 200
  },
  publicAccess: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cancel', 'ok'])

const imgUrl = ref()
const cropper = ref()
const loading = ref(false)

const ok = () => {
  cropper.value.getCropBlob(async (data: Blob) => {
    let formData = new FormData()
    formData.append('file', data, new Date().getTime() + '.jpg')
    imgUrl.value = data
    loading.value = true
    fileUpload(formData, props.publicAccess)
      .then((res) => {
        if (res.success) {
          emit('ok', res.result)
        }
      })
      .finally(() => {
        loading.value = false
      })
  })
}

const cancel = () => {
  emit('cancel')
}
</script>

<style scoped></style>
