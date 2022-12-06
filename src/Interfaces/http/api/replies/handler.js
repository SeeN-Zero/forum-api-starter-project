const AddReplyUseCase = require('../../../../Applications/use_case/AddReplyUseCase')
const DeleteReplyUseCase = require('../../../../Applications/use_case/DeleteReplyUseCase')

class RepliesHandler {
  constructor (container) {
    this._container = container

    this.postReplyHandler = this.postReplyHandler.bind(this)
    this.deleteReplyHandler = this.deleteReplyHandler.bind(this)
  }

  async postReplyHandler (request, h) {
    const { content } = request.payload
    const { threadId, commentId } = request.params
    const { id: owner } = request.auth.credentials

    const addReplyUseCase = this._container.getInstance(AddReplyUseCase.name)
    const addedReply = await addReplyUseCase.execute({ content, owner, threadId, commentId })

    const response = h.response({
      status: 'success',
      data: {
        addedReply
      }
    })
    response.code(201)
    return response
  }

  async deleteReplyHandler (request, h) {
    const { threadId, commentId, replyId } = request.params
    const { id: owner } = request.auth.credentials

    const deleteReplyUseCase = this._container.getInstance(DeleteReplyUseCase.name)
    await deleteReplyUseCase.execute({ owner, threadId, commentId, replyId })

    const response = h.response({
      status: 'success',
      message: 'berhasil delete'
    })
    return response
  }
}

module.exports = RepliesHandler
