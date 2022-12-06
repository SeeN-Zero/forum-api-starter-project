const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper')
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper')
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper')
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper')
const pool = require('../../database/postgres/pool')
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres')
const NotFoundError = require('../../../Commons/exceptions/NotFoundError')
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError')
const AddedReply = require('../../../Domains/replies/entities/AddedReply')

describe('ReplyRepositoryPostgrres', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable()
    await ThreadsTableTestHelper.cleanTable()
    await CommentsTableTestHelper.cleanTable()
    await RepliesTableTestHelper.cleanTable()
  })

  afterAll(async () => {
    await pool.end()
  })

  describe('addReply function', () => {
    it('should persist new reply and return added reply correctly', async () => {
      // Arrange
      const threadId = 'thread-666'
      const commentId = 'comment-666'
      const userId = 'user-666'

      await UsersTableTestHelper.addUser({ id: userId })
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId })
      await CommentsTableTestHelper.addComment({ id: commentId, owner: userId, threadId })

      const addReply = {
        content: 'content',
        owner: userId,
        commentId
      }

      const fakeIdGenerator = () => '666'
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator)

      // Action
      const addReply1 = await replyRepositoryPostgres.addReply(addReply)

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-666')
      expect(replies).toHaveLength(1)
      expect(addReply1).toStrictEqual(new AddedReply({
        id: 'reply-666',
        owner: userId,
        content: 'content'
      }))
    })
  })

  describe('getRepliesByCommentId function', () => {
    it('should return empty array when not found', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool)
      const userId = 'user-666'
      const threadId = 'thread-666'
      const commentId = 'comment-666'

      await UsersTableTestHelper.addUser({ id: userId })
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId })
      await CommentsTableTestHelper.addComment({ id: commentId, owner: userId, threadId })

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentId(commentId)

      // Assert
      expect(replies).toHaveLength(0)
    })

    it('should return array oh object correctly', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool)
      const now = new Date().toISOString()

      const user = {
        id: 'user-666',
        username: 'user1',
        fullname: 'user1'
      }

      const thread = {
        id: 'thread-666',
        title: 'title',
        body: 'body',
        owner: user.id,
        date: now
      }

      const comment = {
        id: 'comment-666',
        threadId: thread.id,
        date: now,
        content: 'content',
        owner: user.id
      }

      const reply = {
        id: 'reply-666',
        commentId: comment.id,
        date: now,
        content: 'content',
        owner: user.id
      }

      const expectedDetailReply = {
        id: reply.id,
        username: user.username,
        date: reply.date,
        content: reply.content,
        is_delete: false
      }

      await UsersTableTestHelper.addUser({ ...user })
      await ThreadsTableTestHelper.addThread({ ...thread })
      await CommentsTableTestHelper.addComment({ ...comment })
      await RepliesTableTestHelper.addReply({ ...reply })

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentId(comment.id)

      // Assert
      expect(replies).toHaveLength(1)
      expect(replies[0]).toStrictEqual(expectedDetailReply)
    })

    it('should return array sorted', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool)

      const firstUser = {
        id: 'user-666',
        username: 'user1',
        fullname: 'user1'
      }
      const secondUser = {
        id: 'user-667',
        username: 'user2',
        fullname: 'user2'
      }

      const thread = {
        id: 'thread-666',
        title: 'title',
        body: 'body',
        owner: firstUser.id,
        date: new Date('2022-01-01').toISOString()
      }

      const comment = {
        id: 'comment-666',
        threadId: thread.id,
        date: new Date('2022-01-01').toISOString(),
        content: 'content',
        owner: firstUser.id
      }

      const secondUserReply = {
        id: 'reply-666',
        content: 'content',
        commentId: comment.id,
        owner: secondUser.id,
        date: new Date().toISOString()
      }

      const firstUserReply = {
        id: 'reply-667',
        content: 'content',
        commentId: comment.id,
        owner: firstUser.id,
        date: new Date('2022-01-01').toISOString()
      }

      // add user
      await UsersTableTestHelper.addUser({ ...firstUser })
      await UsersTableTestHelper.addUser({ ...secondUser })

      // add thread
      await ThreadsTableTestHelper.addThread({ ...thread })

      // add comment
      await CommentsTableTestHelper.addComment({ ...comment })

      // add reply
      await RepliesTableTestHelper.addReply({ ...secondUserReply })
      await RepliesTableTestHelper.addReply({ ...firstUserReply })

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentId(comment.id)

      // Assert
      const firstReplyDate = new Date(replies[0].date)
      const secondReplyDate = new Date(replies[1].date)

      expect(replies).toHaveLength(2)
      expect(firstReplyDate.getTime()).toBeLessThan(secondReplyDate.getTime())
    })

    it('should return array or list of replies correctly deleted when reply was deleted.', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool)

      const user = {
        id: 'user-666',
        username: 'user1',
        fullname: 'user1'
      }

      const thread = {
        id: 'thread-666',
        title: 'title',
        body: 'body',
        owner: user.id,
        date: new Date('2022-01-01').toISOString()
      }

      const comment = {
        id: 'comment-666',
        threadId: thread.id,
        date: thread.date,
        content: 'content',
        owner: user.id
      }

      const reply = {
        id: 'reply-666',
        commentId: comment.id,
        date: comment.date,
        content: 'content',
        owner: user.id
      }

      const expectedDetailReply = {
        id: reply.id,
        username: user.username,
        date: reply.date,
        content: 'content',
        is_delete: true
      }

      await UsersTableTestHelper.addUser({ ...user })
      await ThreadsTableTestHelper.addThread({ ...thread })
      await CommentsTableTestHelper.addComment({ ...comment })
      await RepliesTableTestHelper.addReply({ ...reply })
      await replyRepositoryPostgres.deleteReply(reply.id)

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentId(comment.id)

      // Assert
      expect(replies).toHaveLength(1)
      expect(replies[0]).toStrictEqual(expectedDetailReply)
    })
  })

  describe('checkAvailabilityReply function', () => {
    it('should throw NotFoundError when reply not available', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool)
      const replyId = '-----'

      // Action & Assert
      await expect(replyRepositoryPostgres.checkAvailabilityReply(replyId)).rejects.toThrow(NotFoundError)
    })

    it('should not throw NotFoundError when reply available', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool)
      const userId = 'user-666'
      const threadId = 'thread-666'
      const commentId = 'comment-666'
      const replyId = 'reply-666'

      await UsersTableTestHelper.addUser({ id: userId })
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId })
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: userId })
      await RepliesTableTestHelper.addReply({ id: replyId, commentId, owner: userId })

      // Action & Assert
      await expect(replyRepositoryPostgres.checkAvailabilityReply(replyId)).resolves.not.toThrow(NotFoundError)
    })
  })

  describe('verifyReplyAccess function', () => {
    it('should throw AuthorizationError when do not have access', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool)
      const owner = 'owner-666'
      const User = 'User-666'
      const threadId = 'thread-666'
      const commentId = 'comment-666'
      const replyId = 'reply-666'

      await UsersTableTestHelper.addUser({ id: owner })
      await UsersTableTestHelper.addUser({ id: User, username: 'user' })
      await ThreadsTableTestHelper.addThread({ id: threadId, owner })
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: User })
      await RepliesTableTestHelper.addReply({ id: replyId, threadId, owner: User, commentId })

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyAccess({ replyId, owner })).rejects.toThrow(AuthorizationError)
    })

    it('should not throw AuthorizationError when have access ', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool)
      const owner = 'owner-666'
      const threadId = 'thread-666'
      const commentId = 'comment-666'
      const replyId = 'reply-666'

      await UsersTableTestHelper.addUser({ id: owner })
      await ThreadsTableTestHelper.addThread({ id: threadId, owner })
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner })
      await RepliesTableTestHelper.addReply({ id: replyId, commentId, owner })

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyAccess({ replyId, owner })).resolves.not.toThrow(AuthorizationError)
    })
  })

  describe('deleteReply function', () => {
    it('should update is_delete from comment in database', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool)

      const newUser = {
        id: 'user-666'
      }

      const newComment = {
        id: 'comment-666',
        content: 'content',
        threadId: 'thread-666',
        owner: 'user-666'
      }

      const newReply = {
        id: 'reply-666',
        content: 'Balasan',
        commentId: 'comment-666',
        owner: 'user-666'
      }

      const expectedDeletedReply = {
        id: newReply.id,
        content: newReply.content,
        is_delete: true
      }

      await UsersTableTestHelper.addUser({ id: newUser.id })
      await ThreadsTableTestHelper.addThread({ id: newComment.threadId, owner: newUser.id })
      await CommentsTableTestHelper.addComment(newComment)
      await RepliesTableTestHelper.addReply(newReply)

      const repliesBeforeDelete = await RepliesTableTestHelper.findRepliesById(newReply.id)
      const replyBeforeDelete = repliesBeforeDelete[0]

      // Action
      await replyRepositoryPostgres.deleteReply(newReply.id)

      // Assert
      const repliesAfterDelete = await RepliesTableTestHelper.findRepliesById(newReply.id)
      const replyAfterDelete = repliesAfterDelete[0]

      expect(replyBeforeDelete.is_delete).toEqual(false)
      expect(replyAfterDelete.is_delete).toEqual(expectedDeletedReply.is_delete)
    })
  })
})
