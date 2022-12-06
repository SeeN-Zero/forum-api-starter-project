const CommentRepository = require('../../../Domains/comments/CommentRepository')
const ThreadRepository = require('../../../Domains/threads/ThreadRepository')
const DeleteCommentUseCase = require('../DeleteCommentUseCase')

describe('DeleteCommentUseCase', () => {
  it('should throw error if use case payload did not contain needed property', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-666'
    }
    const deleteCommentUseCase = new DeleteCommentUseCase({})

    // Action & Assert
    await expect(deleteCommentUseCase.execute(useCasePayload))
      .rejects
      .toThrowError('DELETE_COMMENT_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY')
  })

  it('should throw error if use case payload did not meet data type specification', async () => {
    // Arrange
    const useCasePayload = {
      commentId: 'comment-666',
      threadId: 666,
      owner: 666
    }
    const deleteCommentUseCase = new DeleteCommentUseCase({})

    // Action & Assert
    await expect(deleteCommentUseCase.execute(useCasePayload))
      .rejects
      .toThrowError('DELETE_COMMENT_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION')
  })

  it('should orchestrating the delete comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      commentId: 'comment-666',
      threadId: 'thread-666',
      owner: 'user-666'
    }
    /** creating dependency of use case */
    const mockingThreadRepository = new ThreadRepository()
    const mockingCommentRepository = new CommentRepository()

    /** mocking needed function */
    mockingThreadRepository.checkAvailabilityThread = jest.fn()
      .mockImplementation(() => Promise.resolve())
    mockingCommentRepository.checkAvailabilityComment = jest.fn()
      .mockImplementation(() => Promise.resolve())
    mockingCommentRepository.verifyCommentAccess = jest.fn()
      .mockImplementation(() => Promise.resolve())
    mockingCommentRepository.deleteComment = jest.fn()
      .mockImplementation(() => Promise.resolve())

    /** creating use case instance */
    const deleteCommentUseCase = new DeleteCommentUseCase({
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository
    })

    // Action
    await deleteCommentUseCase.execute(useCasePayload)

    // Assert
    expect(mockingThreadRepository.checkAvailabilityThread).toBeCalledWith(useCasePayload.threadId)
    expect(mockingCommentRepository.checkAvailabilityComment).toBeCalledWith(useCasePayload.commentId)
    expect(mockingCommentRepository.verifyCommentAccess).toBeCalledWith({ owner: useCasePayload.owner, commentId: useCasePayload.commentId })
    expect(mockingCommentRepository.deleteComment).toBeCalledWith(useCasePayload.commentId)
  })
})
