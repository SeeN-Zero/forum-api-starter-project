const CommentRepository = require('../../Domains/comments/CommentRepository')
const AddedComment = require('../../Domains/comments/entities/AddedComment')
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError')
const NotFoundError = require('../../Commons/exceptions/NotFoundError')

class CommentRepositoryPostgres extends CommentRepository {
  constructor (pool, idGenerator) {
    super()
    this._pool = pool
    this._idGenerator = idGenerator
  }

  async addComment (addComment) {
    const { content, owner, threadId } = addComment
    const id = `comment-${this._idGenerator()}`
    const createdAt = new Date().toISOString()
    const isDelete = false

    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5, $6) RETURNING id, content, user_id as owner',
      values: [id, content, isDelete, createdAt, threadId, owner]
    }

    const result = await this._pool.query(query)
    return new AddedComment({ ...result.rows[0] })
  }

  async getCommentsByThreadId (threadId) {
    const query = {
      text: 'SELECT c.id, u.username, c.created_at as date, c.content, c.is_delete FROM comments as c LEFT JOIN users as u ON u.id = c.user_id WHERE thread_id = $1 ORDER BY created_at ASC',
      values: [threadId]
    }

    const result = await this._pool.query(query)

    if (!result.rowCount) {
      return []
    }

    return result.rows
  }

  async deleteComment (commentId) {
    const isDelete = true

    const query = {
      text: 'UPDATE comments SET is_delete = $1 WHERE id = $2',
      values: [isDelete, commentId]
    }

    await this._pool.query(query)
  }

  async checkAvailabilityComment (commentId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1',
      values: [commentId]
    }

    const result = await this._pool.query(query)

    if (!result.rowCount) {
      throw new NotFoundError('Not Found')
    }
  }

  async verifyCommentAccess ({ commentId, owner }) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1 and user_id = $2',
      values: [commentId, owner]
    }

    const result = await this._pool.query(query)

    if (!result.rowCount) {
      throw new AuthorizationError('Not Authorized')
    }
  }
}

module.exports = CommentRepositoryPostgres
