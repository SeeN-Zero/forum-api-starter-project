const AddReply = require('../AddReply')

describe('AddReply entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      commentId: 'comment-666'
    }

    // Action & Assert
    expect(() => new AddReply(payload)).toThrowError('ADD_REPLY.NOT_CONTAIN_NEEDED_PROPERTY')
  })

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      content: 'content',
      commentId: 666,
      owner: 666
    }

    // Action & Assert
    expect(() => new AddReply(payload)).toThrowError('ADD_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION')
  })

  it('should create newThread object correctly', () => {
    // Arrange
    const payload = {
      content: 'content',
      commentId: 'comment-666',
      owner: 'user-666'
    }

    // Action
    const { content, commentId, owner } = new AddReply(payload)

    // Assert
    expect(content).toEqual(payload.content)
    expect(commentId).toEqual(payload.commentId)
    expect(owner).toEqual(payload.owner)
  })
})
