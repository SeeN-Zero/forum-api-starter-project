const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper')
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper')
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper')
const createServer = require('../createServer')
const container = require('../../container')
const pool = require('../../database/postgres/pool')
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper')

describe('/threads/{threadId}/comments endpoint', () => {
  afterAll(async () => {
    await pool.end()
  })

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable()
    await AuthenticationsTableTestHelper.cleanTable()
    await ThreadsTableTestHelper.cleanTable()
    await CommentsTableTestHelper.cleanTable()
  })

  let User1AccessToken = ''
  let threadId = ''

  beforeEach(async () => {
    const server = await createServer(container)

    // add user
    await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        username: 'user1',
        password: '666',
        fullname: 'user1'
      }
    })

    // login user
    const loginResponse = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: 'user1',
        password: '666'
      }
    })

    const { data: { accessToken } } = JSON.parse(loginResponse.payload)
    User1AccessToken = accessToken

    // add thread
    const addThreadResponse = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: {
        title: 'Judul Thread',
        body: 'Body thread.'
      },
      headers: {
        Authorization: `Bearer ${User1AccessToken}`
      }
    })

    const { data: { addedThread } } = JSON.parse(addThreadResponse.payload)
    threadId = addedThread.id
  })

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 401 invalid token', async () => {
      // Arrange
      const requestPayload = {
        content: 'content'
      }

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: '---'
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(401)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('Missing authentication')
    })

    it('should response 404 not found', async () => {
      // Arrange
      const requestPayload = {
        content: 'content'
      }
      const notFoundThreadId = '---'

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${notFoundThreadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(404)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('Not Found')
    })

    it('should response 400 not contain mandatory property', async () => {
      // Arrange
      const requestPayload = {}

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(400)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('gagal menambah comment karena tidak lengkap')
    })

    it('should response 400 not meet data type ', async () => {
      // Arrange
      const requestPayload = {
        content: 666
      }

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(400)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('gagal menambah comment karena tipe data salah')
    })

    it('should response 201 add new comment', async () => {
      // Arrange
      const requestPayload = {
        content: 'content'
      }

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(201)
      expect(responseJson.status).toEqual('success')
      expect(responseJson.data.addedComment).toBeDefined()

      const { addedComment } = responseJson.data
      expect(addedComment.id).toBeDefined()
      expect(addedComment.id).not.toEqual('')
      expect(typeof addedComment.id).toEqual('string')
      expect(addedComment.content).toBeDefined()
      expect(addedComment.content).not.toEqual('')
      expect(typeof addedComment.content).toEqual('string')
      expect(addedComment.owner).toBeDefined()
      expect(addedComment.owner).not.toEqual('')
      expect(typeof addedComment.owner).toEqual('string')
    })
  })

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 401 invalid token', async () => {
      // Arrange
      const server = await createServer(container)

      // add comment
      const addCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'content'
        },
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addCommentResponseJson = JSON.parse(addCommentResponse.payload)
      const { data: { addedComment } } = addCommentResponseJson
      const commentId = addedComment.id

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: '---'
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(401)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('Missing authentication')
    })

    it('should response 404 not found', async () => {
      // Arrange
      const server = await createServer(container)

      // add comment
      const addCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'content'
        },
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addCommentResponseJson = JSON.parse(addCommentResponse.payload)
      const { data: { addedComment } } = addCommentResponseJson
      const commentId = addedComment.id

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/not-found-thread-id/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(404)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('Not Found')
    })

    it('should response 404 comment not found', async () => {
      // Arrange
      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/not-found-comment-id`,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(404)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('Not Found')
    })

    it('should response 403 unauthorized', async () => {
      // Arrange
      const server = await createServer(container)

      // add another user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'user2',
          password: '666',
          fullname: 'user2'
        }
      })

      // login another user
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'user2',
          password: '666'
        }
      })
      const { data } = JSON.parse(loginResponse.payload)
      const User2AccessToken = data.accessToken

      // add comment
      const addCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'content'
        },
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addCommentResponseJson = JSON.parse(addCommentResponse.payload)
      const { data: { addedComment } } = addCommentResponseJson
      const commentId = addedComment.id

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${User2AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(403)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('Not Authorized')
    })

    it('should response 200 delete comment', async () => {
      // Arrange
      const server = await createServer(container)

      // add another user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'user2',
          password: '666',
          fullname: 'user2'
        }
      })

      // login another user
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'user2',
          password: '666'
        }
      })
      const { data } = JSON.parse(loginResponse.payload)
      const User2AccessToken = data.accessToken

      // add comment
      const addCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'Komentar'
        },
        headers: {
          Authorization: `Bearer ${User2AccessToken}`
        }
      })
      const addCommentResponseJson = JSON.parse(addCommentResponse.payload)
      const { data: { addedComment } } = addCommentResponseJson
      const commentId = addedComment.id

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${User2AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(200)
      expect(responseJson.status).toEqual('success')
    })
  })
})
