const AddCommentUseCase = require('../AddCommentUseCase')
const CommentRepository = require('../../../Domains/comments/CommentRepository')
const AddComment = require('../../../Domains/comments/entities/AddComment')
const ThreadRepository = require('../../../Domains/threads/ThreadRepository')

describe('AddCommentUseCase', () => {
  it('should orchestrating the add comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'Content',
      threadId: 'thread-666',
      owner: 'user-666'
    }

    const expectedAddedComment = {
      id: 'comment-666',
      content: 'Content',
      owner: 'user-666'
    }

    /** creating dependency of use case */
    const mockingThreadRepository = new ThreadRepository()
    const mockingCommentRepository = new CommentRepository()

    /** mocking needed function */
    mockingThreadRepository.checkAvailabilityThread = jest.fn()
      .mockImplementation(() => Promise.resolve())
    mockingCommentRepository.addComment = jest.fn()
      .mockImplementation(() => Promise.resolve({
        id: 'comment-666',
        content: 'Content',
        owner: 'user-666'
      }))

    /** creating use case instance */
    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockingCommentRepository,
      threadRepository: mockingThreadRepository
    })

    // Action
    const addedComment = await addCommentUseCase.execute(useCasePayload)

    // Assert
    expect(addedComment).toStrictEqual(expectedAddedComment)
    expect(mockingThreadRepository.checkAvailabilityThread).toBeCalledWith(useCasePayload.threadId)
    expect(mockingCommentRepository.addComment).toBeCalledWith(new AddComment(useCasePayload))
  })
})
