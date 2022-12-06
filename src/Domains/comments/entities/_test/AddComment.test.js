const AddComment = require('../AddComment')

describe('AddComment entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      threadId: 'thread-666'
    }

    // Action & Assert
    expect(() => new AddComment(payload)).toThrowError('ADD_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY')
  })

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      content: 'content',
      threadId: 666,
      owner: 666
    }

    // Action & Assert
    expect(() => new AddComment(payload)).toThrowError('ADD_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION')
  })

  it('should create newThread object correctly', () => {
    // Arrange
    const payload = {
      content: 'content',
      threadId: 'thread-666',
      owner: 'user-666'
    }

    // Action
    const { content, threadId, owner } = new AddComment(payload)

    // Assert
    expect(content).toEqual(payload.content)
    expect(threadId).toEqual(payload.threadId)
    expect(owner).toEqual(payload.owner)
  })
})
