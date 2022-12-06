const DetailReply = require('../DetailReply')

describe('DetailReply entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'reply-666'
    }

    // Action & Assert
    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY')
  })

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'reply-666',
      username: 666,
      date: 666,
      content: 666
    }

    // Action & Assert
    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION')
  })

  it('should create DetailReply object correctly', () => {
    // Arrange
    const payload = {
      id: 'reply-666',
      content: 'content',
      date: 'date',
      username: 'username'
    }

    // Action
    const { id, username, date, content } = new DetailReply(payload)

    // Assert
    expect(id).toEqual(payload.id)
    expect(username).toEqual(payload.username)
    expect(date).toEqual(payload.date)
    expect(content).toEqual(payload.content)
  })
})
