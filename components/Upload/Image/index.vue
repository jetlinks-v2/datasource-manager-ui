<template>
  <div class="upload-image-warp">
    <div
      class="upload-image-border"
      :style="borderStyle"
      :class="{ circle: shape === 'circle' }"
    >
      <a-upload
        list-type="picture-card"
        class="avatar-uploader"
        :name="name || 'file'"
        :accept="accept"
        :show-upload-list="false"
        :beforeUpload="beforeUpload"
        :action="_action"
        :headers="{ [TOKEN_KEY]: getToken() }"
        @change="handleChange"
      >
        <div
          class="upload-image-content"
          :style="style"
        >
          <slot
            name="content"
            :imageUrl="imageUrl"
            :loading="loading"
          >
            <template v-if="imageUrl">
              <img
                :src="imageUrl"
                alt=""
                width="100%"
                class="upload-image"
              />
              <div
                class="upload-image-mask"
                v-if="!onlyShow"
              >
                <div style="margin-top: 12px">点击修改</div>
                <a-button
                  type="link"
                  style="padding: 0"
                  @click.stop="handleRemove"
                >
                  <AIcon
                    type="DeleteOutlined"
                    style="color: #fff"
                  />
                </a-button>
              </div>
            </template>
            <AIcon
              v-else
              type="PlusOutlined"
              style="font-size: 20px"
            />
          </slot>
        </div>
      </a-upload>
      <div
        class="upload-loading-mask"
        v-if="disabled"
      ></div>
      <div
        class="upload-loading-mask"
        v-if="imageUrl && loading"
      >
        <AIcon
          type="LoadingOutlined"
          style="font-size: 20px"
        />
      </div>
    </div>
  </div>
  <CropperModal
    v-if="cropper.visible && !noCropper"
    v-bind="cropperProps"
    :img="cropper.img"
    :title="cropperTitle"
    @cancel="cropper.visible = false"
    @ok="saveImage"
    :publicAccess="publicAccess"
  />
</template>

<script setup lang="ts" name="ImageUpload">
import { getToken, onlyMessage, getBase64ByImg } from '@jetlinks-web/utils'
import { TOKEN_KEY } from '@jetlinks-web/constants'
import type { CSSProperties, PropType } from 'vue'
import type { UploadChangeParam } from 'ant-design-vue'
import CropperModal from './Cropper.vue'
import { getImageUrl } from '@datasource-manager-ui/utils'
import { FileStatic } from '@datasource-manager-ui/api/comm'
import {getBaseApi} from "@/utils";

const props = defineProps({
  value: {
    type: String,
    default: undefined
  },
  onlyShow: {
    type: Boolean,
    default: false
  },
  size: {
    type: Number,
    default: 2
  },
  types: {
    type: Array as PropType<Array<string>>,
    default: ['image/jpeg', 'image/png']
  },
  disabled: {
    type: Boolean,
    default: false
  },
  accept: {
    type: String,
    default: undefined
  },
  name: {
    type: String,
    default: 'file'
  },
  style: {
    type: Object as PropType<CSSProperties>,
    default: () => ({})
  },
  borderStyle: {
    type: Object as PropType<CSSProperties>,
    default: () => ({})
  },
  cropperStyle: {
    type: Object as PropType<CSSProperties>,
    default: () => ({})
  },
  cropperTitle: {
    type: String,
    default: '图片编辑'
  },
  cropperProps: {
    type: Object,
    default: () => ({})
  },
  noCropper: {
    type: Boolean,
    default: false
  },
  publicAccess: {
    type: Boolean,
    default: false
  },
  shape: {
    type: String as PropType<'circle' | 'square'>,
    default: 'square'
  }
})

const emit = defineEmits(['update:value', 'change'])

const cropper = reactive({
  visible: false,
  img: ''
})
const loading = ref(false) // 上传图片状态
const imageUrl = ref<string | undefined>('')

const _action = computed(() => {
  return `${getBaseApi()}${FileStatic}${props.publicAccess ? '?options=publicAccess' : ''}`
})

const beforeUpload = (file: any) => {
  const types = (props.types || []) as Array<string>
  const inType = types.includes(file.type)
  const maxSize = (props.size || 2) as number // 文件最大多少兆
  const isMaxSize = file.size / 1024 / 1024 < maxSize

  if (!inType) {
    onlyMessage('请上传正确格式的图片', 'error')
    return false
  }

  if (!isMaxSize) {
    onlyMessage(`图片大小必须小于${maxSize}M`, 'error')
    return false
  }

  if (!props.noCropper) {
    getBase64ByImg(file, (base64Url) => {
      cropper.img = base64Url
      cropper.visible = true
    })
    return false
  } else {
    return true
  }
}

const handleChange = (info: UploadChangeParam) => {
  if (info.file.status === 'uploading') {
    loading.value = true
  }
  if (info.file.status === 'done') {
    loading.value = false
    const _id = info.file.response?.result?.id
    emit('update:value', _id)
    emit('change', _id)
  }
  if (info.file.status === 'error') {
    loading.value = false
    onlyMessage('上传失败', 'error')
  }
}

const saveImage = (dt: any) => {
  cropper.visible = false
  emit('update:value', dt.id)
  emit('change', dt.id)
}

const handleRemove = () => {
  cropper.visible = false
  emit('update:value', '')
  emit('change', '')
}

watch(
  () => props.value,
  (newValue) => {
    if (newValue?.includes('/')) {
      imageUrl.value = newValue
      return
    }
    imageUrl.value = newValue ? getImageUrl(newValue) : ''
  },
  {
    immediate: true
  }
)
</script>

<style scoped lang="less">
@border: 1px dashed @border-color-base;
@mask-color: rgba(#000, 0.25);

.flex-center() {
  align-items: center;
  justify-content: center;
}

.upload-image-warp {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  height: 100%;

  .upload-image-border {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    transition: all 0.3s;
    // border: 1px dashed #1890ff;

    &:hover {
      border-color: @primary-color-hover;
    }

    :deep(.ant-upload-picture-card-wrapper) {
      width: 100%;
      height: 100%;
    }
    :deep(.ant-upload) {
      width: 100%;
      height: 100%;
      margin: 0;
      border: none;
    }

    .upload-image-content {
      .flex-center();

      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      // background-color: #303030;
      cursor: pointer;
      //padding: 8px;

      .upload-image-mask {
        .flex-center();

        position: absolute;
        top: 0;
        left: 0;
        display: none;
        width: 100%;
        height: 100%;
        color: #fff;
        font-size: 16px;
        background-color: @mask-color;
      }

      .upload-image {
        width: 100%;
        height: 100%;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
      }

      &:hover .upload-image-mask {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    }
  }

  .upload-loading-mask {
    .flex-center();

    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    width: 100%;
    height: 100%;
    color: #fff;
    background-color: @mask-color;
  }

  .circle {
    border-radius: 50%;
    overflow: hidden;
    box-sizing: border-box;
  }
}
.borderStyle {
  border: 1px dashed #1890ff;
}
</style>
