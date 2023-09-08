process.env.NODE_ENV = 'test'

const request = require('supertest')

const app = require('../app')
const db = require('../db')

let book_isbn

beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '1673303056',
        'https://www.amazon.com/Heart-Darkness-Joseph-Conrad',
        'Joseph Conrad',
        'English',
        106,
        'Penguin',
        'Heart of Darkness', 2019)
      RETURNING isbn`)

  book_isbn = result.rows[0].isbn
})

describe('GET/books', () => {
  test('returns a list of books', async () => {
    const res = await request(app).get('/books').expect(200)

    expect(Array.isArray(res.body.books)).toBe(true)
    expect(res.body.books.length).toBeGreaterThan(0)
    expect(res.body.books[0].author).toBe('Joseph Conrad')
  })
})

describe('POST/books', () => {
  test('Creates a new book', async () => {
    const res = await request(app).post('/books').send({
      isbn: '0393307050',
      amazon_url: 'https://www.amazon.com/Master-And-Commander',
      author: "Patrick O'Brian",
      language: 'english',
      pages: 400,
      publisher: 'W. W. Norton & Company',
      title: 'Master and Commander',
      year: 2021,
    })
    expect(res.statusCode).toBe(201)
    expect(res.body.book).toHaveProperty('author')
  })

  test('Prevents creating book without isbn', async () => {
    const res = await request(app).post('/books').send({
      author: 'Oscar Wilde',
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('PUT/books/:id', () => {
  test('Updates an existing book', async () => {
    const res = await request(app).put(`/books/${book_isbn}`).send({
      author: "Patrick O'Brian",
      language: 'english',
      pages: 400,
      publisher: 'W. W. Norton & Company',
      title: 'HMS Surprise',
      year: 2021,
    })
    expect(res.body.book).toHaveProperty('isbn')
    expect(res.body.book.title).toBe('HMS Surprise')
  })

  test('Prevents updating isbn on existing book', async () => {
    const res = await request(app).put(`/books/${book_isbn}`).send({
      isbn: '99999999',
      amazon_url: 'https://www.amazon.com/Master-And-Commander',
      author: "Patrick O'Brian",
      language: 'english',
      pages: 400,
      publisher: 'W. W. Norton & Company',
      title: 'Post Captain',
      year: 2021,
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('DELETE /books/:id', () => {
  test('Deletes an existing book', async () => {
    const res = await request(app).delete(`/books/${book_isbn}`)
    expect(res.body).toEqual({ message: 'Book deleted' })
  })
})

afterEach(async function () {
  await db.query('DELETE FROM BOOKS')
})

afterAll(async function () {
  await db.end()
})
