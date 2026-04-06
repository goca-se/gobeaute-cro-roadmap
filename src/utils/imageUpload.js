import { supabase, isConfigured } from '../lib/supabase'

export const IMAGES_BUCKET = 'task-images'
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

// ── Validation ────────────────────────────────────────────────────────────────

export function validateImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return 'Somente imagens são suportadas.'
  if (file.size > MAX_BYTES) {
    return `Imagem muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo permitido: 2 MB.`
  }
  return null
}

// ── Compression ───────────────────────────────────────────────────────────────

export function compressImage(file, maxPx = 1920, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Falha ao comprimir imagem')),
        'image/webp',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Imagem inválida'))
    }
    img.src = objectUrl
  })
}

// ── Upload ────────────────────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export async function uploadImage(blob, brandId = 'unknown', reqId = 'unknown') {
  const storagePath = `tasks/${brandId}/${reqId}/${uid()}.webp`

  if (isConfigured) {
    const { error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(storagePath, blob, { contentType: 'image/webp', upsert: false })

    if (error) {
      // Provide a clear message when the bucket doesn't exist
      if (error.message?.includes('Bucket not found') || error.statusCode === 400) {
        throw new Error(
          'Bucket "task-images" não encontrado no Supabase. Crie-o em Storage → New bucket.'
        )
      }
      throw new Error(error.message)
    }

    const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(storagePath)
    return { src: data.publicUrl, storagePath }
  }

  // ── Base64 fallback (localStorage mode) ──────────────────────────────────
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve({ src: e.target.result, storagePath: null })
    reader.onerror = () => reject(new Error('Falha ao converter para base64'))
    reader.readAsDataURL(blob)
  })
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteImage(storagePath) {
  if (!storagePath || !isConfigured) return
  await supabase.storage.from(IMAGES_BUCKET).remove([storagePath])
}
