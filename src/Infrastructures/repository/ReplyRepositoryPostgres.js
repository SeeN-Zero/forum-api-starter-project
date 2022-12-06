const ReplyRepository = require('../../Domains/replies/ReplyRepository')
const AddedReply = require('../../Domains/replies/entities/AddedReply')
const NotFoundError = require('../../Commons/exceptions/NotFoundError')
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError')

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor (pool, idGenerator) {
    super()
    this._pool = pool
    this._idGenerator = idGenerator
  }

  async addReply (addReply) {
    const { content, commentId, owner } = addReply
    const id = `reply-${this._idGenerator()}`
    const isDelete = false
    const createdAt = new Date().toISOString()

    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5, $6) RETURNING id, content, user_id as owner',
      values: [id, content, isDelete, createdAt, commentId, owner]
    }

    const result = await this._pool.query(query)

    return new AddedReply({ ...result.rows[0] })
  }

  async getRepliesByCommentId (commentId) {
    const query = {
      text: 'SELECT r.id, r.content, r.is_delete, r.created_at as date, u.username FROM replies as r LEFT JOIN users as u ON u.id = r.user_id WHERE r.comment_id = $1 ORDER BY r.created_at ASC',
      values: [commentId]
    }

    const result = await this._pool.query(query)

    if (!result.rowCount) {
      return []
    }

    return result.rows
  }

  async deleteReply (replyId) {
    const IsDelete = true

    const query = {
      text: 'UPDATE replies SET is_delete = $1 WHERE id = $2',
      values: [IsDelete, replyId]
    }

    await this._pool.query(query)
  }

  async checkAvailabilityReply (replyId) {
    const query = {
      text: 'SELECT id FROM replies WHERE id = $1',
      values: [replyId]
    }

    const result = await this._pool.query(query)

    if (!result.rowCount) {
      throw new NotFoundError('Not Found')
    }
  }

  async verifyReplyAccess ({ owner, replyId }) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1 and user_id = $2',
      values: [replyId, owner]
    }

    const result = await this._pool.query(query)

    if (!result.rowCount) {
      throw new AuthorizationError('Not Authorized')
    }
  }
}

module.exports = ReplyRepositoryPostgres
