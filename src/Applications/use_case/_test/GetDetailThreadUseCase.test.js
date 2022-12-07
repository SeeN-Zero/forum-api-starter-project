const CommentRepository = require('../../../Domains/comments/CommentRepository')
const ReplyRepository = require('../../../Domains/replies/ReplyRepository')
const ThreadRepository = require('../../../Domains/threads/ThreadRepository')
const GetDetailThreadUseCase = require('../GetDetailThreadUseCase')

describe('GetDetailThreadUseCase', () => {
  it('should orchestrating the get detail thread action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-666'
    }

    const expectedDetailThread = {
      id: 'thread-666',
      title: 'title',
      body: 'body',
      date: 'date',
      username: 'username',
      comments: [
        {
          id: 'comment-666',
          username: 'username',
          date: 'date',
          content: 'content',
          replies: [
            {
              id: 'reply-666',
              content: 'content',
              date: 'date',
              username: 'username'
            }
          ]
        }
      ]
    }

    /** creating dependency of use case */
    const mockingThreadRepository = new ThreadRepository()
    const mockingCommentRepository = new CommentRepository()
    const mockingReplyRepository = new ReplyRepository()

    /** mocking needed function */
    mockingThreadRepository.checkAvailabilityThread = jest.fn()
      .mockImplementation(() => Promise.resolve())
    mockingThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve(
        {
          id: 'thread-666',
          title: 'title',
          body: 'body',
          date: 'date',
          username: 'username',
          comments: []
        }
      ))
    mockingCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve(
        [
          {
            id: 'comment-666',
            username: 'username',
            date: 'date',
            content: 'content',
            is_delete: false
          }
        ]
      ))
    mockingReplyRepository.getRepliesByCommentId = jest.fn()
      .mockImplementation(() => Promise.resolve(
        [
          {
            id: 'reply-666',
            content: 'content',
            date: 'date',
            username: 'username',
            is_delete: false
          }
        ]
      ))

    /** creating use case instance */
    const getDetailThreadUseCase = new GetDetailThreadUseCase({
      threadRepository: mockingThreadRepository,
      commentRepository: mockingCommentRepository,
      replyRepository: mockingReplyRepository
    })

    // Action
    const detailThread = await getDetailThreadUseCase.execute(useCasePayload)

    // Assert
    expect(detailThread).toEqual(expectedDetailThread)
    expect(mockingThreadRepository.checkAvailabilityThread).toBeCalledWith(useCasePayload.threadId)
    expect(mockingThreadRepository.getThreadById).toBeCalledWith(useCasePayload.threadId)
    expect(mockingCommentRepository.getCommentsByThreadId).toBeCalledWith(useCasePayload.threadId)
    expect(mockingReplyRepository.getRepliesByCommentId).toBeCalledWith(expectedDetailThread.comments[0].id)
  })
})
