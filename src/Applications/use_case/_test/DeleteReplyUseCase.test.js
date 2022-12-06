const CommentRepository = require('../../../Domains/comments/CommentRepository')
const ThreadRepository = require('../../../Domains/threads/ThreadRepository')
const ReplyRepository = require('../../../Domains/replies/ReplyRepository')
const DeleteReplyUseCase = require('../DeleteReplyUseCase')

describe('DeleteReplyUseCase', () => {
  it('should throw error if use case payload did not contain needed property', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-666'
    }
    const deleteReplyUseCase = new DeleteReplyUseCase({})

    // Action & Assert
    await expect(deleteReplyUseCase.execute(useCasePayload))
      .rejects
      .toThrowError('DELETE_REPLY_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY')
  })

  it('should throw error if use case payload did not meet data type specification', async () => {
    // Arrange
    const useCasePayload = {
      commentId: 'comment-666',
      threadId: 666,
      owner: 666,
      replyId: 'reply-666'
    }
    const deleteReplyUseCase = new DeleteReplyUseCase({})

    // Action & Assert
    await expect(deleteReplyUseCase.execute(useCasePayload))
      .rejects
      .toThrowError('DELETE_REPLY_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION')
  })

  it('should orchestrating the delete comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-666',
      commentId: 'comment-666',
      replyId: 'reply-666',
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
    mockingReplyRepository.checkAvailabilityReply = jest.fn()
      .mockImplementation(() => Promise.resolve())
    mockingReplyRepository.verifyReplyAccess = jest.fn()
      .mockImplementation(() => Promise.resolve())
    mockingReplyRepository.deleteReply = jest.fn()
      .mockImplementation(() => Promise.resolve())

    /** creating use case instance */
    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockingReplyRepository,
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository
    })

    // Action
    await deleteReplyUseCase.execute(useCasePayload)

    // Assert
    expect(mockingThreadRepository.checkAvailabilityThread).toBeCalledWith(useCasePayload.threadId)
    expect(mockingCommentRepository.checkAvailabilityComment).toBeCalledWith(useCasePayload.commentId)
    expect(mockingReplyRepository.checkAvailabilityReply).toBeCalledWith(useCasePayload.replyId)
    expect(mockingReplyRepository.verifyReplyAccess).toBeCalledWith({ owner: useCasePayload.owner, replyId: useCasePayload.replyId })
    expect(mockingReplyRepository.deleteReply).toBeCalledWith(useCasePayload.replyId)
  })
})
