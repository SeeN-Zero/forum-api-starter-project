const pool = require('../../database/postgres/pool')
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper')
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper')
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper')
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper')
const createServer = require('../createServer')
const container = require('../../container')

describe('/threads endpoint', () => {
  const addThreadPayload = {
    title: 'title',
    body: 'body'
  }

  const addCommentPayload = {
    content: 'content'
  }

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
  })

  describe('when POST /threads', () => {
    it('should response 401 invalid token', async () => {
      // Arrange
      const requestPayload = {
        title: 'title',
        body: 'body'
      }

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload
      })

      // Assert
      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(401)
      expect(responseJson.message).toBeDefined()
      expect(responseJson.message).toEqual('Missing authentication')
    })

    it('should response 400 not contain mandatory property', async () => {
      // Arrange
      const requestPayload = {
        title: 'title'
      }

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Assert
      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(400)
      expect(responseJson.status).toEqual('fail')
      expect(responseJson.message).toEqual('gagal menambah thread karena tidak lengkap')
    })

    it('should response 400 not meet data type', async () => {
      // Arrange
      const requestPayload = {
        title: 666,
        body: 666
      }

      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Assert
      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(400)
      expect(responseJson.status).toEqual('fail')
      expect(responseJson.message).toEqual('gagal menambah thread karena tipe data salah')
    })

    it('should response 201 and add new thread', async () => {
      // Arrange
      const server = await createServer(container)

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: addThreadPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Assert
      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(201)
      expect(responseJson.status).toEqual('success')
      expect(responseJson.data.addedThread).toBeDefined()

      const { addedThread } = responseJson.data
      expect(addedThread.id).toBeDefined()
      expect(addedThread.id).not.toEqual('')
      expect(typeof addedThread.id).toEqual('string')
      expect(addedThread.title).toBeDefined()
      expect(addedThread.title).not.toEqual('')
      expect(typeof addedThread.title).toEqual('string')
      expect(addedThread.owner).toBeDefined()
      expect(addedThread.owner).not.toEqual('')
      expect(typeof addedThread.owner).toEqual('string')
    })
  })

  describe('when GET /threads/{threadId}', () => {
    it('should response 404 when thread not found', async () => {
      // Arrange
      const server = await createServer(container)
      const notFoundThreadId = '---'

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${notFoundThreadId}`,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Assert
      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(404)
      expect(responseJson.status).toEqual('fail')
      expect(responseJson.message).toEqual('Not Found')
    })

    it('should response 200 and detail thread', async () => {
      // Arrange
      const server = await createServer(container)

      // add thread
      const addThreadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: addThreadPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addThreadResponseJson = JSON.parse(addThreadResponse.payload)
      const { data: { addedThread } } = addThreadResponseJson
      const threadId = addedThread.id

      // add comment
      await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: addCommentPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Assert
      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(200)
      expect(responseJson.status).toEqual('success')
      expect(responseJson.data.thread).toBeDefined()

      const { thread } = responseJson.data
      expect(thread.id).toBeDefined()
      expect(thread.id).not.toEqual('')
      expect(typeof thread.id).toEqual('string')
      expect(thread.title).toBeDefined()
      expect(thread.title).not.toEqual('')
      expect(typeof thread.title).toEqual('string')
      expect(thread.body).toBeDefined()
      expect(thread.body).not.toEqual('')
      expect(typeof thread.body).toEqual('string')
      expect(thread.date).toBeDefined()
      expect(thread.date).not.toEqual('')
      expect(typeof thread.date).toEqual('string')
      expect(thread.username).toBeDefined()
      expect(thread.username).not.toEqual('')
      expect(typeof thread.username).toEqual('string')
      expect(thread.comments).toBeDefined()
      expect(thread.comments).toHaveLength(1)
    })

    it('should response 200 after delete comment', async () => {
      // Arrange
      const server = await createServer(container)

      // add thread
      const addThreadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: addThreadPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addThreadResponseJson = JSON.parse(addThreadResponse.payload)
      const { data: { addedThread } } = addThreadResponseJson
      const threadId = addedThread.id

      // add comment
      const addCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: addCommentPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addCommentResponseJson = JSON.parse(addCommentResponse.payload)
      const { data: { addedComment } } = addCommentResponseJson
      const commentId = addedComment.id

      // delete comment
      await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Assert
      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(200)
      expect(responseJson.status).toEqual('success')
      expect(responseJson.data.thread).toBeDefined()

      const { thread } = responseJson.data
      expect(thread.id).toBeDefined()
      expect(thread.id).not.toEqual('')
      expect(typeof thread.id).toEqual('string')
      expect(thread.title).toBeDefined()
      expect(thread.title).not.toEqual('')
      expect(typeof thread.title).toEqual('string')
      expect(thread.body).toBeDefined()
      expect(thread.body).not.toEqual('')
      expect(typeof thread.body).toEqual('string')
      expect(thread.date).toBeDefined()
      expect(thread.date).not.toEqual('')
      expect(typeof thread.date).toEqual('string')
      expect(thread.username).toBeDefined()
      expect(thread.username).not.toEqual('')
      expect(typeof thread.username).toEqual('string')
      expect(thread.comments).toBeDefined()
      expect(thread.comments).toHaveLength(1)
      expect(thread.comments[0].content).toEqual('**komentar telah dihapus**')
    })

    it('should response 200 and detail thread correctly and sorted', async () => {
      // Arrange
      const server = await createServer(container)

      // add thread
      const addThreadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: addThreadPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addThreadResponseJson = JSON.parse(addThreadResponse.payload)
      const { data: { addedThread } } = addThreadResponseJson
      const threadId = addedThread.id

      // add first comment
      await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: addCommentPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // add second comment
      await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: addCommentPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Assert
      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(200)
      expect(responseJson.status).toEqual('success')
      expect(responseJson.data.thread).toBeDefined()

      const { thread } = responseJson.data
      expect(thread.comments).toBeDefined()
      expect(thread.comments).toHaveLength(2)

      const firstCommentDate = new Date(thread.comments[0].date)
      const secondCommentDate = new Date(thread.comments[1].date)
      expect(firstCommentDate.getTime()).toBeLessThan(secondCommentDate.getTime())
    })

    it('should response 200 and detail thread correctly (replies)', async () => {
      // Arrange
      const server = await createServer(container)

      // add thread
      const addThreadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: addThreadPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addThreadResponseJson = JSON.parse(addThreadResponse.payload)
      const { data: { addedThread } } = addThreadResponseJson
      const threadId = addedThread.id

      // add comment
      const addCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: addCommentPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addCommentResponseJson = JSON.parse(addCommentResponse.payload)
      const { data: { addedComment } } = addCommentResponseJson
      const commentId = addedComment.id

      /// add reply
      await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'Balasan'
        },
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Assert
      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(200)
      expect(responseJson.status).toEqual('success')
      expect(responseJson.data.thread).toBeDefined()

      const { thread } = responseJson.data
      expect(thread.id).toBeDefined()
      expect(thread.id).not.toEqual('')
      expect(typeof thread.id).toEqual('string')
      expect(thread.title).toBeDefined()
      expect(thread.title).not.toEqual('')
      expect(typeof thread.title).toEqual('string')
      expect(thread.body).toBeDefined()
      expect(thread.body).not.toEqual('')
      expect(typeof thread.body).toEqual('string')
      expect(thread.date).toBeDefined()
      expect(thread.date).not.toEqual('')
      expect(typeof thread.date).toEqual('string')
      expect(thread.username).toBeDefined()
      expect(thread.username).not.toEqual('')
      expect(typeof thread.username).toEqual('string')
      expect(thread.comments).toBeDefined()
      expect(thread.comments).toHaveLength(1)
      expect(thread.comments[0].replies).toBeDefined()
      expect(thread.comments[0].replies).toHaveLength(1)
    })

    it('should response 200 and detail thread correctly (sorted replies)', async () => {
      // Arrange
      const server = await createServer(container)

      // add thread
      const addThreadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: addThreadPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addThreadResponseJson = JSON.parse(addThreadResponse.payload)
      const { data: { addedThread } } = addThreadResponseJson
      const threadId = addedThread.id

      // add comment
      const addCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: addCommentPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addCommentResponseJson = JSON.parse(addCommentResponse.payload)
      const { data: { addedComment } } = addCommentResponseJson
      const commentId = addedComment.id

      // add first reply
      await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'Balasan 1'
        },
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // add second reply
      await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'Balasan 2'
        },
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Assert
      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(200)
      expect(responseJson.status).toEqual('success')
      expect(responseJson.data.thread).toBeDefined()

      const { thread } = responseJson.data
      expect(thread.comments[0].replies).toBeDefined()
      expect(thread.comments[0].replies).toHaveLength(2)

      const firstReplyDate = new Date(thread.comments[0].replies[0].date)
      const secondReplyDate = new Date(thread.comments[0].replies[1].date)
      expect(firstReplyDate.getTime()).toBeLessThan(secondReplyDate.getTime())
    })

    it('should response 200 after delete reply', async () => {
      // Arrange
      const server = await createServer(container)

      // add thread
      const addThreadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: addThreadPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addThreadResponseJson = JSON.parse(addThreadResponse.payload)
      const { data: { addedThread } } = addThreadResponseJson
      const threadId = addedThread.id

      // add comment
      const addCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: addCommentPayload,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addCommentResponseJson = JSON.parse(addCommentResponse.payload)
      const { data: { addedComment } } = addCommentResponseJson
      const commentId = addedComment.id

      // add reply
      const addReplyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'Balasan'
        },
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })
      const addReplyResponseJson = JSON.parse(addReplyResponse.payload)
      const { data: { addedReply } } = addReplyResponseJson
      const replyId = addedReply.id

      // delete reply
      await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
        headers: {
          Authorization: `Bearer ${User1AccessToken}`
        }
      })

      // Assert
      const responseJson = JSON.parse(response.payload)
      expect(response.statusCode).toEqual(200)
      expect(responseJson.status).toEqual('success')
      expect(responseJson.data.thread).toBeDefined()

      const { thread } = responseJson.data
      expect(thread.comments[0].replies).toBeDefined()
      expect(thread.comments[0].replies).toHaveLength(1)
      expect(thread.comments[0].replies[0].content).toEqual('**balasan telah dihapus**')
    })
  })
})
