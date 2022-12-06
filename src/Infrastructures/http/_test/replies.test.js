const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper')
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper')
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper')
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper')
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper')
const container = require('../../container')
const pool = require('../../database/postgres/pool')
const createServer = require('../createServer')

describe('/threads/{threadId}/comments/{commentId}/replies endpoint', () => {
  afterAll(async () => {
    await pool.end()
  })

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable()
    await AuthenticationsTableTestHelper.cleanTable()
    await ThreadsTableTestHelper.cleanTable()
    await CommentsTableTestHelper.cleanTable()
    await RepliesTableTestHelper.cleanTable()
  })

  let User1AccessToken = ''
  let threadId = ''
  let commentId = ''

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
        title: 'title',
        body: 'body'
      },
      headers: {
        Authorization: `Bearer ${User1AccessToken}`
      }
    })

    const { data: { addedThread } } = JSON.parse(addThreadResponse.payload)
    threadId = addedThread.id

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

    const { data: { addedComment } } = JSON.parse(addCommentResponse.payload)
    commentId = addedComment.id
  })

  describe('when POST /threads/{threadId}/comments/{commentId}/replies', () => {
    it('should response 201 add new reply', async () => {
      // Arrange
      const requestPayload = {
        content: 'content'
      }

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(201)
      expect(responseJson.status).toEqual('success')
      expect(responseJson.data.addedReply).toBeDefined()

      const { addedReply } = responseJson.data
      expect(addedReply.id).toBeDefined()
      expect(addedReply.id).not.toEqual('')
      expect(typeof addedReply.id).toEqual('string')
      expect(addedReply.content).toBeDefined()
      expect(addedReply.content).not.toEqual('')
      expect(typeof addedReply.content).toEqual('string')
      expect(addedReply.owner).toBeDefined()
      expect(addedReply.owner).not.toEqual('')
      expect(typeof addedReply.owner).toEqual('string')
    })

    it('should response 401 invalid token', async () => {
      // Arrange
      const requestPayload = {
        content: 'content'
      }

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
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

    it('should response 404 thread not found', async () => {
      // Arrange
      const requestPayload = {
        content: 'content'
      }
      const notFoundThreadId = '---'

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${notFoundThreadId}/comments/${commentId}/replies`,
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

    it('should response 404 comment not found', async () => {
      // Arrange
      const requestPayload = {
        content: 'content'
      }
      const notFoundCommentId = '---'

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${notFoundCommentId}/replies`,
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
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(400)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('gagal menambah reply karena tidak lengkap')
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
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(400)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('gagal menambah reply karena tipe data salah')
    })
  })

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    it('should response 401 invalid token', async () => {
      // Arrange
      const server = await createServer(container)

      // add reply
      const addReplyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'content'
        },
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addReplyResponseJson = JSON.parse(addReplyResponse.payload)
      const { data: { addedReply } } = addReplyResponseJson
      const replyid = addedReply.id

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyid}`,
        headers: {
          Authorization: '---'
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(401)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('Missing authentication')
    })

    it('should response 404 thread not found', async () => {
      // Arrange
      const server = await createServer(container)

      // add reply
      const addReplyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'content'
        },
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addReplyResponseJson = JSON.parse(addReplyResponse.payload)
      const { data: { addedReply } } = addReplyResponseJson
      const replyid = addedReply.id

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/not-found-thread-id/comments/${commentId}/replies/${replyid}`,
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

      // add reply
      const addReplyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'content'
        },
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addReplyResponseJson = JSON.parse(addReplyResponse.payload)
      const { data: { addedReply } } = addReplyResponseJson
      const replyid = addedReply.id

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/not-found-comment-id/replies/${replyid}`,
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

      // add reply
      const addReplyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'content'
        },
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addReplyResponseJson = JSON.parse(addReplyResponse.payload)
      const { data: { addedReply } } = addReplyResponseJson
      const replyid = addedReply.id

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyid}`,
        headers: {
          Authorization: `Bearer ${User2AccessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(403)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('Not Authorized')
    })

    it('should response 200 when delete reply', async () => {
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

      // add reply
      const addReplyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'content'
        },
        headers: {
          Authorization: `Bearer ${User2AccessToken}`
        }
      })
      const addReplyResponseJson = JSON.parse(addReplyResponse.payload)
      const { data: { addedReply } } = addReplyResponseJson
      const replyid = addedReply.id

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyid}`,
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
