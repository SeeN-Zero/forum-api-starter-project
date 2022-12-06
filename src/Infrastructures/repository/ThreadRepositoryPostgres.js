const ThreadRepository = require('../../Domains/threads/ThreadRepository')
const AddedThread = require('../../Domains/threads/entities/AddedThread')
const NotFoundError = require('../../Commons/exceptions/NotFoundError')
const DetailThread = require('../../Domains/threads/entities/DetailThread')

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor (pool, idGenerator) {
    super()
    this._pool = pool
    this._idGenerator = idGenerator
  }

  async addThread (addThread) {
    const { title, body, owner } = addThread
    const id = `thread-${this._idGenerator()}`
    const createdAt = new Date().toISOString()

    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, $4, $5) RETURNING id, title, user_id as owner',
      values: [id, title, body, createdAt, owner]
    }

    const result = await this._pool.query(query)
    return new AddedThread({ ...result.rows[0] })
  }

  async getThreadById (threadId) {
    const query = {
      text: 'SELECT t.id, t.title, t.body, created_at as date, u.username FROM threads as t LEFT JOIN users as u ON u.id = t.user_id WHERE t.id = $1',
      values: [threadId]
    }
    const result = await this._pool.query(query)
    const comments = []
    return new DetailThread({ ...result.rows[0], comments })
  }

  async checkAvailabilityThread (threadId) {
    const query = {
      text: 'SELECT id FROM threads WHERE id = $1',
      values: [threadId]
    }

    const result = await this._pool.query(query)

    if (!result.rowCount) {
      throw new NotFoundError('Not Found')
    }
  }
}

module.exports = ThreadRepositoryPostgres
