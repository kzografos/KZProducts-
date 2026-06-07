import { useSupabaseClient } from '#imports'
import { useMediaUpload } from '~/composables/useMediaUpload'

describe('composables/useMediaUpload', () => {
  const useSupabaseClientMock = vi.mocked(useSupabaseClient)

  beforeEach(() => {
    useSupabaseClientMock.mockReset()
  })

  it('rejects unsupported files before upload', async () => {
    const { uploadFile } = useMediaUpload()
    const file = new File(['hello'], 'malware.exe', { type: 'application/octet-stream' })

    await expect(uploadFile(file)).resolves.toEqual({
      url: null,
      error: 'Invalid file type. Allowed: jpeg, png, webp, gif',
    })
  })

  it('uploads files and returns a public URL', async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: 'products/image.webp' }, error: null })
    const getPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/products/image.webp' },
    })

    useSupabaseClientMock.mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload,
          getPublicUrl,
        })),
      },
    })

    const { uploadFile, progress } = useMediaUpload()
    const file = new File(['binary'], 'image.webp', { type: 'image/webp' })

    await expect(uploadFile(file, 'products', 'featured')).resolves.toEqual({
      url: 'https://cdn.example.com/products/image.webp',
      error: null,
    })
    expect(progress.value).toBe(100)
  })

  it('deletes files when a public URL maps to the configured bucket', async () => {
    const remove = vi.fn().mockResolvedValue({ error: null })
    useSupabaseClientMock.mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          remove,
        })),
      },
    })

    const { deleteFile } = useMediaUpload()

    await expect(
      deleteFile('https://example.com/storage/v1/object/public/products/featured/item.webp'),
    ).resolves.toEqual({ success: true, error: null })
    expect(remove).toHaveBeenCalledWith(['featured/item.webp'])
  })
})
