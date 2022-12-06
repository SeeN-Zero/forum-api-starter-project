const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper')
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper')
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper')
const pool = require('../../database/postgres/pool')
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres')
const NotFoundError = require('../../../Commons/exceptions/NotFoundError')
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError')
const DetailComment = require('../../../Domains/comments/entities/DetailComment')

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable()
    await ThreadsTableTestHelper.cleanTable()
    await CommentsTableTestHelper.cleanTable()
  })

  afterAll(async () => {
    await pool.end()
  })

  describe('addComment function', () => {
    it('should persist and return added comment correctly', async () => {
      // Arrange
      const threadId = 'thread-123'
      const userId = 'user-123'

      await UsersTableTestHelper.addUser({ id: userId })
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId })

      const newComment = {
        content: 'content',
        owner: userId,
        threadId
      }

      const fakeIdGenerator = () => '666'
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator)

      // Action
      await commentRepositoryPostgres.addComment(newComment)

      // Assert
      const comments = await CommentsTableTestHelper.findCommentsById('comment-666')
      expect(comments).toHaveLength(1)
    })
  })

  describe('checkAvailabilityComment function', () => {
    it('should throw NotFoundError when comment not available', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool)
      const commentId = '---'

      // Action & Assert
      expect(commentRepositoryPostgres.checkAvailabilityComment(commentId)).rejects.toThrow(NotFoundError)
    })

    it('should not throw NotFoundError when comment available', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool)
      const commentId = 'comment-666'
      const threadId = 'thread-666'
      const userId = 'user-666'

      await UsersTableTestHelper.addUser({ id: userId })
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId })
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: userId })

      // Action & Assert
      expect(commentRepositoryPostgres.checkAvailabilityComment(commentId)).resolves.not.toThrow(NotFoundError)
    })
  })

  describe('verifyCommentAccess function', () => {
    it('should throw AuthorizationError when owner do not have access', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool)
      const commentId = 'comment-666'
      const threadId = 'thread-666'
      const owner = 'owner-666'
      const user = 'user-666'

      await UsersTableTestHelper.addUser({ id: owner })
      await UsersTableTestHelper.addUser({ id: user, username: 'anotheruser' })
      await ThreadsTableTestHelper.addThread({ id: threadId, owner })
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: user })

      // Action & Assert
      expect(commentRepositoryPostgres.verifyCommentAccess({ commentId, owner })).rejects.toThrow(AuthorizationError)
    })

    it('should not throw AuthorizationError when owner have access to the comment', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool)
      const commentId = 'comment-666'
      const threadId = 'thread-666'
      const owner = 'owner-666'
      const user = 'user-666'

      await UsersTableTestHelper.addUser({ id: owner })
      await UsersTableTestHelper.addUser({ id: user, username: 'anotheruser' })
      await ThreadsTableTestHelper.addThread({ id: threadId, owner })
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner })

      // Action & Assert
      expect(commentRepositoryPostgres.verifyCommentAccess({ commentId, owner })).resolves.not.toThrow(AuthorizationError)
    })
  })

  describe('deleteComment function', () => {
    it('should update is_delete from comment in database', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool)
      const newComment = {
        id: 'comment-666',
        content: 'content',
        threadId: 'thread-666',
        owner: 'user-666'
      }

      const expectedDeletedComment = {
        id: newComment.id,
        content: newComment.content,
        is_delete: true
      }

      await UsersTableTestHelper.addUser({ id: newComment.owner })
      await ThreadsTableTestHelper.addThread({
        id: newComment.threadId, owner: newComment.owner
      })
      await CommentsTableTestHelper.addComment(newComment)

      const commentsBeforeDelete = await CommentsTableTestHelper.findCommentsById(newComment.id)
      const commentBeforeDelete = commentsBeforeDelete[0]

      // Action
      await commentRepositoryPostgres.deleteComment(newComment.id)

      // Assert
      const commentsAfterDelete = await CommentsTableTestHelper.findCommentsById(newComment.id)
      const commentAfterDelete = commentsAfterDelete[0]

      expect(commentBeforeDelete.is_delete).toEqual(false)
      expect(commentAfterDelete.is_delete).toEqual(expectedDeletedComment.is_delete)
    })
  })

  describe('getCommentsByThreadId function', () => {
    it('should return empty array when comments not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool)
      const threadId = 'thread-666'
      const userId = 'user-666'

      await UsersTableTestHelper.addUser({ id: userId })
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId })

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(threadId)

      // Assert
      expect(comments).toHaveLength(0)
    })

    it('should return array or list of comments correctly', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool)
      const now = new Date('2022-01-01').toISOString()

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

      const expectedDetailComment = {
        id: 'comment-666',
        username: user.username,
        date: now,
        content: 'content',
        is_delete: false
      }

      await UsersTableTestHelper.addUser({ ...user })
      await ThreadsTableTestHelper.addThread({ ...thread })
      await CommentsTableTestHelper.addComment({ ...comment })

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(thread.id)

      // Assert
      expect(comments).toHaveLength(1)
      expect(comments[0]).toStrictEqual(expectedDetailComment)
    })

    it('should return array or list of comments correctly when comment was deleted.', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool)
      const now = new Date('2022-01-01').toISOString()

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

      const expectedDeletedComment = {
        id: 'comment-666',
        username: user.username,
        date: now,
        content: '**komentar telah dihapus**',
        is_delete: true
      }

      await UsersTableTestHelper.addUser({ ...user })
      await ThreadsTableTestHelper.addThread({ ...thread })
      await CommentsTableTestHelper.addComment({ ...comment })
      await commentRepositoryPostgres.deleteComment(comment.id)

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(thread.id)

      // Assert
      expect(comments).toHaveLength(1)
      expect(comments[0]).toStrictEqual(expectedDeletedComment)
    })

    it('should return array or list of comments sorted form most past', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool)

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
        date: new Date().toISOString()
      }

      const secondUserComment = {
        id: 'comment-666',
        content: 'content',
        threadId: thread.id,
        owner: secondUser.id,
        date: new Date('2022-01-01').toISOString()
      }

      const firstUserComment = {
        id: 'comment-667',
        content: 'content',
        threadId: thread.id,
        owner: firstUser.id,
        date: new Date('2022-01-02').toISOString()
      }

      // add user
      await UsersTableTestHelper.addUser({ ...firstUser })
      await UsersTableTestHelper.addUser({ ...secondUser })

      // add thread
      await ThreadsTableTestHelper.addThread({ ...thread })

      // add comment
      await CommentsTableTestHelper.addComment({ ...secondUserComment })
      await CommentsTableTestHelper.addComment({ ...firstUserComment })

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(thread.id)

      // Assert
      const firstCommentDate = new Date(comments[0].date)
      const secondCommentDate = new Date(comments[1].date)

      expect(comments).toHaveLength(2)
      expect(firstCommentDate.getTime()).toBeLessThan(secondCommentDate.getTime())
    })
  })
})
