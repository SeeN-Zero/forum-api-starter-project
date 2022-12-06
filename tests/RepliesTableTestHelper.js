/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool')

const RepliesTableTestHelper = {
  async addReply ({
    id = 'reply-666',
    content = 'content',
    commentId = 'comment-666',
    owner = 'user-666',
    date = new Date('2022-01-01').toISOString()
  }) {
    const isDelete = false
    const createdAt = date

    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5, $6) RETURNING id, content, user_id as owner',
      values: [id, content, isDelete, createdAt, commentId, owner]
    }

    await pool.query(query)
  },

  async findRepliesById (id) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1',
      values: [id]
    }

    const result = await pool.query(query)
    return result.rows
  },

  async deleteReplyById (id) {
    const query = {
      text: 'DELETE FROM replies WHERE id = $1',
      values: [id]
    }

    await pool.query(query)
  },

  async cleanTable () {
    await pool.query('DELETE FROM replies WHERE 1=1')
  }
}

module.exports = RepliesTableTestHelper
