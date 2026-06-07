import {
  MAX_CSV_FILE_SIZE,
  MAX_CSV_ROWS,
  generateCSV,
  isValidUUID,
  parseBoolean,
  parseCSV,
  parseImageUrls,
  parseNumber,
  sanitizeSlug,
  sanitizeString,
  validateCsvFile,
  validateImageUrl,
} from '~/utils/csvUtils'

describe('utils/csvUtils', () => {
  it('parses quoted CSV fields with commas', () => {
    const result = parseCSV('name,description\nGPU,"Fast, quiet and efficient"')

    expect(result.errors).toEqual([])
    expect(result.rows).toEqual([
      {
        name: 'GPU',
        description: 'Fast, quiet and efficient',
      },
    ])
  })

  it('reports malformed CSV row lengths', () => {
    const result = parseCSV('name,slug\nCPU')

    expect(result.errors).toEqual(['Row 2: Expected 2 columns but found 1'])
  })

  it('escapes formula-looking values when generating CSV', () => {
    const csv = generateCSV(
      [
        {
          name: '=SUM(A1:A2)',
          images: ['https://example.com/1.webp', 'https://example.com/2.webp'],
        },
      ],
      ['name', 'images'],
    )

    expect(csv).toContain("'=SUM(A1:A2)")
    expect(csv).toContain('"https://example.com/1.webp,https://example.com/2.webp"')
  })

  it('parses primitive field helpers', () => {
    expect(parseBoolean('YES')).toBe(true)
    expect(parseBoolean('inactive')).toBe(false)
    expect(parseNumber('10,50')).toBe(10.5)
    expect(parseNumber('')).toBeNull()
  })

  it('sanitizes user strings and slugs', () => {
    expect(sanitizeString('<script>alert(1)</script><b>Gaming Rig</b>')).toBe(
      '&lt;b&gt;Gaming Rig&lt;/b&gt;',
    )
    expect(sanitizeSlug('  Ryzen 7_7800X3D !!! ')).toBe('ryzen-7-7800x3d')
  })

  it('validates image URLs and UUIDs', () => {
    expect(validateImageUrl('https://cdn.example.com/image.webp')).toBe(
      'https://cdn.example.com/image.webp',
    )
    expect(validateImageUrl('javascript:alert(1)')).toBeNull()
    expect(
      parseImageUrls('https://cdn.example.com/a.webp, javascript:alert(1), https://cdn.example.com/b.webp'),
    ).toEqual(['https://cdn.example.com/a.webp', 'https://cdn.example.com/b.webp'])
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(isValidUUID('not-a-uuid')).toBe(false)
  })

  it('validates CSV files by extension and size', () => {
    const validFile = new File(['name,slug'], 'products.csv', { type: 'text/csv' })
    const invalidType = new File(['name,slug'], 'products.txt', { type: 'text/plain' })
    const hugeFile = {
      name: 'products.csv',
      size: MAX_CSV_FILE_SIZE + 1,
    } as File

    expect(validateCsvFile(validFile)).toBeNull()
    expect(validateCsvFile(invalidType)).toBe('Invalid file type. Please upload a CSV file.')
    expect(validateCsvFile(hugeFile)).toContain('Maximum size')
    expect(MAX_CSV_ROWS).toBe(1000)
  })
})
