const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper')
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper')
const NotFoundError = require('../../../Commons/exceptions/NotFoundError')
const DetailThread = require('../../../Domains/threads/entities/DetailThread')
const AddThread = require('../../../Domains/threads/entities/AddThread')
const pool = require('../../database/postgres/pool')
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres')
const AddedThread = require('../../../Domains/threads/entities/AddedThread')

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable()
    await UsersTableTestHelper.cleanTable()
  })

  afterAll(async () => {
    await pool.end()
  })

  describe('addThread function', () => {
    it('should persist new thread and return added thread correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-666' })
      const user = await UsersTableTestHelper.findUsersById('user-666')

      const addThread = new AddThread({
        title: 'title',
        body: 'body',
        owner: user[0].id
      })

      const fakeIdGenerator = () => '666'
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator)

      // Action
      const addThread1 = await threadRepositoryPostgres.addThread(addThread)

      // Assert
      const threads = await ThreadsTableTestHelper.findThreadsById('thread-666')
      expect(threads).toHaveLength(1)
      expect(addThread1).toStrictEqual(new AddedThread({
        id: 'thread-666',
        title: 'title',
        owner: user[0].id
      }))
    })
  })

  describe('checkAvailabilityThread function', () => {
    it('should throw NotFoundError when thread not available', async () => {
      // Arrange

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool)
      const threadId = '---'

      // Action & Assert
      await expect(threadRepositoryPostgres.checkAvailabilityThread(threadId)).rejects.toThrow(NotFoundError)
    })

    it('should not to throw NotFoundError when thread available', async () => {
      // Arrange
      const fakeIdGenerator = () => '666'
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator)
      await UsersTableTestHelper.addUser({ id: 'user-666' })
      const users = await UsersTableTestHelper.findUsersById('user-666')
      const userId = users[0].id
      await ThreadsTableTestHelper.addThread({ id: 'thread-666', owner: userId })
      // Action & Assert
      await expect(threadRepositoryPostgres.checkAvailabilityThread('thread-666')).resolves.not.toThrow(NotFoundError)
    })
  })

  describe('getThreadById function', () => {
    it('should return detail thread correctly', async () => {
      // Arrange
      const now = new Date().toISOString()
      const user = {
        id: 'user-666',
        password: 'secret',
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
      const expectedDetailThread = {
        id: 'thread-666',
        title: 'title',
        body: 'body',
        date: now,
        username: 'dicoding',
        comments: []
      }
      // add user
      await UsersTableTestHelper.addUser({ id: 'user-666' })
      // add thread
      await ThreadsTableTestHelper.addThread({
        id: 'thread-666',
        title: 'title',
        body: 'body',
        owner: user.id,
        date: now
      })
      const fakeIdGenerator = () => '666'
      // Action
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator)
      const detailThread = await threadRepositoryPostgres.getThreadById(thread.id)

      // Assert
      expect(detailThread).toStrictEqual(new DetailThread({ ...expectedDetailThread }))
    })
  })
})
