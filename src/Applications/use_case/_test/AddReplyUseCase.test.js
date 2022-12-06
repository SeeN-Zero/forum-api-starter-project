const AddReplyUseCase = require('../AddReplyUseCase')
const ReplyRepository = require('../../../Domains/replies/ReplyRepository')
const AddReply = require('../../../Domains/replies/entities/AddReply')
const ThreadRepository = require('../../../Domains/threads/ThreadRepository')
const CommentRepository = require('../../../Domains/comments/CommentRepository')

describe('AddReplyUseCase', () => {
  it('should orchestrating the add reply action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'Content',
      threadId: 'thread-666',
      commentId: 'comment-666',
      owner: 'user-666'
    }

    const expectedAddedReply = {
      id: 'reply-666',
      content: 'Content',
      owner: 'user-666'
    }

    /** creating dependency of use case */
    const mockingThreadRepository = new ThreadRepository()
    const mockingCommentRepository = new CommentRepository()
    const mockingReplyRepository = new ReplyRepository()

    /** mocking needed function */
    mockingThreadRepository.checkAvailabilityThread = jest.fn()
      .mockImplementation(() => Promise.resolve())
    mockingCommentRepository.checkAvailabilityComment = jest.fn()
      .mockImplementation(() => Promise.resolve())
    mockingReplyRepository.addReply = jest.fn()
      .mockImplementation(() => Promise.resolve({
        id: 'reply-666',
        content: 'Content',
        owner: 'user-666'
      }))

    /** creating use case instance */
    const addReplyUseCase = new AddReplyUseCase({
      replyRepository: mockingReplyRepository,
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository
    })

    // Action
    const addedReply = await addReplyUseCase.execute(useCasePayload)

    // Assert
    expect(addedReply).toStrictEqual(expectedAddedReply)
    expect(mockingThreadRepository.checkAvailabilityThread).toBeCalledWith(useCasePayload.threadId)
    expect(mockingCommentRepository.checkAvailabilityComment).toBeCalledWith(useCasePayload.commentId)
    expect(mockingReplyRepository.addReply).toBeCalledWith(new AddReply(useCasePayload))
  })
})
