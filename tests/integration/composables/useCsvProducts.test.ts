vi.mock('~/utils/csvUtils', async () => {
  const actual = await vi.importActual<typeof import('~/utils/csvUtils')>('~/utils/csvUtils')
  return {
    ...actual,
    downloadFile: vi.fn(),
    readFileAsText: vi.fn(),
  }
})

import { useSupabaseClient } from '#imports'
import { downloadFile, readFileAsText } from '~/utils/csvUtils'
import { createQueryBuilder } from '../../fixtures/supabase'
import { useCsvProducts } from '~/composables/useCsvProducts'

describe('composables/useCsvProducts', () => {
  const useSupabaseClientMock = vi.mocked(useSupabaseClient)
  const downloadFileMock = vi.mocked(downloadFile)
  const readFileAsTextMock = vi.mocked(readFileAsText)

  it('exports products with category data to CSV', async () => {
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(
        createQueryBuilder({
          data: [{ id: 'cat-1', name: 'GPU' }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: [
            {
              id: 'product-1',
              name: 'RTX 5080',
              slug: 'rtx-5080',
              description: 'High-end GPU',
              price: 1299,
              compare_at_price: null,
              stock_quantity: 5,
              is_active: true,
              images: ['https://cdn.example.com/gpu.webp'],
              categories: { name: 'GPU' },
            },
          ],
          error: null,
        }),
      )

    useSupabaseClientMock.mockReturnValue({ from: fromMock } as never)

    const csvProducts = useCsvProducts()
    await csvProducts.exportProductsToCsv()

    expect(downloadFileMock).toHaveBeenCalled()
  })

  it('parses CSV imports and detects new categories', async () => {
    readFileAsTextMock.mockResolvedValue(`name,slug,price,category_name
Gaming GPU, gaming-gpu, 999.99, GPUs`)

    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: [{ id: 'cat-1', name: 'CPU' }],
          error: null,
        }),
      ),
    } as never)

    const csvProducts = useCsvProducts()
    const preview = await csvProducts.parseImportFile(
      new File(['placeholder'], 'products.csv', { type: 'text/csv' }),
    )

    expect(preview.errors).toEqual([])
    expect(preview.toCreate).toHaveLength(1)
    expect(preview.newCategories).toEqual(['GPUs'])
  })

  it('creates categories and products during import', async () => {
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(
        createQueryBuilder({
          data: [{ id: 'cat-1', name: 'CPU' }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: { id: 'cat-2', name: 'GPU' },
          error: null,
        }),
      )
      .mockReturnValueOnce(createQueryBuilder({ data: null, error: null }))
      .mockReturnValueOnce(createQueryBuilder({ data: null, error: null }))
      .mockReturnValueOnce(
        createQueryBuilder({
          data: [
            { id: 'cat-1', name: 'CPU' },
            { id: 'cat-2', name: 'GPU' },
          ],
          error: null,
        }),
      )

    useSupabaseClientMock.mockReturnValue({ from: fromMock } as never)

    const csvProducts = useCsvProducts()
    const result = await csvProducts.importProducts(
      {
        toCreate: [
          {
            id: null,
            name: 'RTX 5080',
            slug: 'rtx-5080',
            description: 'High-end GPU',
            price: 1299,
            compare_at_price: null,
            stock_quantity: 4,
            category_name: 'GPU',
            is_active: true,
            images: ['https://cdn.example.com/gpu.webp'],
            _rowNumber: 2,
          },
        ],
        toUpdate: [
          {
            id: 'product-1',
            name: 'Ryzen 9',
            slug: 'ryzen-9',
            description: 'CPU refresh',
            price: 599,
            compare_at_price: 649,
            stock_quantity: 7,
            category_name: 'CPU',
            is_active: true,
            images: [],
            _rowNumber: 3,
          },
        ],
        errors: [],
        newCategories: ['GPU'],
      },
      ['GPU'],
    )

    expect(result.created).toBe(1)
    expect(result.updated).toBe(1)
    expect(result.errors).toEqual([])
  })

  it('rejects invalid import files before parsing', async () => {
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: [],
          error: null,
        }),
      ),
    } as never)

    const csvProducts = useCsvProducts()
    const preview = await csvProducts.parseImportFile(
      new File(['nope'], 'products.txt', { type: 'text/plain' }),
    )

    expect(preview.toCreate).toEqual([])
    expect(preview.errors).toEqual([
      {
        row: 0,
        field: 'file',
        message: 'Invalid file type. Please upload a CSV file.',
      },
    ])
  })

  it('reports missing headers and invalid row data during parsing', async () => {
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: [{ id: 'cat-1', name: 'CPU' }],
          error: null,
        }),
      ),
    } as never)

    const csvProducts = useCsvProducts()

    readFileAsTextMock.mockResolvedValueOnce(`name,slug
Gaming GPU,gaming-gpu`)
    const missingHeaderPreview = await csvProducts.parseImportFile(
      new File(['placeholder'], 'products.csv', { type: 'text/csv' }),
    )

    expect(missingHeaderPreview.errors).toEqual([
      {
        row: 0,
        field: 'headers',
        message: 'Missing required columns: price',
      },
    ])

    readFileAsTextMock.mockResolvedValueOnce(`id,name,slug,price,category_name
not-a-uuid,Gaming GPU,gaming-gpu,0,New Category`)
    const invalidRowPreview = await csvProducts.parseImportFile(
      new File(['placeholder'], 'products.csv', { type: 'text/csv' }),
    )

    expect(invalidRowPreview.errors).toEqual([
      {
        row: 2,
        field: 'id',
        message: 'Invalid ID format. Must be a valid UUID.',
      },
      {
        row: 2,
        field: 'price',
        message: 'Price must be a positive number',
      },
    ])
    expect(invalidRowPreview.newCategories).toEqual(['New Category'])
  })

  it('captures export failures from the products query', async () => {
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(
        createQueryBuilder({
          data: [],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: 'products query failed' },
        }),
      )

    useSupabaseClientMock.mockReturnValue({ from: fromMock } as never)

    const csvProducts = useCsvProducts()

    await expect(csvProducts.exportProductsToCsv()).resolves.toBeUndefined()
    expect(downloadFileMock).not.toHaveBeenCalled()
  })

  it('collects category, create, and update import failures without aborting the whole import', async () => {
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(
        createQueryBuilder({
          data: [{ id: 'cat-1', name: 'CPU' }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: 'category create failed' },
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: 'product create failed' },
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: 'product update failed' },
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: [{ id: 'cat-1', name: 'CPU' }],
          error: null,
        }),
      )

    useSupabaseClientMock.mockReturnValue({ from: fromMock } as never)

    const csvProducts = useCsvProducts()
    const result = await csvProducts.importProducts(
      {
        toCreate: [
          {
            id: null,
            name: 'RTX 5090',
            slug: 'rtx-5090',
            description: 'Next-gen GPU',
            price: 1999,
            compare_at_price: null,
            stock_quantity: 2,
            category_name: 'GPU',
            is_active: true,
            images: [],
            _rowNumber: 2,
          },
        ],
        toUpdate: [
          {
            id: 'product-1',
            name: 'Ryzen 9',
            slug: 'ryzen-9',
            description: '',
            price: 599,
            compare_at_price: null,
            stock_quantity: 3,
            category_name: 'CPU',
            is_active: false,
            images: [],
            _rowNumber: 3,
          },
        ],
        errors: [],
        newCategories: ['GPU'],
      },
      ['GPU'],
    )

    expect(result.created).toBe(0)
    expect(result.updated).toBe(0)
    expect(result.errors).toEqual([
      'Failed to create category "GPU": category create failed',
      'Row 2: Failed to create "RTX 5090" - product create failed',
      'Row 3: Failed to update "Ryzen 9" - product update failed',
    ])
  })
})
