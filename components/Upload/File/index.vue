<template>
  <div class="upload-file-container">
    <a-upload
      v-model:file-list="fileList"
      name="file"
      :accept="accept"
      :action="action"
      :maxCount="maxCount"
      :headers="{ [TOKEN_KEY]: getToken() }"
      @change="handleChange"
      @remove="handleRemove"
      :listType="listType"
      :beforeUpload="beforeUpload"
      @preview="handlePreview"
      :multiple="multiple"
      :showUploadList="showUploadList"
    >
      <template v-if="listType === 'text'">
        <slot name="button">
          <a-button
            type="primary"
            ghost
            style="width: 100%"
          >
            <AIcon type="UploadOutlined" />
            {{ btnText }}
          </a-button>
        </slot>
      </template>
      <template v-else-if="listType === 'picture-card'">
        <div v-if="fileList.length < maxCount">
          <AIcon type="PlusOutlined" />
        </div>
      </template>
    </a-upload>

    <div
      v-if="listType === 'picture-card'"
      style="display: none"
    >
      <a-image-preview-group
        :preview="{
          visible: visible,
          minScale: 0.1,
          current: currentPreviewIndex,
          onVisibleChange: (vis: boolean) => (visible = vis)
        }"
      >
        <a-image
          v-for="(item, index) in previewImage"
          :src="item.url"
          :key="index"
          @click="handleImageClick(index)"
        />
      </a-image-preview-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Upload } from 'ant-design-vue'
import type { UploadChangeParam, UploadProps } from 'ant-design-vue'
import { TOKEN_KEY } from '@jetlinks-web/constants'
import { getToken, onlyMessage } from '@jetlinks-web/utils'
import { fileBatchUpload, FileStatic } from '@datasource-manager-ui/api/comm' // 导入封装好的上传接口
import {getBaseApi} from "@/utils";

const props = defineProps({
  value: {
    type: [String, Array<UploadProps['fileList']>],
    default: undefined
  },
  btnText: {
    type: String,
    default: ''
  },
  accept: {
    type: String,
    default: undefined
  },
  types: {
    type: Array as PropType<Array<string>>,
    default: []
  },
  size: {
    type: Number,
    default: 2
  },
  maxCount: {
    type: Number,
    default: 1
  },
  listType: {
    type: String as PropType<'text' | 'picture' | 'picture-card'>,
    default: 'text'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  publicAccess: {
    type: Boolean,
    default: false
  },
  isUpload: {
    type: Boolean,
    default: true
  },
  // 是否手动上传
  manualUpload: {
    type: Boolean,
    default: false
  },
  showUploadList: {
    type: Boolean,
    default: true
  },
  multiple: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:value', 'change', 'remove'])
const fileList = ref([] as any[])
const loading = ref(false)
const action = computed(() => `${getBaseApi()}${FileStatic}${props.publicAccess ? '' : '?options=publicAccess'}`)
const visible = ref(false)
const currentPreviewIndex = ref(0)
const previewImage = ref<any>([])

function getBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

const uploadFiles = async () => {
  try {
    const formData = new FormData()
    fileList.value.forEach((file: any) => {
      formData.append('file', file.originFileObj)
    })

    const res = await fileBatchUpload(formData, props.publicAccess)
    if (res.status === 200) {
      emit('update:value', res.result)
      return true
    }
    return false
  } catch (error) {
    console.error('上传失败:', error)
    return false
  }
}

const handlePreview = async (file: any) => {
  if (props.listType === 'picture-card') {
    if (!file.url && !file.preview) {
      file.preview = (await getBase64(file.originFileObj)) as string
    }
    if (file.id === file.uid) {
      //编辑状态
      previewImage.value = [
        {
          url: file.url,
          uid: file.uid
        }
      ]
    }
    currentPreviewIndex.value = fileList.value.findIndex((f: any) => f.uid === file.uid)
    visible.value = true
  }
}

const handleChange = (info: UploadChangeParam) => {
  // 如果是手动上传模式，由customRequest处理
  if (props.manualUpload) {
    previewImage.value = info.fileList.map((item: any) => {
      const blob = new Blob([item.originFileObj], { type: item.type })
      const url = URL.createObjectURL(blob)
      return {
        url,
        uid: item.uid
      }
    })

    emit('update:value', info.fileList)
    return
  }

  if (info.file.status === 'uploading') {
    loading.value = true
  }
  if (info.file.status === 'done') {
    loading.value = false
    const _id = info.file.response?.result?.id
    previewImage.value.push({
      url: info.file.response?.result.accessUrl,
      uid: info.file.uid
    })
    emit('update:value', fileList.value)
    emit('change', info)
  }
  if (info.file.status === 'error') {
    loading.value = false
    onlyMessage('上传失败', 'error')
  }
  if (!info.file.status) {
    fileList.value = fileList.value.filter((item: any) => item.uid !== info.file.uid)
  }
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (!props.isUpload) {
    emit('change', file)
    return false
  }

  let inType = true
  if (props.types?.length) {
    inType = props.types?.includes(file.type)
    if (file.type.includes('application')) {
      const type = file.type.split('/')[1]
      inType = props.types?.includes(type)
    }
  }

  // 验证文件大小
  const maxSize = props.size // 文件最大多少兆
  const isMaxSize = file.size / 1024 / 1024 < maxSize

  if (!inType) {
    onlyMessage('请上传正确格式的文件', 'error')
    return Upload.LIST_IGNORE // 关键：阻止加入 fileList
  }

  if (!isMaxSize) {
    onlyMessage(`文件大小必须小于${maxSize}M`, 'error')
    return Upload.LIST_IGNORE
  }

  if (props.manualUpload) {
    return false
  }
}

const handleRemove = (file: any) => {
  previewImage.value = previewImage.value.filter((item: any) => item.uid !== file.uid)
  fileList.value = fileList.value.filter((item) => item.uid !== file.uid)
  emit('update:value', fileList.value)
  emit('remove', file)
}

const handleImageClick = (index: number) => {
  currentPreviewIndex.value = index
}

watch(
  () => props?.value,
  (newValue: any) => {
    if (!newValue?.length) {
      fileList.value = []
    } else {
      fileList.value = [...newValue]
    }
  },
  { immediate: true }
)

// 导出方法给父组件使用
defineExpose({
  uploadFiles
})
</script>

<style scoped lang="less">
.upload-file-container {
  .ant-upload-select-picture-card i {
    font-size: 32px;
    color: #999;
  }

  .ant-upload-select-picture-card .ant-upload-text {
    margin-top: 8px;
    color: #666;
  }
}
</style>
