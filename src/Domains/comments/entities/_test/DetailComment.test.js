const DetailComment = require('../DetailComment')

describe('DetailComment entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'comment-666',
      username: 'usernae',
      date: 'date'
    }

    // Action & Assert
    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY')
  })

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 666,
      username: 666,
      date: 666,
      content: 'comment-666'
    }

    // Action & Assert
    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION')
  })

  it('should create detailComment object correctly', () => {
    // Arrange
    const payload = {
      id: 'comment-666',
      username: 'username',
      date: 'date',
      content: 'content'
    }

    // Action
    const { id, username, date, content, replies } = new DetailComment(payload)

    // Assert
    expect(id).toEqual(payload.id)
    expect(username).toEqual(payload.username)
    expect(date).toEqual(payload.date)
    expect(content).toEqual(payload.content)
  })
})
